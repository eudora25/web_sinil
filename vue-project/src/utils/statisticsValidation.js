/**
 * 통계 데이터 정확성 검증 유틸리티
 */

/**
 * 화면 표시와 동일한 매출액 계산 (직거래+도매 합계 후 반올림). 검증 시 UI와 일치시키기 위함.
 * @param {Object} row - 통계 행
 * @returns {number}
 */
function combinedRevenueForValidation(row) {
  if (!row) return 0;
  const hasDirectOrWholesale = row.direct_revenue != null || row.wholesale_revenue != null;
  if (hasDirectOrWholesale) {
    return Math.round((Number(row.wholesale_revenue) || 0) + (Number(row.direct_revenue) || 0));
  }
  return Number(row.total_revenue) || 0;
}

/**
 * 흡수율 계산 검증
 * 개별 행의 흡수율(가중 평균)과 합계 행의 흡수율(단순 나눗셈)이 일치하는지 확인
 * (매출액은 화면과 동일하게 직거래+도매 합계 후 반올림으로 계산)
 * 
 * @param {Array} rows - 통계 데이터 행 배열
 * @returns {Object} 검증 결과
 */
export function validateAbsorptionRate(rows) {
  if (!rows || rows.length === 0) {
    return { isValid: true, message: '데이터가 없습니다.' };
  }

  // 방법 1: 가중 평균 방식 (개별 행의 흡수율을 처방액으로 가중 평균)
  let totalWeightedAbsorption = 0;
  let totalPrescriptionAmount = 0;
  
  rows.forEach(row => {
    const prescriptionAmount = Number(row.prescription_amount) || 0;
    const absorptionRate = Number(row.absorption_rate) || 0;
    
    totalWeightedAbsorption += prescriptionAmount * absorptionRate;
    totalPrescriptionAmount += prescriptionAmount;
  });
  
  const weightedAverageRate = totalPrescriptionAmount > 0 
    ? totalWeightedAbsorption / totalPrescriptionAmount 
    : 0;

  // 방법 2: 매출액 기반 흡수율 (총 매출액 / 총 처방액). 화면과 동일하게 직거래+도매 합계 후 반올림 사용
  let totalRevenue = 0;
  rows.forEach(row => {
    totalRevenue += combinedRevenueForValidation(row);
  });
  
  // 매출액이 없으면 지급액 기반으로 계산 (하위 호환성)
  let totalPaymentAmount = 0;
  rows.forEach(row => {
    totalPaymentAmount += Number(row.payment_amount) || 0;
  });
  
  const revenueBasedRate = totalPrescriptionAmount > 0 && totalRevenue > 0
    ? totalRevenue / totalPrescriptionAmount
    : 0;
  
  const paymentBasedRate = totalPrescriptionAmount > 0
    ? totalPaymentAmount / totalPrescriptionAmount
    : 0;
  
  // 매출액이 있으면 매출액 기반 사용, 없으면 지급액 기반 사용
  const simpleDivisionRate = totalRevenue > 0 ? revenueBasedRate : paymentBasedRate;

  // 두 방식의 차이 확인 (부동소수점 오차 고려)
  const difference = Math.abs(weightedAverageRate - simpleDivisionRate);
  const tolerance = 0.0001; // 0.01% 허용 오차

  if (difference > tolerance) {
    return {
      isValid: false,
      message: `흡수율 계산 불일치 발견!\n가중 평균: ${(weightedAverageRate * 100).toFixed(4)}%\n단순 나눗셈: ${(simpleDivisionRate * 100).toFixed(4)}%\n차이: ${(difference * 100).toFixed(4)}%`,
      weightedAverage: weightedAverageRate,
      simpleDivision: simpleDivisionRate,
      difference: difference
    };
  }

  return {
    isValid: true,
    message: '흡수율 계산이 정확합니다.',
    weightedAverage: weightedAverageRate,
    simpleDivision: simpleDivisionRate,
    difference: difference
  };
}

/**
 * 합계 검증
 * 부분 합계의 총합이 전체 합계와 일치하는지 확인
 * 
 * @param {Array} rows - 통계 데이터 행 배열
 * @param {string} groupField - 그룹화 필드 (예: 'company_id', 'hospital_id')
 * @returns {Object} 검증 결과
 */
