<template>
  <div class="admin-revenue-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">직거래매출 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px; margin-right: 24px">
          <label style="font-weight: 400">기간</label>
          <select v-model="fromMonth" class="select_month" @change="applyFilters">
            <option value="">- 전체 -</option>
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
          <span>~</span>
          <select v-model="toMonth" class="select_month" @change="applyFilters">
            <option value="">- 전체 -</option>
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="약국명, 사업자등록번호, 표준코드, 제품명"
              class="search-input"
              @keyup.enter="applyFilters"
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
            @click="applyFilters">
            검색
          </button>
        </div>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ totalCount.toLocaleString() }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
          <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
          <button class="btn-delete" @click="deleteAllRevenues" style="margin-right: 1rem;">모두 삭제</button>
          <button class="btn-save" @click="goCreate">개별 등록</button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
        </div>
      </div>
      <DataTable
        :value="revenues"
        :loading="false"
        paginator
        :rows="pageSize"
        :totalRecords="totalCount"
        :rowsPerPageOptions="[20, 50, 100]"
        v-model:first="currentPageFirstIndex"
        v-model:page="currentPage"
        @page="onPageChange"
        :lazy="true"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-direct-revenue-table"
      >
        <template #empty>
          <div v-if="!loading">등록된 매출이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ (currentPage - 1) * pageSize + slotProps.index + 1 }}
          </template>
        </Column>
        <Column
          field="pharmacy_code"
          header="약국코드"
          :headerStyle="{ width: columnWidths.pharmacy_code }"
        >
          <template #body="slotProps">
            <input v-if="slotProps.data.isEditing" v-model="slotProps.data.pharmacy_code" />
            <span v-else>{{ slotProps.data.pharmacy_code }}</span>
          </template>
        </Column>
        <Column
          field="pharmacy_name"
          header="약국명"
          :headerStyle="{ width: columnWidths.pharmacy_name }"
        >
          <template #body="slotProps">
            <input v-if="slotProps.data.isEditing" v-model="slotProps.data.pharmacy_name" :id="`pharmacy_name_${slotProps.data.id}`" />
            <span v-else class="ellipsis-cell" :title="slotProps.data.pharmacy_name" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.pharmacy_name }}</span>
          </template>
        </Column>
        <Column
          field="business_registration_number"
          header="사업자번호"
          :headerStyle="{ width: columnWidths.business_registration_number }"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.business_registration_number"
              :id="`business_registration_number_${slotProps.data.id}`"
              @input="formatBusinessNumber"
              @keypress="allowOnlyNumbers"
              @keydown="handleBackspace"
            />
            <span v-else>{{ slotProps.data.business_registration_number }}</span>
          </template>
        </Column>
        <Column
          field="address"
          header="주소"
          :headerStyle="{ width: columnWidths.address }"
        >
          <template #body="slotProps">
            <input v-if="slotProps.data.isEditing" v-model="slotProps.data.address" :id="`address_${slotProps.data.id}`" />
            <span v-else class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
          </template>
        </Column>
        <Column
          field="standard_code"
          header="표준코드"
          :headerStyle="{ width: columnWidths.standard_code }"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.standard_code"
              style="width: 100%; border: 1px solid #ddd; padding: 4px"
              :id="`standard_code_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.standard_code }}</span>
          </template>
        </Column>
        <Column
          field="product_name"
          header="제품명"
          :headerStyle="{ width: columnWidths.product_name }"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.product_name"
              style="width: 100%; border: 1px solid #ddd; padding: 4px"
              :id="`product_name_${slotProps.data.id}`"
            />
            <span v-else class="ellipsis-cell" :title="slotProps.data.product_name" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.product_name }}</span>
          </template>
        </Column>
        <Column
          field="sales_amount"
          header="매출액"
          :headerStyle="{ width: columnWidths.sales_amount }"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.sales_amount"
              type="number"
              style="width: 100%; border: 1px solid #ddd; padding: 4px; text-align: right"
              :id="`sales_amount_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.sales_amount?.toLocaleString() }}</span>
          </template>
        </Column>
        <Column
          field="sales_date"
          header="매출일자"
          :headerStyle="{ width: columnWidths.sales_date }"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.sales_date"
              type="date"
              style="width: 100%; border: 1px solid #ddd; padding: 4px"
              :id="`sales_date_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.sales_date }}</span>
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: columnWidths.actions }">
          <template #body="slotProps">
            <div style="display: flex; gap: 4px; justify-content: center">
              <template v-if="slotProps.data.isEditing">
                <button @click="saveEdit(slotProps.data)" class="btn-save-sm" title="저장">
                  저장
                </button>
                <button @click="cancelEdit(slotProps.data)" class="btn-cancel-sm" title="취소">
                  취소
                </button>
              </template>
              <template v-else>
                <button class="btn-edit-sm" @click="startEdit(slotProps.data)" title="수정">
                  수정
                </button>
                <button class="btn-delete-sm" @click="deleteRevenue(slotProps.data)" title="삭제">
                  삭제
                </button>
              </template>
            </div>
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column footer="합계" :colspan="7" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="Math.round(totalSalesAmount).toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column footer="" footerClass="footer-cell" />
            <Column footer="" footerClass="footer-cell" />
          </Row>
        </ColumnGroup>
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
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import Row from 'primevue/row'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { generateExcelFileName } from '@/utils/excelUtils'

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  pharmacy_code: '7%',
  pharmacy_name: '16%',
  business_registration_number: '8%',
  address: '20%',
  standard_code: '8%',
  product_name: '16%',
  sales_amount: '7%',
  sales_date: '6%',
  actions: '8%',
}

