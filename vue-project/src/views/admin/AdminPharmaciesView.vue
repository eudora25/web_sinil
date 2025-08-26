<template>
  <div class="admin-clients-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">문전약국 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row" style="display:flex; align-items:center; justify-content:flex-start;">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="약국코드, 약국명, 사업자등록번호"
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
          전체 {{ filteredPharmacies.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
          <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
          <button class="btn-delete" @click="deleteAllPharmacies" style="margin-right: 1rem;">모두 삭제</button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
          <button class="btn-save" @click="goCreate">개별 등록</button>
        </div>
      </div>
      <DataTable
        :value="filteredPharmacies"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-pharmacies-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 약국이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column
          field="pharmacy_code"
          header="약국코드"
          :headerStyle="{ width: columnWidths.pharmacy_code }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.pharmacy_code"
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.pharmacy_code }}</span>
          </template>
        </Column>
        <Column field="name" header="약국명" :headerStyle="{ width: columnWidths.name }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.name"
              class="inline-edit-input"
              :id="`name_${slotProps.data.id}`"
            />
            <a v-else href="#" class="text-link ellipsis-cell" :title="slotProps.data.name" @click.prevent="goToDetail(slotProps.data.id)" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">
              {{ slotProps.data.name }}
            </a>
          </template>
        </Column>
        <Column
          field="business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidths.business_registration_number }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.business_registration_number"
              class="inline-edit-input"
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
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.address"
              class="inline-edit-input"
            />
            <span v-else class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
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
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.remarks }}</span>
          </template>
        </Column>
        <Column
          field="created_at"
          header="등록일자"
          :headerStyle="{ width: columnWidths.created_at }"
          :sortable="true"
        >
          <template #body="slotProps">
            <span>{{
              slotProps.data.created_at
                ? new Date(slotProps.data.created_at).toISOString().split('T')[0]
                : ''
            }}</span>
          </template>
        </Column>
        <Column
          field="status"
          header="상태"
          :headerStyle="{ width: columnWidths.status }"
          :sortable="true"
        >
          <template #body="slotProps">
            <select
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.status"
              class="inline-edit-input"
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
        <Column
          header="작업"
          :headerStyle="{ width: columnWidths.actions }"
        >
          <template #body="slotProps">
            <div style="display: flex; gap: 4px; justify-content: center">
              <template v-if="slotProps.data.isEditing">
                <button @click="saveEdit(slotProps.data)" class="btn-save-sm" :disabled="!isEditValid(slotProps.data)" title="저장">
                  저장
                </button>
                <button @click="cancelEdit(slotProps.data)" class="btn-cancel-sm" title="취소">
                  취소
                </button>
              </template>
              <template v-else>
                <button @click="startEdit(slotProps.data)" class="btn-edit-sm" title="수정">
                  수정
                </button>
                <button @click="deletePharmacy(slotProps.data)" class="btn-delete-sm" title="삭제">
                  삭제
                </button>
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
import { ref, onMounted, nextTick } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import { generateExcelFileName } from '@/utils/excelUtils'

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  pharmacy_code: '7%',
  name: '18%',
  business_registration_number: '8%',
  address: '31%',
  remarks: '10%',
  created_at: '8%',
  status: '6%',
  actions: '8%'
};

const pharmacies = ref([])
const filteredPharmacies = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const searchInput = ref('');
const searchKeyword = ref('');
const router = useRouter()
const fileInput = ref(null)
const currentPageFirstIndex = ref(0)

function goCreate() {
  router.push('/admin/pharmacies/create')
}
function goToDetail(id) {
  router.push(`/admin/pharmacies/${id}`)
}

function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredPharmacies.value = pharmacies.value.filter(p =>
      (p.name && p.name.toLowerCase().includes(keyword)) ||
      (p.business_registration_number && p.business_registration_number.toLowerCase().includes(keyword)) ||
      (p.pharmacy_code && p.pharmacy_code.toLowerCase().includes(keyword))
    );
  }
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredPharmacies.value = pharmacies.value;
}

const fetchPharmacies = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('pharmacy_code', { ascending: true })
    if (!error && data) {
      pharmacies.value = data.map((item) => ({
        ...item,
        isEditing: false,
        originalData: { ...item },
      }))
      filteredPharmacies.value = pharmacies.value;
    }
  } finally {
    loading.value = false;
  }
}

