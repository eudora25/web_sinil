<template>
  <div class="admin-clients-commission-grades page-container">
    <div class="page-header-title-area">
      <div class="header-title">수수료 등급 설정</div>
    </div>
    <div class="filter-card">
      <div class="filter-row" style="display:flex; align-items:center; justify-content:flex-start;">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="병의원명, 사업자번호, 원장명, 주소, 구분, 업체명"
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
        <div class="total-count-display">전체 {{ filteredClients.length }} 건</div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
          <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
          <button class="btn-delete" @click="deleteAllGrades">모두 삭제</button>
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
        :value="filteredClients"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-commission-grades-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 병의원이 없습니다.</div>
        </template>

        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column
          field="client_code"
          header="병의원코드"
          :headerStyle="{ width: columnWidths.client_code }"
          :sortable="true"
        >
          <template #body="slotProps">
            {{ slotProps.data.client_code || '' }}
          </template>
        </Column>
        <Column
          field="client_name"
          header="병의원명"
          :headerStyle="{ width: columnWidths.client_name }"
          :style="{ fontWeight: '500 !important' }"  
          :sortable="true"
        >
          <template #body="slotProps">
            <span 
              class="ellipsis-cell text-link" 
              :title="slotProps.data.client_name" 
              @mouseenter="checkOverflow" 
              @mouseleave="removeOverflowClass"
              @click="goToClientDetail(slotProps.data.client_id)"
            >
              {{ slotProps.data.client_name }}
            </span>
          </template>
        </Column>
        <Column
          field="client_business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidths.client_business_registration_number }"
          :sortable="true"
        />
        <Column
          field="owner_name"
          header="원장명"
          :headerStyle="{ width: columnWidths.owner_name }"
          :sortable="true"
        />
        <Column
          field="address"
          header="주소"
          :headerStyle="{ width: columnWidths.address }"
          :sortable="true"
        >
          <template #body="slotProps">
            <span class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
          </template>
        </Column>
        <Column
          field="company_group"
          header="구분"
          :headerStyle="{ width: columnWidths.company_group }"
          :sortable="true"
        />
        <Column
          field="company_name"
          header="업체명"
          :headerStyle="{ width: columnWidths.company_name }"
          :style="{ fontWeight: '500 !important' }"
          :sortable="true"
        >
          <template #body="slotProps">
            <span 
              class="text-link" 
              @click="goToCompanyDetail(slotProps.data.company_id)"
              style="cursor: pointer;"
            >
              {{ slotProps.data.company_name }}
            </span>
          </template>
        </Column>
        <Column
          field="company_business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidths.company_business_registration_number }"
          :sortable="true"
        />
        <Column
          field="company_default_commission_grade"
          header="기본 수수료 등급"
          :headerStyle="{ width: columnWidths.default_grade, textAlign: 'center' }"
          :bodyStyle="{ textAlign: 'center' }"
          :sortable="true"
        />
        <Column header="변경 수수료 등급" :headerStyle="{ width: columnWidths.modified_grade, textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            <select
              v-model="slotProps.data.modified_commission_grade"
              @change="onGradeChange(slotProps.data, $event.target.value)"
              class="commission-grade-select"
            >
              <option value="">-</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
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
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { generateExcelFileName } from '@/utils/excelUtils'

const router = useRouter()
const assignments = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const filters = ref({ global: { value: null, matchMode: 'contains' } })
const currentPageFirstIndex = ref(0)
const fileInput = ref(null)

const searchInput = ref('');
const searchKeyword = ref('');
const filteredClients = ref([]);

function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredClients.value = assignments.value.filter(c =>
      (c.client_name && c.client_name.toLowerCase().includes(keyword)) ||
      (c.client_business_registration_number && c.client_business_registration_number.toLowerCase().includes(keyword)) ||
      (c.client_code && c.client_code.toLowerCase().includes(keyword)) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(keyword)) ||
      (c.company_name && c.company_name.toLowerCase().includes(keyword)) ||
      (c.company_group && c.company_group.toLowerCase().includes(keyword)) ||
      (c.address && c.address.toLowerCase().includes(keyword))
    );
  }
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredClients.value = assignments.value;
}

