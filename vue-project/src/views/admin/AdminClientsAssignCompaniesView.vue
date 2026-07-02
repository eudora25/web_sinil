<template>
  <div class="admin-clients-assign-companies page-container">
    <div class="page-header-title-area">
      <div class="header-title">담당업체 지정</div>
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
        <div class="total-count-display">전체 {{ totalCount }} 건</div>
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
        :value="clients"
        :loading="loading"
        lazy
        paginator
        :rows="pageSize"
        :rowsPerPageOptions="[20, 50, 100]"
        :totalRecords="totalCount"
        @page="onPageChange"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-assign-companies-table"
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
          :headerStyle="{ width: columnWidths.client_code }"        />
        <Column
          field="name"
          header="병의원명"
          :headerStyle="{ width: columnWidths.name }"
          :style="{ fontWeight: '500 !important' }"        >
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
            >
              <template #body="slotProps">
                {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
              </template>
            </Column>
        <Column
          field="owner_name"
          header="원장명"
          :headerStyle="{ width: columnWidths.owner_name }"        />
        <Column
          field="address"
          header="주소"
          :headerStyle="{ width: columnWidths.address }"        >
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
        <Column header="사업자등록번호" :headerStyle="{ width: columnWidths.company_brn }">
          <template #body="slotProps">
            <div v-if="slotProps.data.companies && slotProps.data.companies.length > 0">
              <div
                v-for="(company, idx) in slotProps.data.companies"
                :key="company.id"
                style="min-height: 32px; display: flex; align-items: center !important;"
              >
                {{ company.business_registration_number }}
              </div>
            </div>
            <div v-else style="min-height: 32px">-</div>
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: columnWidths.actions }">
          <template #body="slotProps">
            <div v-if="slotProps.data.companies && slotProps.data.companies.length > 0">
              <div
                v-for="(company, idx) in slotProps.data.companies"
                :key="company.id"
                style="min-height: 32px; display: flex; align-items: center; gap: 4px"
              >
                <button class="btn-delete-sm" @click="deleteAssignment(slotProps.data, company)">
                  삭제
                </button>
                <button
                  v-if="idx === slotProps.data.companies.length - 1"
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

    <!-- 담당업체 지정 모달 -->
    <Dialog v-model:visible="assignModalVisible" header="업체 지정" :modal="true" :style="{ width: '60vw' }">
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; margin-top: 0px">
          <InputText
            v-model="companySearch"
            placeholder="구분, 업체명, 사업자등록번호, 대표자명"
            style="flex: 1"
            class="modal-search-input"
            @keyup.enter="searchCompanies"
          />
          <button
            class="search-btn"
            @click="searchCompanies"
            :disabled="!companySearch.trim()"
          >
            검색
          </button>
          <button
            class="search-btn"
            @click="clearCompanySearch"
            :disabled="!companySearchKeyword"
          >
            초기화
          </button>
        </div>
        <DataTable
          :value="filteredCompanies"
          v-model:selection="selectedCompanies"
          selectionMode="multiple"
          class="custom-table modal-assign-companies-table"
          scrollable
          scrollHeight="480px"
        >
          <Column selectionMode="multiple" :headerStyle="{ width: '6%' }" />
          <Column
            field="company_group"
            header="구분"
            :headerStyle="{ width: '12%' }"
            :sortable="true"
          />
          <Column
            field="company_name"
            header="업체명"
            :headerStyle="{ width: '18%' }"
            :sortable="true"
          />
          <Column
            field="business_registration_number"
            header="사업자등록번호"
            :headerStyle="{ width: '16%' }"
            :sortable="true"
          />
          <Column
            field="representative_name"
            header="대표자명"
            :headerStyle="{ width: '12%' }"
            :sortable="true"
          />
          <Column
            field="business_address"
            header="사업장 소재지"
            :headerStyle="{ width: '36%' }"
            :sortable="true"
          />
        </DataTable>
      </div>

      <template #footer>
        <div class="btn-row">
          <button class="btn-cancel" @click="closeAssignModal">취소</button>
          <button class="btn-save" :disabled="selectedCompanies.length === 0" @click="assignCompanies">지정</button>
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
import { formatBusinessNumber } from '@/utils/formatUtils'
import { useNotifications } from '@/utils/notifications'
import { translateSupabaseError } from '@/utils/errorMessages'

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const router = useRouter()
const clients = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const companies = ref([])
const assignModalVisible = ref(false)
const selectedClient = ref(null)
const selectedCompanies = ref([])
const companySearch = ref('')
const companySearchKeyword = ref('')
const currentPageFirstIndex = ref(0)
const fileInput = ref(null)

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  client_code: '7%',
  name: '18%',
  business_registration_number: '8%',
  owner_name: '7%',
  address: '20%',
  company_group: '10%',
  company_name: '14%',
  company_brn: '8%',
  actions: '8%',
}

