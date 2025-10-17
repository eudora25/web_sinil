<template>
  <div class="admin-products-standard-code-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">표준코드 목록</div>
    </div>

    <div class="filter-card">
      <div class="filter-row">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="제품명, 보험코드, 표준코드"
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
          전체 {{ filteredStandardCodes.length }} 건
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
<!--          <button class="btn-delete" @click="deleteAllStandardCodes" style="margin-right: 1rem;">모두 삭제</button>-->
          <button class="btn-save" @click="goCreate">개별 등록</button>
        </div>
      </div>

      <DataTable
        :value="filteredStandardCodes"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-products-standard-code-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 표준코드가 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column
          field="product_name" header="제품명" :headerStyle="{ width: columnWidths.product_name }" :sortable="true">
          <template #body="slotProps">
            <a href="#" class="text-link ellipsis-cell" :title="slotProps.data.product_name" @click.prevent="goToDetail(slotProps.data.id)" @mouseenter="checkProductOverflow" @mouseleave="removeOverflowClass">
              {{ slotProps.data.product_name || '제품 목록 등록 필요' }}
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
        <Column
          field="standard_code"
          header="표준코드"
          :headerStyle="{ width: columnWidths.standard_code }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.standard_code"
              class="p-inputtext p-component p-inputtext-sm inline-edit-input"
              :id="`standard_code_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.standard_code }}</span>
          </template>
        </Column>
        <Column
          field="unit_packaging_desc"
          header="단위/포장형태"
          :headerStyle="{ width: columnWidths.unit_packaging_desc }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.unit_packaging_desc"
              class="p-inputtext p-component p-inputtext-sm inline-edit-input"
              :id="`unit_packaging_desc_${slotProps.data.id}`"
            />
            <span v-else>{{ slotProps.data.unit_packaging_desc }}</span>
          </template>
        </Column>
                 <Column
           field="unit_quantity"
           header="단위수량"
           :headerStyle="{ width: columnWidths.unit_quantity }"
           :sortable="true"
         >
           <template #body="slotProps">
             <input
               v-if="slotProps.data.isEditing"
               v-model="slotProps.data.unit_quantity"
               type="number"
               class="p-inputtext p-component p-inputtext-sm text-right inline-edit-input"
               :id="`unit_quantity_${slotProps.data.id}`"
             />
             <span v-else>{{ slotProps.data.unit_quantity?.toLocaleString() }}</span>
           </template>
         </Column>
         <Column
           field="remarks"
           header="비고"
           :headerStyle="{ width: columnWidths.remarks }"
           :sortable="true"
         >
           <template #body="slotProps">
             <input
               v-if="slotProps.data.isEditing"
               v-model="slotProps.data.remarks"
               class="p-inputtext p-component p-inputtext-sm inline-edit-input"
               :id="`remarks_${slotProps.data.id}`"
             />
             <span v-else>{{ slotProps.data.remarks || '' }}</span>
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
                <button @click="deleteStandardCode(slotProps.data)" class="btn-delete-sm" title="삭제">삭제</button>
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
import { generateExcelFileName } from '@/utils/excelUtils'

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  product_name: '20%',
  insurance_code: '8%',
  standard_code: '10%',
  unit_packaging_desc: '12%',
  unit_quantity: '8%',
  remarks: '16%',
  created_at: '8%',
  status: '6%',
  actions: '8%'
};

const standardCodes = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const searchInput = ref('');
const searchKeyword = ref('');
const filteredStandardCodes = ref([]);
const router = useRouter()
const fileInput = ref(null)
const currentPageFirstIndex = ref(0)



function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredStandardCodes.value = standardCodes.value.filter(p =>
      (p.product_name && p.product_name.toLowerCase().includes(keyword)) ||
      (p.insurance_code && p.insurance_code.toLowerCase().includes(keyword)) ||
      (p.standard_code && p.standard_code.toLowerCase().includes(keyword))
    );
  }
}

function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredStandardCodes.value = standardCodes.value;
}

function goCreate() {
  router.push('/admin/products-standard-code/create')
}

