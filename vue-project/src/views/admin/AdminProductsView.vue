<template>
  <div class="admin-products-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">제품 목록</div>
    </div>

    <div class="filter-card">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px; margin-right: 24px;">
          <label style="white-space: nowrap; font-weight: 400">기준월</label>
          <select
            v-model="selectedMonth"
            @change="filterByMonth"
            class="select_month"
          >
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="제품명, 보험코드"
              class="search-input"
              @keyup.enter="doSearch"
              style="width:100%;"
            />
            <button
              v-if="searchInput.length > 0"
              class="clear-btn"
              @click="clearSearch"
              title="검색어 초기화">
              ×
            </button>
          </span>
          <button
            class="search-btn"
            :disabled="searchInput.length < 2"
            @click="doSearch">
            검색
          </button>
        </div>
      </div>
    </div>

    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ filteredProducts.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
          <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
<!--          <button class="btn-delete" @click="deleteAllProducts" style="margin-right: 1rem;">모두 삭제</button>-->
          <button class="btn-save" @click="goCreate" style="margin-right: 1rem;">개별 등록</button>
          <button class="btn-save" @click="openMonthlyRegisterModal">월별 등록</button>
        </div>
      </div>

      <DataTable
        :value="filteredProducts"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-products-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 제품이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column
          field="product_name" header="제품명" :headerStyle="{ width: columnWidths.product_name }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.product_name"
              class="p-inputtext p-component p-inputtext-sm inline-edit-input"
              :id="`product_name_${slotProps.data.id}`"
            />
            <a v-else href="#" class="text-link ellipsis-cell" :title="slotProps.data.product_name" @click.prevent="goToDetail(slotProps.data.id)" @mouseenter="checkProductOverflow" @mouseleave="removeOverflowClass">
              {{ slotProps.data.product_name }}
            </a>
          </template>
        </Column>
        <Column
          field="insurance_code"
          header="보험코드"
          :headerStyle="{ width: columnWidths.insurance_code }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.insurance_code"
              class="p-inputtext p-component p-inputtext-sm inline-edit-input"
              :id="`insurance_code_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.insurance_code }}</span>
          </template>
        </Column>
        <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.price"
              type="number"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`price_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.price?.toLocaleString() }}</span>
          </template>
        </Column>
        <Column header="수수료율 A" :headerStyle="{ width: columnWidths.commission_rate_a }" :sortable="false">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.commission_rate_a"
              type="text"
              placeholder="예: 36, 36%"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`commission_rate_a_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.commission_rate_a !== undefined && slotProps.data.commission_rate_a !== null ? (slotProps.data.commission_rate_a * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </Column>
        <Column header="수수료율 B" :headerStyle="{ width: columnWidths.commission_rate_b }" :sortable="false">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.commission_rate_b"
              type="text"
              placeholder="예: 36, 36%"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`commission_rate_b_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.commission_rate_b !== undefined && slotProps.data.commission_rate_b !== null ? (slotProps.data.commission_rate_b * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </Column>
        <Column header="수수료율 C" :headerStyle="{ width: columnWidths.commission_rate_c }" :sortable="false">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.commission_rate_c"
              type="text"
              placeholder="예: 36, 36%"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`commission_rate_c_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.commission_rate_c !== undefined && slotProps.data.commission_rate_c !== null ? (slotProps.data.commission_rate_c * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </Column>
        <Column header="수수료율 D" :headerStyle="{ width: columnWidths.commission_rate_d }" :sortable="false">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.commission_rate_d"
              type="text"
              placeholder="예: 36, 36%"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`commission_rate_d_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.commission_rate_d !== undefined && slotProps.data.commission_rate_d !== null ? (slotProps.data.commission_rate_d * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </Column>
        <Column header="수수료율 E" :headerStyle="{ width: columnWidths.commission_rate_e }" :sortable="false">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.commission_rate_e"
              type="text"
              placeholder="예: 36, 36%"
              class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
              :id="`commission_rate_e_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.commission_rate_e !== undefined && slotProps.data.commission_rate_e !== null ? (slotProps.data.commission_rate_e * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </Column>


        <Column
          field="created_at"
          header="등록일자"
          :headerStyle="{ width: columnWidths.created_at }"
          :sortable="true"
        >
          <template #body="slotProps">
            <span>{{ slotProps.data.created_at ? new Date(slotProps.data.created_at).toISOString().split('T')[0] : '' }}</span>
          </template>
        </Column>
        <Column header="업체" :headerStyle="{ width: columnWidths.companies }" :sortable="false">
          <template #body="slotProps">
            <div class="companies-cell">
              <div
                class="companies-summary clickable"
                @click="openCompanyAssignment(slotProps.data)"
                title="업체 할당 관리"
              >
                <span v-if="isAllCompaniesAssigned(slotProps.data)" class="all-assigned">
                  전체
                </span>
                <template v-else>
                  <span class="active-count">{{ getValidActiveCount(slotProps.data) }}</span>
                  <span class="separator">/</span>
                  <span class="total-count">{{ slotProps.data.total_companies_count || 0 }}</span>
                </template>
              </div>
            </div>
          </template>
        </Column>
        <Column field="status" header="상태" :headerStyle="{ width: columnWidths.status }" :sortable="true">
          <template #body="slotProps">
            <select
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.status"
              class="p-inputtext p-component p-inputtext-sm inline-edit-input"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <span
              v-else
              :class="slotProps.data.status === 'active' ? 'active-badge' : 'inactive-badge'"
            >
              {{ slotProps.data.status === 'active' ? '활성' : '비활성' }}
            </span>
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: columnWidths.actions }">
          <template #body="slotProps">
            <div style="display: flex; gap: 0.25rem; justify-content: center;">
              <template v-if="slotProps.data.isEditing">
                <button @click="saveEdit(slotProps.data)" class="btn-save-sm" :disabled="!isEditValid(slotProps.data)" title="저장">저장</button>
                <button @click="cancelEdit(slotProps.data)" class="btn-cancel-sm" title="취소">취소</button>
              </template>
              <template v-else>
                <button @click="startEdit(slotProps.data)" class="btn-edit-sm" title="수정">수정</button>
                <button @click="deleteProduct(slotProps.data)" class="btn-delete-sm" title="삭제">삭제</button>
              </template>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 전체 화면 로딩 오버레이 - 메뉴 진입 시 -->
    <div v-if="loading && !excelLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>

    <!-- 전체 화면 로딩 오버레이 - 엑셀 등록 시 -->
    <div v-if="excelLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">등록 진행중입니다...</div>
      </div>
    </div>

    <!-- 월별 등록 모달 -->
    <div v-if="showMonthlyRegisterModal" class="modal-overlay" @click="!monthlyRegisterLoading && closeMonthlyRegisterModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>월별 제품 등록</h3>
          <button class="modal-close" @click="closeMonthlyRegisterModal" :disabled="monthlyRegisterLoading">×</button>
        </div>
        <div class="modal-body">
          <div class="monthly-register-form">
            <!-- 로딩 오버레이 -->
            <div v-if="monthlyRegisterLoading" class="form-loading-overlay">
              <div class="loading-spinner"></div>
              <div class="loading-text">데이터 복사 중...</div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>복사할 기준월<span class="required">*</span></label>
                <select v-model="selectedSourceMonth" class="form-select" :disabled="monthlyRegisterLoading">
                  <option value="">기준월을 선택하세요</option>
                  <option v-for="month in availableMonths" :key="month" :value="month">
                    {{ month }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>적용할 월<span class="required">*</span></label>
                <select v-model="selectedTargetMonth" class="form-select" :disabled="monthlyRegisterLoading">
                  <option value="">적용할 월을 선택하세요</option>
                  <option v-for="month in targetMonths" :key="month" :value="month">
                    {{ month }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" @click="closeMonthlyRegisterModal" :disabled="monthlyRegisterLoading">취소</button>
              <button class="btn-save" @click="executeMonthlyRegister" :disabled="!isMonthlyRegisterValid || monthlyRegisterLoading">
                {{ monthlyRegisterLoading ? '복사 중...' : '적용' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils'
import { translateSupabaseError, translateGeneralError } from '@/utils/errorMessages'
import { convertCommissionRateToDecimal } from '@/utils/formatUtils'
import { useNotifications } from '@/utils/notifications'

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotifications();

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  product_name: '20%',
  insurance_code: '7%',
  price: '6%',
  commission_rate_a: '7%',
  commission_rate_b: '7%',
  commission_rate_c: '7%',
  commission_rate_d: '7%',
  commission_rate_e: '7%',
  created_at: '8%',
  companies: '6%',
  status: '6%',
  actions: '8%'
};

const products = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const searchInput = ref('');
const searchKeyword = ref('');
const filteredProducts = ref([]);
const selectedMonth = ref('')
const availableMonths = ref([])
const router = useRouter()
const fileInput = ref(null)
const currentPageFirstIndex = ref(0)

// 월별 등록 모달 관련 변수들
const showMonthlyRegisterModal = ref(false)
const selectedSourceMonth = ref('')
const selectedTargetMonth = ref('')
const targetMonths = ref([])
const monthlyRegisterLoading = ref(false)



function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredProducts.value = products.value.filter(p =>
      (p.product_name && p.product_name.toLowerCase().includes(keyword)) ||
      (p.insurance_code && p.insurance_code.toLowerCase().includes(keyword))
    );
  }
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredProducts.value = products.value;
}

const koLocale = {
  firstDayOfWeek: 0,
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  today: '오늘',
  clear: '초기화',
}

const filterByMonth = async () => {
  if (selectedMonth.value) {
    await fetchProductsByMonth(selectedMonth.value);
  }
}

function goCreate() {
  router.push('/admin/products/create')
}
function goToDetail(id) {
  router.push(`/admin/products/${id}`)
}

// 월별 등록 모달 관련 함수들
const openMonthlyRegisterModal = () => {
  generateTargetMonths()
  showMonthlyRegisterModal.value = true
}

const closeMonthlyRegisterModal = (force = false) => {
  if (monthlyRegisterLoading.value && !force) {
    return // 로딩 중일 때는 모달을 닫지 않음 (강제 닫기가 아닌 경우)
  }
  showMonthlyRegisterModal.value = false
  selectedSourceMonth.value = ''
  selectedTargetMonth.value = ''
  monthlyRegisterLoading.value = false // 로딩 상태도 초기화
}

// 이전달부터 6개월 후까지의 월 목록 생성
const generateTargetMonths = () => {
  const months = []
  const currentDate = new Date()
  
  for (let i = -1; i < 6; i++) { // 이전달 포함 7개월
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  
  targetMonths.value = months
}

// 월별 등록 폼 유효성 검사
const isMonthlyRegisterValid = computed(() => {
  return selectedSourceMonth.value && selectedTargetMonth.value && 
         selectedSourceMonth.value !== selectedTargetMonth.value
})

// 월별 등록 실행
const executeMonthlyRegister = async () => {
  if (!isMonthlyRegisterValid.value) {
    showWarning('복사할 기준월과 적용할 월을 모두 선택해주세요.')
    return
  }

  if (selectedSourceMonth.value === selectedTargetMonth.value) {
    showWarning('복사할 기준월과 적용할 월이 같을 수 없습니다.')
    return
  }

  if (!confirm(`${selectedSourceMonth.value}월의 제품 데이터를 ${selectedTargetMonth.value}월로 복사하시겠습니까?`)) {
    return
  }

  monthlyRegisterLoading.value = true

  try {
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showError('로그인 정보가 없습니다.')
      return
    }

    // 1. 복사할 기준월의 제품 데이터 조회
    const { data: sourceProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', selectedSourceMonth.value)

    if (productsError) {
      const errorMessage = translateSupabaseError(productsError, '제품 데이터 조회');
      throw new Error(errorMessage);
    }

    if (!sourceProducts || sourceProducts.length === 0) {
      showWarning(`${selectedSourceMonth.value}월에 복사할 제품 데이터가 없습니다.`)
      return
    }


    // 2. 복사할 기준월의 업체 할당 데이터 조회
    const { data: sourceAssignments, error: assignmentsError } = await supabase
      .from('product_company_not_assignments')
      .select(`
        product_id,
        company_id,
        products!inner(
          id,
          base_month
        )
      `)
      .eq('products.base_month', selectedSourceMonth.value)

    if (assignmentsError) {
      const errorMessage = translateSupabaseError(assignmentsError, '업체 할당 데이터 조회');
      throw new Error(errorMessage);
    }


    // 3. 새로운 제품 데이터 생성 (base_month 변경)
    const newProducts = sourceProducts.map(product => {
      const { id, created_at, updated_at, ...productData } = product
      return {
        ...productData,
        base_month: selectedTargetMonth.value,
        created_by: user.id,
        updated_by: user.id
      }
    })

    // 4. 제품 데이터 삽입
    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(newProducts)
      .select('id, insurance_code')

    if (insertError) {
      const errorMessage = translateSupabaseError(insertError, '제품 데이터 삽입');
      throw new Error(errorMessage);
    }


    // 5. 업체 할당 데이터 복사 (새로운 제품 ID로 매핑)
    if (sourceAssignments && sourceAssignments.length > 0) {
      const newAssignments = []
      
      for (const assignment of sourceAssignments) {
        // 원본 제품의 보험코드로 새 제품 찾기
        const originalProduct = sourceProducts.find(p => p.id === assignment.product_id)
        const newProduct = insertedProducts.find(p => p.insurance_code === originalProduct.insurance_code)
        
        if (newProduct) {
          newAssignments.push({
            product_id: newProduct.id,
            company_id: assignment.company_id
          })
        }
      }

      if (newAssignments.length > 0) {
        const { error: assignmentInsertError } = await supabase
          .from('product_company_not_assignments')
          .insert(newAssignments)

        if (assignmentInsertError) {
          // 업체 할당 실패해도 제품 복사는 성공으로 처리
        }
      }
    }

    showSuccess(`${insertedProducts.length}개의 제품이 ${selectedTargetMonth.value}월로 복사되었습니다.`)
    
    // 6. 모달 닫기 및 데이터 새로고침
    closeMonthlyRegisterModal(true) // 강제로 모달 닫기
    await fetchProducts()
    
    // 7. 복사된 월로 자동 이동
    if (availableMonths.value.includes(selectedTargetMonth.value)) {
      selectedMonth.value = selectedTargetMonth.value
      await fetchProductsByMonth(selectedTargetMonth.value)
    }

    // 8. 복사 결과 검증 (개발용)

  } catch (error) {
    console.error('월별 등록 오류:', error);
    const errorMessage = translateGeneralError(error, '월별 등록');
    showError(errorMessage);
    monthlyRegisterLoading.value = false // 오류 시에만 로딩 상태 해제
  }
}

const fetchProducts = async () => {
  loading.value = true;
  try {
    // 페이지네이션을 사용하여 모든 기준월 데이터 가져오기
    let allMonthData = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000;

    while (hasMore) {
      const { data: monthData, error: monthError } = await supabase
        .from('products')
        .select('base_month')
        .not('base_month', 'is', null)
        .order('base_month', { ascending: false })
        .range(offset, offset + limit - 1);

      if (monthError) {
        return;
      }

      if (monthData && monthData.length > 0) {
        allMonthData = allMonthData.concat(monthData);
        offset += limit;

        // 더 이상 데이터가 없으면 중단
        if (monthData.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }


    // 중복 제거하고 최신순으로 정렬
    const monthSet = new Set();
    allMonthData.forEach((item) => {
      if (item.base_month) {
        monthSet.add(item.base_month);
      }
    });

    availableMonths.value = Array.from(monthSet).sort((a, b) => {
      return b.localeCompare(a); // 최신순 정렬
    });


    // 최신 연월을 기본값으로 설정하고 해당 월의 제품 불러오기
    if (availableMonths.value.length > 0) {
      selectedMonth.value = availableMonths.value[0];
      await fetchProductsByMonth(selectedMonth.value);
    }
  } catch (err) {
  } finally {
    loading.value = false;
  }
}

// 선택된 기준월의 제품만 불러오는 함수
const fetchProductsByMonth = async (month) => {
  if (!month) return;

  loading.value = true;
  try {
    // 1. 제품 데이터 가져오기
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', month)
      .order('product_name', { ascending: true })
      .limit(1000);

    if (productsError) {
      return;
    }

    // 2. 업체 할당 정보 가져오기 (product_company_not_assignments 테이블 사용)
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('product_company_not_assignments')
      .select(`
        product_id,
        company_id,
        companies!inner(
          id,
          company_name,
          approval_status,
          user_type
        )
      `)
      .eq('companies.user_type', 'user')
      .eq('companies.approval_status', 'approved');

    if (assignmentError) {
      return;
    }

    // 3. 전체 업체 수 계산 (승인된 업체만)
    const { count: totalCompaniesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'user')
      .eq('approval_status', 'approved');

    // 4. companies 테이블에서 업체명 가져오기 (user와 admin 모두 포함)
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('user_id, company_name')
      .eq('approval_status', 'approved');

    if (companiesError) {
      return;
    }

    // 5. user_id로 company_name 매핑
    const companiesMap = {};
    companiesData?.forEach(company => {
      companiesMap[company.user_id] = company.company_name;
    });

    // 디버깅: created_by, updated_by 값 확인

    // 4. 제품별 업체 할당 정보 매핑 (할당 안된 업체만 저장하는 방식)
    const productsWithAssignments = productsData.map(product => {
      const notAssignedCompanies = assignmentData.filter(
        assignment => assignment.product_id === product.id
      );

      // 할당 안된 업체 수
      const notAssignedCount = notAssignedCompanies.length;

      // 활성 업체 수 = 전체 업체 수 - 할당 안된 업체 수
      const activeCompaniesCount = Math.max(0, (totalCompaniesCount || 0) - notAssignedCount);

      return {
        ...product,
        created_by_name: companiesMap[product.created_by] || '',
        updated_by_name: companiesMap[product.updated_by] || '',
        active_companies_count: activeCompaniesCount,
        total_companies_count: totalCompaniesCount || 0,
        not_assigned_companies: notAssignedCompanies
      };
    });

    products.value = productsWithAssignments || [];
  } catch (err) {
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchProducts()
})

// 기준월이 바뀌거나 products가 새로 로드될 때 전체로 복원
watch(products, (newVal) => {
  filteredProducts.value = newVal;
}, { immediate: true });

const downloadTemplate = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('제품템플릿')

  // 헤더 정의
  const headers = [
    '기준월', '제품명', '보험코드', '약가', '수수료A', '수수료B', '수수료C', '수수료D', '수수료E', '비고', '상태'
  ]

  // 헤더 추가
  worksheet.addRow(headers)

  // 헤더 스타일 설정
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '76933C' } // RGB(118, 147, 60)
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 예시 데이터 추가
  const exampleData = [
    ['2025-01', '팜플정', '601234567', 1000, 0.45, 0.44, 0.30, 0.25, 0.20, '', '활성'],
  ]

  exampleData.forEach((rowData) => {
    const dataRow = worksheet.addRow(rowData)

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 기준월 컬럼은 텍스트 형식으로 설정
      if (colNumber === 1) {
        cell.numFmt = '@'
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 가운데 정렬이 필요한 컬럼들 (보험코드, 수수료A~E, 상태)
      if (colNumber === 3 || colNumber === 5 ||
          colNumber === 6 || colNumber === 7 || colNumber === 8 || colNumber === 9 || colNumber === 11) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 약가 컬럼은 숫자형식이므로 오른쪽 정렬
      if (colNumber === 4) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })

  })
  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 12 }, // 기준월
    { width: 32 }, // 제품명
    { width: 12 }, // 보험코드
    { width: 12 }, // 약가
    { width: 12 }, // 수수료A
    { width: 12 }, // 수수료B
    { width: 12 }, // 수수료C
    { width: 12 }, // 수수료D
    { width: 12 }, // 수수료E
    { width: 24 }, // 비고
    { width: 10 }  // 상태
  ]

  // 약가 컬럼에 천단위 콤마 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getCell(row, 4) // 약가 컬럼 (4번째)
    cell.numFmt = '#,##0'
  }

  // 약가 컬럼에 천단위 콤마 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getCell(row, 4) // 약가 컬럼 (4번째)
    cell.numFmt = '#,##0'
  }

  // 수수료A~E 컬럼에 백분율 형식 적용 (소수점 한자리)
  for (let row = 2; row <= worksheet.rowCount; row++) {
    for (let col = 5; col <= 9; col++) {
      const cell = worksheet.getCell(row, col)
      cell.numFmt = '0.0%'
    }
  }

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
  for (let row = 1; row <= worksheet.rowCount; row++) {
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    }
  }

  // 헤더행 고정 및 눈금선 숨기기
  worksheet.views = [
    {
      showGridLines: false,
      state: 'frozen',
      xSplit: 0,
      ySplit: 1
    }
  ]

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '제품_엑셀등록_템플릿.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}

