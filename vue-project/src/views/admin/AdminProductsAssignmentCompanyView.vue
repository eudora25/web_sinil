<template>
  <div class="assignment-page">
    <div class="filter-card">
      <div class="header-content">
        <div class="header-left">
          <button class="btn-back" @click="goBack">← 뒤로가기</button>
          <h1 class="page-title">{{ productName }} ({{ insuranceCode }})</h1>
        </div>
      </div>
      

    </div>


    <div class="data-card">

      <!-- 업체 선택 영역 -->
      <div class="companies-section">
        <!-- 왼쪽: 할당 업체 테이블 -->
        <div class="table-container">
          <div class="table-header">
            <span>할당 업체 ({{ allCompanies.length }})</span>
          </div>
          <div class="table-content">
            <div class="table-header-row">
              <div class="header-cell checkbox-cell">
                <input 
                  type="checkbox" 
                  :checked="allAllCompaniesChecked" 
                  :indeterminate="someAllCompaniesChecked"
                  @change="toggleAllAllCompanies"
                  :disabled="allCompanies.length === 0"
                  class="performance-checkbox"
                />
              </div>
              <div class="header-cell name-cell">업체명</div>
              <div class="header-cell number-cell">사업자등록번호</div>
              <div class="header-cell rep-cell">대표자</div>
              <div class="header-cell location-cell">사업장소재지</div>
            </div>
            <div class="table-body">
              <div
                v-for="company in allCompanies"
                :key="company.id"
                class="table-row"
              >
                <div class="item-cell checkbox-cell">
                  <input 
                    type="checkbox" 
                    v-model="company.is_checked" 
                    @change="updateAllCompaniesSelection" 
                    class="performance-checkbox" 
                  />
                </div>
                <div class="item-cell name-cell">
                  <span class="company-name">{{ company.company_name }}</span>
                </div>
                <div class="item-cell number-cell">
                  <span class="business-number">{{ company.business_registration_number || '-' }}</span>
                </div>
                <div class="item-cell rep-cell">
                  <span class="representative">{{ company.representative_name || '-' }}</span>
                </div>
                <div class="item-cell location-cell">
                  <span class="business-location">{{ company.business_address || '-' }}</span>
                </div>
              </div>
              <div v-if="allCompanies.length === 0" class="empty-message">
                선택된 업체가 없습니다
              </div>
            </div>
          </div>
        </div>

        <!-- 중앙: 화살표 버튼 -->
        <div class="arrow-section">
          <button
            class="arrow-btn"
            :disabled="selectedAllCompaniesCount === 0"
            @click="assignCompanies"
            title="미할당"
          >
            →
          </button>
          <button
            class="arrow-btn"
            :disabled="selectedUnassignedCompaniesCount === 0"
            @click="unassignCompanies"
            title="할당"
          >
            ←
          </button>
        </div>

        <!-- 오른쪽: 미할당 업체 테이블 -->
        <div class="table-container">
          <div class="table-header">
            <span>미할당 업체 ({{ unassignedCompanies.length }})</span>
          </div>
          <div class="table-content">
            <div class="table-header-row">
              <div class="header-cell checkbox-cell">
                <input 
                  type="checkbox" 
                  :checked="allUnassignedCompaniesChecked" 
                  :indeterminate="someUnassignedCompaniesChecked"
                  @change="toggleAllUnassignedCompanies"
                  :disabled="unassignedCompanies.length === 0"
                  class="performance-checkbox"
                />
              </div>
              <div class="header-cell name-cell">업체명</div>
              <div class="header-cell number-cell">사업자등록번호</div>
              <div class="header-cell rep-cell">대표자</div>
              <div class="header-cell location-cell">사업장소재지</div>
            </div>
            <div class="table-body">
              <div
                v-for="company in unassignedCompanies"
                :key="company.id"
                class="table-row"
              >
                <div class="item-cell checkbox-cell">
                  <input 
                    type="checkbox" 
                    v-model="company.is_checked" 
                    @change="updateUnassignedCompaniesSelection" 
                    class="performance-checkbox" 
                  />
                </div>
                <div class="item-cell name-cell">
                  <span class="company-name">{{ company.company_name }}</span>
                </div>
                <div class="item-cell number-cell">
                  <span class="business-number">{{ company.business_registration_number || '-' }}</span>
                </div>
                <div class="item-cell rep-cell">
                  <span class="representative">{{ company.representative_name || '-' }}</span>
                </div>
                <div class="item-cell location-cell">
                  <span class="business-location">{{ company.business_address || '-' }}</span>
                </div>
              </div>
              <div v-if="unassignedCompanies.length === 0" class="empty-message">
                선택된 업체가 없습니다
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useNotifications } from '@/utils/notifications'

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

