import { supabase } from '@/supabase'

/**
 * (업체 × 병의원) 조합의 수수료 등급(A~E)을 반환한다.
 * - client_company_assignments.modified_commission_grade 우선
 * - 없으면 companies.default_commission_grade
 * - 그것도 없으면 'A'
 * 순수 async 함수(컴포넌트 상태 비의존) — 실적등록/편집 등 여러 화면에서 공용.
 *
 * @param {string} companyId 업체 id
 * @param {number|string} clientId 병의원 id
 * @returns {Promise<string>} 등급 문자열 'A'~'E'
 */
export async function getCommissionGradeForClientCompany(companyId, clientId) {
  const { data, error } = await supabase
    .from('client_company_assignments')
    .select('modified_commission_grade, company:companies(default_commission_grade)')
    .eq('company_id', companyId)
    .eq('client_id', clientId)
    .single()

  if (error || !data) {
    // 매핑 정보가 없으면 회사의 기본 등급 사용
    const { data: company } = await supabase
      .from('companies')
      .select('default_commission_grade')
      .eq('id', companyId)
      .single()
    return company?.default_commission_grade || 'A'
  }

  // modified_commission_grade가 있으면 우선 사용, 없으면 companies의 default_commission_grade 사용
  return data.modified_commission_grade || data.company?.default_commission_grade || 'A'
}

/**
 * 등급에 해당하는 제품 수수료율(소수)을 반환한다.
 * 제품 레코드의 commission_rate_a~e 중 등급 문자에 맞는 값을 고른다.
 *
 * @param {object} product commission_rate_a~e를 가진 제품 레코드
 * @param {string} grade 'A'~'E'
 * @returns {number} 수수료율(소수). 값이 없으면 0
 */
export function pickRateByGrade(product, grade) {
  if (!product) return 0
  const key = `commission_rate_${String(grade || 'A').toLowerCase()}`
  const rate = product[key]
  return rate === null || rate === undefined ? 0 : Number(rate)
}