export function validateTotals(rows, groupField = null) {
  if (!rows || rows.length === 0) {
    return { isValid: true, message: '데이터가 없습니다.' };
  }

  // 전체 합계 계산
  const totalQty = rows.reduce((sum, row) => sum + (Number(row.prescription_qty) || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
  const totalPayment = rows.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);

  // 그룹별 합계 계산 (그룹 필드가 있는 경우)
  if (groupField) {
    const groupMap = new Map();
    
    rows.forEach(row => {
      const groupKey = row[groupField];
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          qty: 0,
          amount: 0,
          payment: 0
        });
      }
      
      const group = groupMap.get(groupKey);
      group.qty += Number(row.prescription_qty) || 0;
      group.amount += Number(row.prescription_amount) || 0;
      group.payment += Number(row.payment_amount) || 0;
    });

    // 그룹별 합계의 총합
    let groupTotalQty = 0;
    let groupTotalAmount = 0;
    let groupTotalPayment = 0;

    groupMap.forEach(group => {
      groupTotalQty += group.qty;
      groupTotalAmount += group.amount;
      groupTotalPayment += group.payment;
    });

    // 검증
    const qtyDiff = Math.abs(totalQty - groupTotalQty);
    const amountDiff = Math.abs(totalAmount - groupTotalAmount);
    const paymentDiff = Math.abs(totalPayment - groupTotalPayment);
    const tolerance = 0.01;

    if (qtyDiff > tolerance || amountDiff > tolerance || paymentDiff > tolerance) {
      return {
        isValid: false,
        message: `합계 불일치 발견!\n처방수량 차이: ${qtyDiff}\n처방액 차이: ${amountDiff}\n지급액 차이: ${paymentDiff}`,
        totalQty,
        groupTotalQty,
        totalAmount,
        groupTotalAmount,
        totalPayment,
        groupTotalPayment
      };
    }
  }

  return {
    isValid: true,
    message: '합계가 정확합니다.',
    totalQty,
    totalAmount,
    totalPayment
  };
}

/**
 * 데이터 무결성 검증
 * 필수 필드, 데이터 타입, 음수 값 등 확인
 * 
 * @param {Array} rows - 통계 데이터 행 배열
 * @param {string} statisticsType - 통계 타입 ('company', 'hospital', 'product')
 * @returns {Object} 검증 결과 및 발견된 문제 목록
 */
export function validateDataIntegrity(rows, statisticsType = null) {
  if (!rows || rows.length === 0) {
    return { isValid: true, issues: [], message: '데이터가 없습니다.' };
  }

  const issues = [];

  rows.forEach((row, index) => {
    // 통계 타입에 따라 필수 필드 확인
    if (statisticsType === 'company') {
      // 업체별 통계: company_id 필수
      if (row.company_id === null || row.company_id === undefined) {
        issues.push({
          row: index + 1,
          type: '필수 필드 누락',
          field: 'company_id',
          message: `행 ${index + 1}: company_id가 없습니다.`
        });
      }
    } else if (statisticsType === 'hospital') {
      // 병의원별 통계: hospital_id 필수 (company_id는 선택)
      if (row.hospital_id === null || row.hospital_id === undefined) {
        issues.push({
          row: index + 1,
          type: '필수 필드 누락',
          field: 'hospital_id',
          message: `행 ${index + 1}: hospital_id가 없습니다.`
        });
      }
    } else if (statisticsType === 'product') {
      // 제품별 통계: product_id 필수 (company_id는 선택)
      if (row.product_id === null || row.product_id === undefined) {
        issues.push({
          row: index + 1,
          type: '필수 필드 누락',
          field: 'product_id',
          message: `행 ${index + 1}: product_id가 없습니다.`
        });
      }
    } else {
      // 통계 타입이 지정되지 않은 경우: 기본적으로 company_id 확인 (하위 호환성)
      if (row.company_id === null || row.company_id === undefined) {
        issues.push({
          row: index + 1,
          type: '필수 필드 누락',
          field: 'company_id',
          message: `행 ${index + 1}: company_id가 없습니다.`
        });
      }
    }

    // 음수 값 확인
    const qty = Number(row.prescription_qty) || 0;
    const amount = Number(row.prescription_amount) || 0;
    const payment = Number(row.payment_amount) || 0;

    if (qty < 0) {
      issues.push({
        row: index + 1,
        type: '음수 값',
        field: 'prescription_qty',
        value: qty,
        message: `행 ${index + 1}: 처방수량이 음수입니다: ${qty}`
      });
    }

    if (amount < 0) {
      issues.push({
        row: index + 1,
        type: '음수 값',
        field: 'prescription_amount',
        value: amount,
        message: `행 ${index + 1}: 처방액이 음수입니다: ${amount}`
      });
    }

    if (payment < 0) {
      issues.push({
        row: index + 1,
        type: '음수 값',
        field: 'payment_amount',
        value: payment,
        message: `행 ${index + 1}: 지급액이 음수입니다: ${payment}`
      });
    }

    // 데이터 타입 확인
    if (isNaN(qty) && row.prescription_qty !== null && row.prescription_qty !== undefined) {
      issues.push({
        row: index + 1,
        type: '데이터 타입 오류',
        field: 'prescription_qty',
        value: row.prescription_qty,
        message: `행 ${index + 1}: 처방수량이 숫자가 아닙니다: ${row.prescription_qty}`
      });
    }

    // 흡수율 범위 확인 (0~1 사이 또는 0~100% 사이)
    const absorptionRate = Number(row.absorption_rate);
    if (!isNaN(absorptionRate)) {
      // 소수점 형태 (0~1) 또는 퍼센트 형태 (0~100)
      if (absorptionRate < 0 || absorptionRate > 1) {
        // 퍼센트 형태일 수도 있으므로 100으로 나눠서 확인
        if (absorptionRate < 0 || absorptionRate > 100) {
          issues.push({
            row: index + 1,
            type: '이상치',
            field: 'absorption_rate',
            value: absorptionRate,
            message: `행 ${index + 1}: 흡수율이 비정상적입니다: ${absorptionRate}`
          });
        }
      }
    }

    // 논리적 검증: 지급액이 처방액보다 클 수 없음 (흡수율이 100%를 초과할 수 없음)
    if (amount > 0 && payment > amount) {
      issues.push({
        row: index + 1,
        type: '논리 오류',
        field: 'payment_amount',
        value: payment,
        expectedMax: amount,
        message: `행 ${index + 1}: 지급액(${payment})이 처방액(${amount})보다 큽니다.`
      });
    }
  });

  return {
    isValid: issues.length === 0,
    issues: issues,
    message: issues.length === 0 
      ? '데이터 무결성 검증 통과' 
      : `${issues.length}개의 문제가 발견되었습니다.`
  };
}

