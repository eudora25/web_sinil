<template>
  <div class="performance-register-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">실적 등록</div>
    </div>

    <!-- 필터 카드: 정산월 + 업체 선택 드롭다운 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>업체</label>
          <div class="company-search-container" style="position: relative;">
            <input
              v-model="companySearchText"
              @input="handleCompanySearch"
              @focus="handleCompanyFocus"
              @blur="delayedHideCompanyDropdown"
              @keydown="handleCompanyKeydown"
              :placeholder="selectedCompanyId === '' ? '업체명을 입력하세요...' : ''"
              class="select_200px"
              autocomplete="off"
            />
            <div v-if="showCompanyDropdown && filteredCompanies.length > 0" class="company-dropdown">
              <!-- 전체 옵션 -->
              <div
                :class="['company-dropdown-item', { 
                  selected: selectedCompanyId === '', 
                  highlighted: companyHighlightedIndex === 0 
                }]"
                @mousedown.prevent="selectCompany({ id: '', company_name: '전체' })"
              >
                전체
              </div>
              <!-- 업체 목록 -->
              <div
                v-for="(company, index) in filteredCompanies"
                :key="company.id"
                :class="['company-dropdown-item', { 
                  selected: selectedCompanyId === company.id, 
                  highlighted: companyHighlightedIndex === index + 1 
                }]"
                @mousedown.prevent="selectCompany(company)"
              >
                {{ company.company_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 데이터 카드: 전체 n건 + 테이블 + 합계 행 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0;">
        <div class="total-count-display">전체 {{ clientList.length }} 건</div>
        <div class="data-card-buttons">
          <button
            class="btn-excell-download"
            @click="downloadExcel"
            :disabled="clientList.length === 0"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>
      <div style="flex-grow: 1; overflow: auto;">
        <DataTable
          :value="clientList"
          scrollable
          scrollHeight="calc(100vh - 220px)"
          class="custom-table performance-register-table"
        >
          <template #empty>
            <div v-if="!loading">{{ !selectedCompanyId ? '업체를 선택해주세요.' : '등록된 병의원이 없습니다.' }}</div>
          </template>

          <!-- No 컬럼 -->
          <Column header="No" :headerStyle="{ width: columnWidths.no, textAlign: 'center' }">
            <template #body="slotProps">
              {{ slotProps.index + 1 }}
            </template>
          </Column>
          <!-- 거래처 정보 -->
          <Column
            field="client_code"
            header="병의원코드"
            :headerStyle="{ width: columnWidths.client_code, textAlign: 'center' }"
          />
          <Column header="병의원명" :headerStyle="{ width: columnWidths.name, textAlign: 'center' }">
            <template #body="slotProps">
              <a 
                href="#" 
                class="text-link"
                :title="slotProps.data.name"
                @click.prevent="goToClientDetail(slotProps.data.id)"
                style="
                  display: block;
                  width: 100%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  font-weight: 500;
                "
              >
                {{ slotProps.data.name }}
              </a>
            </template>
          </Column>
          <Column
            field="business_registration_number"
            header="사업자등록번호"
            :headerStyle="{ width: columnWidths.business_registration_number, textAlign: 'center' }"
          />
          <Column header="주소" :headerStyle="{ width: columnWidths.address, textAlign: 'center' }">
            <template #body="slotProps">
              <span
                :title="slotProps.data.address"
                style="
                  display: block;
                  max-width: 100%;
                  width: 100%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  box-sizing: border-box;
                "
              >
                {{ slotProps.data.address }}
              </span>
            </template>
          </Column>

          <!-- 실적 정보 -->
          <Column
            header="처방건수"
            :headerStyle="{ width: columnWidths.performance_count, textAlign: 'center' }"
          >
            <template #body="slotProps">
              {{ slotProps.data.performance_count ? slotProps.data.performance_count : '-' }}
            </template>
          </Column>
          <Column
            header="처방액"
            :headerStyle="{ width: columnWidths.total_prescription_amount, textAlign: 'center' }"
          >
            <template #body="slotProps">
              {{
                slotProps.data.total_prescription_amount
                  ? Number(slotProps.data.total_prescription_amount).toLocaleString('ko-KR', { maximumFractionDigits: 0 })
                  : '-'
              }}
            </template>
          </Column>

          <!-- 버튼 영역 -->
          <Column
            header="조회"
            :headerStyle="{ width: columnWidths.view_button, textAlign: 'center' }"
          >
            <template #body="slotProps">
              <button
                class="btn-view-sm"
                @click="viewDetails(slotProps.data)"
                :disabled="!isInputPeriod || !(slotProps.data.performance_count > 0)"
              >
                조회
              </button>
            </template>
          </Column>
          <Column
            header="등록"
            :headerStyle="{ width: columnWidths.input_button, textAlign: 'center' }"
          >
            <template #body="slotProps">
              <button
                class="btn-input-sm"
                @click="registerPerformance(slotProps.data)"
                :disabled="!isInputPeriod"
              >
                등록
              </button>
            </template>
          </Column>
          <Column
            header="증빙 파일"
            :headerStyle="{ width: columnWidths.evidence_files_count, textAlign: 'center' }"
          >
            <template #body="slotProps">
              {{ slotProps.data.evidence_files_count ? slotProps.data.evidence_files_count : '-' }}
            </template>
          </Column>
          <Column
            header="파일 보기"
            :headerStyle="{ width: columnWidths.view_files_button, textAlign: 'center' }"
          >
            <template #body="slotProps">
              <button
                class="btn-view-sm"
                @click="openDetailModal(slotProps.data)"
                :disabled="!isInputPeriod || !(slotProps.data.evidence_files_count > 0)"
              >
                보기
              </button>
            </template>
          </Column>
          <Column
            header="업로드"
            :headerStyle="{ width: columnWidths.upload_button, textAlign: 'center' }"
          >
            <template #body="slotProps">
              <button
                class="btn-upload-sm"
                @click="openUploadModal(slotProps.data)"
                :disabled="!isInputPeriod"
              >
                업로드
              </button>
            </template>
          </Column>
          <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="5" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="totalPerformanceCount.toString()" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="Number(totalPrescriptionAmount).toLocaleString('ko-KR', { maximumFractionDigits: 0 })" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :colspan="2" footerClass="footer-cell" />
              <Column :footer="totalEvidenceFilesCount.toString()" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :colspan="2" footerClass="footer-cell" />
            </Row>
          </ColumnGroup>
        </DataTable>
      </div>
    </div>

    <!-- 전체 화면 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>

    <!-- 증빙파일 상세 모달: teleport로 body에 위치 -->
    <teleport to="body">
      <div v-if="detailModalVisible" class="modal-overlay" @click="closeDetailModal">
        <div class="modal-content modal-center" @click.stop>
          <div class="modal-header">
            <h2>{{ truncateText(selectedClient?.name || '', 20) }}</h2>
            <button @click="closeDetailModal" class="btn-close-nobg">X</button>
          </div>
          <div class="modal-body">
            <div
              v-if="clientFiles.length === 0"
              style="text-align: center; color: #666; padding: 2rem"
            >
              등록된 파일이 없습니다.
            </div>
            <div v-else>
              <!-- 테이블 헤더 -->
              <div
                style="
                  display: flex;
                  font-weight: bold;
                  padding: 0.75rem 0;
                  border-bottom: 1px solid #bbb;
                  margin-bottom: 0.5rem;
                "
              >
                <div style="flex: 1; text-align: center">파일명</div>
                <div style="width: 80px; text-align: center">삭제</div>
              </div>
              <!-- 테이블 데이터 -->
              <div
                v-for="(file, index) in clientFiles"
                :key="file.id"
                style="display: flex; padding: 0.5rem 0; border-bottom: 1px solid #eee"
              >
                <div style="flex: 1; text-align: left; padding-left: 1rem">
                  <a
                    @click="downloadFile(file)"
                    style="color: #1976d2; cursor: pointer; text-decoration: underline"
                  >
                    {{ file.file_name }}
                  </a>
                </div>
                <div style="width: 80px; text-align: center">
                  <button
                    class="btn-delete-sm"
                    @click="deleteFile(file, index)"
                    title="파일 삭제"
                    :disabled="!isInputPeriod"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn-download"
              @click="downloadAllFiles"
              :disabled="clientFiles.length === 0"
            >
              전체 다운로드
            </button>
            <button class="btn-close" @click="closeDetailModal">닫기</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 업로드 모달: teleport로 body에 위치 -->
    <teleport to="body">
      <div v-if="uploadModalVisible" class="modal-overlay" @click="closeUploadModal">
        <div class="modal-content modal-center" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedClient?.name }}</h2>
            <button @click="closeUploadModal" class="btn-close-nobg">X</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">파일 선택 (최대 10개)</label>
              <input
                ref="fileInput"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                @change="handleFileSelect"
                style="width: 100%"
              />
              <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem">
                등록 가능 파일: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
              </div>
            </div>
            <div v-if="selectedFiles.length > 0" style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">선택된 파일</label>
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.5rem;
                  border: 1px solid #ddd;
                  margin-bottom: 0.25rem;
                "
              >
                <span>{{ file.name }}</span>
                <button
                  class="btn-delete-sm"
                  @click="removeFile(index)"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeUploadModal">취소</button>
            <button
              class="btn-excell-upload"
              @click="uploadFiles"
              :disabled="selectedFiles.length === 0 || uploading"
            >
              {{ uploading ? '업로드 중...' : '업로드' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 조회 모달: teleport로 body에 위치 -->
    <teleport to="body">
      <div v-if="viewModalVisible" class="modal-overlay" @click="closeViewModal">
        <div class="modal-content modal-center" @click.stop>
          <div class="modal-header">
            <h2>{{ truncateText(viewModalClient?.name || '', 20) }}</h2>
            <button @click="closeViewModal" class="btn-close-nobg">X</button>
          </div>
          <div class="modal-body">
            <div
              v-if="viewModalData.length === 0"
              style="text-align: center; color: #666; padding: 2rem"
            >
              등록된 실적이 없습니다.
            </div>
            <div v-else>
              <!-- 테이블 헤더 -->
              <div
                style="
                  display: flex;
                  font-weight: bold;
                  padding: 0.5rem 0;
                  border-top: 1px solid #ddd;
                  border-bottom: 1px solid #bbb;
                "
              >
                <div style="flex: 1; text-align: center">제품명</div>
                <div style="width: 100px; text-align: center">처방수량</div>
                <div style="width: 100px; text-align: center">처방액</div>
              </div>
              <!-- 테이블 데이터 -->
              <div
                v-for="(record, index) in viewModalData"
                :key="index"
                style="display: flex; padding: 0.5rem 0; border-bottom: 1px solid #eee"
              >
                <div style="flex: 1; text-align: left; padding-left: 1rem">
                  {{ record.product_name }}
                </div>
                <div style="width: 100px; text-align: right; padding-right: 1rem">
                  {{ formatNumber(record.prescription_qty) }}
                </div>
                <div style="width: 100px; text-align: right; padding-right: 1rem">
                  {{ Number(record.prescription_amount || 0).toLocaleString() }}
                </div>
              </div>
              <!-- 합계 행 -->
              <div
                style="
                  display: flex;
                  padding: 0.5rem 0;
                  border-top: 1px solid #ddd;
                  border-bottom: 1px solid #bbb;
                  font-weight: bold;
                  background-color: #f8f9fa;
                "
              >
                <div style="flex: 1; text-align: center">합계</div>
                <div style="width: 100px; text-align: right; padding-right: 1rem">
                  {{ formatNumber(viewModalTotalQty) }}
                </div>
                <div style="width: 100px; text-align: right; padding-right: 1rem">
                  {{ Number(viewModalTotalAmount).toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-close" @click="closeViewModal">닫기</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'
import ExcelJS from 'exceljs'

const columnWidths = {
  no: '4%',
  client_code: '7%',
  name: '16%',
  business_registration_number: '8%',
  address: '23%',
  performance_count: '6%',
  total_prescription_amount: '6%',
  view_button: '6%',
  input_button: '6%',
  evidence_files_count: '6%',
  view_files_button: '6%',
  upload_button: '6%',
}

const availableMonths = ref([])
const selectedSettlementMonth = ref('')
const availableCompanies = ref([])
const selectedCompanyId = ref('')
const clientList = ref([])
const isInputPeriod = ref(false)
const loading = ref(false)
const router = useRouter()

// 업체 검색 관련 변수들
const companySearchText = ref('')
const showCompanyDropdown = ref(false)
const filteredCompanies = ref([])
const companyHighlightedIndex = ref(-1)
const detailModalVisible = ref(false)
const selectedClient = ref(null)
const clientFiles = ref([])
const uploadModalVisible = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const fileInput = ref(null)

// 조회 모달 관련 변수 추가
const viewModalVisible = ref(false)
const viewModalData = ref([])
const viewModalClient = ref(null)

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  // 소수점 한자리까지 반올림해서 표기
  return Number(value).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// 정산월 목록 fetch
const fetchAvailableMonths = async () => {
  const { data, error } = await supabase
    .from('settlement_months')
    .select('settlement_month')
    .eq('status', 'active')
    .order('settlement_month', { ascending: false })
  if (!error && data) {
    availableMonths.value = data.map((m) => m.settlement_month)
    if (availableMonths.value.length > 0) {
      selectedSettlementMonth.value = availableMonths.value[0]
    }
  }
}

// 업체 목록 fetch (관리자용)
const fetchAvailableCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name')
    .eq('approval_status', 'approved')
    .eq('status', 'active')
    .eq('user_type', 'user')
    .order('company_name', { ascending: true })
  if (!error && data) {
    availableCompanies.value = data
  }
}

// 선택된 업체의 거래처ID fetch
const fetchCompanyClientIds = async (companyId) => {
  if (!companyId) return []
  const { data, error } = await supabase
    .from('client_company_assignments')
    .select('client_id')
    .eq('company_id', companyId)
  if (!error && data) {
    return data.map((a) => a.client_id)
  }
  return []
}

// 거래처+실적 집계 fetch
const fetchClientList = async () => {
  loading.value = true
  clientList.value = []
  if (!selectedSettlementMonth.value || !selectedCompanyId.value) {
    loading.value = false
    return
  }
  const clientIds = await fetchCompanyClientIds(selectedCompanyId.value)
  if (clientIds.length === 0) {
    loading.value = false
    return
  }
  // 거래처 정보
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, client_code, name, business_registration_number, address')
    .in('id', clientIds)
    .eq('status', 'active')

  if (clientError || !clients) {
    loading.value = false
    return
  }
  // 실적 집계
  const { data: perfData } = await supabase
    .from('performance_records')
    .select('client_id, prescription_qty, products(price)')
    .eq('company_id', selectedCompanyId.value)
    .eq('settlement_month', selectedSettlementMonth.value)

  // 거래처별 증빙파일 개수 집계
  const evidenceCounts = {}
  for (const client of clients) {
    const { count } = await supabase
      .from('performance_evidence_files')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', selectedCompanyId.value)
      .eq('client_id', client.id)
      .eq('settlement_month', selectedSettlementMonth.value)
    evidenceCounts[client.id] = count || 0
  }

  // 집계
  let unsortedList = clients.map((client) => {
    const perfRows = perfData?.filter((p) => p.client_id === client.id) || []
    const performance_count = perfRows.length
    const total_prescription_amount = perfRows.reduce(
      (sum, p) => sum + Math.round((p.prescription_qty || 0) * (p.products?.price || 0)),
      0,
    )
    const evidence_files_count = evidenceCounts[client.id] || 0
    return {
      ...client,
      performance_count,
      total_prescription_amount,
      evidence_files_count,
    }
  })
  // 정렬: 처방건수 0건 → 1건 이상, 각 그룹 내 가나다순
  const noData = unsortedList
    .filter((c) => !c.performance_count || Number(c.performance_count) === 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const hasData = unsortedList
    .filter((c) => Number(c.performance_count) > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  clientList.value = [...noData, ...hasData]
  loading.value = false
}

// 입력 가능 기간 체크
const checkInputPeriod = async () => {
  // 관리자는 항상 입력 가능
  isInputPeriod.value = true
  return
  
  if (!selectedSettlementMonth.value) return
  const { data, error } = await supabase
    .from('settlement_months')
    .select('start_date, end_date')
    .eq('settlement_month', selectedSettlementMonth.value)
    .single()
  if (!error && data) {
    const now = new Date()
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    endDate.setHours(23, 59, 59, 999); // 종료일을 그날의 마지막 시간으로 설정
    isInputPeriod.value = now >= startDate && now <= endDate
  } else {
    isInputPeriod.value = false
  }
}

// 합계 계산
const totalPerformanceCount = computed(() =>
  clientList.value.reduce((sum, c) => sum + (c.performance_count || 0), 0),
)
const totalPrescriptionAmount = computed(() =>
  clientList.value.reduce((sum, c) => sum + Math.round(c.total_prescription_amount || 0), 0),
)
const totalEvidenceFilesCount = computed(() =>
  clientList.value.reduce((sum, c) => sum + (c.evidence_files_count || 0), 0),
)

// 조회 모달 합계 계산
const viewModalTotalQty = computed(() =>
  viewModalData.value.reduce((sum, record) => sum + (record.prescription_qty || 0), 0),
)

const viewModalTotalAmount = computed(() =>
  viewModalData.value.reduce((sum, record) => sum + Math.round(record.prescription_amount || 0), 0),
)

const viewDetails = (client) => {
  if (!selectedSettlementMonth.value) {
    alert('정산월을 선택해주세요.')
    return
  }

  openViewModal(client)
}

// 조회 모달 열기
async function openViewModal(client) {
  viewModalClient.value = client
  viewModalData.value = []
  viewModalVisible.value = true
  await fetchViewModalData(client.id)
}

// 조회 모달 닫기
function closeViewModal() {
  viewModalVisible.value = false
  viewModalClient.value = null
  viewModalData.value = []
}

// 조회 모달용 실적 데이터 조회
async function fetchViewModalData(clientId) {
  if (!selectedCompanyId.value || !selectedSettlementMonth.value) return

  try {
    const { data, error } = await supabase
      .from('performance_records')
      .select(
        `
        prescription_qty,
        products (
          product_name,
          price
        )
      `,
      )
      .eq('company_id', selectedCompanyId.value)
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('client_id', clientId)

    if (!error && data) {
      viewModalData.value = data.map((record) => ({
        product_name: record.products?.product_name || '',
        prescription_qty: record.prescription_qty || 0,
        prescription_amount: Math.round((record.prescription_qty || 0) * (record.products?.price || 0)),
      }))
    }
  } catch (err) {
    console.error('조회 데이터 로드 오류:', err)
  }
}

const registerPerformance = (client) => {
  if (!selectedSettlementMonth.value) {
    alert('정산월을 선택해주세요.')
    return
  }
  if (!selectedCompanyId.value) {
    alert('업체를 선택해주세요.')
    return
  }

  router.push({
    name: 'PerformanceRegisterEdit',
    query: {
      clientId: client.id,
      clientName: client.name,
      businessRegistrationNumber: client.business_registration_number,
      address: client.address,
      settlementMonth: selectedSettlementMonth.value,
      companyId: selectedCompanyId.value, // 관리자용 추가 파라미터
    },
  })
}

function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  
  // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
  const utcYear = date.getUTCFullYear()
  const utcMonth = date.getUTCMonth()
  const utcDate = date.getUTCDate()
  
  // KST로 변환 (9시간 추가)
  const kstDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, 9, 0, 0))
  
  return kstDate.toLocaleDateString('ko-KR')
}

async function openDetailModal(client) {
  selectedClient.value = client
  detailModalVisible.value = false // 강제 반응성 트리거
  await nextTick()
  detailModalVisible.value = true
  await fetchClientFiles(client.id)
}
function closeDetailModal() {
  detailModalVisible.value = false
  selectedClient.value = null
  clientFiles.value = []
}
async function fetchClientFiles(clientId) {
  const { data, error } = await supabase
    .from('performance_evidence_files')
    .select('*')
    .eq('company_id', selectedCompanyId.value)
    .eq('client_id', clientId)
    .eq('settlement_month', selectedSettlementMonth.value)
    .order('uploaded_at', { ascending: false })
  if (!error && data) {
    clientFiles.value = data
  } else {
    clientFiles.value = []
  }
}
async function downloadFile(file) {
  const { data, error } = await supabase.storage
    .from('performance-evidence')
    .download(file.file_path)
  if (error) {
    alert('파일 다운로드에 실패했습니다.')
    return
  }
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = file.file_name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
async function deleteFile(file, index) {
  if (!confirm('이 파일을 삭제하시겠습니까?')) return
  await supabase.storage.from('performance-evidence').remove([file.file_path])
  await supabase.from('performance_evidence_files').delete().eq('id', file.id)
  clientFiles.value.splice(index, 1)
  await fetchClientFiles(selectedClient.value.id)
  await fetchClientList() // 테이블 새로고침
}
async function downloadAllFiles() {
  if (clientFiles.value.length === 0) {
    alert('다운로드할 파일이 없습니다.')
    return
  }
  const zip = new window.JSZip()
  const today = new Date().toISOString().slice(0, 10)
  const folderNameInZip = `${selectedClient.value.name}_${selectedSettlementMonth.value}`
  const folder = zip.folder(folderNameInZip)
  const filePromises = clientFiles.value.map(async (file) => {
    const { data, error } = await supabase.storage
      .from('performance-evidence')
      .download(file.file_path)
    if (!error) folder.file(file.file_name, data, { binary: true })
  })
  await Promise.all(filePromises)
  zip
    .generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } })
    .then(function (content) {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${folderNameInZip}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    })
    .catch((err) => {
      alert('ZIP 파일 생성에 실패했습니다.')
    })
}