function goToDetail(id) {
  router.push(`/admin/products-standard-code/${id}`)
}

const fetchStandardCodes = async () => {
  loading.value = true;
  try {
    // 1. 표준코드 데이터 가져오기
    const { data: standardCodesData, error: standardCodesError } = await supabase
      .from('products_standard_code')
      .select('*')
      .order('insurance_code', { ascending: true })
      .limit(1000);

    if (standardCodesError) {
      console.error('표준코드 데이터 로딩 오류:', standardCodesError);
      return;
    }

    // 2. products 테이블에서 product_name 가져오기 (최신 등록순으로 정렬)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('insurance_code, product_name, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('제품 데이터 로딩 오류:', productsError);
      return;
    }

    // 3. insurance_code로 product_name 매핑 (중복 제거 - 첫 번째 제품만 사용)
    const productsMap = {};
    productsData?.forEach(product => {
      if (!productsMap[product.insurance_code]) {
        productsMap[product.insurance_code] = product.product_name;
      }
    });
    
    // 디버깅: productsMap 확인
    // console.log('Products data:', productsData);
    // console.log('Products map:', productsMap);
    
    // 특정 보험코드 디버깅 (653806230) - 최신 등록순으로 정렬된 결과 확인
    const specificInsuranceCode = '653806230';
    const specificProducts = productsData?.filter(p => p.insurance_code === specificInsuranceCode);
    if (specificProducts && specificProducts.length > 0) {
      // console.log(`🔍 특정 보험코드 ${specificInsuranceCode}의 모든 제품 (최신순):`, specificProducts);
      // console.log(`🔍 선택된 제품명:`, specificProducts[0].product_name);
    }
    
    // 모든 상태의 제품 조회 (디버깅용) - 최신 등록순으로 정렬
    const { data: allProductsData } = await supabase
      .from('products')
      .select('insurance_code, product_name, status, created_at')
      .eq('insurance_code', specificInsuranceCode)
      .order('created_at', { ascending: false });
    // console.log(`🔍 보험코드 ${specificInsuranceCode}의 모든 상태 제품 (최신순):`, allProductsData);

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
    // console.log('Companies data:', companiesData);
    // console.log('Companies map:', companiesMap);
    if (standardCodesData && standardCodesData.length > 0) {
      // console.log('Sample standard code created_by:', standardCodesData[0].created_by);
      // console.log('Sample standard code updated_by:', standardCodesData[0].updated_by);
      // console.log('Sample standard code created_by type:', typeof standardCodesData[0].created_by);
      // console.log('Sample standard code updated_by type:', typeof standardCodesData[0].updated_by);

      // companiesMap에서 해당 값이 있는지 확인
      // console.log('created_by in companiesMap:', companiesMap[standardCodesData[0].created_by]);
      // console.log('updated_by in companiesMap:', companiesMap[standardCodesData[0].updated_by]);
    }

    // 6. 표준코드 데이터에 product_name과 업체명 추가
    const mappedData = standardCodesData?.map(item => {
      const productName = productsMap[item.insurance_code] || '제품 목록 등록 필요'
      // console.log(`🔍 제품명 매핑 - insurance_code: ${item.insurance_code}, product_name: ${productName}`)
      return {
        ...item,
        product_name: productName,
        created_by_name: companiesMap[item.created_by] || '',
        updated_by_name: companiesMap[item.updated_by] || ''
      }
    }) || [];

    standardCodes.value = mappedData;
  } catch (err) {
    console.error('표준코드 데이터 로딩 오류:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStandardCodes()
})

// standardCodes가 새로 로드될 때 전체로 복원
watch(standardCodes, (newVal) => {
  filteredStandardCodes.value = newVal;
}, { immediate: true });

