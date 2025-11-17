<template>
  <div class="admin-clients-assign-pharmacies page-container">
    <div class="page-header-title-area">
      <div class="header-title">문전약국 지정</div>
    </div>
    <div class="filter-card">
      <div class="filter-row" style="display:flex; align-items:center; justify-content:flex-start;">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="병의원, 사업자번호, 원장, 주소, 구분, 업체, 약국"
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
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>병원 구분</label>
          <select v-model="hospitalFilter" class="select_180px" @change="applyHospitalFilter">
            <option v-for="option in hospitalFilterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ filteredClients.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
                    <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
<!--          <button class="btn-delete" @click="deleteAllAssignments">모두 삭제</button>-->
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
        v-model:filters="filters"
        :globalFilterFields="['client_code', 'name', 'business_registration_number']"
        class="admin-assign-pharmacies-table"
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
        />
        <Column
          field="name"
          header="병의원명"
          :headerStyle="{ width: columnWidths.name }"
          :style="{ fontWeight: '500 !important' }"
          :sortable="true"
        >
          <template #body="slotProps">
            <span
              class="ellipsis-cell text-link"
              :title="slotProps.data.name"
              @mouseenter="checkOverflow"
              @mouseleave="removeOverflowClass"
              @click="goToClientDetail(slotProps.data.id)"
            >
              {{ slotProps.data.name }}
            </span>
          </template>
        </Column>
        <Column
          field="business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidths.business_registration_number }"
          :sortable="true"
        />
        <Column
          field="owner_name"
          header="원장명"
          :headerStyle="{ width: columnWidths.owner_name }"
          :sortable="true"
        />
        <Column field="address" header="주소" :headerStyle="{ width: columnWidths.address }" :sortable="true">
          <template #body="slotProps">
            <span class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
          </template>
        </Column>
        <Column header="구분" :headerStyle="{ width: columnWidths.company_group }">
          <template #body="slotProps">
            <div v-if="slotProps.data.companies && slotProps.data.companies.length > 0">
              <div
                v-for="(company, idx) in slotProps.data.companies"
                :key="company.id"
                style="min-height: 32px; display: flex; align-items: center !important;"
              >
                {{ company.company_group || '-' }}
              </div>
            </div>
            <div v-else style="min-height: 32px">-</div>
          </template>
        </Column>

        <Column header="업체명" :headerStyle="{ width: columnWidths.company_name }">
          <template #body="slotProps">
            <div v-if="slotProps.data.companies && slotProps.data.companies.length > 0">
              <div
                v-for="(company, idx) in slotProps.data.companies"
                :key="company.id"
                style="min-height: 32px; display: flex; align-items: center !important; font-weight: 500 !important;"
              >
                <span
                  class="text-link"
                  @click="goToCompanyDetail(company.id)"
                  style="cursor: pointer;"
                >
                  {{ company.company_name }}
                </span>
              </div>
            </div>
            <div v-else style="min-height: 32px">-</div>
          </template>
        </Column>

        <Column header="약국명" :headerStyle="{ width: columnWidths.pharmacy_name }">
          <template #body="slotProps">
            <div v-if="slotProps.data.pharmacies && slotProps.data.pharmacies.length > 0">
              <div
                v-for="(pharmacy, idx) in slotProps.data.pharmacies"
                :key="pharmacy.id"
                style="min-height: 32px; display: flex; align-items: center !important; font-weight: 500 !important;"
              >
                <span
                  class="text-link"
                  @click="goToPharmacyDetail(pharmacy.id)"
                  style="cursor: pointer;"
                >
                  {{ pharmacy.name }}
                </span>
              </div>
            </div>
            <div v-else style="min-height: 32px">-</div>
          </template>
        </Column>
        <Column header="사업자등록번호" :headerStyle="{ width: columnWidths.pharmacy_brn }">
          <template #body="slotProps">
            <div v-if="slotProps.data.pharmacies && slotProps.data.pharmacies.length > 0">
              <div
                v-for="(pharmacy, idx) in slotProps.data.pharmacies"
                :key="pharmacy.id"
                style="min-height: 32px; display: flex; align-items: center"
              >
                {{ pharmacy.business_registration_number }}
              </div>
            </div>
            <div v-else style="min-height: 32px">-</div>
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: columnWidths.actions }">
          <template #body="slotProps">
            <div v-if="slotProps.data.pharmacies && slotProps.data.pharmacies.length > 0">
              <div
                v-for="(pharmacy, idx) in slotProps.data.pharmacies"
                :key="pharmacy.id"
                style="min-height: 32px; display: flex; align-items: center; gap: 4px"
              >
                <button class="btn-delete-sm" @click="deleteAssignment(slotProps.data, pharmacy)">
                  삭제
                </button>
                <button
                  v-if="idx === slotProps.data.pharmacies.length - 1"
                  class="btn-add-sm"
                  @click="openAssignModal(slotProps.data)"
                >
                  추가
                </button>
              </div>
            </div>
            <div v-else style="min-height: 32px; display: flex; align-items: center">
              <button class="btn-add-sm" @click="openAssignModal(slotProps.data)">추가</button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 담당약국 지정 모달 -->
    <Dialog v-model:visible="assignModalVisible" header="약국 지정" :modal="true" :style="{ width: '60vw' }">
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; margin-top: 0px">
          <InputText
            ref="pharmacySearchInput"
            placeholder="약국명, 사업자등록번호 검색"
            style="flex: 1"
            class="modal-search-input"
            @keyup.enter="performPharmacySearch"
          />
          <button
            class="search-btn"
            @click="performPharmacySearch"
          >
            검색
          </button>
          <button
            class="search-btn clear-btn-style"
            @click="clearPharmacySearch"
          >
            초기화
          </button>
        </div>
        <div 
          ref="pharmacyTableContainer"
          class="pharmacy-table-container"
          style="height: 480px; overflow-y: auto; border: 1px solid #ddd; position: relative;"
          @scroll="handlePharmacyTableScroll"
        >
          <!-- 로딩 오버레이 - 스크롤과 상관없이 고정 -->
          <div v-if="pharmacyLoading" class="loading-overlay-fixed">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <span style="color: #333; font-weight: 500;">약국 목록을 불러오는 중...</span>
            </div>
          </div>
          
          <DataTable
            :value="pharmacies"
            v-model:selection="selectedPharmacies"
            selectionMode="multiple"
            class="custom-table modal-assign-pharmacies-table"
            :scrollable="false"
          >
          <Column selectionMode="multiple" :headerStyle="{ width: '6%' }" />
          <Column field="name" header="약국명" :headerStyle="{ width: '28%' }" :sortable="true" />
          <Column
            field="business_registration_number"
            header="사업자등록번호"
            :headerStyle="{ width: '16%' }"
            :sortable="true"
          />
          <Column field="address" header="주소" :headerStyle="{ width: '50%' }" :sortable="true" />
          </DataTable>
          
          <!-- 더 이상 로드할 데이터가 없을 때 -->
          <div v-if="!pharmacyHasMore && pharmacies.length > 0" style="text-align: center; padding: 10px; color: #666; border-top: 1px solid #eee;">
            모든 약국을 불러왔습니다. (총 {{ pharmacyTotalCount }}개)
          </div>
        </div>
      </div>

      <template #footer>
        <div class="btn-row">
          <button class="btn-cancel" @click="closeAssignModal">취소</button>
          <button class="btn-save" :disabled="selectedPharmacies.length === 0" @click="assignPharmacies">지정</button>
        </div>
      </template>
    </Dialog>

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
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import { read, utils } from 'xlsx'
import { generateExcelFileName } from '@/utils/excelUtils'