const revenues = ref([])
const loading = ref(true)
const excelLoading = ref(false)
const searchInput = ref('');
const router = useRouter()
const fileInput = ref(null)
const fromMonth = ref('')
const toMonth = ref('')
const availableMonths = ref([])
const currentPageFirstIndex = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const totalCount = ref(0)
const totalSalesAmount = ref(0)

function goCreate() {
  router.push('/admin/direct-revenue/create')
}

// 서버 사이드 페이징으로 데이터 조회
const fetchRevenues = async () => {
  loading.value = true;
  try {
    let query = supabase
      .from('direct_sales')
      .select('*')
      .order('sales_date', { ascending: false })

    // 검색 조건 적용
    if (searchInput.value.length >= 2) {
      const keyword = searchInput.value.toLowerCase();
      query = query.or(`pharmacy_name.ilike.%${keyword}%,business_registration_number.ilike.%${keyword}%,standard_code.ilike.%${keyword}%,product_name.ilike.%${keyword}%`)
    }

    // 기간 필터 적용 (A to B 방식)
    if (fromMonth.value && toMonth.value) {
      // A와 B 모두 선택: A 포함 이후 ~ B 포함 이전
      const fromDate = fromMonth.value + '-01'
      const toDate = new Date(toMonth.value + '-01')
      toDate.setMonth(toDate.getMonth() + 1)
      toDate.setDate(0) // 해당 월의 마지막 날
      const lastDay = toDate.getDate().toString().padStart(2, '0')
      const toDateStr = toMonth.value + '-' + lastDay
      
      query = query.gte('sales_date', fromDate)
        .lte('sales_date', toDateStr)
    } else if (fromMonth.value) {
      // A만 선택: A 포함 이후 모두
      query = query.gte('sales_date', fromMonth.value + '-01')
    } else if (toMonth.value) {
      // B만 선택: B 포함 이전 모두
      const toDate = new Date(toMonth.value + '-01')
      toDate.setMonth(toDate.getMonth() + 1)
      toDate.setDate(0) // 해당 월의 마지막 날
      const lastDay = toDate.getDate().toString().padStart(2, '0')
      const toDateStr = toMonth.value + '-' + lastDay
      
      query = query.lte('sales_date', toDateStr)
    }

    // 페이징 적용
    const from = (currentPage.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
    query = query.range(from, to)

    const { data, error } = await query

    if (!error && data) {
      revenues.value = data.map((item) => ({
        ...item,
        isEditing: false,
        originalData: { ...item },
      }))
    }
  } finally {
    loading.value = false;
  }
}

// 전체 개수와 합계 조회
const fetchSummary = async () => {
  try {
    // 개수 조회
    let countQuery = supabase
      .from('direct_sales')
      .select('*', { count: 'exact' })

    // 합계 조회 - RPC 함수 사용
    let sumQuery = supabase
      .rpc('calculate_sales_sum', {
        table_name: 'direct_sales',
        from_date: fromMonth.value ? fromMonth.value + '-01' : null,
        to_date: toMonth.value ? (() => {
          const toDate = new Date(toMonth.value + '-01')
          toDate.setMonth(toDate.getMonth() + 1)
          toDate.setDate(0)
          const lastDay = toDate.getDate().toString().padStart(2, '0')
          return toMonth.value + '-' + lastDay
        })() : null,
        search_keyword: searchInput.value.length >= 2 ? searchInput.value.toLowerCase() : null
      })

    // 검색 조건 적용
    if (searchInput.value.length >= 2) {
      const keyword = searchInput.value.toLowerCase();
      countQuery = countQuery.or(`pharmacy_name.ilike.%${keyword}%,business_registration_number.ilike.%${keyword}%,standard_code.ilike.%${keyword}%,product_name.ilike.%${keyword}%`)
    }

    // 기간 필터 적용 (A to B 방식)
    if (fromMonth.value && toMonth.value) {
      // A와 B 모두 선택: A 포함 이후 ~ B 포함 이전
      const fromDate = fromMonth.value + '-01'
      const toDate = new Date(toMonth.value + '-01')
      toDate.setMonth(toDate.getMonth() + 1)
      toDate.setDate(0) // 해당 월의 마지막 날
      const lastDay = toDate.getDate().toString().padStart(2, '0')
      const toDateStr = toMonth.value + '-' + lastDay
      
      countQuery = countQuery.gte('sales_date', fromDate)
        .lte('sales_date', toDateStr)
    } else if (fromMonth.value) {
      // A만 선택: A 포함 이후 모두
      countQuery = countQuery.gte('sales_date', fromMonth.value + '-01')
    } else if (toMonth.value) {
      // B만 선택: B 포함 이전 모두
      const toDate = new Date(toMonth.value + '-01')
      toDate.setMonth(toDate.getMonth() + 1)
      toDate.setDate(0) // 해당 월의 마지막 날
      const lastDay = toDate.getDate().toString().padStart(2, '0')
      const toDateStr = toMonth.value + '-' + lastDay
      
      countQuery = countQuery.lte('sales_date', toDateStr)
    }

    // 개수와 합계를 병렬로 조회
    const [countResult, sumResult] = await Promise.all([
      countQuery,
      sumQuery
    ])

    if (!countResult.error) {
      totalCount.value = countResult.count || 0
    } else {
      console.error('개수 조회 오류:', countResult.error)
      totalCount.value = 0
    }

    if (!sumResult.error && sumResult.data !== null) {
      totalSalesAmount.value = Number(sumResult.data) || 0
    } else {
      console.error('합계 조회 오류:', sumResult.error)
      totalSalesAmount.value = 0
    }

  } catch (error) {
    console.error('fetchSummary 오류:', error)
    totalCount.value = 0
    totalSalesAmount.value = 0
  }
}

const fetchAvailableMonths = () => {
  // 현재 월에서 1년 전까지의 연월 생성
  const months = []
  const currentDate = new Date()
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  
  availableMonths.value = months
}

// 페이지 변경 처리
const onPageChange = async (event) => {
  console.log('페이지 변경:', event)
  currentPage.value = event.page + 1
  currentPageFirstIndex.value = event.first
  await fetchRevenues()
}

// 필터 적용
const applyFilters = async () => {
  console.log('필터 적용 시작:', { fromMonth: fromMonth.value, toMonth: toMonth.value, searchInput: searchInput.value })
  currentPage.value = 1
  currentPageFirstIndex.value = 0
  loading.value = true
  try {
    await fetchSummary()
    console.log('fetchSummary 완료:', { totalCount: totalCount.value, totalSalesAmount: totalSalesAmount.value })
    await fetchRevenues()
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchInput.value = '';
  fromMonth.value = '';
  toMonth.value = '';
  applyFilters()
}

// 수정 시작
const startEdit = (row) => {
  // 다른 행이 편집 중이면 취소
  revenues.value.forEach((item) => {
    if (item.isEditing && item.id !== row.id) {
      cancelEdit(item)
    }
  })

  // 원본 데이터 백업
  row.originalData = { ...row }
  row.isEditing = true
}

// 수정 취소
const cancelEdit = (row) => {
  // 원본 데이터로 복원
  Object.keys(row.originalData).forEach((key) => {
    if (key !== 'isEditing' && key !== 'originalData') {
      row[key] = row.originalData[key]
    }
  })
  row.isEditing = false
}

// 수정 저장
const saveEdit = async (row) => {
  try {
    // 필수 필드 검증
    if (!row.business_registration_number || row.business_registration_number.trim() === '') {
      alert('사업자등록번호는 필수 입력 항목입니다.');
      await nextTick();
      setTimeout(() => {
        const businessNumberInput = document.getElementById(`business_registration_number_${row.id}`);
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

    if (!row.standard_code || row.standard_code.toString().trim() === '') {
      alert('표준코드는 필수 입력 항목입니다.');
      await nextTick();
      setTimeout(() => {
        const standardCodeInput = document.getElementById(`standard_code_${row.id}`);
        if (standardCodeInput) {
          standardCodeInput.focus();
          standardCodeInput.select();
        }
      }, 100);
      return;
    }

    if (!row.sales_amount || row.sales_amount.toString().trim() === '') {
      alert('매출액은 필수 입력 항목입니다.');
      await nextTick();
      setTimeout(() => {
        const salesAmountInput = document.getElementById(`sales_amount_${row.id}`);
        if (salesAmountInput) {
          salesAmountInput.focus();
          salesAmountInput.select();
        }
      }, 100);
      return;
    }

    if (!row.sales_date || row.sales_date.toString().trim() === '') {
      alert('매출일자는 필수 입력 항목입니다.');
      await nextTick();
      setTimeout(() => {
        const salesDateInput = document.getElementById(`sales_date_${row.id}`);
        if (salesDateInput) {
          salesDateInput.focus();
          salesDateInput.select();
        }
      }, 100);
      return;
    }

    // 사업자등록번호 형식 검증 (10자리 숫자)
    const businessNumberDigits = row.business_registration_number.replace(/[^0-9]/g, '');
    if (businessNumberDigits.length !== 10) {
      alert('사업자등록번호는 10자리여야 합니다.');
      await nextTick();
      setTimeout(() => {
        const businessNumberInput = document.getElementById(`business_registration_number_${row.id}`);
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

    // 표준코드 형식 검증 (13자리 숫자)
    if (row.standard_code.toString().length !== 13 || !/^\d{13}$/.test(row.standard_code.toString())) {
      alert('표준코드는 13자리 숫자여야 합니다.');
      await nextTick();
      setTimeout(() => {
        const standardCodeInput = document.getElementById(`standard_code_${row.id}`);
        if (standardCodeInput) {
          standardCodeInput.focus();
          standardCodeInput.select();
        }
      }, 100);
      return;
    }

    // 매출액 형식 검증 (숫자, 마이너스 허용)
    if (isNaN(Number(row.sales_amount))) {
      alert('매출액은 숫자여야 합니다.');
      await nextTick();
      setTimeout(() => {
        const salesAmountInput = document.getElementById(`sales_amount_${row.id}`);
        if (salesAmountInput) {
          salesAmountInput.focus();
          salesAmountInput.select();
        }
      }, 100);
      return;
    }

    // 매출일자 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.sales_date)) {
      alert('매출일자는 YYYY-MM-DD 형식이어야 합니다.');
      await nextTick();
      setTimeout(() => {
        const salesDateInput = document.getElementById(`sales_date_${row.id}`);
        if (salesDateInput) {
          salesDateInput.focus();
          salesDateInput.select();
        }
      }, 100);
      return;
    }

    const userId = await getCurrentUserId();
    const updateData = {
      pharmacy_code: row.pharmacy_code || '',
      pharmacy_name: row.pharmacy_name || '',
      business_registration_number: row.business_registration_number,
      address: row.address || '',
      standard_code: row.standard_code,
      product_name: row.product_name || '',
      sales_amount: row.sales_amount ? Number(row.sales_amount) : null,
      sales_date: row.sales_date || null,
      updated_by: userId,
    }

    const { error } = await supabase.from('direct_sales').update(updateData).eq('id', row.id)

    if (error) {
      alert('수정 실패: ' + error.message)
      return
    }

    // 편집 모드 종료
    row.isEditing = false
    row.originalData = { ...row }

    // 데이터 새로고침
    fetchSummary()
    fetchRevenues()

    alert('수정되었습니다.')
  } catch (error) {
    console.error('수정 오류:', error)
    alert('수정 중 오류가 발생했습니다.')
  }
}

// 삭제
const deleteRevenue = async (row) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    const { error } = await supabase.from('direct_sales').delete().eq('id', row.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    // 데이터 새로고침
    fetchSummary()
    fetchRevenues()

    alert('삭제되었습니다.')
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

// 엑셀 템플릿 다운로드
const downloadTemplate = async () => {
  const templateData = [
    {
      약국코드: '',
      약국명: '예시약국',
      사업자등록번호: '123-45-67890',
      주소: '서울시 강남구 테헤란로 123',
      표준코드: '1234567890123',
      제품명: '예시제품',
      매출액: 1000000,
      매출일자: '2025-01-15',
    },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('직거래매출템플릿')

  // 헤더 정의
  const headers = Object.keys(templateData[0])
  worksheet.addRow(headers)

  // 헤더 스타일 설정
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 데이터 추가
  templateData.forEach((row) => {
    const dataRow = worksheet.addRow(Object.values(row))
    
    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }
      
      // 가운데 정렬할 컬럼 지정 (약국코드, 표준코드, 매출일자)
      if ([1, 3, 5, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 3) {
        cell.numFmt = '@'
      }
      
      // 매출액 컬럼은 숫자 형식으로 설정
      if (colNumber === 7) {
        cell.numFmt = '#,##0'
      }
    })
  })

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 12 }, // 약국코드
    { width: 32 }, // 약국명
    { width: 16 }, // 사업자등록번호
    { width: 64 }, // 주소
    { width: 16 }, // 표준코드
    { width: 32 }, // 제품명
    { width: 16 }, // 매출액
    { width: 16 }, // 매출일자
  ]

  // 헤더행 고정 및 눈금선 숨기기
  worksheet.views = [
    { 
      state: 'frozen', 
      xSplit: 0, 
      ySplit: 1,
      showGridLines: false
    }
  ]

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '직거래매출자료_엑셀등록_템플릿.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}

// 파일 업로드 트리거
const triggerFileUpload = () => {
  fileInput.value.click()
}

// 엑셀 파일 업로드 처리
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 엑셀 등록 로딩 시작
  excelLoading.value = true

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      alert('엑셀 파일에 데이터가 없습니다.')
      return
    }

    // 데이터 변환 및 검증
    const uploadData = []
    const errors = []
    const userId = await getCurrentUserId();

    jsonData.forEach((row, index) => {
      const rowNum = index + 2 // 엑셀 행 번호 (헤더 제외)

      // 필수 필드 검증
      if (!row['사업자등록번호']) {
        errors.push(`${rowNum}행: 사업자등록번호가 필요합니다.`)
        return
      }
      if (!row['표준코드']) {
        errors.push(`${rowNum}행: 표준코드가 필요합니다.`)
        return
      }
      if (!row['매출일자']) {
        errors.push(`${rowNum}행: 매출일자가 필요합니다.`)
        return
      }

      // 사업자등록번호 형식 검증 및 변환 (10자리 숫자)
      const businessNumber = row['사업자등록번호'].toString().replace(/[^0-9]/g, '');
      if (businessNumber.length !== 10) {
        errors.push(`${rowNum}행: 사업자등록번호는 10자리 숫자여야 합니다.`)
        return
      }
      
      // 사업자등록번호 형식 변환: ###-##-#####
      const formattedBusinessNumber = businessNumber.substring(0, 3) + '-' + 
                                     businessNumber.substring(3, 5) + '-' + 
                                     businessNumber.substring(5);

      // 표준코드 형식 검증 (13자리 숫자)
      if (row['표준코드'].toString().length !== 13 || !/^\d{13}$/.test(row['표준코드'].toString())) {
        errors.push(`${rowNum}행: 표준코드는 13자리 숫자여야 합니다.`)
        return
      }

      // 매출액 형식 검증 (숫자, 마이너스 허용) - 없으면 0으로 설정
      let salesAmountValue = 0;
      if (row['매출액'] !== undefined && row['매출액'] !== null && row['매출액'] !== '') {
        salesAmountValue = Number(row['매출액']);
        if (isNaN(salesAmountValue)) {
          errors.push(`${rowNum}행: 매출액은 숫자여야 합니다.`)
          return
        }
      }

      // 매출일자 형식 검증 (YYYY-MM-DD)
      let salesDate = null
      if (row['매출일자']) {
        if (typeof row['매출일자'] === 'number') {
          const excelDate = new Date((row['매출일자'] - 25569) * 86400 * 1000)
          salesDate = excelDate.toISOString().split('T')[0]
        } else if (row['매출일자'] instanceof Date) {
          salesDate = row['매출일자'].toISOString().split('T')[0]
        } else if (typeof row['매출일자'] === 'string') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (dateRegex.test(row['매출일자'])) {
            salesDate = row['매출일자']
          } else {
            errors.push(`${rowNum}행: 매출일자는 YYYY-MM-DD 형식이어야 합니다.`)
            return
          }
        }
      } else {
        errors.push(`${rowNum}행: 매출일자가 필요합니다.`)
        return
      }

      uploadData.push({
        pharmacy_code: row['약국코드'] || '',
        pharmacy_name: row['약국명'] || '',
        business_registration_number: formattedBusinessNumber,
        address: row['주소'] || '',
        standard_code: row['표준코드'],
        product_name: row['제품명'] || '',
        sales_amount: salesAmountValue,
        sales_date: salesDate,
        created_by: userId,
        updated_by: userId,
      })
    })

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 데이터베이스에 일괄 삽입
    const { error } = await supabase.from('direct_sales').insert(uploadData)

    if (error) {
      alert('업로드 실패: ' + error.message)
    } else {
      alert(`${uploadData.length}건의 직거래매출 데이터가 업로드되었습니다.`)
      // 데이터 새로고침
      fetchSummary()
      fetchRevenues()
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    alert('파일 처리 중 오류가 발생했습니다.')
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    // 파일 입력 초기화
    event.target.value = ''
  }
}

// 엑셀 다운로드 (전체 데이터)
const downloadExcel = async () => {
  try {
    loading.value = true
    
    // 전체 데이터를 페이지별로 조회하여 합치기
    let allData = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      // 페이지별 데이터 조회
      let query = supabase
        .from('direct_sales')
        .select('*')
        .order('sales_date', { ascending: false })

      // 검색 조건 적용
      if (searchInput.value.length >= 2) {
        const keyword = searchInput.value.toLowerCase();
        query = query.or(`pharmacy_name.ilike.%${keyword}%,business_registration_number.ilike.%${keyword}%,standard_code.ilike.%${keyword}%,product_name.ilike.%${keyword}%`)
      }

      // 기간 필터 적용 (A to B 방식)
      if (fromMonth.value && toMonth.value) {
        // A와 B 모두 선택: A 포함 이후 ~ B 포함 이전
        const fromDate = fromMonth.value + '-01'
        const toDate = new Date(toMonth.value + '-01')
        toDate.setMonth(toDate.getMonth() + 1)
        toDate.setDate(0) // 해당 월의 마지막 날
        const lastDay = toDate.getDate().toString().padStart(2, '0')
        const toDateStr = toMonth.value + '-' + lastDay
        
        query = query.gte('sales_date', fromDate)
          .lte('sales_date', toDateStr)
      } else if (fromMonth.value) {
        // A만 선택: A 포함 이후 모두
        query = query.gte('sales_date', fromMonth.value + '-01')
      } else if (toMonth.value) {
        // B만 선택: B 포함 이전 모두
        const toDate = new Date(toMonth.value + '-01')
        toDate.setMonth(toDate.getMonth() + 1)
        toDate.setDate(0) // 해당 월의 마지막 날
        const lastDay = toDate.getDate().toString().padStart(2, '0')
        const toDateStr = toMonth.value + '-' + lastDay
        
        query = query.lte('sales_date', toDateStr)
      }

      // 페이징 적용 (필터 적용 후)
      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      const { data, error } = await query

      if (error) {
        alert('데이터 조회 실패: ' + error.message)
        return
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      allData = allData.concat(data)
      page++
      
      // 1000개 미만이면 더 이상 데이터가 없음
      if (data.length < pageSize) {
        hasMore = false
      }
    }

    if (allData.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    // 데이터 변환
    const excelData = allData.map((revenue, index) => ({
      No: index + 1,
      약국코드: revenue.pharmacy_code || '',
      약국명: revenue.pharmacy_name || '',
      사업자등록번호: revenue.business_registration_number || '',
      주소: revenue.address || '',
      표준코드: revenue.standard_code || '',
      제품명: revenue.product_name || '',
      매출액: revenue.sales_amount || 0,
      매출일자: revenue.sales_date || '',
      등록일시: revenue.created_at ? new Date(revenue.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
      수정일시: revenue.updated_at ? new Date(revenue.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    }))

    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('직거래매출목록')

    // 헤더 정의
    const headers = Object.keys(excelData[0])
    worksheet.addRow(headers)

    // 헤더 스타일 설정
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // 데이터 추가
    excelData.forEach((row) => {
      const dataRow = worksheet.addRow(Object.values(row))
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 }
        cell.alignment = { vertical: 'middle' }
        
        // 가운데 정렬할 컬럼 지정 (No, 약국코드, 표준코드, 매출일자, 등록일시, 수정일시)
        if ([1, 2, 4, 6, 9, 10, 11].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        
        // 사업자등록번호 컬럼은 텍스트 형식으로 설정
        if (colNumber === 4) {
          cell.numFmt = '@'
        }
        
        // 매출액 컬럼은 숫자 형식으로 설정
        if (colNumber === 8) {
          cell.numFmt = '#,##0'
        }
      })
    })

    // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      })
    })

    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 8 },  // No
      { width: 12 }, // 약국코드
      { width: 32 }, // 약국명
      { width: 16 }, // 사업자등록번호
      { width: 48 }, // 주소
      { width: 16 }, // 표준코드
      { width: 32 }, // 제품명
      { width: 16 }, // 매출액
      { width: 16 }, // 매출일자
      { width: 18 }, // 등록일시
      { width: 18 }, // 수정일시
    ]

    // 헤더행 고정 및 눈금선 숨기기
    worksheet.views = [
      { 
        state: 'frozen', 
        xSplit: 0, 
        ySplit: 1,
        showGridLines: false
      }
    ]

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = generateExcelFileName('직거래매출목록')
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    alert('엑셀 다운로드 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function deleteAllRevenues() {
  if (!confirm('정말 모든 직거래매출 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'))
    return
  const { error } = await supabase.from('direct_sales').delete().neq('id', 0)
  if (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
    return
  }
  revenues.value = []
  totalCount.value = 0
  totalSalesAmount.value = 0
  alert('모든 직거래매출 데이터가 삭제되었습니다.')
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// 오버플로우 감지 및 툴팁 제어 함수들
const checkOverflow = (event) => {
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
    element.classList.remove('overflowed');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
}

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  const target = event.target;
  let value = target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
  
  if (value.length > 10) {
    value = value.substring(0, 10); // 최대 10자리로 제한
  }
  
  // 형식 변환: ###-##-#####
  if (value.length >= 3) {
    value = value.substring(0, 3) + '-' + value.substring(3);
  }
  if (value.length >= 6) {
    value = value.substring(0, 6) + '-' + value.substring(6);
  }
  
  // 최대 12자리(하이픈 포함)로 제한
  if (value.length > 12) {
    value = value.substring(0, 12);
  }
  
  target.value = value;
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  if (event.key === 'Backspace') {
    const cursorPosition = event.target.selectionStart;
    const value = event.target.value;
    
    // 커서 위치에 하이픈이 있으면 한 칸 더 뒤로 이동
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      event.target.value = value.substring(0, newPosition) + value.substring(cursorPosition);
      
      // 커서 위치 조정
      setTimeout(() => {
        event.target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

onMounted(async () => {
  fetchAvailableMonths()
  await fetchSummary()
  await fetchRevenues()
})
</script>

<style scoped>

.footer-cell {
  background-color: #f8f9fa !important;
  font-weight: bold !important;
  border-top: 1px solid #dee2e6 !important;
}

</style>
