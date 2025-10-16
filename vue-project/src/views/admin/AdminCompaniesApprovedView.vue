<template>
  <TopNavigationBar :breadcrumbMenu="'업체 관리'" :breadcrumbSubMenu="'승인 업체'" />
  <div class="admin-companies-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">승인 업체</div>
    </div>

    <div class="filter-card">
      <div class="filter-row" style="display:flex; align-items:center; justify-content:flex-start;">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="구분, 업체명, 사업자등록번호, 대표자명"
              class="search-input"
              @keyup.enter="doSearch"
              style="width:100%;"
            />
            <button
              v-if="searchInput.length > 0"
              class="clear-btn"
              @click="clearSearch"
              title="검색어 초기화"
            >×</button>
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
          전체 {{ filteredCompanies.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-download" @click="downloadExcel" :disabled="filteredCompanies.length === 0" style="margin-right: 1rem;">엑셀 다운로드</button>
          <button class="btn-save" @click="goCreate">업체 등록</button>
        </div>
      </div>
      
      <DataTable
        :value="filteredCompanies"
        :loading="false"
        paginator :rows="50" :rowsPerPageOptions="[20, 50, 100]"
        editMode="cell" @cell-edit-complete="onCellEditComplete"
        scrollable scrollHeight="calc(100vh - 250px)" 
        class="admin-companies-approved-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">승인된 업체가 없습니다.</div>
        </template>
        
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
        </Column>
        <Column field="company_group" header="구분" :headerStyle="{ width: columnWidths.company_group }" :sortable="true" :editor="getTextEditor"></Column>
        <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true">
          <template #body="slotProps">
            <a href="#" class="text-link" @click.prevent="goToDetail(slotProps.data.id)">{{ slotProps.data.company_name }}</a>
          </template>
        </Column>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: columnWidths.business_registration_number }" :sortable="true" :editor="getTextEditor">
          <template #body="slotProps">
            {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
          </template>
        </Column>
        <Column field="representative_name" header="대표자" :headerStyle="{ width: columnWidths.representative_name }" :sortable="true" :editor="getTextEditor"></Column>
        <Column field="business_address" header="사업장소재지" :headerStyle="{ width: columnWidths.business_address }" :sortable="true" :editor="getTextEditor">
          <template #body="slotProps">
            <span class="ellipsis-cell" :title="slotProps.data.business_address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.business_address }}</span>
          </template>
        </Column>
        <Column field="default_commission_grade" header="수수료 등급" :headerStyle="{ width: columnWidths.default_commission_grade }" :sortable="true" :editor="getDropdownEditor">
          <template #editor="{ data, field }">
            <Dropdown v-model="data[field]" :options="commissionGrades" optionLabel="name" optionValue="value" style="width: 100%" />
          </template>
        </Column>
        <Column header="병의원" :headerStyle="{ width: columnWidths.client_count }" :sortable="true">
          <template #body="slotProps">
            <span 
              v-if="slotProps.data.client_count > 0" 
              class="text-link" 
              @click="openClientModal(slotProps.data)"
              style="cursor: pointer; color: #007bff; text-decoration: underline;"
            >
              {{ slotProps.data.client_count }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="assigned_pharmacist_contact" header="관리자" :headerStyle="{ width: columnWidths.assigned_pharmacist_contact }" :sortable="true" :editor="getTextEditor"></Column>
        <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }">
          <template #body="slotProps">
            {{ slotProps.data.remarks || '-' }}
          </template>
        </Column>
        <Column field="approval_status" header="승인 취소" :headerStyle="{ width: columnWidths.approval_status, textAlign: 'center' }" :exportable="false">
          <template #body="slotProps">
            <div style="display: flex; justify-content: center;">
              <button class="btn-pending-sm" @click="openCancelDialog(slotProps.data)">취소</button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <!-- 승인 취소 확인 모달은 기본 브라우저 confirm 사용 -->

    <!-- 담당 병의원 모달 -->
    <Dialog 
      v-model:visible="clientModalVisible" 
      header="담당 병의원" 
      :modal="true"
      :style="{ width: '60vw' }">
      <div>
        <DataTable
          :value="clientModalData"
          class="custom-table modal-client-table"
          scrollable
          scrollHeight="400px"
        >
          <Column
            field="client_code"
            header="병의원코드"
            :headerStyle="{ width: '10%', textAlign: 'center' }"
            :style="{ textAlign: 'center' }"
            :sortable="true"
          />
          <Column
            field="name"
            header="병의원명"
            :headerStyle="{ width: '20%' }"
            :sortable="true"
          />
          <Column
            field="business_registration_number"
            header="사업자등록번호"
            :headerStyle="{ width: '12%', textAlign: 'center' }"
            :style="{ textAlign: 'center' }"
            :sortable="true"
          >
            <template #body="slotProps">
              {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
            </template>
          </Column>
          <Column
            field="owner_name"
            header="원장명"
            :headerStyle="{ width: '10%', textAlign: 'center' }"
            :style="{ textAlign: 'center' }"
            :sortable="true"
          />
          <Column
            field="address"
            header="주소"
            :headerStyle="{ width: '38%' }"
            :sortable="true"
          />
          <Column
            field="commission_grade"
            header="수수료 등급"
            :headerStyle="{ width: '10%', textAlign: 'center' }"
            :style="{ textAlign: 'center' }"
            :sortable="true"
          />
        </DataTable>
      </div>
      
      <template #footer>
        <div class="btn-row">
          <button class="btn-cancel" @click="closeClientModal">닫기</button>
        </div>
      </template>
    </Dialog>

    <!-- 전체 화면 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { h } from 'vue'
import { supabase } from '@/supabase'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import { useRouter } from 'vue-router'
import ExcelJS from 'exceljs'
import TopNavigationBar from '@/components/TopNavigationBar.vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { generateExcelFileName } from '@/utils/excelUtils'

// 컬럼 너비 관리
const columnWidths = {
  no: '4%',
  company_group: '7%',
  company_name: '16%',
  business_registration_number: '9%',
  representative_name: '7%',
  business_address: '20%',
  default_commission_grade: '7%',
  client_count: '7%',
  assigned_pharmacist_contact: '7%',
  remarks: '12%',
  approval_status: '6%',
}

const approvedCompanies = ref([])
const filteredCompanies = ref([])
const searchInput = ref('');
const searchKeyword = ref('');
const loading = ref(false)
const currentPageFirstIndex = ref(0)
const filters = ref({
  global: { value: null, matchMode: 'contains' },
})
const commissionGrades = [
  { name: 'A', value: 'A' },
  { name: 'B', value: 'B' },
  { name: 'C', value: 'C' },
]
const router = useRouter()

const fetchCompanies = async () => {
  loading.value = true
  try {
    // 업체 정보와 함께 병의원 수를 가져오기
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        client_assignments:client_company_assignments(count)
      `)
    
    if (error) {
      console.error('업체 정보를 불러오는데 실패했습니다.', error)
      throw error
    }
    
    // 승인된 업체만 필터링하고 병의원 수 추가
    approvedCompanies.value = (data || [])
      .filter(company => company.user_type === 'user' && company.approval_status === 'approved')
      .map(company => ({
        ...company,
        client_count: company.client_assignments?.[0]?.count || 0
      }))
    
    filteredCompanies.value = approvedCompanies.value;
  } catch (err) {
    console.error('업체 정보를 불러오는데 실패했습니다.', err)
  } finally {
    loading.value = false
  }
}

function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredCompanies.value = approvedCompanies.value.filter(c =>
      (c.company_name && c.company_name.toLowerCase().includes(keyword)) ||
      (c.business_registration_number && c.business_registration_number.toLowerCase().includes(keyword)) ||
      (c.representative_name && c.representative_name.toLowerCase().includes(keyword)) ||
      (c.company_group && c.company_group.toLowerCase().includes(keyword))
    );
  }
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredCompanies.value = approvedCompanies.value;
}

onMounted(() => {
  fetchCompanies()
})

function getDropdownEditor() {
  return {}
}

const goCreate = () => {
  router.push('/admin/companies/create?from=approved')
}

const companyDetailDialog = ref(false)
const selectedCompany = reactive({})
const isEditing = ref(false)
const hasChanges = ref(false)
const originalCompanyDetail = ref({})

const openCompanyDetailDialog = (company) => {
  Object.assign(selectedCompany, company)
  originalCompanyDetail.value = JSON.parse(JSON.stringify(company))
  companyDetailDialog.value = true
  isEditing.value = false
  hasChanges.value = false
  router.push(`/admin/companies/${company.id}?from=approved`)
}
const closeCompanyDetailDialog = () => {
  companyDetailDialog.value = false
}
const startEditCompanyDetail = () => {
  isEditing.value = true
  hasChanges.value = false
}
const cancelEditCompanyDetail = () => {
  Object.assign(selectedCompany, JSON.parse(JSON.stringify(originalCompanyDetail.value)))
  isEditing.value = false
  hasChanges.value = false
}
const saveCompanyDetail = async () => {
  try {
    loading.value = true
    const currentUser = await supabase.auth.getUser()
    if (!currentUser.data.user) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.')
      loading.value = false
      return
    }
    const adminUserId = currentUser.data.user.id

    const { error } = await supabase
      .from('companies')
      .update({
        company_name: selectedCompany.company_name,
        representative_name: selectedCompany.representative_name,
        business_address: selectedCompany.business_address,
        landline_phone: selectedCompany.landline_phone,
        contact_person_name: selectedCompany.contact_person_name,
        mobile_phone: selectedCompany.mobile_phone,
        mobile_phone_2: selectedCompany.mobile_phone_2,
        receive_email: selectedCompany.receive_email,
        company_group: selectedCompany.company_group,
        default_commission_grade: selectedCompany.default_commission_grade,
        assigned_pharmacist_contact: selectedCompany.assigned_pharmacist_contact,
        remarks: selectedCompany.remarks,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      })
      .eq('id', selectedCompany.id)
    if (error) throw error
    alert('업체 정보가 성공적으로 수정되었습니다.')
    isEditing.value = false
    hasChanges.value = false
    originalCompanyDetail.value = JSON.parse(JSON.stringify(selectedCompany))
    await fetchCompanies()
  } catch (err) {
    console.error('업체 정보 수정 중 오류가 발생했습니다.', err)
  } finally {
    loading.value = false
  }
}

watch(
  selectedCompany,
  (newVal) => {
    hasChanges.value = JSON.stringify(newVal) !== JSON.stringify(originalCompanyDetail.value)
  },
  { deep: true },
)

const confirmApprovalChange = async (company, newStatus) => {
  const actionText = newStatus === 'approved' ? '승인' : '승인 취소'
  try {
    loading.value = true
    
    // 새로운 함수 호출로 승인 상태 변경
    const { error } = await supabase.rpc('update_company_approval_status', {
      company_id: company.id,
      new_status: newStatus
    })
    
    if (error) throw error
    alert('업체 상태가 성공적으로 변경되었습니다.')
    await fetchCompanies()
    router.push('/admin/companies/approved')
  } catch (err) {
    alert(err.message || '상태 변경 실패')
  } finally {
    loading.value = false
  }
}

// 날짜 포맷 함수 및 최종 수정자 함수 추가
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
const getLastModifiedBy = (company) => {
  if (!company) return ''
  if (company.user_type === 'admin') {
    return `관리자(${company.email})`
  } else {
    return `${company.company_name}(${company.email})`
  }
}


function getTextEditor(slotProps) {
  return h(InputText, {
    modelValue: slotProps.data[slotProps.field],
    'onUpdate:modelValue': (value) => (slotProps.data[slotProps.field] = value),
  })
}

function onCellEditComplete(event) {
  // event.data, event.field, event.newValue 등 활용
  // 예: 서버에 저장 등
}

function goToDetail(id) {
  router.push(`/admin/companies/${id}?from=approved`)
}

const downloadExcel = async () => {
  if (filteredCompanies.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('승인업체목록')

  // 헤더 정의
  const headers = [
    'No', '아이디(이메일)', '구분', '업체명', '사업자등록번호', '대표자', 
    '사업장소재지', '유선전화', '담당자', '휴대폰 번호', '휴대폰 번호 2', 
    '수신용 이메일', '승인여부', '수수료 등급', '관리자', '비고', 
    '등록일시', '승인일시', '수정일시'
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
  filteredCompanies.value.forEach((company, index) => {
    const dataRow = worksheet.addRow([
      index + 1 + currentPageFirstIndex.value,
      company.email || '',
      company.company_group || '',
      company.company_name || '',
      company.business_registration_number || '',
      company.representative_name || '',
      company.business_address || '',
      company.landline_phone || '',
      company.contact_person_name || '',
      company.mobile_phone || '',
      company.mobile_phone_2 || '',
      company.receive_email || '',
      company.approval_status === 'approved' ? '승인' : 
      company.approval_status === 'pending' ? '미승인' : company.approval_status || '',
      company.default_commission_grade || '',
      company.assigned_pharmacist_contact || '',
      company.remarks || '',
      company.created_at ? new Date(company.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
      company.approved_at ? new Date(company.approved_at).toISOString().slice(0, 16).replace('T', ' ') : '',
      company.updated_at ? new Date(company.updated_at).toISOString().slice(0, 16).replace('T', ' ') : ''
    ])

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }
      
      // 가운데 정렬이 필요한 컬럼들 (No, 구분, 사업자등록번호, 대표자, 승인여부, 수수료 등급)
      if (colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 8 || colNumber === 9 || colNumber === 10 || colNumber === 11 || colNumber === 13 || colNumber === 14 || colNumber === 15 || colNumber === 17 || colNumber === 18 || colNumber === 19) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 8 },   // No
    { width: 24 },  // 아이디(이메일)
    { width: 12 },   // 구분
    { width: 24 },  // 업체명
    { width: 16 },  // 사업자등록번호
    { width: 12 },  // 대표자
    { width: 48 },  // 사업장소재지
    { width: 14 },  // 유선전화
    { width: 12 },  // 담당자
    { width: 16 },  // 휴대폰 번호
    { width: 16 },  // 휴대폰 번호 2
    { width: 24 },  // 수신용 이메일
    { width: 8 },   // 승인여부
    { width: 10 },  // 수수료 등급
    { width: 12 },  // 관리자
    { width: 24 },  // 비고
    { width: 18 },  // 등록일시
    { width: 18 },  // 승인일시
    { width: 18 }   // 수정일시
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
  link.download = generateExcelFileName('승인업체목록')
  link.click()
  window.URL.revokeObjectURL(url)
}

function goList() {
  const from = route.query?.from === 'pending' ? 'pending' : 'approved';
  router.push(`/admin/companies/${from}`);
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
  
  // console.log('업체 오버플로우 체크:', { text: element.textContent, textWidth, availableWidth, isOverflowed });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    // console.log('업체 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    // console.log('업체 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
}

const clientModalVisible = ref(false);
const clientModalData = ref([]);

function openCancelDialog(company) {
  if (confirm(`정말 ${company.company_name} 업체를 승인 취소 처리하시겠습니까?`)) {
    confirmApprovalChange(company, 'pending');
  }
}

// 담당 병의원 모달 관련 함수들
async function openClientModal(company) {
  try {
    const { data, error } = await supabase
      .from('client_company_assignments')
      .select(`
        modified_commission_grade,
        company_default_commission_grade,
        client:clients(
          client_code,
          name,
          business_registration_number,
          owner_name,
          address
        )
      `)
      .eq('company_id', company.id)
    
    if (error) {
      console.error('병의원 정보 조회 오류:', error);
      alert('병의원 정보를 불러오는데 실패했습니다.');
      return;
    }
    
    clientModalData.value = data.map(item => ({
      ...item.client,
      commission_grade: item.modified_commission_grade || item.company_default_commission_grade || '-'
    }));
    clientModalVisible.value = true;
  } catch (err) {
    console.error('병의원 정보 조회 오류:', err);
    alert('병의원 정보를 불러오는데 실패했습니다.');
  }
}

function closeClientModal() {
  clientModalVisible.value = false;
  clientModalData.value = [];
}

// 사업자번호 형식 변환 함수
function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '-';
  
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 10자리가 아니면 원본 반환
  if (numbers.length !== 10) return businessNumber;
  
  // 형식 변환: ###-##-#####
  return numbers.substring(0, 3) + '-' + numbers.substring(3, 5) + '-' + numbers.substring(5);
}

</script>

<style scoped>
/* 이 컴포넌트 전용 스타일이 있다면 여기에, 없다면 태그 제거 */
.text-link { color: var(--text-link); text-decoration: underline; cursor: pointer; }
.text-link:hover { color: var(--primary-color-dark); }
</style>