const downloadTemplate = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('표준코드템플릿')

  // 헤더 정의
  const headers = [
    '보험코드', '표준코드', '단위포장형태', '단위수량', '비고', '상태'
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
    ['601234567', '8800123456789', '정 10개', 10, '', '활성'],
  ]

  exampleData.forEach((rowData) => {
    const dataRow = worksheet.addRow(rowData)

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 가운데 정렬이 필요한 컬럼들 (보험코드, 표준코드, 단위수량, 상태)
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 12 }, // 보험코드
    { width: 16 }, // 표준코드
    { width: 16 }, // 단위포장형태
    { width: 12 }, // 단위수량
    { width: 24 }, // 비고
    { width: 10 }  // 상태
  ]

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
  link.download = '표준코드_엑셀등록_템플릿.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}

const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  excelLoading.value = true

  try {
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

    let uploadData = []
    const errors = []

    jsonData.forEach((row, index) => {
      const rowNum = index + 2

      if (!row['보험코드']) {
        errors.push(`${rowNum}행: 보험코드가 필요합니다.`)
        return
      }
      if (!row['표준코드']) {
        errors.push(`${rowNum}행: 표준코드가 필요합니다.`)
        return
      }

      // 보험코드 형식 검증 (9자리 숫자)
      if (row['보험코드'].toString().length !== 9 || !/^\d{9}$/.test(row['보험코드'].toString())) {
        errors.push(`${rowNum}행: 보험코드는 9자리 숫자여야 합니다.`)
        return
      }

      // 표준코드 형식 검증 (13자리 숫자)
      if (row['표준코드'].toString().length !== 13 || !/^\d{13}$/.test(row['표준코드'].toString())) {
        errors.push(`${rowNum}행: 표준코드는 13자리 숫자여야 합니다.`)
        return
      }

      // 단위수량 검증 (숫자, 0 이상)
      if (row['단위수량'] !== undefined && row['단위수량'] !== null && row['단위수량'] !== '') {
        const unitQuantity = Number(row['단위수량'])
        if (isNaN(unitQuantity) || unitQuantity < 0) {
          errors.push(`${rowNum}행: 단위수량은 0 이상의 숫자여야 합니다.`)
          return
        }
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
         insurance_code: row['보험코드'],
         standard_code: row['표준코드'],
         unit_packaging_desc: row['단위포장형태'] || '',
         unit_quantity: Number(row['단위수량']) || 0,
         remarks: row['비고'] || '',
         status: statusValue,
         created_by: user.id,
         rowNum: rowNum
       })
       
      // 디버깅: 업로드 데이터 확인
      // console.log(`행 ${rowNum} 데이터:`, {
      //   insurance_code: row['보험코드'],
      //   standard_code: row['표준코드']
      // })
    })

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 중복된 표준코드 확인
    const standardCodeCounts = {}
    const duplicateStandardCodes = []

    uploadData.forEach((item, index) => {
      const standardCode = item.standard_code
      if (!standardCodeCounts[standardCode]) {
        standardCodeCounts[standardCode] = []
      }
      standardCodeCounts[standardCode].push(index + 2) // 엑셀 행 번호 (헤더 제외)
    })

    Object.keys(standardCodeCounts).forEach(standardCode => {
      if (standardCodeCounts[standardCode].length > 1) {
        duplicateStandardCodes.push({
          standardCode: standardCode,
          rows: standardCodeCounts[standardCode]
        })
      }
    })

    if (duplicateStandardCodes.length > 0) {
      let duplicateMessage = '중복된 표준코드가 있습니다:\n\n'
      duplicateStandardCodes.forEach(duplicate => {
        duplicateMessage += `표준코드: ${duplicate.standardCode}\n`
        duplicateMessage += `중복된 행: ${duplicate.rows.join(', ')}행\n\n`
      })
      duplicateMessage += '중복된 표준코드를 제거한 후 다시 업로드해주세요.'

      alert(duplicateMessage)
      return
    }

    // 바로 products_standard_code 테이블에 등록
    // console.log('📝 표준코드 등록 시작 - 총', uploadData.length, '개 항목')
    
    const insertData = uploadData.map(item => {
      const { rowNum, ...data } = item
      // console.log(`📝 표준코드 저장 데이터:`, data)
      return data
    })

    if (insertData.length === 0) {
      alert('등록할 데이터가 없습니다.')
      return
    }

    const { error } = await supabase.from('products_standard_code').insert(insertData)

    if (error) {
      if (error.code === '23505' && error.message.includes('standard_code')) {
        // 중복된 표준코드 오류인 경우
        alert('중복된 표준코드가 있습니다.\n\n엑셀 파일에서 중복된 표준코드를 확인하고 제거한 후 다시 업로드해주세요.')
      } else {
        alert('업로드 실패: ' + error.message)
      }
    } else {
      // 최종 성공 메시지 생성
      let finalMessage = `✅ 표준코드 등록 완료!\n\n`
      finalMessage += `📊 처리 결과:\n`
      finalMessage += `• 전체 데이터: ${uploadData.length}건\n`
      finalMessage += `• 등록 성공: ${insertData.length}건\n\n`
      finalMessage += `🎉 모든 데이터가 성공적으로 등록되었습니다!`
      
      alert(finalMessage)
      // console.log('🔄 표준코드 목록 새로고침 시작')
      await fetchStandardCodes()
      // console.log('✅ 표준코드 목록 새로고침 완료')
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    alert('파일 처리 중 오류가 발생했습니다.')
  } finally {
    excelLoading.value = false
    event.target.value = ''
  }
}