// 수정 시작
const startEdit = (row) => {
  // 다른 행이 편집 중이면 취소
  pharmacies.value.forEach((item) => {
    if (item.isEditing && item.id !== row.id) {
      cancelEdit(item)
    }
  })

  // 원본 데이터 백업
  row.originalData = { ...row }
  row.isEditing = true
}

// 변경값 감지 및 필수값 검증
const isEditValid = (row) => {
  // 필수값 검증
  const hasRequiredFields = row.name && row.name.trim() !== '' && 
                           row.business_registration_number && row.business_registration_number.trim() !== '';
  
  // 변경값 감지
  const hasChanges = row.pharmacy_code !== row.originalData.pharmacy_code ||
                    row.name !== row.originalData.name ||
                    row.business_registration_number !== row.originalData.business_registration_number ||
                    row.address !== row.originalData.address ||
                    row.status !== row.originalData.status ||
                    row.remarks !== row.originalData.remarks;
  
  return hasRequiredFields && hasChanges;
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
    if (!row.name || row.name.trim() === '') {
      alert('약국명은 필수 입력 항목입니다.');
      await nextTick();
      setTimeout(() => {
        const nameInput = document.getElementById(`name_${row.id}`);
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 100);
      return;
    }

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

    // 상태 값 검증
    if (!['active', 'inactive'].includes(row.status)) {
      alert('상태는 active 또는 inactive여야 합니다.')
      return
    }

    const updateData = {
      pharmacy_code: row.pharmacy_code || '',
      name: row.name,
      business_registration_number: row.business_registration_number,
      address: row.address || '',
      remarks: row.remarks || '',
      status: row.status,
    }

    const { error } = await supabase.from('pharmacies').update(updateData).eq('id', row.id)

    if (error) {
      alert('수정 실패: ' + error.message)
      return
    }

    // 편집 모드 종료
    row.isEditing = false
    row.originalData = { ...row }

    alert('수정되었습니다.')
  } catch (error) {
    console.error('수정 오류:', error)
    alert('수정 중 오류가 발생했습니다.')
  }
}