export default {
  name: 'AdminProductsAssignmentCompanyView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const companies = ref([])
    const loading = ref(false)
    const originalAssignments = ref([])
    const productName = ref('')
    const insuranceCode = ref('')

    const allCompanies = ref([])
    const unassignedCompanies = ref([])

         // 제품 정보 로드
     const loadProductInfo = async () => {
       try {
         const { data, error } = await supabase
           .from('products')
           .select('product_name, insurance_code')
           .eq('id', route.params.productId)
           .single()

         if (error) throw error
         productName.value = data.product_name
         insuranceCode.value = data.insurance_code
       } catch (error) {
         console.error('제품 정보 로드 실패:', error)
         productName.value = '알 수 없는 제품'
       }
     }

    // 체크박스 상태 계산
    const selectedAllCompaniesCount = computed(() => {
      return allCompanies.value.filter(company => company.is_checked).length
    })

    const selectedUnassignedCompaniesCount = computed(() => {
      return unassignedCompanies.value.filter(company => company.is_checked).length
    })

    const allAllCompaniesChecked = computed({
      get() {
        return allCompanies.value.length > 0 && 
               allCompanies.value.every(company => company.is_checked)
      },
      set(value) {
        allCompanies.value.forEach(company => {
          company.is_checked = value
        })
      }
    })

    const someAllCompaniesChecked = computed(() => {
      const checkedCount = allCompanies.value.filter(company => company.is_checked).length
      return checkedCount > 0 && checkedCount < allCompanies.value.length
    })

    const allUnassignedCompaniesChecked = computed({
      get() {
        return unassignedCompanies.value.length > 0 && 
               unassignedCompanies.value.every(company => company.is_checked)
      },
      set(value) {
        unassignedCompanies.value.forEach(company => {
          company.is_checked = value
        })
      }
    })

    const someUnassignedCompaniesChecked = computed(() => {
      const checkedCount = unassignedCompanies.value.filter(company => company.is_checked).length
      return checkedCount > 0 && checkedCount < unassignedCompanies.value.length
    })

    // 변경사항 확인
    const hasChanges = computed(() => {
      // 현재 할당된 업체와 원본 할당을 비교
      const currentAssignedIds = unassignedCompanies.value.map(company => company.id)
      const originalAssignedIds = originalAssignments.value.map(assignment => assignment.company_id)
      
      if (currentAssignedIds.length !== originalAssignedIds.length) {
        return true
      }
      
      return currentAssignedIds.some(id => !originalAssignedIds.includes(id)) ||
             originalAssignedIds.some(id => !currentAssignedIds.includes(id))
    })



    // 전체 업체 로드 (미할당 업체를 제외한 모든 승인된 업체)
    const loadAllCompanies = async () => {
      if (!route.params.productId) return
      
      // console.log('🔍 전체 업체 로드 시작 - product_id:', route.params.productId)
      loading.value = true
      
      try {
        // 1. 먼저 미할당 업체 ID들을 가져옴
        // console.log('📋 1단계: 미할당 업체 ID 조회 중...')
        const { data: unassignedData, error: unassignedError } = await supabase
          .from('product_company_not_assignments')
          .select('company_id')
          .eq('product_id', route.params.productId)

        if (unassignedError) {
          console.error('❌ 미할당 업체 ID 조회 실패:', unassignedError)
          throw unassignedError
        }

        const unassignedCompanyIds = unassignedData.map(item => item.company_id)
        // console.log('✅ 미할당 업체 ID 목록:', unassignedCompanyIds)

        // 2. 미할당 업체를 제외한 모든 승인된 업체를 가져옴
        // console.log('📋 2단계: 전체 승인된 업체 조회 중...')
        let query = supabase
          .from('companies')
          .select('id, company_name, business_registration_number, representative_name, business_address')
          .eq('user_type', 'user')
          .eq('approval_status', 'approved')
          .order('company_name')

        if (unassignedCompanyIds.length > 0) {
          // console.log('🔍 미할당 업체 제외 필터 적용')
          query = query.not('id', 'in', `(${unassignedCompanyIds.join(',')})`)
        }

        const { data, error } = await query

        if (error) {
          console.error('❌ 전체 업체 조회 실패:', error)
          throw error
        }

        // console.log('✅ 전체 업체 조회 성공 - 개수:', data.length)
        // console.log('📋 전체 업체 샘플:', data.slice(0, 3))

        allCompanies.value = data.map(company => ({
          ...company,
          is_checked: false
        }))
        
        // console.log('✅ 전체 업체 목록 설정 완료 - 개수:', allCompanies.value.length)
      } catch (error) {
        console.error('❌ 전체 업체 로드 실패:', error)
        showError('전체 업체 목록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    // 미할당 업체 로드 (product_company_not_assignments 테이블에서)
    const loadUnassignedCompanies = async () => {
      if (!route.params.productId) return
      
      // console.log('🔍 미할당 업체 로드 시작 - product_id:', route.params.productId)
      loading.value = true
      
      try {
        // console.log('📋 product_company_not_assignments 테이블 조회 중...')
        const { data, error } = await supabase
          .from('product_company_not_assignments')
          .select(`
            company_id,
            companies!inner(
              id,
              company_name,
              business_registration_number,
              representative_name,
              business_address
            )
          `)
          .eq('product_id', route.params.productId)

        if (error) {
          console.error('❌ 미할당 업체 조회 실패:', error)
          throw error
        }

        // console.log('✅ 미할당 업체 조회 성공 - 개수:', data.length)
        // console.log('📋 미할당 업체 원본 데이터:', data)

        unassignedCompanies.value = data.map(item => ({
          id: item.companies.id,
          company_name: item.companies.company_name,
          business_registration_number: item.companies.business_registration_number,
          representative_name: item.companies.representative_name,
          business_address: item.companies.business_address,
          is_checked: false
        }))

        // console.log('✅ 미할당 업체 목록 설정 완료 - 개수:', unassignedCompanies.value.length)
        // console.log('📋 미할당 업체 변환된 데이터:', unassignedCompanies.value)

        // 원본 데이터 저장
        originalAssignments.value = [...unassignedCompanies.value]
        // console.log('✅ 원본 할당 데이터 저장 완료')
      } catch (error) {
        console.error('❌ 미할당 업체 로드 실패:', error)
        showError('미할당 업체 목록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    // 전체 선택/해제 토글
    const toggleAllAllCompanies = () => {
      const newValue = !allAllCompaniesChecked.value
      allCompanies.value.forEach(company => {
        company.is_checked = newValue
      })
    }

    const toggleAllUnassignedCompanies = () => {
      const newValue = !allUnassignedCompaniesChecked.value
      unassignedCompanies.value.forEach(company => {
        company.is_checked = newValue
      })
    }

    // 개별 선택 상태 업데이트
    const updateAllCompaniesSelection = () => {
      // 별도 처리 불필요 (v-model로 자동 처리)
    }

    const updateUnassignedCompaniesSelection = () => {
      // 별도 처리 불필요 (v-model로 자동 처리)
    }

    // 업체 할당/해제 동작
    const assignCompanies = async () => {
      const companiesToAssign = allCompanies.value.filter(company => company.is_checked)
      if (companiesToAssign.length === 0) return

      loading.value = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          showError('로그인이 필요합니다.')
          return
        }

        // product_company_not_assignments 테이블에 추가
        const assignments = companiesToAssign.map(company => ({
          product_id: route.params.productId,
          company_id: company.id,
          created_by: user.id
        }))

        const { error } = await supabase
          .from('product_company_not_assignments')
          .insert(assignments)

        if (error) throw error

        // 체크 해제
        companiesToAssign.forEach(company => {
          company.is_checked = false
        })

        // 양쪽 리스트 모두 새로고침
        await loadAllCompanies()
        await loadUnassignedCompanies()
        
        showSuccess(`${companiesToAssign.length}개 업체가 미할당되었습니다.`)
      } catch (error) {
        console.error('업체 미할당 실패:', error)
        showError('업체 미할당 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    const unassignCompanies = async () => {
      const companiesToUnassign = unassignedCompanies.value.filter(company => company.is_checked)
      if (companiesToUnassign.length === 0) return

      loading.value = true
      try {
        // product_company_not_assignments 테이블에서 삭제
        const { error } = await supabase
          .from('product_company_not_assignments')
          .delete()
          .eq('product_id', route.params.productId)
          .in('company_id', companiesToUnassign.map(company => company.id))

        if (error) throw error

        // 체크 해제
        companiesToUnassign.forEach(company => {
          company.is_checked = false
        })

        // 양쪽 리스트 모두 새로고침
        await loadAllCompanies()
        await loadUnassignedCompanies()
        
        showSuccess(`${companiesToUnassign.length}개 업체가 할당되었습니다.`)
      } catch (error) {
        console.error('업체 할당 실패:', error)
        showError('업체 할당 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    // 페이지 이벤트 처리
    const goBack = () => {
      router.push('/admin/products')
    }



    // 컴포넌트 마운트 시 데이터 로드
    onMounted(async () => {
      await loadProductInfo()
      await loadAllCompanies()
      await loadUnassignedCompanies()
    })

    return {
      companies,
      loading,
      productName,
      insuranceCode,

      allCompanies,
      unassignedCompanies,
      selectedAllCompaniesCount,
      selectedUnassignedCompaniesCount,
      allAllCompaniesChecked,
      someAllCompaniesChecked,
      allUnassignedCompaniesChecked,
      someUnassignedCompaniesChecked,
      hasChanges,
      toggleAllAllCompanies,
      toggleAllUnassignedCompanies,
      updateAllCompaniesSelection,
      updateUnassignedCompaniesSelection,
      assignCompanies,
      unassignCompanies,

      goBack
    }
  }
}
</script>

<style scoped>
.assignment-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.btn-back {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #495057;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #eee;
  border-color: #adb5bd;
}

.assignment-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.table-header-section {
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.75rem;
}

.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header-item {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: #495057;
  font-size: 1rem;
}

.companies-section {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  min-height: 500px;
  margin-bottom: 2rem;
}

.table-container {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
  background-color: white;
}

.table-header {
  background-color: #888;
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
}

.table-content {
  height: 500px;
  overflow: hidden;
}

.table-header-row {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 500;
  font-size: var(--font-size-base);
}

.header-cell {
  padding: 0.5rem;
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center !important;
  text-align: center !important;
}

.header-cell:last-child {
  border-right: none;
}

.checkbox-cell {
  width: 50px;
  text-align: center;
}

.name-cell {
  width: 200px;
  justify-content: flex-start;
}

.number-cell {
  width: 140px;
  text-align: center !important;
  justify-content: center !important;
}

.rep-cell {
  width: 100px;
  text-align: center !important;
  justify-content: center !important;
}

.location-cell {
  flex: 1;
  justify-content: flex-start;
}

.table-body {
  max-height: 420px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f1f3f4;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.item-cell {
  padding: 0.5rem;
  border-right: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.item-cell:last-child {
  border-right: none;
}

.item-cell.checkbox-cell {
  justify-content: center;
}

.item-cell.name-cell {
  justify-content: flex-start;
}

.company-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.business-number {
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.representative {
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.business-location {
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-message {
  padding: 2rem 1rem;
  text-align: center;
  color: #6c757d;
  font-size: var(--font-size-base);
}

/* 화살표 버튼 스타일 강화 */
.arrow-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  padding: 6rem 1rem;
}

.arrow-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
  transform: scale(1.05);
}

.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: #888;
  background-color: #ddd;
  color: #222;
}


</style> 