watch(assignments, (newVal) => {
  filteredClients.value = newVal;
}, { immediate: true });

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  client_code: '6%',
  client_name: '16%',
  client_business_registration_number: '8%',
  owner_name: '6%',
  address: '20%',
  company_group: '8%',
  company_name: '12%',
  company_business_registration_number: '8%',
  default_grade: '8%',
  modified_grade: '8%',
}

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const { data: assignmentsData, error } = await supabase
      .from('client_company_assignments')
      .select(`
        id,
        company_default_commission_grade,
        modified_commission_grade,
        client:clients(id, client_code, name, business_registration_number, owner_name, address),
        company:companies(id, company_name, business_registration_number, default_commission_grade, company_group)
      `)
    
    if (!error && assignmentsData) {
      assignments.value = assignmentsData.map((assignment) => ({
        id: assignment.id,
        client_code: assignment.client?.client_code || '',
        client_name: assignment.client?.name || '',
        client_business_registration_number: assignment.client?.business_registration_number || '',
        client_id: assignment.client?.id || null, // 상세화면으로 이동할 때 사용할 클라이언트 ID
        owner_name: assignment.client?.owner_name || '',
        address: assignment.client?.address || '',
        company_group: assignment.company?.company_group || '',
        company_name: assignment.company?.company_name || '',
        company_business_registration_number: assignment.company?.business_registration_number || '',
        company_default_commission_grade: assignment.company?.default_commission_grade || assignment.company_default_commission_grade,
        modified_commission_grade: assignment.modified_commission_grade,
        company_id: assignment.company?.id || null, // 업체 상세화면으로 이동할 때 사용할 업체 ID
      }))
    }
  } catch (err) {
    console.error('데이터 조회 오류:', err)
  } finally {
    loading.value = false;
  }
}
// 수수료 등급 변경 관련 함수들
async function onGradeChange(assignment, newValue) {
  const oldValue = assignment.modified_commission_grade
  
  if (confirm('해당 병의원의 수수료 등급을 변경하시겠습니까?')) {
    try {
      const { error } = await supabase
        .from('client_company_assignments')
        .update({ modified_commission_grade: newValue })
        .eq('id', assignment.id)
      
      if (error) {
        console.error('수수료 등급 변경 오류:', error)
        alert('수수료 등급 변경 중 오류가 발생했습니다.')
        // 드롭다운을 이전 값으로 되돌리기
        assignment.modified_commission_grade = oldValue
      } else {
        // 성공적으로 변경됨
        assignment.modified_commission_grade = newValue
      }
    } catch (err) {
      console.error('수수료 등급 변경 오류:', err)
      alert('수수료 등급 변경 중 오류가 발생했습니다.')
      // 드롭다운을 이전 값으로 되돌리기
      assignment.modified_commission_grade = oldValue
    }
  } else {
    // 취소한 경우 드롭다운을 이전 값으로 되돌리기
    assignment.modified_commission_grade = oldValue
  }
}