const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 엑셀 등록 로딩 시작
  excelLoading.value = true

  try {
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showError('로그인이 필요합니다.')
      return
    }

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      showWarning('엑셀 파일에 데이터가 없습니다.')
      return
    }

    // 기존 데이터 확인
    const hasExistingData = products.value.length > 0

    // 1단계: 기존 데이터 존재 시 확인
    if (hasExistingData) {
      if (!confirm('기존 데이터가 있습니다.\n계속 등록하시겠습니까?')) {
        event.target.value = ''
        return
      }

      // 2단계: 추가 등록 확인
      const choice = await showUploadChoiceModal()

      if (choice !== 'append') {
        // cancel이거나 잘못된 입력
        event.target.value = ''
        return
      }
    }

    // 데이터 변환 및 검증
    let uploadData = []
    const errors = []

    jsonData.forEach((row, index) => {
      const rowNum = index + 2

      if (!row['기준월']) {
        errors.push(`${rowNum}행: 기준월이 필요합니다.`)
        return
      }
      if (!row['제품명']) {
        errors.push(`${rowNum}행: 제품명이 필요합니다.`)
        return
      }
      if (!row['보험코드']) {
        errors.push(`${rowNum}행: 보험코드가 필요합니다.`)
        return
      }

      // 보험코드 형식 검증 (9자리 숫자)
      if (row['보험코드'].toString().length !== 9 || !/^\d{9}$/.test(row['보험코드'].toString())) {
        errors.push(`${rowNum}행: 보험코드는 9자리 숫자여야 합니다.`)
        return
      }

      // 약가 형식 검증 (숫자)
      if (row['약가'] && (isNaN(Number(row['약가'])) || Number(row['약가']) < 0)) {
        errors.push(`${rowNum}행: 약가는 0 이상의 숫자여야 합니다.`)
        return
      }

      // 수수료율 A 변환 및 검증
      let commissionRateA = 0;
      if (row['수수료A'] !== undefined && row['수수료A'] !== null && row['수수료A'] !== '') {
        commissionRateA = convertCommissionRateToDecimal(row['수수료A']);
        if (commissionRateA < 0 || commissionRateA > 1) {
          errors.push(`${rowNum}행: 수수료율 A는 0~100% 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        commissionRateA = Math.round(commissionRateA * 1000) / 1000
      }

      // 수수료율 B 변환 및 검증
      let commissionRateB = 0;
      if (row['수수료B'] !== undefined && row['수수료B'] !== null && row['수수료B'] !== '') {
        commissionRateB = convertCommissionRateToDecimal(row['수수료B']);
        if (commissionRateB < 0 || commissionRateB > 1) {
          errors.push(`${rowNum}행: 수수료율 B는 0~100% 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        commissionRateB = Math.round(commissionRateB * 1000) / 1000
      }

      // 수수료율 C 변환 및 검증
      let commissionRateC = 0;
      if (row['수수료C'] !== undefined && row['수수료C'] !== null && row['수수료C'] !== '') {
        commissionRateC = convertCommissionRateToDecimal(row['수수료C']);
        if (commissionRateC < 0 || commissionRateC > 1) {
          errors.push(`${rowNum}행: 수수료율 C는 0~100% 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        commissionRateC = Math.round(commissionRateC * 1000) / 1000
      }

      // 수수료율 D 변환 및 검증
      let commissionRateD = 0;
      if (row['수수료D'] !== undefined && row['수수료D'] !== null && row['수수료D'] !== '') {
        commissionRateD = convertCommissionRateToDecimal(row['수수료D']);
        if (commissionRateD < 0 || commissionRateD > 1) {
          errors.push(`${rowNum}행: 수수료율 D는 0~100% 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        commissionRateD = Math.round(commissionRateD * 1000) / 1000
      }

      // 수수료율 E 변환 및 검증
      let commissionRateE = 0;
      if (row['수수료E'] !== undefined && row['수수료E'] !== null && row['수수료E'] !== '') {
        commissionRateE = convertCommissionRateToDecimal(row['수수료E']);
        if (commissionRateE < 0 || commissionRateE > 1) {
          errors.push(`${rowNum}행: 수수료율 E는 0~100% 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        commissionRateE = Math.round(commissionRateE * 1000) / 1000
      }

      const monthRegex = /^\d{4}-\d{2}$/
      if (!monthRegex.test(row['기준월'])) {
        errors.push(`${rowNum}행: 기준월은 YYYY-MM 형식이어야 합니다.`)
        return
      }

      let statusValue = 'active'
      if (row['상태']) {
        if (row['상태'] === '활성') {
          statusValue = 'active'
        } else if (row['상태'] === '비활성') {
          statusValue = 'inactive'
        } else {
          errors.push(`${rowNum}행: 상태는 '활성' 또는 '비활성'이어야 합니다.`)
          return
        }
      } else {
        statusValue = 'active'
      }

      uploadData.push({
        base_month: row['기준월'],
        product_name: row['제품명'],
        insurance_code: row['보험코드'],
        price: Number(row['약가']) || 0,
        commission_rate_a: commissionRateA,
        commission_rate_b: commissionRateB,
        commission_rate_c: commissionRateC,
        commission_rate_d: commissionRateD,
        commission_rate_e: commissionRateE,
        remarks: row['비고'] || '',
        status: statusValue,
        created_by: user.id, // 등록자 ID 추가
        rowNum: rowNum // 에러 표시용
      })
    })

    if (errors.length > 0) {
      showError('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 3단계: 기존 데이터가 있을 때만 보험코드 중복 체크
    if (hasExistingData) {
      const duplicateErrors = []
      const duplicateProducts = []

      for (const newProduct of uploadData) {
        if (newProduct.insurance_code) {
          // 기존 데이터에서 동일한 기준월의 보험코드 중복 확인
          const existingProduct = products.value.find(p =>
            p.base_month === newProduct.base_month &&
            p.insurance_code === newProduct.insurance_code
          )

          if (existingProduct) {
            duplicateErrors.push(`${newProduct.rowNum}행: 이미 동일한 보험코드 제품이 등록되어 있습니다.`)
            duplicateProducts.push(newProduct)
          }
        }
      }

      if (duplicateErrors.length > 0) {
        // 4단계: 중복 발견 시 계속 진행 여부 확인
        const confirmed = await showConfirm('중복 오류:\n' + duplicateErrors.join('\n') + '\n\n계속 등록 작업을 진행하시겠습니까?', '중복 확인');
        if (!confirmed) {
          return
        }

        // 5단계: 중복 해결 방법 선택 (버튼 모달)
        const duplicateChoice = await showDuplicateChoiceModal()

        if (duplicateChoice === 'keep') {
          // 기존 유지 모드: 중복되는 신규 제품들 제외
          const duplicateInsuranceCodes = duplicateProducts.map(p => p.insurance_code)
          uploadData = uploadData.filter(item => !duplicateInsuranceCodes.includes(item.insurance_code))
        } else {
          // cancel 모드: 업로드 취소
          return
        }
      }
    }

    // 최종 등록
    const insertData = uploadData.map(item => {
      const { rowNum, ...data } = item
      return data
    })

    if (insertData.length === 0) {
      showWarning('등록할 데이터가 없습니다.')
      return
    }

    const { error } = await supabase.from('products').insert(insertData)

    if (error) {
      const errorMessage = translateSupabaseError(error, '엑셀 등록');
      showError(`업로드 실패: ${errorMessage}`);
    } else {
      showSuccess(`${insertData.length}건의 제품 데이터가 업로드되었습니다.`)
      await fetchProducts()
    }
  } catch (error) {
    console.error('파일 처리 오류:', error);
    const errorMessage = translateGeneralError(error, '파일 처리');
    showError(errorMessage);
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    event.target.value = ''
  }
}

const downloadExcel = async () => {
    if (filteredProducts.value.length === 0) {
    showWarning('다운로드할 데이터가 없습니다.')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('제품목록')

  // 헤더 정의
  const headers = [
    'No', '기준월', '제품명', '보험코드', '약가', '수수료A', '수수료B', '수수료C',
    '수수료D', '수수료E', '비고', '상태', '등록일시', '등록자', '수정일시', '수정자'
  ]

  // 헤더 추가
  worksheet.addRow(headers)
  // 헤더 스타일 설정

  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '76933C' } // RGB(118, 147, 60)
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 데이터 추가
  filteredProducts.value.forEach((product, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      product.base_month || '',
      product.product_name || '',
      product.insurance_code || '',
      product.price || 0,
      product.commission_rate_a || 0,
      product.commission_rate_b || 0,
      product.commission_rate_c || 0,
      product.commission_rate_d || 0,
      product.commission_rate_e || 0,
      product.remarks || '',
      product.status === 'active' ? '활성' : '비활성',
      product.created_at ? new Date(product.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace(/\./g, '').replace(/ /g, ' ') : '',
      product.created_by_name || '',
      product.updated_at ? new Date(product.updated_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace(/\./g, '').replace(/ /g, ' ') : '',
      product.updated_by_name || ''
    ])

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 기준월 컬럼은 텍스트 형식으로 설정
      if (colNumber === 2) {
        cell.numFmt = '@'
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 가운데 정렬이 필요한 컬럼들 (No, 보험코드, 수수료A~E, 상태, 등록일시, 수정일시)
      if (colNumber === 1 || colNumber === 4 || colNumber === 6 ||
          colNumber === 7 || colNumber === 8 || colNumber === 9 || colNumber === 10 ||
          colNumber === 12 || colNumber === 13 || colNumber === 15) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 약가 컬럼은 숫자형식이므로 오른쪽 정렬
      if (colNumber === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 8 },  // No
    { width: 12 }, // 기준월
    { width: 32 }, // 제품명
    { width: 12 }, // 보험코드
    { width: 12 }, // 약가
    { width: 12 }, // 수수료A
    { width: 12 }, // 수수료B
    { width: 12 }, // 수수료C
    { width: 12 }, // 수수료D
    { width: 12 }, // 수수료E
    { width: 24 }, // 비고
    { width: 10 },  // 상태
    { width: 18 }, // 등록일시
    { width: 16 }, // 등록자
    { width: 18 }, // 수정일시
    { width: 16 }  // 수정자
  ]

  // 수수료A~E 컬럼에 백분율 형식 적용 (소수점 한자리)
  for (let row = 2; row <= worksheet.rowCount; row++) {
    for (let col = 6; col <= 10; col++) { // F~J 컬럼 (수수료A~E)
      const cell = worksheet.getCell(row, col)
      cell.numFmt = '0.0%'
    }
  }

  // 약가 컬럼에 천단위 콤마 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getCell(row, 5) // E컬럼 (약가)
    cell.numFmt = '#,##0'
  }

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
  for (let row = 1; row <= worksheet.rowCount; row++) {
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    }
  }

  // 헤더행 고정 및 눈금선 숨기기
  worksheet.views = [
    {
      showGridLines: false,
      state: 'frozen',
      xSplit: 0,
      ySplit: 1
    }
  ]

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  // 기준월 정보가 있으면 파일명에 포함
  const monthInfo = selectedMonth.value ? formatMonthToKorean(selectedMonth.value) : null
  link.download = generateExcelFileName('제품목록', monthInfo)

  link.click()
  window.URL.revokeObjectURL(url)
}


const startEdit = (row) => {
  products.value.forEach((item) => {
    if (item.isEditing && item.id !== row.id) {
      cancelEdit(item)
    }
  })

  row.originalData = { ...row }
  
  // 수수료율을 퍼센트로 변환해서 표시 (소수점 0.36 -> 36.0)
  if (row.commission_rate_a !== null && row.commission_rate_a !== undefined) {
    row.commission_rate_a = (row.commission_rate_a * 100).toFixed(1);
  }
  if (row.commission_rate_b !== null && row.commission_rate_b !== undefined) {
    row.commission_rate_b = (row.commission_rate_b * 100).toFixed(1);
  }
  if (row.commission_rate_c !== null && row.commission_rate_c !== undefined) {
    row.commission_rate_c = (row.commission_rate_c * 100).toFixed(1);
  }
  if (row.commission_rate_d !== null && row.commission_rate_d !== undefined) {
    row.commission_rate_d = (row.commission_rate_d * 100).toFixed(1);
  }
  if (row.commission_rate_e !== null && row.commission_rate_e !== undefined) {
    row.commission_rate_e = (row.commission_rate_e * 100).toFixed(1);
  }
  
  row.isEditing = true
}

// 변경값 감지 및 필수값 검증
const isEditValid = (row) => {
  // 필수값 검증
  const hasRequiredFields = row.product_name && row.product_name.trim() !== '' &&
                           row.insurance_code && row.insurance_code.toString().trim() !== '' &&
                           row.price && row.price.toString().trim() !== '';

  // 변경값 감지
  const hasChanges = row.product_name !== row.originalData.product_name ||
                    row.insurance_code !== row.originalData.insurance_code ||
                    row.price !== row.originalData.price ||
                    row.commission_rate_a !== row.originalData.commission_rate_a ||
                    row.commission_rate_b !== row.originalData.commission_rate_b ||
                    row.commission_rate_c !== row.originalData.commission_rate_c ||
                    row.commission_rate_d !== row.originalData.commission_rate_d ||
                    row.commission_rate_e !== row.originalData.commission_rate_e ||
                    row.status !== row.originalData.status ||
                    row.remarks !== row.originalData.remarks;

  return hasRequiredFields && hasChanges;
}

const cancelEdit = (row) => {
  Object.keys(row.originalData).forEach((key) => {
    if (key !== 'isEditing' && key !== 'originalData') {
      row[key] = row.originalData[key]
    }
  })
  row.isEditing = false
}

const saveEdit = async (row) => {
  try {
    // 필수 필드 검증
    if (!row.product_name || row.product_name.trim() === '') {
      showWarning('제품명은 필수 입력 항목입니다.');
      setTimeout(() => {
        const productNameInput = document.getElementById(`product_name_${row.id}`);
        if (productNameInput) {
          productNameInput.focus();
          productNameInput.select();
        }
      }, 100);
      return;
    }

    if (!row.insurance_code || row.insurance_code.toString().trim() === '') {
      showWarning('보험코드는 필수 입력 항목입니다.');
      setTimeout(() => {
        const insuranceCodeInput = document.getElementById(`insurance_code_${row.id}`);
        if (insuranceCodeInput) {
          insuranceCodeInput.focus();
          insuranceCodeInput.select();
        }
      }, 100);
      return;
    }

    if (!row.price || row.price.toString().trim() === '') {
      showWarning('약가는 필수 입력 항목입니다.');
      setTimeout(() => {
        const priceInput = document.getElementById(`price_${row.id}`);
        if (priceInput) {
          priceInput.focus();
          priceInput.select();
        }
      }, 100);
      return;
    }



    // 보험코드 형식 검증 (9자리 숫자)
    if (row.insurance_code.toString().length !== 9 || !/^\d{9}$/.test(row.insurance_code.toString())) {
      showWarning('보험코드는 9자리 숫자여야 합니다.');
      setTimeout(() => {
        const insuranceCodeInput = document.getElementById(`insurance_code_${row.id}`);
        if (insuranceCodeInput) {
          insuranceCodeInput.focus();
          insuranceCodeInput.select();
        }
      }, 100);
      return;
    }



    // 약가 형식 검증 (0 이상의 숫자)
    if (row.price && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
      showWarning('약가는 0 이상의 숫자여야 합니다.');
      setTimeout(() => {
        const priceInput = document.getElementById(`price_${row.id}`);
        if (priceInput) {
          priceInput.focus();
          priceInput.select();
        }
      }, 100);
      return;
    }

    // 수수료율 A 변환 및 검증
    let commissionRateA = 0;
    if (row.commission_rate_a && row.commission_rate_a.toString().trim() !== '') {
      commissionRateA = convertCommissionRateToDecimal(row.commission_rate_a);
      if (commissionRateA < 0 || commissionRateA > 1) {
        showWarning('수수료율 A는 0~100% 사이의 숫자여야 합니다.');
        setTimeout(() => {
          const commissionAInput = document.getElementById(`commission_rate_a_${row.id}`);
          if (commissionAInput) {
            commissionAInput.focus();
            commissionAInput.select();
          }
        }, 100);
        return;
      }
      // 소수점 3자리로 반올림
      commissionRateA = Math.round(commissionRateA * 1000) / 1000;
    }

    // 수수료율 B 변환 및 검증
    let commissionRateB = 0;
    if (row.commission_rate_b && row.commission_rate_b.toString().trim() !== '') {
      commissionRateB = convertCommissionRateToDecimal(row.commission_rate_b);
      if (commissionRateB < 0 || commissionRateB > 1) {
        showWarning('수수료율 B는 0~100% 사이의 숫자여야 합니다.');
        setTimeout(() => {
          const commissionBInput = document.getElementById(`commission_rate_b_${row.id}`);
          if (commissionBInput) {
            commissionBInput.focus();
            commissionBInput.select();
          }
        }, 100);
        return;
      }
      // 소수점 3자리로 반올림
      commissionRateB = Math.round(commissionRateB * 1000) / 1000;
    }

    // 수수료율 C 변환 및 검증
    let commissionRateC = 0;
    if (row.commission_rate_c && row.commission_rate_c.toString().trim() !== '') {
      commissionRateC = convertCommissionRateToDecimal(row.commission_rate_c);
      if (commissionRateC < 0 || commissionRateC > 1) {
        showWarning('수수료율 C는 0~100% 사이의 숫자여야 합니다.');
        setTimeout(() => {
          const commissionCInput = document.getElementById(`commission_rate_c_${row.id}`);
          if (commissionCInput) {
            commissionCInput.focus();
            commissionCInput.select();
          }
        }, 100);
        return;
      }
      // 소수점 3자리로 반올림
      commissionRateC = Math.round(commissionRateC * 1000) / 1000;
    }

    // 수수료율 D 변환 및 검증
    let commissionRateD = 0;
    if (row.commission_rate_d && row.commission_rate_d.toString().trim() !== '') {
      commissionRateD = convertCommissionRateToDecimal(row.commission_rate_d);
      if (commissionRateD < 0 || commissionRateD > 1) {
        showWarning('수수료율 D는 0~100% 사이의 숫자여야 합니다.');
        setTimeout(() => {
          const commissionDInput = document.getElementById(`commission_rate_d_${row.id}`);
          if (commissionDInput) {
            commissionDInput.focus();
            commissionDInput.select();
          }
        }, 100);
        return;
      }
      // 소수점 3자리로 반올림
      commissionRateD = Math.round(commissionRateD * 1000) / 1000;
    }

    // 수수료율 E 변환 및 검증
    let commissionRateE = 0;
    if (row.commission_rate_e && row.commission_rate_e.toString().trim() !== '') {
      commissionRateE = convertCommissionRateToDecimal(row.commission_rate_e);
      if (commissionRateE < 0 || commissionRateE > 1) {
        showWarning('수수료율 E는 0~100% 사이의 숫자여야 합니다.');
        setTimeout(() => {
          const commissionEInput = document.getElementById(`commission_rate_e_${row.id}`);
          if (commissionEInput) {
            commissionEInput.focus();
            commissionEInput.select();
          }
        }, 100);
        return;
      }
      // 소수점 3자리로 반올림
      commissionRateE = Math.round(commissionRateE * 1000) / 1000;
    }

    if (!['active', 'inactive'].includes(row.status)) {
      showWarning('상태는 active 또는 inactive여야 합니다.')
      return
    }

    const updateData = {
      product_name: row.product_name,
      insurance_code: row.insurance_code,
      price: Number(row.price) || 0,
      commission_rate_a: commissionRateA,
      commission_rate_b: commissionRateB,
      commission_rate_c: commissionRateC,
      commission_rate_d: commissionRateD,
      commission_rate_e: commissionRateE,
      remarks: row.remarks || '',
      status: row.status,
    }

    const { error } = await supabase.from('products').update(updateData).eq('id', row.id)

    if (error) {
      const errorMessage = translateSupabaseError(error, '제품 수정');
      showError(`수정 실패: ${errorMessage}`);
      return
    }

    // 저장 후 row 객체의 수수료율을 변환된 소수점 값으로 업데이트
    row.commission_rate_a = commissionRateA
    row.commission_rate_b = commissionRateB
    row.commission_rate_c = commissionRateC
    row.commission_rate_d = commissionRateD
    row.commission_rate_e = commissionRateE
    
    row.isEditing = false
    row.originalData = { ...row }

    showSuccess('수정되었습니다.')
  } catch (error) {
    console.error('수정 오류:', error);
    const errorMessage = translateGeneralError(error, '제품 수정');
    showError(errorMessage);
  }
}

const deleteProduct = async (row) => {
  const confirmed = await showConfirm('정말 삭제하시겠습니까?', '삭제 확인');
  if (!confirmed) {
    return
  }

  try {
    // RPC를 호출하여 참조 여부 확인
    const { data: isReferenceExist, error: rpcError } = await supabase.rpc(
      'check_product_references_exist',
      { p_id: row.id }
    )

    if (rpcError) {
      const errorMessage = translateSupabaseError(rpcError, '제품 참조 확인');
      showError(`삭제 확인 중 오류: ${errorMessage}`);
      return;
    }

    if (isReferenceExist != 0) {
      showWarning(`이 제품(${row.product_name})은 이미 사용되고 있어 삭제할 수 없습니다.`);
      return;
    }

    const { error } = await supabase.from('products').delete().eq('id', row.id)

    if (error) {
      const errorMessage = translateSupabaseError(error, '제품 삭제');
      showError(`삭제 실패: ${errorMessage}`);
      return;
    }

    const index = products.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      products.value.splice(index, 1)
    }

    showSuccess('삭제되었습니다.')
  } catch (error) {
    console.error('삭제 오류:', error);
    const errorMessage = translateGeneralError(error, '제품 삭제');
    showError(errorMessage);
  }
}

// async function deleteAllProducts() {
//   if (!selectedMonth.value) {
//     alert('기준월을 선택해주세요.');
//     return;
//   }
//
//   const confirmMessage = `정말 ${selectedMonth.value} 기준월의 모든 제품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.\n\n주의: 이 제품을 참조하는 실적 데이터도 함께 삭제됩니다.`;
//   if (!confirm(confirmMessage)) return;
//
//   try {
//     // 1. 먼저 해당 기준월의 제품 ID들을 조회
//     const { data: productsToDelete, error: fetchError } = await supabase
//       .from('products')
//       .select('id')
//       .eq('base_month', selectedMonth.value);
//
//     if (fetchError) {
//       alert('제품 조회 중 오류가 발생했습니다: ' + fetchError.message);
//       return;
//     }
//
//     if (!productsToDelete || productsToDelete.length === 0) {
//       alert('삭제할 제품이 없습니다.');
//       return;
//     }
//
//     const productIds = productsToDelete.map(p => p.id);
//
//     // 2. performance_records_absorption에서 해당 제품들을 참조하는 데이터 삭제
//     const { error: absorptionError } = await supabase
//       .from('performance_records_absorption')
//       .delete()
//       .in('product_id', productIds);
//
//     if (absorptionError) {
//       console.error('실적 데이터 삭제 오류:', absorptionError);
//       // 실적 데이터 삭제 실패해도 계속 진행
//     }
//
//     // 3. performance_records에서 해당 제품들을 참조하는 데이터 삭제
//     const { error: recordsError } = await supabase
//       .from('performance_records')
//       .delete()
//       .in('product_id', productIds);
//
//     if (recordsError) {
//       console.error('실적 기록 삭제 오류:', recordsError);
//       // 실적 기록 삭제 실패해도 계속 진행
//     }
//
//     // 4. 마지막으로 제품들 삭제
//     const { error: deleteError } = await supabase
//       .from('products')
//       .delete()
//       .eq('base_month', selectedMonth.value);
//
//     if (deleteError) {
//       alert('제품 삭제 중 오류가 발생했습니다: ' + deleteError.message);
//       return;
//     }
//
//     // 5. 로컬 데이터에서도 해당 기준월 제품 제거
//     products.value = products.value.filter(p => p.base_month !== selectedMonth.value);
//
//     alert(`${selectedMonth.value} 기준월의 모든 제품이 삭제되었습니다.`);
//
//   } catch (error) {
//     console.error('삭제 중 예외 발생:', error);
//     alert('삭제 중 오류가 발생했습니다: ' + error.message);
//   }
// }

// 제품명 오버플로우 감지 함수
const checkProductOverflow = (event) => {
  const element = event.target;

  // 실제 오버플로우 감지
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const fontFamily = computedStyle.fontFamily;

  // 임시 캔버스를 만들어서 텍스트의 실제 너비 측정
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(element.textContent).width;

  // 패딩과 보더 고려
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;

  const availableWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
  const isOverflowed = textWidth > availableWidth;

  if (isOverflowed) {
    element.classList.add('overflowed');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
}

// 업체 할당 관련 함수들
const openCompanyAssignment = (product) => {
  router.push(`/admin/products/${product.id}/assignment`);
}

// 모든 업체가 할당되었는지 확인
const isAllCompaniesAssigned = (product) => {
  const activeCount = product.active_companies_count || 0;
  const totalCount = product.total_companies_count || 0;
  return activeCount >= totalCount && totalCount > 0;
}

// 유효한 활성 업체 수 반환 (전체 업체 수를 초과하지 않도록)
const getValidActiveCount = (product) => {
  const activeCount = product.active_companies_count || 0;
  const totalCount = product.total_companies_count || 0;
  return Math.min(activeCount, totalCount);
}

// 중복 선택 모달 함수
function showDuplicateChoiceModal() {
  return new Promise((resolve) => {
    // 모달 컨테이너 생성
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `

    // 모달 내용 생성
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      text-align: center;
    `

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">이미 동일한 보험코드 제품을 어떻게 처리하시겠습니까?</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="keep-btn" style="
          padding: 12px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
          기존 제품 정보는 그대로 두고 신규 제품 정보만 등록하기
        </button>
        <button id="cancel-btn" style="
          padding: 12px 20px;
          background: #9e9e9e;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#757575'" onmouseout="this.style.background='#9e9e9e'">
          취소
        </button>
      </div>
    `

    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    // 버튼 이벤트 리스너
    document.getElementById('keep-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('keep')
    })

    document.getElementById('cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('cancel')
    })

    // 모달 외부 클릭 시 취소
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
  })
}

// 업로드 선택 모달 함수
function showUploadChoiceModal() {
  return new Promise((resolve) => {
    // 모달 컨테이너 생성
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `

    // 모달 내용 생성
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      text-align: center;
    `

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">기존 데이터는 그대로 두고 추가 등록하시겠습니까?</h3>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirm-btn" style="
          padding: 12px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
          확인
        </button>
        <button id="cancel-btn" style="
          padding: 12px 20px;
          background: #9e9e9e;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#757575'" onmouseout="this.style.background='#9e9e9e'">
          취소
        </button>
      </div>
    `

    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    // 버튼 이벤트 리스너
    document.getElementById('confirm-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('append')
    })

    document.getElementById('cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('cancel')
    })

    // 모달 외부 클릭 시 취소
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
  })
}

</script>

<style scoped>
.btn-save-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 업체 컬럼 스타일 */
.companies-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.companies-summary {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.companies-summary.clickable {
  cursor: pointer;
  border: none !important;
}

.companies-summary.clickable:hover {
  text-decoration: underline;
  color: var(--primary-color) !important;
}

.active-count {
  color: #495057;
}

.separator {
  color: #495057;
}

.total-count {
  color: #495057;
}

.all-assigned {
  color: #495057;
}

.active-count:hover,
.separator:hover,
.total-count:hover,
.all-assigned:hover {
  cursor: pointer;
  text-decoration: underline;
  color: var(--primary-color) !important;
  font-weight: 500;
}

/* 월별 등록 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  max-width: 650px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  border: 1px solid rgba(118, 147, 60, 0.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px 8px 0 0;
  position: relative;
  height: 40px;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.modal-close:hover {
  background-color: #f5f5f5;
}

.modal-body {
  padding: 32px 28px;
  background: white;
}

.monthly-register-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: relative;
}

.form-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 12px;
}

.form-loading-overlay .loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #76933C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.form-loading-overlay .loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #76933C;
  text-align: center;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.form-group label {
  font-weight: 600 !important;
  color: #2c3e50 !important;
  font-size: 16px !important;
  margin-top: 10px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-group label .required {
  color: #e74c3c;
  font-weight: 700;
  font-size: 16px;
}

.form-select {
  padding: 14px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  font-size: 15px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
}

.form-select:focus {
  outline: none;
  border-color: #76933C;
  box-shadow: 
    0 0 0 4px rgba(118, 147, 60, 0.15),
    0 4px 12px rgba(118, 147, 60, 0.1);
  transform: translateY(-1px);
}

.form-select:hover:not(:disabled) {
  border-color: #76933C;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 24px;
  padding-bottom: 20px;
  border-top: 1px solid rgba(118, 147, 60, 0.1);
  margin-top: 8px;
}

.modal-actions .btn-cancel {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
  position: relative;
  overflow: hidden;
}

.modal-actions .btn-cancel::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.modal-actions .btn-cancel:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.modal-actions .btn-cancel:hover:not(:disabled)::before {
  left: 100%;
}

.modal-actions .btn-save {
  padding: 12px 24px;
  background: linear-gradient(135deg, #76933C 0%, #5a7a2e 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(118, 147, 60, 0.3);
  position: relative;
  overflow: hidden;
}

.modal-actions .btn-save::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.modal-actions .btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a7a2e 0%, #4a6b2a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(118, 147, 60, 0.4);
}

.modal-actions .btn-save:hover:not(:disabled)::before {
  left: 100%;
}

.modal-actions .btn-save:disabled {
  background: linear-gradient(135deg, #ccc 0%, #bbb 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.form-select:disabled {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  cursor: not-allowed;
  opacity: 0.6;
  border-color: #dee2e6;
  box-shadow: none;
}

.modal-actions .btn-cancel:disabled {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0.6;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 20px 24px 16px;
    border-radius: 12px 12px 0 0;
  }
  
  .modal-header::before {
    border-radius: 12px 12px 0 0;
  }
  
  .modal-body {
    padding: 24px 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-actions .btn-cancel,
  .modal-actions .btn-save {
    width: 100%;
    justify-content: center;
  }
  
  .form-select {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
}


</style>
