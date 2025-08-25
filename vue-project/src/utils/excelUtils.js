// 엑셀 다운로드 파일명 생성 유틸리티

/**
 * 현재 날짜와 시간을 YYYY-MM-DD_HHMM 형식으로 반환
 * @returns {string} 현재 날짜시간 문자열
 */
export function getCurrentDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}_${hours}${minutes}`
}

/**
 * 엑셀 파일명 생성
 * @param {string} baseName - 기본 파일명 (예: "승인업체목록")
 * @param {string} monthInfo - 월 정보 (선택사항, 예: "2025년7월")
 * @returns {string} 완성된 파일명
 */
export function generateExcelFileName(baseName, monthInfo = null) {
  const dateTime = getCurrentDateTime()
  
  if (monthInfo) {
    return `${baseName}_${monthInfo}_${dateTime}.xlsx`
  } else {
    return `${baseName}_${dateTime}.xlsx`
  }
}

/**
 * 월 정보를 한국어 형식으로 변환 (예: "2025-07" -> "2025년7월")
 * @param {string} monthString - YYYY-MM 형식의 월 문자열
 * @returns {string} 한국어 형식의 월 문자열
 */
export function formatMonthToKorean(monthString) {
  if (!monthString) return null
  
  const [year, month] = monthString.split('-')
  if (!year || !month) return null
  
  return `${year}년${parseInt(month)}월`
} 