const downloadTemplate = async () => {
  const templateData = [
    { '병의원 사업자등록번호': '123-45-67890', '업체 사업자등록번호': '111-22-33333', '변경 수수료 등급': 'A' },
    { '병의원 사업자등록번호': '987-65-43210', '업체 사업자등록번호': '444-55-66666', '변경 수수료 등급': 'B' },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('수수료등급설정템플릿')

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
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 1 || colNumber === 2) {
        cell.numFmt = '@'
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
    { width: 20 }, // 병의원 사업자등록번호
    { width: 20 }, // 업체 사업자등록번호
    { width: 15 }, // 변경 수수료 등급
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
  link.download = '수수료등급설정_엑셀등록_템플릿.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}

const triggerFileUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

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

    const gradesToUpdate = []
    const errors = []

    // 모든 매핑 정보를 미리 로드
    const { data: allAssignmentsData, error: assignmentError } = await supabase
      .from('client_company_assignments')
      .select(`
        id,
        client:clients(business_registration_number),
        company:companies(business_registration_number)
      `)

    if (assignmentError) {
      alert('매핑 정보 조회 중 오류가 발생했습니다.')
      console.error(assignmentError)
      return
    }

    // 매핑 정보를 키-값 형태로 변환 (성능 최적화)
    const assignmentMap = new Map()
    allAssignmentsData.forEach(assignment => {
      if (assignment.client && assignment.company) {
        const key = `${assignment.client.business_registration_number}-${assignment.company.business_registration_number}`
        assignmentMap.set(key, assignment.id)
      }
    })

    for (const [index, row] of jsonData.entries()) {
      const rowNum = index + 2
      const clientBrn = row['병의원 사업자등록번호']
      const companyBrn = row['업체 사업자등록번호']
      const newGrade = row['변경 수수료 등급']

      if (!clientBrn || !companyBrn) {
        errors.push(`${rowNum}행: 병의원 또는 업체의 사업자등록번호가 비어있습니다.`)
        continue
      }

      if (newGrade && !['A', 'B', 'C', 'D', 'E'].includes(newGrade)) {
        errors.push(`${rowNum}행: 변경 수수료 등급은 'A', 'B', 'C', 'D', 'E' 중 하나여야 합니다.`)
        continue
      }

      const key = `${clientBrn}-${companyBrn}`
      const assignmentId = assignmentMap.get(key)

      if (!assignmentId) {
        errors.push(
          `${rowNum}행: 병의원-업체 매핑을 찾을 수 없습니다. (병의원: ${clientBrn}, 업체: ${companyBrn})`,
        )
        continue
      }

      gradesToUpdate.push({
        id: assignmentId,
        modified_commission_grade: newGrade || null
      })
    }

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    if (gradesToUpdate.length > 0) {
      // 각 항목을 개별적으로 업데이트
      let successCount = 0
      let errorCount = 0

      for (const gradeUpdate of gradesToUpdate) {
        const { error } = await supabase
          .from('client_company_assignments')
          .update({ modified_commission_grade: gradeUpdate.modified_commission_grade })
          .eq('id', gradeUpdate.id)
        
        if (error) {
          errorCount++
          console.error('수수료 등급 업데이트 오류:', error)
        } else {
          successCount++
        }
      }

      if (errorCount > 0) {
        alert(`업로드 완료: 성공 ${successCount}건, 실패 ${errorCount}건`)
      } else {
        alert(`${successCount}건의 수수료 등급이 업데이트되었습니다.`)
      }
      
      await fetchAssignments() // 목록 새로고침
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    alert('파일 처리 중 오류가 발생했습니다.')
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    if (event.target) {
      event.target.value = ''
    }
  }
}

const downloadExcel = async () => {
  if (filteredClients.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }
  
  const excelData = filteredClients.value.map((assignment) => ({
    병의원코드: assignment.client_code,
    병의원명: assignment.client_name,
    '사업자등록번호': assignment.client_business_registration_number,
    원장명: assignment.owner_name,
    주소: assignment.address,
    구분: assignment.company_group,
    업체명: assignment.company_name,
    '업체 사업자번호': assignment.company_business_registration_number,
    '기본 수수료 등급': assignment.company_default_commission_grade,
    '변경 수수료 등급': assignment.modified_commission_grade || '-',
  }))

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('수수료등급설정현황')

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
      
      // 가운데 정렬할 컬럼 지정 (병의원코드, 원장명, 구분, 기본 수수료 등급, 변경 수수료 등급)
      if ([1, 3, 4, 8, 9, 10].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 3 || colNumber === 8) {
        cell.numFmt = '@'
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
    { width: 12 }, // 병의원코드
    { width: 32 }, // 병의원명
    { width: 16 }, // 병의원 사업자등록번호
    { width: 12 }, // 원장명
    { width: 64 }, // 주소
    { width: 16 }, // 구분
    { width: 24 }, // 업체명
    { width: 16 }, // 업체 사업자등록번호
    { width: 16 }, // 기본 수수료 등급
    { width: 16 }, // 변경 수수료 등급
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
  link.download = generateExcelFileName('병의원-수수료등급')
  link.click()
  window.URL.revokeObjectURL(url)
}

async function deleteAllGrades() {
  if (!confirm('정말 모든 변경 수수료 등급을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'))
    return
  
  const { error } = await supabase
    .from('client_company_assignments')
    .update({ modified_commission_grade: null })
    .neq('id', 0)
  
  if (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
    return
  }
  
  // 로컬 데이터도 업데이트
  assignments.value.forEach((assignment) => {
    assignment.modified_commission_grade = null
  })
  
  alert('모든 변경 수수료 등급이 삭제되었습니다.')
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
  
  console.log('병의원 수수료등급 오버플로우 체크:', {
    text: element.textContent,
    textWidth,
    availableWidth,
    isOverflowed
  });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    console.log('병의원 수수료등급 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    console.log('병의원 수수료등급 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  console.log('병의원 수수료등급 오버플로우 클래스 제거됨');
}

// 병의원 상세 화면으로 이동
function goToClientDetail(clientId) {
  router.push({
    name: 'AdminClientDetail',
    params: { id: clientId },
    query: { from: 'admin-clients-commission-grades' }
  })
}

// 업체 상세 화면으로 이동
function goToCompanyDetail(companyId) {
  router.push({
    name: 'AdminCompanyDetail',
    params: { id: companyId },
    query: { from: 'admin-clients-commission-grades' }
  })
}

onMounted(() => {
  fetchAssignments()
})
</script>

<style scoped>
.commission-grade-select {
  width: 100%;
  min-width: 80px;
  height: 1.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  color: #374151;
  cursor: pointer;
  text-align: center;
}

.commission-grade-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.commission-grade-select option {
  padding: 4px 8px;
}

.commission-grade-select option:checked {
  background-color: #3b82f6;
  color: white;
}

.text-link {
  cursor: pointer;
  text-decoration: underline;
  color: #3b82f6; /* 클릭 가능한 링크 색상 */
}

.text-link:hover {
  color: #2563eb; /* 호버 시 색상 */
}

</style>
