/**
 * 공통 포맷팅 유틸리티 함수
 */

/**
 * 숫자를 한국어 형식으로 포맷팅
 * @param {number|string} value - 포맷팅할 숫자
 * @param {boolean} isQty - 수량인지 여부 (소수점 표시)
 * @returns {string} 포맷팅된 문자열
 */
export function formatNumber(value, isQty = false) {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  if (isQty) {
    return num.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return Math.round(num).toLocaleString('ko-KR');
}

/**
 * 흡수율을 백분율 형식으로 포맷팅
 * @param {number|string} value - 흡수율 (0~1 사이의 소수점 값)
 * @returns {string} 포맷팅된 문자열 (예: "95.0%")
 */
export function formatAbsorptionRate(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 소수점을 백분율로 변환 (예: 0.95 -> 95.0%)
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * 사업자등록번호를 형식에 맞게 포맷팅
 * @param {string} businessNumber - 사업자등록번호
 * @returns {string} 포맷팅된 문자열 (예: "123-45-67890")
 */
export function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '-';
  
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 10자리가 아니면 원본 반환
  if (numbers.length !== 10) return businessNumber;
  
  // 형식 변환: ###-##-#####
  return numbers.substring(0, 3) + '-' + numbers.substring(3, 5) + '-' + numbers.substring(5);
}

/**
 * 수수료율을 소수점으로 변환하는 헬퍼 함수
 * 입력값이 퍼센트(예: 5, 5%, 5.5%)이면 소수점(0.05)으로 변환
 * 입력값이 이미 소수점(예: 0.05)이면 그대로 사용
 * @param {string|number} input - 변환할 입력값
 * @returns {number} 소수점 형태의 수수료율 (예: 0.05)
 */
export function convertCommissionRateToDecimal(input) {
  if (input === null || input === undefined || input === '') {
    return 0;
  }
  
  // 문자열로 변환하고 공백 제거
  const str = String(input).trim();
  if (!str) return 0;
  
  // 퍼센트 기호 제거
  const hasPercent = str.includes('%');
  const cleanedStr = str.replace(/%/g, '').replace(/,/g, '');
  
  // 숫자로 변환
  const num = parseFloat(cleanedStr);
  if (isNaN(num)) return 0;
  
  // 퍼센트 기호가 있거나 값이 1보다 크면 100으로 나누어 소수점으로 변환
  if (hasPercent || num > 1) {
    return num / 100;
  }
  
  // 이미 소수점으로 입력된 경우 그대로 사용
  return num;
}

