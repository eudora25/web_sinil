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
          <button class="btn-delete" @click="deleteAllProducts" style="margin-right: 1rem;">모두 삭제</button>
          <button class="btn-save" @click="goCreate">개별 등록</button>
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
              type="number"
              step="0.001"
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
              type="number"
              step="0.001"
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
              type="number"
              step="0.001"
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
              type="number"
              step="0.001"
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
              type="number"
              step="0.001"
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


  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils'


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
        console.error('기준월 목록 로딩 오류:', monthError);
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
    
    console.log('가져온 기준월 데이터 개수:', allMonthData.length);
    console.log('기준월 데이터 샘플:', allMonthData.slice(0, 10));
    
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
    
    console.log('추출된 기준월 목록:', availableMonths.value);
    
    // 최신 연월을 기본값으로 설정하고 해당 월의 제품 불러오기
    if (availableMonths.value.length > 0) {
      selectedMonth.value = availableMonths.value[0];
      await fetchProductsByMonth(selectedMonth.value);
    }
  } catch (err) {
    console.error('기준월 목록 로딩 오류:', err);
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
      console.error('제품 데이터 로딩 오류:', productsError);
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
      console.error('업체 할당 데이터 로딩 오류:', assignmentError);
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
      console.error('업체 데이터 로딩 오류:', companiesError);
      return;
    }
    
    // 5. user_id로 company_name 매핑
    const companiesMap = {};
    companiesData?.forEach(company => {
      companiesMap[company.user_id] = company.company_name;
    });
    
    // 디버깅: created_by, updated_by 값 확인
    console.log('Companies data:', companiesData);
    console.log('Companies map:', companiesMap);
    if (productsData && productsData.length > 0) {
      console.log('Sample product created_by:', productsData[0].created_by);
      console.log('Sample product updated_by:', productsData[0].updated_by);
      console.log('Sample product created_by type:', typeof productsData[0].created_by);
      console.log('Sample product updated_by type:', typeof productsData[0].updated_by);
      
      // companiesMap에서 해당 값이 있는지 확인
      console.log('created_by in companiesMap:', companiesMap[productsData[0].created_by]);
      console.log('updated_by in companiesMap:', companiesMap[productsData[0].updated_by]);
    }
    
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
    console.error('제품 데이터 로딩 오류:', err);
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
      
      // 가운데 정렬이 필요한 컬럼들 (기준월, 보험코드, 수수료A~E, 상태)
      if (colNumber === 1 || colNumber === 3 || colNumber === 5 || 
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
      alert('로그인이 필요합니다.')
      return
    }

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      alert('엑셀 파일에 데이터가 없습니다.')
      return
    }

    // 업로드 데이터의 기준월들 추출
    const uploadMonths = [...new Set(jsonData.map(row => row['기준월']).filter(month => month))]
    
    // 기존 데이터 확인
    let hasExistingData = false
    for (const month of uploadMonths) {
      const existingProducts = products.value.filter(p => p.base_month === month)
      if (existingProducts.length > 0) {
        hasExistingData = true
        break
      }
    }

    // 1단계: 기존 데이터 존재 시 확인
    let isAppendMode = false
    if (hasExistingData) {
      if (!confirm('기존 데이터가 있습니다.\n계속 등록하시겠습니까?')) {
        event.target.value = ''
        return
      }

      // 2단계: 추가 vs 대체 선택
      isAppendMode = confirm('기존 데이터에 추가하시겠습니까? 대체하시겠습니까?\n\n확인: 기존 데이터는 그대로 추가 등록\n취소: 기존 데이터를 모두 지우고 등록')
      
      if (!isAppendMode) {
        // 대체 모드: 해당 기준월의 기존 데이터 삭제
        for (const month of uploadMonths) {
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('base_month', month)
          
          if (deleteError) {
            alert('기존 데이터 삭제 실패: ' + deleteError.message)
            event.target.value = ''
            return
          }
        }
        // 대체 모드에서는 로컬 데이터도 업데이트
        products.value = products.value.filter(p => !uploadMonths.includes(p.base_month))
      }
    }

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

      // 수수료율 A 검증 (0~1, 소수점 3자리)
      if (row['수수료A'] !== undefined && row['수수료A'] !== null && row['수수료A'] !== '') {
        const commissionA = Number(row['수수료A'])
        if (isNaN(commissionA) || commissionA < 0 || commissionA > 1) {
          errors.push(`${rowNum}행: 수수료율 A는 0~1 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        row['수수료A'] = Math.round(commissionA * 1000) / 1000
      }

      // 수수료율 B 검증 (0~1, 소수점 3자리)
      if (row['수수료B'] !== undefined && row['수수료B'] !== null && row['수수료B'] !== '') {
        const commissionB = Number(row['수수료B'])
        if (isNaN(commissionB) || commissionB < 0 || commissionB > 1) {
          errors.push(`${rowNum}행: 수수료율 B는 0~1 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        row['수수료B'] = Math.round(commissionB * 1000) / 1000
      }

      // 수수료율 C 검증 (0~1, 소수점 3자리)
      if (row['수수료C'] !== undefined && row['수수료C'] !== null && row['수수료C'] !== '') {
        const commissionC = Number(row['수수료C'])
        if (isNaN(commissionC) || commissionC < 0 || commissionC > 1) {
          errors.push(`${rowNum}행: 수수료율 C는 0~1 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        row['수수료C'] = Math.round(commissionC * 1000) / 1000
      }

      // 수수료율 D 검증 (0~1, 소수점 3자리)
      if (row['수수료D'] !== undefined && row['수수료D'] !== null && row['수수료D'] !== '') {
        const commissionD = Number(row['수수료D'])
        if (isNaN(commissionD) || commissionD < 0 || commissionD > 1) {
          errors.push(`${rowNum}행: 수수료율 D는 0~1 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        row['수수료D'] = Math.round(commissionD * 1000) / 1000
      }

      // 수수료율 E 검증 (0~1, 소수점 3자리)
      if (row['수수료E'] !== undefined && row['수수료E'] !== null && row['수수료E'] !== '') {
        const commissionE = Number(row['수수료E'])
        if (isNaN(commissionE) || commissionE < 0 || commissionE > 1) {
          errors.push(`${rowNum}행: 수수료율 E는 0~1 사이의 숫자여야 합니다.`)
          return
        }
        // 소수점 3자리로 반올림
        row['수수료E'] = Math.round(commissionE * 1000) / 1000
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
        commission_rate_a: Number(row['수수료A']) || 0,
        commission_rate_b: Number(row['수수료B']) || 0,
        commission_rate_c: Number(row['수수료C']) || 0,
        commission_rate_d: Number(row['수수료D']) || 0,
        commission_rate_e: Number(row['수수료E']) || 0,
        remarks: row['비고'] || '',
        status: statusValue,
        created_by: user.id, // 등록자 ID 추가
        rowNum: rowNum // 에러 표시용
      })
    })

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 3단계: 추가 모드일 때만 보험코드 중복 체크
    if (hasExistingData && isAppendMode) {
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
        if (!confirm('중복 오류:\n' + duplicateErrors.join('\n') + '\n\n계속 등록 작업을 진행하시겠습니까?')) {
          return
        }

        // 5단계: 중복 해결 방법 선택
        const shouldReplace = confirm('이미 동일한 보험코드 제품을 어떻게 처리하시겠습니까?\n\n확인: 기존 제품 정보를 신규 제품 정보로 교체하기\n취소: 기존 제품 정보는 그대로 두고 신규 제품 정보만 등록하기')
        
        if (shouldReplace) {
          // 교체 모드: 중복되는 기존 제품들 삭제
          for (const duplicateProduct of duplicateProducts) {
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('base_month', duplicateProduct.base_month)
              .eq('insurance_code', duplicateProduct.insurance_code)
            
            if (deleteError) {
              alert('기존 제품 삭제 실패: ' + deleteError.message)
              return
            }
          }
          // 로컬 데이터에서도 삭제
          for (const duplicateProduct of duplicateProducts) {
            const index = products.value.findIndex(p => 
              p.base_month === duplicateProduct.base_month && 
              p.insurance_code === duplicateProduct.insurance_code
            )
            if (index > -1) {
              products.value.splice(index, 1)
            }
          }
        } else {
          // 기존 유지 모드: 중복되는 신규 제품들 제외
          const duplicateInsuranceCodes = duplicateProducts.map(p => p.insurance_code)
          uploadData = uploadData.filter(item => !duplicateInsuranceCodes.includes(item.insurance_code))
        }
      }
    }

    // 최종 등록
    const insertData = uploadData.map(item => {
      const { rowNum, ...data } = item
      return data
    })

    if (insertData.length === 0) {
      alert('등록할 데이터가 없습니다.')
      return
    }

    const { error } = await supabase.from('products').insert(insertData)

    if (error) {
      alert('업로드 실패: ' + error.message)
    } else {
      alert(`${insertData.length}건의 제품 데이터가 업로드되었습니다.`)
      await fetchProducts()
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    alert('파일 처리 중 오류가 발생했습니다.')
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    event.target.value = ''
  }
}

