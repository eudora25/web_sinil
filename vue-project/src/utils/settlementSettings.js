// ============================================================================
// 정산 정책 cutoff 단일 소스 (DB settlement_settings 테이블)
// ----------------------------------------------------------------------------
// 이관 연속성 / 소액처 0원 / 흡수율 제외 의 "적용 시작월(cutoff)"을 DB 한 곳에서 관리.
// DB 함수(calculate_statistics, calculate_absorption_rates)도 같은 테이블을 읽으므로
// 프론트/DB 가 동일 값을 공유한다(drift 방지).
//
// 사용:
//   - 앱 시작 시 main.js 에서 loadSettlementSettings() 1회 호출 → 모듈 캐시 워밍.
//   - promotion.js / smallClient.js 의 cutoff 판정 함수가 아래 getter 를 동기 호출.
//   - 캐시가 워밍되기 전엔 DEFAULT_CUTOFFS(='2026-06') 로 안전 폴백.
// 변경: settlement_settings UPDATE → DB 즉시 반영, 프론트는 새로고침(재fetch).
// DB: database/migrations/settings/add_settlement_settings.sql
// ============================================================================
import { supabase } from '@/supabase';

// 기본값(=초기 정책). DB 조회 실패/미워밍 시 폴백. 프론트의 '2026-06' 리터럴은 여기 한 곳만 둔다.
export const DEFAULT_CUTOFFS = Object.freeze({
  transfer_cutoff_month: '2026-06',
  small_client_cutoff_month: '2026-06',
  absorption_exclusion_cutoff_month: '2026-06',
});

let cache = { ...DEFAULT_CUTOFFS };
let loaded = false;
let inflight = null;

/**
 * settlement_settings(id=1) 를 1회 fetch 하여 모듈 캐시에 보관.
 * 동시 호출은 inflight 로 합치고, 실패 시 기본값을 유지(throw 안 함).
 * @param {boolean} force true 면 캐시 무시하고 재조회
 * @returns {Promise<typeof DEFAULT_CUTOFFS>}
 */
export async function loadSettlementSettings(force = false) {
  if (loaded && !force) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('settlement_settings')
        .select('transfer_cutoff_month, small_client_cutoff_month, absorption_exclusion_cutoff_month')
        .eq('id', 1)
        .single();
      if (!error && data) {
        cache = {
          transfer_cutoff_month: data.transfer_cutoff_month || DEFAULT_CUTOFFS.transfer_cutoff_month,
          small_client_cutoff_month: data.small_client_cutoff_month || DEFAULT_CUTOFFS.small_client_cutoff_month,
          absorption_exclusion_cutoff_month: data.absorption_exclusion_cutoff_month || DEFAULT_CUTOFFS.absorption_exclusion_cutoff_month,
        };
        loaded = true;
      }
    } catch (e) {
      console.warn('[settlementSettings] 로드 실패, 기본값 사용:', e?.message || e);
    } finally {
      inflight = null;
    }
    return cache;
  })();
  return inflight;
}

/** 현재 캐시된 cutoff 묶음(동기). */
export function getSettlementCutoffs() { return cache; }

/** 이관 연속성 cutoff(YYYY-MM). */
export function getTransferCutoffMonth() { return cache.transfer_cutoff_month; }

/** 소액처 0원 cutoff(YYYY-MM). */
export function getSmallClientCutoffMonth() { return cache.small_client_cutoff_month; }

/** 흡수율 제외 cutoff(YYYY-MM). */
export function getAbsorptionExclusionCutoffMonth() { return cache.absorption_exclusion_cutoff_month; }