function openUploadModal(client) {
  selectedClient.value = client
  selectedFiles.value = []
  uploadModalVisible.value = true
  nextTick(() => {
    if (fileInput.value) fileInput.value.value = ''
  })
}
function closeUploadModal() {
  uploadModalVisible.value = false
  selectedClient.value = null
  selectedFiles.value = []
  if (fileInput.value) fileInput.value.value = ''
}
function handleFileSelect(event) {
  const newFiles = Array.from(event.target.files)
  const totalFiles = selectedFiles.value.length + newFiles.length

  if (totalFiles > 10) {
    alert('최대 10개의 파일만 선택할 수 있습니다.')
    return
  }

  selectedFiles.value = [...selectedFiles.value, ...newFiles]

  // 파일 input 초기화 (같은 파일 다시 선택 가능하도록)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}
async function uploadFiles() {
  if (selectedFiles.value.length === 0) return
  if (!selectedClient.value || !selectedCompanyId.value) return
  uploading.value = true
  try {
    for (const file of selectedFiles.value) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}_${randomId}_${cleanFileName}`
      const filePath = `private/${fileName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('performance-evidence')
        .upload(filePath, file)
      if (uploadError) {
        alert(`파일 업로드 실패: ${file.name}`)
        continue
      }
      await supabase.from('performance_evidence_files').insert({
        company_id: selectedCompanyId.value,
        client_id: selectedClient.value.id,
        settlement_month: selectedSettlementMonth.value,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        uploaded_by: null, // 필요시 사용자 ID로 변경
      })
    }
    alert('파일 업로드가 완료되었습니다.')
    closeUploadModal()
    await fetchClientList() // 목록 새로고침
  } catch (err) {
    alert('파일 업로드 중 오류가 발생했습니다.')
  } finally {
    uploading.value = false
  }
}