/**
 * 이상치 감지
 * 평균 대비 크게 벗어난 값 감지
 * 
 * @param {Array} rows - 통계 데이터 행 배열
 * @param {number} threshold - 임계값 (기본값: 3, 3 표준편차)
 * @returns {Object} 검증 결과 및 이상치 목록
 */
export function detectOutliers(rows, threshold = 3) {
  if (!rows || rows.length === 0) {
    return { isValid: true, outliers: [], message: '데이터가 없습니다.' };
  }

  const outliers = [];

  // 평균 및 표준편차 계산
  const amounts = rows.map(row => Number(row.prescription_amount) || 0);
  const absorptionRates = rows.map(row => Number(row.absorption_rate) || 0).filter(r => !isNaN(r) && r > 0);

  if (amounts.length > 0) {
    const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    rows.forEach((row, index) => {
      const amount = Number(row.prescription_amount) || 0;
      const zScore = stdDev > 0 ? Math.abs((amount - avgAmount) / stdDev) : 0;

      if (zScore > threshold) {
        outliers.push({
          row: index + 1,
          type: '처방액 이상치',
          field: 'prescription_amount',
          value: amount,
          zScore: zScore.toFixed(2),
          message: `행 ${index + 1}: 처방액(${amount.toLocaleString()})이 평균(${avgAmount.toLocaleString()}) 대비 ${zScore.toFixed(2)} 표준편차만큼 벗어났습니다.`
        });
      }
    });
  }

  if (absorptionRates.length > 0) {
    const avgRate = absorptionRates.reduce((sum, val) => sum + val, 0) / absorptionRates.length;
    const variance = absorptionRates.reduce((sum, val) => sum + Math.pow(val - avgRate, 2), 0) / absorptionRates.length;
    const stdDev = Math.sqrt(variance);

    rows.forEach((row, index) => {
      const rate = Number(row.absorption_rate) || 0;
      if (!isNaN(rate) && rate > 0) {
        const zScore = stdDev > 0 ? Math.abs((rate - avgRate) / stdDev) : 0;

        if (zScore > threshold) {
          outliers.push({
            row: index + 1,
            type: '흡수율 이상치',
            field: 'absorption_rate',
            value: rate,
            zScore: zScore.toFixed(2),
            message: `행 ${index + 1}: 흡수율(${(rate * 100).toFixed(2)}%)이 평균(${(avgRate * 100).toFixed(2)}%) 대비 ${zScore.toFixed(2)} 표준편차만큼 벗어났습니다.`
          });
        }
      }
    });
  }

  return {
    isValid: outliers.length === 0,
    outliers: outliers,
    message: outliers.length === 0 
      ? '이상치가 발견되지 않았습니다.' 
      : `${outliers.length}개의 이상치가 발견되었습니다.`
  };
}