// 삭제
const deletePharmacy = async (row) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    const { error } = await supabase.from('pharmacies').delete().eq('id', row.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    // 목록에서 제거
    const index = pharmacies.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      pharmacies.value.splice(index, 1)
    }

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
      비고: '예시 비고',
      상태: '활성',
    },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('문전약국템플릿')

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
      
      // 가운데 정렬할 컬럼 지정 (약국코드, 상태)
      if ([1, 3, 6].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 3) {
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
    { width: 12 }, // 약국코드
    { width: 32 }, // 약국명
    { width: 16 }, // 사업자등록번호
    { width: 64 }, // 주소
    { width: 24 }, // 비고
    { width: 10 }, // 상태
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
  link.download = '문전약국_엑셀등록_템플릿.xlsx'
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

    // 기존 데이터 확인
    const hasExistingData = pharmacies.value.length > 0

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
        // 대체 모드: 기존 데이터 삭제
        const { error: deleteError } = await supabase.from('pharmacies').delete().neq('id', 0)
        
        if (deleteError) {
          alert('기존 데이터 삭제 실패: ' + deleteError.message)
          event.target.value = ''
          return
        }
        // 로컬 데이터도 초기화
        pharmacies.value = []
      }
    }

    // 데이터 변환 및 검증
    let uploadData = []
    const errors = []

    jsonData.forEach((row, index) => {
      const rowNum = index + 2 // 엑셀 행 번호 (헤더 제외)

      // 필수 필드 검증
      if (!row['약국명']) {
        errors.push(`${rowNum}행: 약국명이 필요합니다.`)
        return
      }
      if (!row['사업자등록번호']) {
        errors.push(`${rowNum}행: 사업자등록번호가 필요합니다.`)
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

      // 상태 값 검증 및 변환
      let statusValue = 'active' // 기본값
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
        pharmacy_code: row['약국코드'] || '',
        name: row['약국명'],
        business_registration_number: formattedBusinessNumber,
        address: row['주소'] || '',
        remarks: row['비고'] || '',
        status: statusValue,
        rowNum: rowNum // 에러 표시용
      })
    })

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 3단계: 추가 모드일 때만 사업자등록번호 중복 체크
    if (hasExistingData && isAppendMode) {
      const duplicateErrors = []
      const duplicatePharmacies = []
      
      for (const newPharmacy of uploadData) {
        if (newPharmacy.business_registration_number) {
          // 기존 데이터에서 동일한 사업자등록번호 중복 확인
          const existingPharmacy = pharmacies.value.find(p => 
            p.business_registration_number === newPharmacy.business_registration_number
          )
          
          if (existingPharmacy) {
            duplicateErrors.push(`${newPharmacy.rowNum}행: 이미 동일한 사업자등록번호의 약국이 등록되어 있습니다.`)
            duplicatePharmacies.push(newPharmacy)
          }
        }
      }

      if (duplicateErrors.length > 0) {
        // 4단계: 중복 발견 시 계속 진행 여부 확인
        if (!confirm('중복 오류:\n' + duplicateErrors.join('\n') + '\n\n계속 등록 작업을 진행하시겠습니까?')) {
          return
        }

        // 5단계: 중복 해결 방법 선택
        const shouldReplace = confirm('이미 동일한 사업자등록번호 약국을 어떻게 처리하시겠습니까?\n\n확인: 기존 약국 정보를 신규 약국 정보로 교체하기\n취소: 기존 약국 정보는 그대로 두고 신규 약국만 등록하기')
        
        if (shouldReplace) {
          // 교체 모드: 중복되는 기존 약국들 삭제
          for (const duplicatePharmacy of duplicatePharmacies) {
            const { error: deleteError } = await supabase
              .from('pharmacies')
              .delete()
              .eq('business_registration_number', duplicatePharmacy.business_registration_number)
            
            if (deleteError) {
              alert('기존 약국 삭제 실패: ' + deleteError.message)
              return
            }
          }
          // 로컬 데이터에서도 삭제
          for (const duplicatePharmacy of duplicatePharmacies) {
            const index = pharmacies.value.findIndex(p => 
              p.business_registration_number === duplicatePharmacy.business_registration_number
            )
            if (index > -1) {
              pharmacies.value.splice(index, 1)
            }
          }
        } else {
          // 기존 유지 모드: 중복되는 신규 약국들 제외
          const duplicateBusinessNumbers = duplicatePharmacies.map(p => p.business_registration_number)
          uploadData = uploadData.filter(item => !duplicateBusinessNumbers.includes(item.business_registration_number))
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

    // 데이터베이스에 일괄 삽입
    const { error } = await supabase.from('pharmacies').insert(insertData)

    if (error) {
      alert('업로드 실패: ' + error.message)
    } else {
      alert(`${insertData.length}건의 문전약국 데이터가 업로드되었습니다.`)
      await fetchPharmacies() // 목록 새로고침
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

// 엑셀 다운로드 (현재 목록)
const downloadExcel = async () => {
  if (pharmacies.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  // 데이터 변환
  const excelData = pharmacies.value.map((pharmacy, index) => ({
    No: index + 1,
    약국코드: pharmacy.pharmacy_code || '',
    약국명: pharmacy.name || '',
    사업자등록번호: pharmacy.business_registration_number || '',
    주소: pharmacy.address || '',
    비고: pharmacy.remarks || '',
    상태: pharmacy.status === 'active' ? '활성' : '비활성',
    등록일시: pharmacy.created_at ? new Date(pharmacy.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    수정일시: pharmacy.updated_at ? new Date(pharmacy.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '',
  }))

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('문전약국목록')

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
      
      // 가운데 정렬할 컬럼 지정 (No, 약국코드, 상태, 등록일시, 수정일시)
      if ([1, 2, 4, 7, 8, 9].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 4) {
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
    { width: 8 },  // No
    { width: 12 }, // 약국코드
    { width: 32 }, // 약국명
    { width: 16 }, // 사업자등록번호
    { width: 64 }, // 주소
    { width: 24 }, // 비고
    { width: 10 }, // 상태
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
  link.download = generateExcelFileName('문전약국목록')
  link.click()
  window.URL.revokeObjectURL(url)
}

async function deleteAllPharmacies() {
  if (!confirm('정말 모든 약국을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
  const { error } = await supabase.from('pharmacies').delete().neq('id', 0);
  if (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message);
    return;
  }
  pharmacies.value = [];
  alert('모든 약국이 삭제되었습니다.');
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
  
  console.log('약국 오버플로우 체크:', {
    text: element.textContent,
    textWidth,
    availableWidth,
    isOverflowed
  });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    console.log('약국 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    console.log('약국 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  console.log('약국 오버플로우 클래스 제거됨');
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

onMounted(() => {
  fetchPharmacies()
})
</script>
