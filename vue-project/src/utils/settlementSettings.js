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

// 소액처 0원 적용 대상 업체 그룹 기본값. DB(jsonb 배열) 미워밍 시 폴백.
export const DEFAULT_SMALL_CLIENT_COMPANY_GROUPS = Object.freeze(['NEWCSO', '인천CSO']);

let cache = {
  ...DEFAULT_CUTOFFS,
  small_client_company_groups: [...DEFAULT_SMALL_CLIENT_COMPANY_GROUPS],
};
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
      let { data, error } = await supabase
        .from('settlement_settings')
        .select('transfer_cutoff_month, small_client_cutoff_month, absorption_exclusion_cutoff_month, small_client_company_groups')
        .eq('id', 1)
        .single();
      // small_client_company_groups 컬럼 미적용 환경(ALTER 전 배포)이면 select 전체가 에러 →
      // cutoff 3종까지 기본값으로 되돌아가 소액처가 한 달 조기 적용되는 사고가 난다.
      // 신규 컬럼을 뺀 cutoff-only 로 1회 재조회해 cutoff 는 항상 DB 값을 쓰게 한다.
      if (error) {
        console.warn('[settlementSettings] 신규 컬럼 조회 실패, cutoff-only 재조회:', error.message);
        ({ data, error } = await supabase
          .from('settlement_settings')
          .select('transfer_cutoff_month, small_client_cutoff_month, absorption_exclusion_cutoff_month')
          .eq('id', 1)
          .single());
      }
      if (!error && data) {
        cache = {
          transfer_cutoff_month: data.transfer_cutoff_month || DEFAULT_CUTOFFS.transfer_cutoff_month,
          small_client_cutoff_month: data.small_client_cutoff_month || DEFAULT_CUTOFFS.small_client_cutoff_month,
          absorption_exclusion_cutoff_month: data.absorption_exclusion_cutoff_month || DEFAULT_CUTOFFS.absorption_exclusion_cutoff_month,
          // jsonb 문자열 배열 → JS 배열. 형식이 어긋나면 기본값 유지(잘못된 값으로 전 업체 미적용 되는 사고 방지).
          // 빈문자/공백 원소는 제외 → 그룹 미지정 업체가 실수로 매칭되지 않게(DB calculate_statistics 와 동일).
          small_client_company_groups: Array.isArray(data.small_client_company_groups)
            ? data.small_client_company_groups.filter((g) => typeof g === 'string' && g.trim() !== '')
            : [...DEFAULT_SMALL_CLIENT_COMPANY_GROUPS],
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

/** 소액처 0원 cutoff(YYYY-MM). 이 정산월부터 소액 0원 규칙 적용. */
export function getSmallClientCutoffMonth() { return cache.small_client_cutoff_month; }

/** 흡수율 제외 cutoff(YYYY-MM). */
export function getAbsorptionExclusionCutoffMonth() { return cache.absorption_exclusion_cutoff_month; }

/** 소액처 0원 적용 대상 업체 그룹 목록(companies.company_group 값 배열). */
export function getSmallClientCompanyGroups() { return cache.small_client_company_groups; }