const router = useRouter()
const clients = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const pharmacies = ref([])
const filters = ref({ global: { value: null, matchMode: 'contains' } })
const assignModalVisible = ref(false)
const selectedClient = ref(null)
const selectedPharmacies = ref([])
const pharmacySearchInput = ref(null)
const pharmacyTableContainer = ref(null)
const pharmacyPage = ref(1)
const pharmacyPageSize = ref(20)
const pharmacyTotalCount = ref(0)
const pharmacyLoading = ref(false)
const pharmacyHasMore = ref(true)
const currentPageFirstIndex = ref(0)
const fileInput = ref(null)

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  client_code: '7%',
  name: '16%',
  business_registration_number: '8%',
  owner_name: '7%',
  address: '20%',
  company_group: '8%',
  company_name: '12%',
  pharmacy_name: '12%',
  pharmacy_brn: '8%',
  actions: '8%'
};

const fetchClients = async () => {
  loading.value = true;
  try {
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select(
        `*, pharmacies:client_pharmacy_assignments!fk_client_pharmacy_assignments_client_id(created_at, pharmacy:pharmacies(id, name, business_registration_number)),companies:client_company_assignments!fk_client_company_assignments_client_id(created_at,company:companies!fk_client_company_assignments_company_id(id,company_name,business_registration_number,company_group))`,
      )
      .eq('status', 'active')
    
    if (error) {
      console.error('병의원 목록 조회 오류:', error);
      console.error('오류 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert('병의원 목록을 불러오는 중 오류가 발생했습니다: ' + error.message);
      clients.value = [];
      filteredClients.value = [];
      return;
    }
    
    if (clientsData) {
      clients.value = clientsData.map((client) => {
        const pharmaciesArr = (client.pharmacies || []).map((p) => ({
          ...p.pharmacy,
          assignment_created_at: p.created_at
        }))
        const companiesArr = (client.companies || []).map((c) => ({
          ...c.company,
          assignment_created_at: c.created_at
        }))
        return {
          ...client,
          pharmacies: pharmaciesArr,
          companies: companiesArr,
        }
      })
      filteredClients.value = clients.value;
      console.log('병의원 목록 로드 완료:', clients.value.length, '건');
    } else {
      console.warn('병의원 데이터가 없습니다.');
      clients.value = [];
      filteredClients.value = [];
    }
  } catch (err) {
    console.error('병의원 목록 조회 예외:', err);
    alert('병의원 목록을 불러오는 중 예외가 발생했습니다: ' + err.message);
    clients.value = [];
    filteredClients.value = [];
  } finally {
    loading.value = false;
  }
}
const fetchPharmacies = async (page = 1, searchKeyword = '') => {
  pharmacyLoading.value = true
  try {
    let query = supabase
      .from('pharmacies')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('name', { ascending: true })
      .range((page - 1) * pharmacyPageSize.value, page * pharmacyPageSize.value - 1)

    // 검색어가 있으면 필터링
    if (searchKeyword) {
      query = query.or(`name.ilike.%${searchKeyword}%,business_registration_number.ilike.%${searchKeyword}%`)
    }

    const { data, error, count } = await query
    
    // console.log('약국 데이터 로드 결과:', { page, searchKeyword, dataLength: data?.length, count, error })
    
    if (!error && data) {
      if (page === 1) {
        pharmacies.value = data
        // console.log('첫 페이지 로드:', data.length, '개')
      } else {
        pharmacies.value = [...pharmacies.value, ...data]
        // console.log('추가 페이지 로드:', data.length, '개, 총:', pharmacies.value.length, '개')
      }
      pharmacyTotalCount.value = count || 0
      pharmacyHasMore.value = pharmacies.value.length < pharmacyTotalCount.value
      // console.log('페이징 상태:', { total: pharmacyTotalCount.value, loaded: pharmacies.value.length, hasMore: pharmacyHasMore.value })
    }
  } catch (error) {
    console.error('약국 데이터 로드 실패:', error)
  } finally {
    pharmacyLoading.value = false
  }
}
const searchInput = ref('');
const searchKeyword = ref('');
const filteredClients = ref([]);

// 병원 필터 관련 변수들
const hospitalFilter = ref('assigned'); // 기본값: 담당업체 지정
const hospitalFilterOptions = ref([
  { label: '전체 병의원', value: 'all' },
  { label: '담당업체 지정 병의원', value: 'assigned' }
]);

function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
  } else {
    searchKeyword.value = '';
  }
  applyFilters();
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  applyFilters();
}