const fetchClients = async () => {
  loading.value = true;
  try {
    // 서버 사이드 페이징/검색: 병의원+배정업체를 DB 함수(RPC)로 조회
    // (검색이 업체명/구분 조인까지 걸치므로 search_clients_with_assignments 재사용)
    const kw = searchKeyword.value && searchKeyword.value.trim().length >= 2
      ? searchKeyword.value.trim()
      : null;
    const offset = (currentPage.value - 1) * pageSize.value;
    const { data, error } = await supabase.rpc('search_clients_with_assignments', {
      p_keyword: kw,
      p_filter: 'all', // 담당업체 지정 화면은 미배정 병의원도 보여야 함 → 전체
      p_limit: pageSize.value,
      p_offset: offset,
    });
    if (error) {
      console.error('병의원 목록 조회 오류:', error);
      showError(translateSupabaseError(error, '병의원 목록 조회'));
      clients.value = [];
      totalCount.value = 0;
      return;
    }
    const rows = data || [];
    clients.value = rows.map((r) => ({
      id: r.id,
      client_code: r.client_code,
      name: r.name,
      business_registration_number: r.business_registration_number,
      owner_name: r.owner_name,
      address: r.address,
      companies: r.companies || [],
    }));
    totalCount.value = rows.length > 0 ? Number(rows[0].total_count) : 0;
    currentPageFirstIndex.value = offset;
  } catch (err) {
    console.error('병의원 목록 조회 예외:', err);
    showError(translateSupabaseError(err, '병의원 목록 조회'));
    clients.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}
const fetchCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('status', 'active')
    .eq('user_type', 'user') // user만 불러오기
  if (!error && data) companies.value = data
}
const searchInput = ref('');
const searchKeyword = ref('');

// 서버 페이징 상태
const pageSize = ref(50);
const totalCount = ref(0);
const currentPage = ref(1);

function doSearch() {
  searchKeyword.value = searchInput.value.length >= 2 ? searchInput.value : '';
  currentPage.value = 1;
  fetchClients();
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchClients();
}
function onPageChange(event) {
  currentPage.value = event.page + 1;
  pageSize.value = event.rows;
  fetchClients();
}

const filteredCompanies = computed(() => {
  if (!companySearchKeyword.value) return companies.value
  const search = companySearchKeyword.value.toLowerCase()
  return companies.value.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search) ||
      c.business_registration_number.includes(search) ||
      c.representative_name.toLowerCase().includes(search) ||
      (c.company_group && c.company_group.toLowerCase().includes(search)),
  )
})
function openAssignModal(client) {
  selectedClient.value = client
  selectedCompanies.value = []
  companySearch.value = ''
  companySearchKeyword.value = ''
  assignModalVisible.value = true
}
function closeAssignModal() {
  assignModalVisible.value = false
  selectedClient.value = null
  selectedCompanies.value = []
  companySearch.value = ''
  companySearchKeyword.value = ''
}
function searchCompanies() {
  if (companySearch.value.trim()) {
    companySearchKeyword.value = companySearch.value.trim()
  } else {
    companySearchKeyword.value = ''
  }
}
function clearCompanySearch() {
  companySearch.value = ''
  companySearchKeyword.value = ''
}
async function assignCompanies() {
  if (!selectedClient.value || selectedCompanies.value.length === 0) return
  const assignments = selectedCompanies.value.map((company) => ({
    client_id: selectedClient.value.id,
    company_id: company.id,
    company_default_commission_grade: company.default_commission_grade
  }))
  try {
    const { error } = await supabase
      .from('client_company_assignments')
      .upsert(assignments, { onConflict: 'client_id,company_id' })
    if (error) throw error

    const addedCount = selectedCompanies.value.length
    showSuccess(`${addedCount}개의 담당업체가 지정되었습니다.`)

    // 선택된 업체 초기화 (모달은 유지)
    selectedCompanies.value = []

    // 해당 병원의 담당업체 목록만 업데이트
    await updateClientCompanies(selectedClient.value.id)
  } catch (error) {
    console.error('담당업체 지정 실패:', error)
    showError(translateSupabaseError(error, '담당업체 지정'))
  }
}

