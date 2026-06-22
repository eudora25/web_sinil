// ============================================================================
// 프로모션 적용 판정 공유 유틸
// ----------------------------------------------------------------------------
// 프로모션 수수료(final_commission_rate) 적용 여부는 여러 화면에 중복 구현돼 있어
// drift(불일치)가 발생하기 쉽다. 이관(CSO 변경) 연속성 규칙을 한 곳에서 관리한다.
//
// [이관 연속성 규칙]
// - 프로모션 "대상 자격"은 병원+제품 단위로 promotion_product_hospital_performance 에
//   저장된다. first_performance_cso_id 가 NULL 이 아니면 = 그 병원+제품은 프로모션 대상
//   (최초 처방월이 프로모션 시작일 이후라는 의미).
// - 기존 로직은 "최초 실적 업체(first_performance_cso_id) == 현재 업체" 일 때만 적용해서,
//   병원이 다른 CSO 로 이관되면 신규 업체에서 프로모션이 끊겼다.
// - 개선: 그 병원에 "현재 배정된(담당) 업체"(client_company_assignments)에게만 프로모션을 적용한다.
//   이관되어 배정이 빠진 기존 업체는, 이관 이후 월에 실적을 올려도 적용받지 못한다.
// - 그룹 제한: cutoff 이후(이관 연속성) 분기에서는 그 정산월 담당 업체가 NEWCSO 그룹일 때만 적용한다.
//   비-NEWCSO 업체로 이관되면 그 달부터 프로모션이 중단된다. (cutoff 이전 과거 월은 그룹 게이트 미적용)
//
// [과거 정산분 보존 (cutoff)]
// - 이미 정산이 끝난 과거 월을 소급해서 바꾸지 않기 위해, 아래 기준월 이상(>=)부터만
//   새 로직(배정 기반)을 적용하고, 그 이전 월은 기존 로직(최초 업체 == 현재 업체)을 유지한다.
// - 2026-03~05 정산분이 확정(settlement_share 공유 완료)되어 보존하기 위해 2026-06 으로 설정
//   → 확정월(03~05)은 구 로직 유지, 이관 효과는 미정산월인 2026-06 부터 발효된다.
//   운영 적용 시점/정책에 맞춰 이 값만 조정하면 된다. (이전 값: 2026-03, 2026-06-22 변경)
// - 한계: client_company_assignments 는 이력이 없는 "현재 상태"라, 이관 이후 월을 다시 재이관하면
//   직전 업체의 과거 정산분이 바뀔 수 있다(배정 이력 테이블이 없기 때문).
// ============================================================================

export const PROMOTION_TRANSFER_CUTOFF_MONTH = '2026-06';

/**
 * 해당 정산월이 이관 연속성(새) 로직 적용 대상인지 여부.
 * @param {string} settlementMonth 'YYYY-MM'
 * @returns {boolean}
 */
export function isTransferContinuityMonth(settlementMonth) {
  if (!settlementMonth) return false;
  return String(settlementMonth) >= PROMOTION_TRANSFER_CUTOFF_MONTH;
}

/**
 * 프로모션 대상 자격이 있는 병원+제품 실적행이, 특정 (업체, 정산월) 정산에
 * 프로모션 수수료를 적용받을 수 있는지 판정한다.
 *
 * 주의: 이 함수는 "대상 자격 + 담당 업체" 판정만 한다. 제외병원(isExcluded) 여부와
 * 정산월이 프로모션 기간 내인지(promotion_start/end) 는 각 호출부에서 별도로 AND 한다.
 *
 * @param {string|null|undefined} firstPerfCsoId promotion_product_hospital_performance.first_performance_cso_id
 * @param {string|null|undefined} companyId      정산 대상 업체 id
 * @param {string} settlementMonth               정산월 'YYYY-MM'
 * @param {boolean} isAssignedToHospital         그 업체가 해당 정산월에 그 병원의 담당이었는지
 *                                               (client_company_assignment_history 월 기간 판정,
 *                                                isAssignedForMonth 로 계산)
 * @param {boolean} isNewCsoCompany              정산 대상 업체가 NEWCSO 그룹인지(companies.company_group==='NEWCSO').
 *                                               cutoff 이후(이관 연속성) 분기에서만 사용 — 그 정산월 담당 업체가
 *                                               NEWCSO일 때만 적용(비-NEWCSO로 이관되면 프로모션 중단).
 * @returns {boolean}
 */
export function isPromotionApplicableToCompany(firstPerfCsoId, companyId, settlementMonth, isAssignedToHospital, isNewCsoCompany) {
  // 자격 없음(최초 처방이 프로모션 시작일 이전이거나 대상 아님)
  if (!firstPerfCsoId) return false;
  // cutoff 이후: 그 정산월에 담당이던 NEWCSO 업체만 적용 → 이관 연속성 + 그룹 제한
  //   (비-NEWCSO 업체로 이관되면 그 달부터 프로모션 미적용)
  if (isTransferContinuityMonth(settlementMonth)) return !!isAssignedToHospital && !!isNewCsoCompany;
  // cutoff 이전: 기존 로직(최초 업체 == 현재 업체)으로 과거 정산분 보존(그룹 게이트 미적용)
  return firstPerfCsoId === companyId;
}

/**
 * 배정 이력 기간 배열에서, 주어진 정산월에 그 업체가 담당이었는지 판정한다.
 * 담당 = (from IS NULL OR from <= M) AND (to IS NULL OR M < to)  (to 는 담당 종료=제외 경계)
 *
 * @param {Array<{effective_from_month: ?string, effective_to_month: ?string}>} periods
 *        한 (병원, 업체) 조합의 배정 이력 기간들
 * @param {string} month 정산월 'YYYY-MM'
 * @returns {boolean}
 */
export function isAssignedForMonth(periods, month) {
  if (!periods || !periods.length || !month) return false;
  return periods.some(p =>
    (!p.effective_from_month || p.effective_from_month <= month) &&
    (!p.effective_to_month || month < p.effective_to_month)
  );
}