// 병원 필터 적용 함수
function applyHospitalFilter() {
  applyFilters();
}

// 통합 필터 적용 함수
function applyFilters() {
  let filtered = clients.value;

  // 병원 필터 적용
  if (hospitalFilter.value === 'assigned') {
    filtered = filtered.filter(client =>
      client.companies && client.companies.length > 0
    );
  }

  // 검색 필터 적용
  if (searchKeyword.value && searchKeyword.value.length >= 2) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(c =>
      (c.name && c.name.toLowerCase().includes(keyword)) ||
      (c.business_registration_number && c.business_registration_number.toLowerCase().includes(keyword)) ||
      (c.client_code && c.client_code.toLowerCase().includes(keyword)) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(keyword)) ||
      (c.address && c.address.toLowerCase().includes(keyword)) ||
      (c.pharmacies && c.pharmacies.some(pharmacy =>
        pharmacy.name && pharmacy.name.toLowerCase().includes(keyword)
      )) ||
      (c.companies && c.companies.some(company =>
        (company.company_group && company.company_group.toLowerCase().includes(keyword)) ||
        (company.company_name && company.company_name.toLowerCase().includes(keyword))
      ))
    );
  }

  filteredClients.value = filtered;
}

// (filteredClients를 ref로만 관리, 검색 버튼/X버튼/검색 버튼 클릭 시에만 갱신)