// 업체 선택 시 데이터 새로고침 + sessionStorage에 저장
watch(selectedCompanyId, async () => {
  // 업체가 변경되면 검색 텍스트도 업데이트
  if (selectedCompanyId.value === '') {
    companySearchText.value = '';
  } else {
    const selectedCompany = availableCompanies.value.find(c => c.id === selectedCompanyId.value);
    if (selectedCompany) {
      companySearchText.value = selectedCompany.company_name;
    }
  }
  
  // 선택된 업체 ID를 sessionStorage에 저장
  if (selectedCompanyId.value) {
    sessionStorage.setItem('admin_selected_company_id', selectedCompanyId.value);
  } else {
    sessionStorage.removeItem('admin_selected_company_id');
  }
  await fetchClientList()
})

// 정산월 변경 시 데이터 새로고침
watch(selectedSettlementMonth, async () => {
  await checkInputPeriod()
  await fetchClientList()
})

onMounted(async () => {
  await fetchAvailableMonths()
  await fetchAvailableCompanies()
  
  // sessionStorage에서 이전에 선택했던 업체 ID 복원
  const savedCompanyId = sessionStorage.getItem('admin_selected_company_id');
  if (savedCompanyId) {
    selectedCompanyId.value = savedCompanyId;
  }
  
  await checkInputPeriod()
})