// 특정 병원의 담당업체 목록만 업데이트하는 함수
async function updateClientCompanies(clientId) {
  try {
    // 해당 병원의 담당업체 정보만 다시 조회
    const { data: clientData, error } = await supabase
      .from('clients')
      .select(
        `*, companies:client_company_assignments(created_at, company:companies(id, company_name, business_registration_number, company_group))`
      )
      .eq('id', clientId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('병원 담당업체 정보 업데이트 오류:', error)
      return
    }

    if (clientData) {
      const companiesArr = (clientData.companies || []).map((c) => ({
        ...c.company,
        assignment_created_at: c.created_at
      }))

      // 현재 페이지의 해당 병원만 in-place 갱신 (검색/스크롤 위치 보존)
      const clientIndex = clients.value.findIndex(c => c.id === clientId)
      if (clientIndex !== -1) {
        clients.value[clientIndex].companies = companiesArr
      }
    }
  } catch (err) {
    console.error('병원 담당업체 정보 업데이트 예외:', err)
  }
}
async function deleteAssignment(client, company = null) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  let query = supabase.from('client_company_assignments').delete().eq('client_id', client.id)
  if (company) query = query.eq('company_id', company.id)
  const { error } = await query
  if (error) {
    console.error('담당업체 삭제 실패:', error)
    showError(translateSupabaseError(error, '담당업체 삭제'))
    return
  }

  // 추가와 동일하게: 전체 목록 새로고침(fetchClients) 대신 해당 병원의 담당업체 목록만 갱신
  // → 병원 검색 결과·스크롤 위치 등 화면 상태를 그대로 유지
  await updateClientCompanies(client.id)
}

const downloadTemplate = async () => {
  const templateData = [
    { '병의원 사업자등록번호': '123-45-67890', '업체 사업자등록번호': '111-22-33333' },
    { '병의원 사업자등록번호': '987-65-43210', '업체 사업자등록번호': '444-55-66666' },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('담당업체지정템플릿')

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
    { width: 20 }, // 업체 사업자등록번호
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
  link.download = '병의원-업체매핑_엑셀등록_템플릿.xlsx'
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
      showWarning('엑셀 파일에 데이터가 없습니다.')
      return
    }

    const assignmentsToUpload = []
    const errors = []

    // 모든 병의원 및 업체 정보를 미리 로드하여 ID 조회용으로 사용
    // (2000행 제한을 넘어도 전량 매칭되도록 배치 조회)
    const fetchAllIdBrn = async (table) => {
      const batchSize = 1000
      let all = []
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select('id, business_registration_number')
          .order('id', { ascending: true })
          .range(from, from + batchSize - 1)
        if (error) throw error
        if (data && data.length > 0) all = all.concat(data)
        if (!data || data.length < batchSize) break
        from += batchSize
      }
      return all
    }

    let allClientsData, allCompaniesData
    try {
      allClientsData = await fetchAllIdBrn('clients')
      allCompaniesData = await fetchAllIdBrn('companies')
    } catch (fetchErr) {
      showError('병의원 또는 업체 정보 조회 중 오류가 발생했습니다.')
      console.error(fetchErr)
      return
    }

    const clientMap = new Map(allClientsData.map((c) => [c.business_registration_number, c.id]))
    const companyMap = new Map(allCompaniesData.map((c) => [c.business_registration_number, c.id]))

    for (const [index, row] of jsonData.entries()) {
      const rowNum = index + 2
      const clientBrn = row['병의원 사업자등록번호']
      const companyBrn = row['업체 사업자등록번호']

      if (!clientBrn || !companyBrn) {
        errors.push(`${rowNum}행: 병의원 또는 업체의 사업자등록번호가 비어있습니다.`)
        continue
      }

      const clientId = clientMap.get(String(clientBrn))
      const companyId = companyMap.get(String(companyBrn))

      if (!clientId) {
        errors.push(
          `${rowNum}행: 병의원 사업자등록번호 '${clientBrn}'에 해당하는 병의원을 찾을 수 없습니다.`,
        )
      }
      if (!companyId) {
        errors.push(
          `${rowNum}행: 업체 사업자등록번호 '${companyBrn}'에 해당하는 업체를 찾을 수 없습니다.`,
        )
      }

      if (clientId && companyId) {
        assignmentsToUpload.push({ client_id: clientId, company_id: companyId })
      }
    }

    if (errors.length > 0) {
      showError('데이터 오류:\n' + errors.join('\n'))
      return
    }

    if (assignmentsToUpload.length > 0) {
      const { error } = await supabase
        .from('client_company_assignments')
        .upsert(assignmentsToUpload, { onConflict: 'client_id,company_id' })
      if (error) {
        showError(translateSupabaseError(error, '업로드'))
      } else {
        showSuccess(`${assignmentsToUpload.length}건의 담당업체 지정 정보가 업로드/갱신되었습니다.`)
        await fetchClients() // 목록 새로고침
      }
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    // 정의되지 않은 예외는 원본(영문) 메시지를 노출하지 않고 공통 오류 메시지로 안내
    showError('일괄 등록에 실패했습니다. 파일 형식을 확인 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.')
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    if (event.target) {
      event.target.value = ''
    }
  }
}

