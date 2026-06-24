// ============================================================================
// 소액처 0원 + 신규처 보호 공유 유틸
// ----------------------------------------------------------------------------
// 규칙(2026-06-24 갱신):
// - 소액처: (업체 × 병의원) 정산월 처방액 합계 < 100,000원 → 그 (업체,병의원)의 지급액 0원
// - 신규처 보호: 그 병의원의 "첫 실적월" + 3개월 이내 정산월은 0원 제외(정상 지급)
//     예) 첫 실적이 2026-03 이면 2026-03·04·05 는 보호(정상 지급), 2026-06 부터
//        소액(10만원 미만)이면 0원. (이전 버전은 clients.created_at 기준이었음)
// - 적용 시점: cutoff(2026-06) 이상 정산월부터. 이전 월은 미적용(과거 정산분 보존)
// - 판정 단위: 소액 합계는 (업체, 병의원), 신규처 보호는 병의원(client) 단위
//
// 적용 위치: 정산내역서 공유(목록/상세), 사용자 정산내역서, 흡수율 분석, 실적검수,
//           그리고 DB calculate_statistics. 규칙 변경 시 전부 동기화해야 한다(드리프트 주의).
// "첫 실적월" 정의(병의원별 가장 이른 settlement_month, 삭제 제외)는
//   RPC get_clients_first_performance_month 와 DB calculate_statistics 가 공유한다.
// DB 측 동일 규칙: database/migrations/statistics/add_small_client_zero_to_calculate_statistics.sql
//                database/migrations/statistics/add_get_clients_first_performance_month.sql
// ============================================================================

import { getSmallClientCutoffMonth, DEFAULT_CUTOFFS } from '@/utils/settlementSettings';

// 런타임 cutoff 는 settlement_settings(DB) 단일 소스에서 가져온다(getSmallClientCutoffMonth).
// 아래 상수는 기본값/문서용일 뿐, 실제 판정은 getter 를 쓴다.
export const SMALL_CLIENT_CUTOFF_MONTH = DEFAULT_CUTOFFS.small_client_cutoff_month;
export const SMALL_CLIENT_THRESHOLD = 100000;
export const NEW_CLIENT_PROTECTION_MONTHS = 3;

/**
 * 'YYYY-MM' 을 월 인덱스(연*12 + 월-1)로 변환. 잘못된 값이면 null.
 * @param {string} ym
 * @returns {number|null}
 */
function monthIndex(ym) {
  if (!ym || typeof ym !== 'string') return null;
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

/**
 * 해당 정산월이 소액처 0원 규칙 적용 대상 월인지(cutoff 이상).
 * @param {string} settlementMonth 'YYYY-MM'
 */
export function isSmallClientCutoffMonth(settlementMonth) {
  if (!settlementMonth) return false;
  return String(settlementMonth) >= getSmallClientCutoffMonth();
}

/**
 * 신규처 보호 대상 여부: 그 병의원의 첫 실적월 + 3개월 이내 정산월이면 보호(true).
 * 보호 = 0원 처리에서 제외(정상 지급).
 *   예) firstMonth='2026-03' → 2026-03·04·05 보호, 2026-06 부터 보호 해제.
 * firstMonth 가 없으면(실적월 미상) 보호하지 않음(기존 거래처로 간주).
 * @param {string|null|undefined} firstMonth 병의원 첫 실적월 'YYYY-MM'
 * @param {string} settlementMonth 'YYYY-MM'
 * @returns {boolean}
 */
export function isProtectedNewClient(firstMonth, settlementMonth) {
  const firstIdx = monthIndex(firstMonth);
  const settleIdx = monthIndex(settlementMonth);
  if (firstIdx === null || settleIdx === null) return false;
  // 정산월이 (첫 실적월 + 3개월) 미만이면 보호
  return settleIdx < firstIdx + NEW_CLIENT_PROTECTION_MONTHS;
}

/**
 * (업체,병의원) 단위로 지급액을 0원 처리할지 최종 판정.
 *   cutoff 이상 AND 소액(합계<10만) AND 신규처 보호 아님
 * @param {string} settlementMonth 'YYYY-MM'
 * @param {number} companyClientPrescriptionTotal (업체,병의원) 처방액 합계
 * @param {string|null|undefined} clientFirstMonth 병의원 첫 실적월 'YYYY-MM'
 * @returns {boolean} true 면 지급처방액·지급액 0 처리
 */
export function isSmallClientZeroApplicable(settlementMonth, companyClientPrescriptionTotal, clientFirstMonth) {
  if (!isSmallClientCutoffMonth(settlementMonth)) return false;
  if (Number(companyClientPrescriptionTotal || 0) >= SMALL_CLIENT_THRESHOLD) return false;
  if (isProtectedNewClient(clientFirstMonth, settlementMonth)) return false;
  return true;
}

/**
 * 병의원(client) 별 첫 실적월을 RPC 로 일괄 조회한다.
 * 신규처 보호 판정에 쓰며, DB calculate_statistics 와 동일 정의(삭제 제외 MIN(settlement_month)).
 * @param {object} supabase Supabase 클라이언트
 * @param {Array<string>} clientIds 병의원 id 배열
 * @returns {Promise<Map<string,string>>} client_id → 첫 실적월('YYYY-MM')
 */
export async function fetchClientFirstMonths(supabase, clientIds) {
  const map = new Map();
  const ids = [...new Set((clientIds || []).filter(Boolean))];
  if (ids.length === 0) return map;
  const { data, error } = await supabase.rpc('get_clients_first_performance_month', {
    p_client_ids: ids,
  });
  if (error) {
    console.error('첫 실적월 조회 실패(get_clients_first_performance_month):', error);
    return map;
  }
  (data || []).forEach((r) => map.set(r.client_id, r.first_month));
  return map;
}