// 병의원 상세 화면으로 이동
function goToClientDetail(clientId) {
  router.push({
    name: 'AdminClientDetail',
    params: { id: clientId },
    query: { from: 'admin-performance-register' }
  })
}

// 엑셀 다운로드 함수
async function downloadExcel() {
  if (!clientList.value || clientList.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  // 엑셀 데이터 준비
  const excelData = clientList.value.map((client, index) => ({
    No: index + 1,
    병의원코드: client.client_code || '',
    병의원명: client.name || '',
    사업자등록번호: client.business_registration_number || '',
    주소: client.address || '',
    처방건수: client.performance_count || 0,
    처방액: client.total_prescription_amount || 0,
    증빙파일: client.evidence_files_count || 0,
  }))

  // 합계 행 추가
  const totalCount = totalPerformanceCount.value
  const totalAmount = totalPrescriptionAmount.value
  const totalFiles = totalEvidenceFilesCount.value

  excelData.push({
    No: '',
    병의원코드: '',
    병의원명: '',
    사업자등록번호: '',
    주소: '합계',
    처방건수: totalCount,
    처방액: totalAmount,
    증빙파일: totalFiles,
  })

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('실적 등록 현황')

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

  // 데이터 추가 (합계 행 제외)
  excelData.slice(0, -1).forEach((row) => {
    const dataRow = worksheet.addRow(Object.values(row))
    
    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }
      
      // 가운데 정렬할 컬럼 지정 (No, 병의원코드, 처방건수, 증빙파일)
      if ([1, 2, 4].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 4) {
        cell.numFmt = '@'
      }
      
      // 숫자 컬럼들은 숫자 형식으로 설정
      if ([6, 7, 8].includes(colNumber)) {
        cell.numFmt = '#,##0'
      }
    })
  })

  // 합계 행 추가
  const totalRow = worksheet.addRow(Object.values(excelData[excelData.length - 1]))
  
  // 합계행 스타일 설정
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F0F0F0' } // 연한 그레이
    };
    cell.alignment = { vertical: 'middle' };
    
    // 합계 텍스트는 가운데 정렬
    if (colNumber === 5) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });
  
  // 합계행 숫자 형식 설정
  totalRow.getCell(6).numFmt = '#,##0'; // 처방건수
  totalRow.getCell(7).numFmt = '#,##0'; // 처방액
  totalRow.getCell(8).numFmt = '#,##0'; // 증빙파일

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
    { width: 8 }, // No
    { width: 12 }, // 병의원코드
    { width: 32 }, // 병의원명
    { width: 16 }, // 사업자등록번호
    { width: 64 }, // 주소
    { width: 12 }, // 처방건수
    { width: 16 }, // 처방액
    { width: 12 }, // 증빙파일
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

  // 파일명 생성
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  let fileName = '실적등록현황'
  if (selectedSettlementMonth.value) {
    fileName += `_${selectedSettlementMonth.value}`
  }
  fileName += `_${dateStr}.xlsx`

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

