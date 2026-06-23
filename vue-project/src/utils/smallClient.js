// ============================================================================
// 소액처 0원 + 신규처 보호 공유 유틸
// ----------------------------------------------------------------------------
// 규칙(2026-06-22 확정):
// - 소액처: (업체 × 병의원) 정산월 처방액 합계 < 100,000원 → 그 (업체,병의원)의 지급액 0원
// - 신규처 보호: 병의원 등록일(clients.created_at) + 3개월 이내 정산월은 0원 제외(정상 지급)
// - 적용 시점: cutoff(2026-06) 이상 정산월부터. 이전 월은 미적용(과거 정산분 보존)
// - 판정 단위: 병의원 전체가 아니라 (업체, 병의원) 합산 단위
//
// 적용 위치: 정산내역서 공유(목록/상세), 사용자 정산내역서, 흡수율 분석, 그리고
//           DB calculate_statistics. 규칙 변경 시 전부 동기화해야 한다(드리프트 주의).
// DB 측 동일 규칙: database/migrations/statistics/add_small_client_zero_to_calculate_statistics.sql
// ============================================================================

export const SMALL_CLIENT_CUTOFF_MONTH = '2026-06';
export const SMALL_CLIENT_THRESHOLD = 100000;
export const NEW_CLIENT_PROTECTION_MONTHS = 3;

/**
 * 해당 정산월이 소액처 0원 규칙 적용 대상 월인지(cutoff 이상).
 * @param {string} settlementMonth 'YYYY-MM'
 */
export function isSmallClientCutoffMonth(settlementMonth) {
  if (!settlementMonth) return false;
  return String(settlementMonth) >= SMALL_CLIENT_CUTOFF_MONTH;
}

/**
 * 신규처 보호 대상 여부: 병의원 등록일(created_at) + 3개월 이내 정산월이면 보호(true).
 * 보호 = 0원 처리에서 제외(정상 지급). created_at 이 없으면 보호하지 않음(기존 거래처로 간주).
 * @param {string|Date|null|undefined} createdAt clients.created_at
 * @param {string} settlementMonth 'YYYY-MM'
 * @returns {boolean}
 */
export function isProtectedNewClient(createdAt, settlementMonth) {
  if (!createdAt || !settlementMonth) return false;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return false;
  // 보호 종료 시점 = 등록일 + 3개월(달력)
  const protectionEnd = new Date(created);
  protectionEnd.setMonth(protectionEnd.getMonth() + NEW_CLIENT_PROTECTION_MONTHS);
  // 정산월 첫날
  const settle = new Date(`${settlementMonth}-01T00:00:00`);
  if (isNaN(settle.getTime())) return false;
  // 정산월 첫날이 보호 종료 이전이면 보호
  return settle < protectionEnd;
}

/**
 * (업체,병의원) 단위로 지급액을 0원 처리할지 최종 판정.
 *   cutoff 이상 AND 소액(합계<10만) AND 신규처 보호 아님
 * @param {string} settlementMonth 'YYYY-MM'
 * @param {number} companyClientPrescriptionTotal (업체,병의원) 처방액 합계
 * @param {string|Date|null|undefined} clientCreatedAt 병의원 등록일
 * @returns {boolean} true 면 지급처방액·지급액 0 처리
 */
export function isSmallClientZeroApplicable(settlementMonth, companyClientPrescriptionTotal, clientCreatedAt) {
  if (!isSmallClientCutoffMonth(settlementMonth)) return false;
  if (Number(companyClientPrescriptionTotal || 0) >= SMALL_CLIENT_THRESHOLD) return false;
  if (isProtectedNewClient(clientCreatedAt, settlementMonth)) return false;
  return true;
}