// 검색 결과를 ref로 관리하여 computed 속성 제거
const filteredPharmacies = ref([])
const currentSearchKeyword = ref('')
function openAssignModal(client) {
  selectedClient.value = client
  selectedPharmacies.value = []
  pharmacyPage.value = 1
  currentSearchKeyword.value = ''
  assignModalVisible.value = true
  // 검색창 초기화
  if (pharmacySearchInput.value) {
    pharmacySearchInput.value.$el.value = ''
  }
  // 초기 약국 데이터 로드
  fetchPharmacies(1, '')
}
function closeAssignModal() {
  assignModalVisible.value = false
  selectedClient.value = null
  selectedPharmacies.value = []
  // 검색창 초기화
  if (pharmacySearchInput.value) {
    pharmacySearchInput.value.$el.value = ''
  }
}
function performPharmacySearch() {
  const searchValue = pharmacySearchInput.value ? pharmacySearchInput.value.$el.value.trim() : ''
  currentSearchKeyword.value = searchValue
  pharmacyPage.value = 1
  fetchPharmacies(1, searchValue)
}
function clearPharmacySearch() {
  // 검색창 초기화
  if (pharmacySearchInput.value) {
    pharmacySearchInput.value.$el.value = ''
  }
  currentSearchKeyword.value = ''
  pharmacyPage.value = 1
  fetchPharmacies(1, '')
}

// 스크롤 이벤트 핸들러
function handlePharmacyTableScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50
  
  // console.log('스크롤 이벤트:', { scrollTop, scrollHeight, clientHeight, isNearBottom, hasMore: pharmacyHasMore.value, loading: pharmacyLoading.value })
  
  if (isNearBottom && pharmacyHasMore.value && !pharmacyLoading.value) {
    // console.log('다음 페이지 로드 시작:', pharmacyPage.value + 1)
    pharmacyPage.value++
    fetchPharmacies(pharmacyPage.value, currentSearchKeyword.value)
  }
}
async function assignPharmacies() {
  if (!selectedClient.value || selectedPharmacies.value.length === 0) return

      const assignments = selectedPharmacies.value.map((pharmacy) => ({
      // id는 자동 생성되도록 제거 (auto-increment)
      client_id: selectedClient.value.id,
      pharmacy_id: pharmacy.id,
    }))

  try {
    // 상용서버와 동일한 방식으로 복원
    const { data, error } = await supabase
      .from('client_pharmacy_assignments')
      .upsert(assignments, { onConflict: 'client_id,pharmacy_id' });

    if (error) {
      console.error('=== 상세 오류 정보 ===');
      console.error('오류 객체:', error);
      console.error('오류 메시지:', error.message);
      console.error('오류 코드:', error.code);
      console.error('오류 상세:', error.details);
      console.error('오류 힌트:', error.hint);
      console.error('전체 오류:', JSON.stringify(error, null, 2));
      throw error;
    }

  } catch (error) {
    console.error('문전약국 지정 실패:', error);
    alert('문전약국 지정 중 오류가 발생했습니다: ' + error.message);
    return;
  }

  closeAssignModal()
  await fetchClients()
}
async function deleteAssignment(client, pharmacy = null) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  let query = supabase.from('client_pharmacy_assignments').delete().eq('client_id', client.id)
  if (pharmacy) query = query.eq('pharmacy_id', pharmacy.id)
  await query
  await fetchClients()
}