const downloadExcel = async () => {
  if (filteredProducts.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
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
      
      // 가운데 정렬이 필요한 컬럼들 (No, 기준월, 보험코드, 수수료A~E, 상태, 등록일시, 수정일시)
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6 || 
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
      alert('제품명은 필수 입력 항목입니다.');
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
      alert('보험코드는 필수 입력 항목입니다.');
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
      alert('약가는 필수 입력 항목입니다.');
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
      alert('보험코드는 9자리 숫자여야 합니다.');
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
      alert('약가는 0 이상의 숫자여야 합니다.');
      setTimeout(() => {
        const priceInput = document.getElementById(`price_${row.id}`);
        if (priceInput) {
          priceInput.focus();
          priceInput.select();
        }
      }, 100);
      return;
    }

    // 수수료율 A 검증 (0~1, 소수점 3자리)
    if (row.commission_rate_a && row.commission_rate_a.toString().trim() !== '') {
      const commissionAValue = Number(row.commission_rate_a);
      if (isNaN(commissionAValue) || commissionAValue < 0 || commissionAValue > 1) {
        alert('수수료율 A는 0~1 사이의 숫자여야 합니다.');
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
      row.commission_rate_a = Math.round(commissionAValue * 1000) / 1000;
    }

    // 수수료율 B 검증 (0~1, 소수점 3자리)
    if (row.commission_rate_b && row.commission_rate_b.toString().trim() !== '') {
      const commissionBValue = Number(row.commission_rate_b);
      if (isNaN(commissionBValue) || commissionBValue < 0 || commissionBValue > 1) {
        alert('수수료율 B는 0~1 사이의 숫자여야 합니다.');
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
      row.commission_rate_b = Math.round(commissionBValue * 1000) / 1000;
    }

    // 수수료율 C 검증 (0~1, 소수점 3자리)
    if (row.commission_rate_c && row.commission_rate_c.toString().trim() !== '') {
      const commissionCValue = Number(row.commission_rate_c);
      if (isNaN(commissionCValue) || commissionCValue < 0 || commissionCValue > 1) {
        alert('수수료율 C는 0~1 사이의 숫자여야 합니다.');
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
      row.commission_rate_c = Math.round(commissionCValue * 1000) / 1000;
    }

    // 수수료율 D 검증 (0~1, 소수점 3자리)
    if (row.commission_rate_d && row.commission_rate_d.toString().trim() !== '') {
      const commissionDValue = Number(row.commission_rate_d);
      if (isNaN(commissionDValue) || commissionDValue < 0 || commissionDValue > 1) {
        alert('수수료율 D는 0~1 사이의 숫자여야 합니다.');
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
      row.commission_rate_d = Math.round(commissionDValue * 1000) / 1000;
    }

    // 수수료율 E 검증 (0~1, 소수점 3자리)
    if (row.commission_rate_e && row.commission_rate_e.toString().trim() !== '') {
      const commissionEValue = Number(row.commission_rate_e);
      if (isNaN(commissionEValue) || commissionEValue < 0 || commissionEValue > 1) {
        alert('수수료율 E는 0~1 사이의 숫자여야 합니다.');
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
      row.commission_rate_e = Math.round(commissionEValue * 1000) / 1000;
    }

    if (!['active', 'inactive'].includes(row.status)) {
      alert('상태는 active 또는 inactive여야 합니다.')
      return
    }

    const updateData = {
      product_name: row.product_name,
      insurance_code: row.insurance_code,
      price: Number(row.price) || 0,
      commission_rate_a: row.commission_rate_a === '' ? 0 : Number(row.commission_rate_a),
      commission_rate_b: row.commission_rate_b === '' ? 0 : Number(row.commission_rate_b),
      commission_rate_c: row.commission_rate_c === '' ? 0 : Number(row.commission_rate_c),
      commission_rate_d: row.commission_rate_d === '' ? 0 : Number(row.commission_rate_d),
      commission_rate_e: row.commission_rate_e === '' ? 0 : Number(row.commission_rate_e),
      remarks: row.remarks || '',
      status: row.status,
    }

    const { error } = await supabase.from('products').update(updateData).eq('id', row.id)

    if (error) {
      alert('수정 실패: ' + error.message)
      return
    }

    row.isEditing = false
    row.originalData = { ...row }

    alert('수정되었습니다.')
  } catch (error) {
    console.error('수정 오류:', error)
    alert('수정 중 오류가 발생했습니다.')
  }
}

const deleteProduct = async (row) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    const { error } = await supabase.from('products').delete().eq('id', row.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    const index = products.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      products.value.splice(index, 1)
    }

    alert('삭제되었습니다.')
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

async function deleteAllProducts() {
  if (!selectedMonth.value) {
    alert('기준월을 선택해주세요.');
    return;
  }
  
  const confirmMessage = `정말 ${selectedMonth.value} 기준월의 모든 제품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
  if (!confirm(confirmMessage)) return;
  
  // 선택된 기준월에 해당하는 제품만 삭제
  const { error } = await supabase.from('products').delete().eq('base_month', selectedMonth.value);
  if (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message);
    return;
  }
  
  // 로컬 데이터에서도 해당 기준월 제품 제거
  products.value = products.value.filter(p => p.base_month !== selectedMonth.value);
  
  alert(`${selectedMonth.value} 기준월의 모든 제품이 삭제되었습니다.`);
}

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
  
  console.log('오버플로우 체크:', {
    text: element.textContent,
    textWidth,
    availableWidth,
    isOverflowed
  });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    console.log('오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    console.log('오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  console.log('오버플로우 클래스 제거됨');
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



</style>