const downloadExcel = async () => {
  try {
    // 엑셀은 현재 화면 페이지가 아니라 "현재 검색에 맞는 전체"를 대상으로 → 서버 배치(1000건) 전량 조회
    const kw = searchKeyword.value && searchKeyword.value.trim().length >= 2
      ? searchKeyword.value.trim()
      : null;
    const excelBatchSize = 1000;
    let allClients = [];
    let excelOffset = 0;
    while (true) {
      const { data, error } = await supabase.rpc('search_clients_with_assignments', {
        p_keyword: kw,
        p_filter: 'all',
        p_limit: excelBatchSize,
        p_offset: excelOffset,
      });
      if (error) {
        showError(translateSupabaseError(error, '엑셀 데이터 조회'))
        return
      }
      const rows = data || [];
      if (rows.length > 0) allClients = allClients.concat(rows);
      if (rows.length < excelBatchSize) break;
      excelOffset += excelBatchSize;
    }
    if (allClients.length === 0) {
      showWarning('다운로드할 데이터가 없습니다.')
      return
    }
  const excelData = []
  allClients.forEach((client) => {
    if (client.companies && client.companies.length > 0) {
      client.companies.forEach((company) => {
        excelData.push({
          병의원코드: client.client_code,
          병의원명: client.name,
          사업자등록번호: client.business_registration_number,
          원장명: client.owner_name,
          주소: client.address,
          구분: company.company_group || '',
          '업체명': company.company_name || '',
          '업체 사업자번호': company.business_registration_number || '',
          지정일시: company.assignment_created_at ? new Date(company.assignment_created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
        })
      })
    } else {
      excelData.push({
        병의원코드: client.client_code,
        병의원명: client.name,
        사업자등록번호: client.business_registration_number,
        원장명: client.owner_name,
        주소: client.address,
        구분: '',
        '업체명': '',
        '업체 사업자번호': '',
        지정일시: '',
      })
    }
  })

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('담당업체지정현황')

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
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 가운데 정렬할 컬럼 지정 (병의원코드, 사업자등록번호, 원장명, 업체 사업자등록번호, 지정일시)
      if ([1, 3, 4, 8, 9].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 4) {
        cell.numFmt = '@'
      }
    })
  })

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일 (빈 셀 포함)
  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
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
    { width: 16 }, // 구분
    { width: 24 }, // 업체명
    { width: 16 }, // 사업자등록번호
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
  link.download = generateExcelFileName('병의원-업체목록')
  link.click()
  window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    showError('엑셀 다운로드 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  fetchClients()
  fetchCompanies()
})

// 병의원 상세 화면으로 이동
function goToClientDetail(clientId) {
  router.push({
    name: 'AdminClientDetail',
    params: { id: clientId },
    query: { from: 'admin-clients-assign-companies' }
  })
}

// 업체 상세 화면으로 이동
function goToCompanyDetail(companyId) {
  router.push({
    name: 'AdminCompanyDetail',
    params: { id: companyId },
    query: { from: 'admin-clients-assign-companies' }
  })
}

</script>