const downloadExcel = async () => {
  try {
    // 전체 데이터 조회 (페이징 없이)
    const { data: allStandardCodes, error } = await supabase
      .from('products_standard_code')
      .select('*')
      .order('insurance_code', { ascending: true })

    if (error) {
      alert('데이터 조회 실패: ' + error.message)
      return
    }

    if (!allStandardCodes || allStandardCodes.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    // 제품명과 업체명 매핑을 위한 데이터 조회
    const { data: productsData } = await supabase
      .from('products')
      .select('insurance_code, product_name')
      .eq('status', 'active')

    const { data: companiesData } = await supabase
      .from('companies')
      .select('user_id, company_name')
      .eq('approval_status', 'approved')

    // 매핑 데이터 생성
    const productsMap = {}
    productsData?.forEach(product => {
      productsMap[product.insurance_code] = product.product_name
    })

    const companiesMap = {}
    companiesData?.forEach(company => {
      companiesMap[company.user_id] = company.company_name
    })

    // 전체 데이터에 제품명과 업체명 추가
    const excelData = allStandardCodes.map((item, index) => ({
      No: index + 1,
      제품명: productsMap[item.insurance_code] || '',
      보험코드: item.insurance_code || '',
      표준코드: item.standard_code || '',
      단위포장형태: item.unit_packaging_desc || '',
      단위수량: item.unit_quantity || 0,
      비고: item.remarks || '',
      상태: item.status === 'active' ? '활성' : '비활성',
      등록일시: item.created_at ? new Date(item.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace(/\./g, '').replace(/ /g, ' ') : '',
      등록자: companiesMap[item.created_by] || '',
      수정일시: item.updated_at ? new Date(item.updated_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace(/\./g, '').replace(/ /g, ' ') : '',
      수정자: companiesMap[item.updated_by] || ''
    }))

    const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('표준코드목록')

  // 헤더 정의
  const headers = [
    'No', '제품명', '보험코드', '표준코드', '단위포장형태', '단위수량',
    '비고', '상태', '등록일시', '등록자', '수정일시', '수정자'
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
  excelData.forEach((item) => {
    const dataRow = worksheet.addRow(Object.values(item))

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 가운데 정렬이 필요한 컬럼들 (No, 보험코드, 표준코드, 단위수량, 상태, 등록일시, 등록자, 수정일시, 수정자)
      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 8 ||
          colNumber === 9 || colNumber === 11) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 8 },  // No
    { width: 32 }, // 제품명
    { width: 12 }, // 보험코드
    { width: 16 }, // 표준코드
    { width: 16 }, // 단위포장형태
    { width: 12 }, // 단위수량
    { width: 24 }, // 비고
    { width: 10 },  // 상태
    { width: 18 }, // 등록일시
    { width: 16 }, // 등록자
    { width: 18 }, // 수정일시
    { width: 16 }  // 수정자
  ]

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

  // 단위수량 컬럼에 천단위 콤마 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getCell(row, 5) // E컬럼 (단위수량)
    cell.numFmt = '#,##0'
  }

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = generateExcelFileName('표준코드목록')
  link.click()
  window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    alert('엑셀 다운로드 중 오류가 발생했습니다.')
  }
}

const startEdit = (row) => {
  standardCodes.value.forEach((item) => {
    if (item.isEditing && item.id !== row.id) {
      cancelEdit(item)
    }
  })

  row.originalData = { ...row }
  row.isEditing = true
}

const isEditValid = (row) => {
  const hasRequiredFields = row.insurance_code && row.insurance_code.toString().trim() !== '' &&
                           row.standard_code && row.standard_code.toString().trim() !== '';

  const hasChanges = row.insurance_code !== row.originalData.insurance_code ||
                    row.standard_code !== row.originalData.standard_code ||
                    row.unit_packaging_desc !== row.originalData.unit_packaging_desc ||
                    row.unit_quantity !== row.originalData.unit_quantity ||
                    row.remarks !== row.originalData.remarks ||
                    row.status !== row.originalData.status;

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

    if (!row.standard_code || row.standard_code.toString().trim() === '') {
      alert('표준코드는 필수 입력 항목입니다.');
      setTimeout(() => {
        const standardCodeInput = document.getElementById(`standard_code_${row.id}`);
        if (standardCodeInput) {
          standardCodeInput.focus();
          standardCodeInput.select();
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

    // 표준코드 형식 검증 (13자리 숫자)
    if (row.standard_code.toString().length !== 13 || !/^\d{13}$/.test(row.standard_code.toString())) {
      alert('표준코드는 13자리 숫자여야 합니다.');
      setTimeout(() => {
        const standardCodeInput = document.getElementById(`standard_code_${row.id}`);
        if (standardCodeInput) {
          standardCodeInput.focus();
          standardCodeInput.select();
        }
      }, 100);
      return;
    }

    // 단위수량 검증 (0 이상의 숫자)
    if (row.unit_quantity && (isNaN(Number(row.unit_quantity)) || Number(row.unit_quantity) < 0)) {
      alert('단위수량은 0 이상의 숫자여야 합니다.');
      setTimeout(() => {
        const unitQuantityInput = document.getElementById(`unit_quantity_${row.id}`);
        if (unitQuantityInput) {
          unitQuantityInput.focus();
          unitQuantityInput.select();
        }
      }, 100);
      return;
    }

    if (!['active', 'inactive'].includes(row.status)) {
      alert('상태는 active 또는 inactive여야 합니다.')
      return
    }

         const updateData = {
       insurance_code: row.insurance_code,
       standard_code: row.standard_code,
       unit_packaging_desc: row.unit_packaging_desc || '',
       unit_quantity: Number(row.unit_quantity) || 0,
       remarks: row.remarks || '',
       status: row.status,
     }

    const { error } = await supabase.from('products_standard_code').update(updateData).eq('id', row.id)

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

const deleteStandardCode = async (row) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    const { error } = await supabase.from('products_standard_code').delete().eq('id', row.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    const index = standardCodes.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      standardCodes.value.splice(index, 1)
    }

    alert('삭제되었습니다.')
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다.')
  }
}



// async function deleteAllStandardCodes() {
//   const confirmMessage = `정말 모든 표준코드를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
//   if (!confirm(confirmMessage)) return;
//
//   const { error } = await supabase.from('products_standard_code').delete().neq('id', 0);
//   if (error) {
//     alert('삭제 중 오류가 발생했습니다: ' + error.message);
//     return;
//   }
//
//   standardCodes.value = [];
//
//   alert('모든 표준코드가 삭제되었습니다.');
// }

// 제품명 오버플로우 감지 함수
const checkProductOverflow = (event) => {
  const element = event.target;

  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const fontFamily = computedStyle.fontFamily;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(element.textContent).width;

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
</script>

<style scoped>
.btn-save-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
