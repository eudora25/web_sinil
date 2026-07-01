// ============================================================================
// 소액처 0원 + 신규처 보호 공유 유틸
// ----------------------------------------------------------------------------
// 규칙:
// - 소액처: (업체 × 병의원 × 처방월) 정산월 내 처방액 합계 < 100,000원 → 그 처방월분 지급 0원
// - 신규처 보호: 첫 처방월(MIN prescription_month) + 3개월 이내 **처방월**은 0원 제외.
//     예) 첫 처방 2026-01, 5월 정산에 1·2·3·4월 EDI 일괄 → 1·2·3월 처방 보호(지급), 4월 처방만 소액 0원.
//     예) 첫 처방 2026-03, 6월 정산에 3·4·5월 EDI 일괄 → 3·4·5월 보호, 6월 처방분부터 0원.
// - 적용 시점: cutoff 이상 **정산월**부터 소액 0원 규칙 적용. 이전 정산월은 미적용.
// - 판정 단위: 소액 합계 (업체, 병의원, 처방월), 신규처 보호 (병의원 첫 처방월 기준)
// ============================================================================

import { getSmallClientCutoffMonth, DEFAULT_CUTOFFS } from '@/utils/settlementSettings';

export const SMALL_CLIENT_CUTOFF_MONTH = DEFAULT_CUTOFFS.small_client_cutoff_month;
export const SMALL_CLIENT_THRESHOLD = 100000;
export const NEW_CLIENT_PROTECTION_MONTHS = 3;

/** (업체,병의원,처방월) 합계 맵 키 */
export function companyClientRxMonthKey(companyId, clientId, prescriptionMonth) {
  return `${companyId}_${clientId}_${prescriptionMonth}`;
}

function monthIndex(ym) {
  if (!ym || typeof ym !== 'string') return null;
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

/** 정산월이 cutoff 이상이면 소액 0원 규칙 적용 대상(true). */
export function isSmallClientCutoffMonth(settlementMonth) {
  if (!settlementMonth) return false;
  return String(settlementMonth) >= getSmallClientCutoffMonth();
}

/**
 * 신규처 보호: 첫 처방월 + 3개월 미만인 **처방월**이면 보호(true).
 * @param {string|null|undefined} firstMonth 병의원 첫 처방월 (RPC: MIN prescription_month)
 * @param {string} prescriptionMonth 판정 대상 처방월 'YYYY-MM'
 */
export function isProtectedNewClient(firstMonth, prescriptionMonth) {
  const firstIdx = monthIndex(firstMonth);
  const rxIdx = monthIndex(prescriptionMonth);
  if (firstIdx === null || rxIdx === null) return false;
  return rxIdx < firstIdx + NEW_CLIENT_PROTECTION_MONTHS;
}

/**
 * (업체,병의원,처방월) 단위 0원 판정.
 * @param {string} settlementMonth 정산월 (cutoff 판정용)
 * @param {string} prescriptionMonth 처방월 (보호·소액 합계 단위)
 * @param {number} rxMonthPrescriptionTotal 해당 정산월 내 (업체,병의원,처방월) 처방액 합계
 * @param {string|null|undefined} clientFirstMonth 병의원 첫 처방월
 */
export function isSmallClientZeroApplicable(
  settlementMonth,
  prescriptionMonth,
  rxMonthPrescriptionTotal,
  clientFirstMonth,
) {
  if (!isSmallClientCutoffMonth(settlementMonth)) return false;
  if (Number(rxMonthPrescriptionTotal || 0) >= SMALL_CLIENT_THRESHOLD) return false;
  if (isProtectedNewClient(clientFirstMonth, prescriptionMonth)) return false;
  return true;
}

/** RPC·실적 row 간 client_id 타입(number|string) 불일치 대비 */
export function getClientFirstMonth(clientFirstMonthMap, clientId) {
  if (!clientFirstMonthMap || clientId == null) return undefined;
  return clientFirstMonthMap.get(String(clientId));
}

export async function fetchClientFirstMonths(supabase, clientIds) {
  const map = new Map();
  const ids = [...new Set((clientIds || []).filter(Boolean).map((id) => Number(id)).filter((id) => !Number.isNaN(id)))];
  if (ids.length === 0) return map;
  const { data, error } = await supabase.rpc('get_clients_first_performance_month', {
    p_client_ids: ids,
  });
  if (error) {
    console.error('첫 실적월 조회 실패(get_clients_first_performance_month):', error);
    return map;
  }
  (data || []).forEach((r) => map.set(String(r.client_id), r.first_month));
  return map;
}