const downloadTemplate = async () => {
  const templateData = [
    { '병의원 사업자등록번호': '123-45-67890', '약국 사업자등록번호': '222-11-33333' },
    { '병의원 사업자등록번호': '987-65-43210', '약국 사업자등록번호': '555-44-66666' },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('문전약국지정템플릿')

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
      cell.numFmt = '@' // 텍스트 형식으로 설정
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
    { width: 20 }, // 약국 사업자등록번호
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
  link.download = '병의원-약국매핑_엑셀등록_템플릿.xlsx'
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
    const workbook = read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      alert('엑셀 파일에 데이터가 없습니다.')
      return
    }

    const assignmentsToUpload = []
    const errors = []

    const { data: allClientsData, error: clientError } = await supabase
      .from('clients')
      .select('id, business_registration_number')
    const { data: allPharmaciesData, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('id, business_registration_number')

    if (clientError || pharmacyError) {
      alert('병의원 또는 약국 정보 조회 중 오류가 발생했습니다.')
      console.error(clientError || pharmacyError)
      return
    }

    const clientMap = new Map(allClientsData.map((c) => [c.business_registration_number, c.id]))
    const pharmacyMap = new Map(
      allPharmaciesData.map((p) => [p.business_registration_number, p.id]),
    )

    for (const [index, row] of jsonData.entries()) {
      const rowNum = index + 2
      const clientBrn = row['병의원 사업자등록번호']
      const pharmacyBrn = row['약국 사업자등록번호']

      if (!clientBrn || !pharmacyBrn) {
        errors.push(`${rowNum}행: 병의원 또는 약국의 사업자등록번호가 비어있습니다.`)
        continue
      }

      const clientId = clientMap.get(String(clientBrn))
      const pharmacyId = pharmacyMap.get(String(pharmacyBrn))

      if (!clientId) {
        errors.push(
          `${rowNum}행: 병의원 사업자등록번호 '${clientBrn}'에 해당하는 병의원을 찾을 수 없습니다.`,
        )
      }
      if (!pharmacyId) {
        errors.push(
          `${rowNum}행: 약국 사업자등록번호 '${pharmacyBrn}'에 해당하는 약국을 찾을 수 없습니다.`,
        )
      }

      if (clientId && pharmacyId) {
        assignmentsToUpload.push({
          // id는 자동 생성되도록 제거 (auto-increment)
          client_id: clientId,
          pharmacy_id: pharmacyId
        })
      }
    }

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    if (assignmentsToUpload.length > 0) {
      try {
        // 상용서버와 동일한 방식으로 복원
        const { data, error } = await supabase
          .from('client_pharmacy_assignments')
          .upsert(assignmentsToUpload, { onConflict: 'client_id,pharmacy_id' });

        if (error) {
          console.error('=== 엑셀 업로드 상세 오류 정보 ===');
          console.error('오류 객체:', error);
          console.error('오류 메시지:', error.message);
          console.error('오류 코드:', error.code);
          console.error('오류 상세:', error.details);
          console.error('오류 힌트:', error.hint);
          console.error('전체 오류:', JSON.stringify(error, null, 2));
          alert('업로드 실패: ' + error.message)
        } else {
          // console.log('엑셀 업로드 성공 응답:', data);
          alert(`${assignmentsToUpload.length}건의 문전약국 지정 정보가 업로드/갱신되었습니다.`)
          await fetchClients()
        }
      } catch (error) {
        console.error('엑셀 업로드 예외:', error);
        alert('업로드 중 예외가 발생했습니다: ' + error.message);
      }
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
  const excelData = []
  filteredClients.value.forEach((client) => {
    // 업체명과 구분을 쉼표로 구분하여 문자열로 만들기
    const companyNames = client.companies && client.companies.length > 0 
      ? client.companies.map(c => c.company_name || '').filter(n => n).join(', ')
      : ''
    const companyGroups = client.companies && client.companies.length > 0
      ? client.companies.map(c => c.company_group || '').filter(g => g).join(', ')
      : ''
    
    if (client.pharmacies && client.pharmacies.length > 0) {
      client.pharmacies.forEach((pharmacy) => {
        excelData.push({
          병의원코드: client.client_code,
          병의원명: client.name,
          사업자등록번호: client.business_registration_number,
          원장명: client.owner_name,
          주소: client.address,
          구분: companyGroups || '',
          업체명: companyNames || '',
          '약국명': pharmacy.name || '',
          '약국 사업자번호': pharmacy.business_registration_number || '',
          지정일시: pharmacy.assignment_created_at ? new Date(pharmacy.assignment_created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
        })
      })
    } else {
      excelData.push({
        병의원코드: client.client_code,
        병의원명: client.name,
        사업자등록번호: client.business_registration_number,
        원장명: client.owner_name,
        주소: client.address,
        구분: companyGroups || '',
        업체명: companyNames || '',
        '약국명': '',
        '약국 사업자번호': '',
        지정일시: '',
      })
    }
  })

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('문전약국지정현황')

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

      // 가운데 정렬할 컬럼 지정 (병의원코드, 원장명, 구분, 약국 사업자번호, 지정일시)
      if ([1, 4, 6, 9, 10].includes(colNumber)) {
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
    { width: 12 }, // 병의원코드
    { width: 32 }, // 병의원명
    { width: 16 }, // 사업자등록번호
    { width: 12 }, // 원장명
    { width: 64 }, // 주소
    { width: 10 }, // 구분
    { width: 24 }, // 업체명
    { width: 32 }, // 약국명
    { width: 16 }, // 약국 사업자번호
    { width: 18 }, // 지정일시
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
  link.download = generateExcelFileName('병의원-문전약국목록')
  link.click()
  window.URL.revokeObjectURL(url)
}



// async function deleteAllAssignments() {
//   if (!confirm('정말 모든 문전약국 지정 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
//   const { error } = await supabase.from('client_pharmacy_assignments').delete().neq('id', 0);
//   if (error) {
//     alert('삭제 중 오류가 발생했습니다: ' + error.message);
//     return;
//   }
//   clients.value.forEach(c => c.pharmacies = []);
//   alert('모든 문전약국 지정 데이터가 삭제되었습니다.');
// }

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
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
}

// 병의원 상세 화면으로 이동
function goToClientDetail(clientId) {
  router.push({
    name: 'AdminClientDetail',
    params: { id: clientId },
    query: { from: 'admin-clients-assign-pharmacies' }
  })
}

// 약국 상세 화면으로 이동
function goToPharmacyDetail(pharmacyId) {
  router.push({
    name: 'admin-pharmacies-detail',
    params: { id: pharmacyId },
    query: { from: 'admin-clients-assign-pharmacies' }
  })
}

// 업체 상세 화면으로 이동
function goToCompanyDetail(companyId) {
  router.push({
    name: 'AdminCompanyDetail',
    params: { id: companyId },
    query: { from: 'admin-clients-assign-pharmacies' }
  })
}

onMounted(() => {
  fetchClients()
  // fetchPharmacies는 모달 열 때만 호출
})
</script>

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pharmacy-table-container {
  position: relative;
}

.loading-overlay-fixed {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  border: 2px solid #007bff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  min-width: 200px;
  min-height: 120px;
}

.loading-content {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.clear-btn-style {
  background-color: #6c757d !important;
  border-color: #6c757d !important;
}

.clear-btn-style:hover {
  background-color: #5a6268 !important;
  border-color: #545b62 !important;
}

.clear-btn-style:active {
  background-color: #545b62 !important;
  border-color: #4e555b !important;
}
</style>