// 업체 검색 관련 함수들
function handleCompanySearch() {
  const searchTerm = companySearchText.value.toLowerCase().trim();
  
  if (!searchTerm) {
    // 검색어가 없으면 모든 업체 표시 (최대 100개)
    filteredCompanies.value = availableCompanies.value.slice(0, 100);
  } else {
    // 검색어가 있으면 필터링
    filteredCompanies.value = availableCompanies.value
      .filter(company => 
        company.company_name.toLowerCase().includes(searchTerm)
      )
      .slice(0, 100); // 최대 100개로 제한
  }
  
  companyHighlightedIndex.value = -1; // 검색 시 하이라이트 초기화
  showCompanyDropdown.value = true;
}

function selectCompany(company) {
  selectedCompanyId.value = company.id;
  companySearchText.value = company.id === '' ? '' : company.company_name;
  showCompanyDropdown.value = false;
  companyHighlightedIndex.value = -1;
  
  // 병의원 데이터 다시 로드
  fetchClients();
}

function handleCompanyFocus() {
  showCompanyDropdown.value = true;
  handleCompanySearch();
}

function handleCompanyKeydown(event) {
  if (!showCompanyDropdown.value) return;
  
  const totalItems = filteredCompanies.value.length + 1; // +1 for "전체" option
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      companyHighlightedIndex.value = Math.min(companyHighlightedIndex.value + 1, totalItems - 1);
      scrollToHighlightedCompany();
      break;
    case 'ArrowUp':
      event.preventDefault();
      companyHighlightedIndex.value = Math.max(companyHighlightedIndex.value - 1, -1);
      scrollToHighlightedCompany();
      break;
    case 'Enter':
      event.preventDefault();
      if (companyHighlightedIndex.value === 0) {
        // "전체" 선택
        selectCompany({ id: '', company_name: '전체' });
      } else if (companyHighlightedIndex.value > 0) {
        // 업체 선택
        const companyIndex = companyHighlightedIndex.value - 1;
        if (companyIndex < filteredCompanies.value.length) {
          selectCompany(filteredCompanies.value[companyIndex]);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      showCompanyDropdown.value = false;
      companyHighlightedIndex.value = -1;
      break;
  }
}

function scrollToHighlightedCompany() {
  nextTick(() => {
    const dropdown = document.querySelector('.company-dropdown');
    if (!dropdown) return;
    
    const highlightedItem = dropdown.querySelector('.company-dropdown-item.highlighted');
    if (!highlightedItem) return;
    
    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = highlightedItem.getBoundingClientRect();
    
    // 항목이 드롭다운 상단을 벗어나면 스크롤
    if (itemRect.top < dropdownRect.top) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // 항목이 드롭다운 하단을 벗어나면 스크롤
    else if (itemRect.bottom > dropdownRect.bottom) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function delayedHideCompanyDropdown() {
  // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
  setTimeout(() => {
    showCompanyDropdown.value = false;
  }, 200);
}
</script>

<style scoped>
/* 업체 검색 드롭다운 스타일 */
.company-search-container {
  position: relative;
}

.company-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
  z-index: 1000;
}

.company-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.company-dropdown-item:hover {
  background-color: #f5f5f5;
}

.company-dropdown-item.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.company-dropdown-item.highlighted {
  background-color: #f0f8ff;
  color: #1976d2;
}

.company-dropdown-item.no-results {
  color: #999;
  font-style: italic;
  cursor: default;
}

.company-dropdown-item.no-results:hover {
  background-color: transparent;
}
</style> 