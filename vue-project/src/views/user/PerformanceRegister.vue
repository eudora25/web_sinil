<template>
  <div class="performance-register-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">실적 등록</div>
    </div>

    <!-- 필터 카드: 정산월 드롭다운 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end">
        <div style="display: flex; align-items: center; gap: 8px">
          <label style="font-weight: 400">정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
        
        <!-- 실적 등록기간 및 구분 표시 -->
        <div style="display: flex; align-items: center; gap: 1rem; margin-left: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-weight: 500; font-size: 1.05rem; color: var(--text-secondary);">실적 등록 기간 :</label>
            <span style="font-weight: 500; font-size: 1.05rem; color: var(--text-primary);">
              {{ registrationPeriod.startDate }} ~ {{ registrationPeriod.endDate }}
            </span>
          </div>
          <div class="registration-status-badge" :class="registrationStatus.class">
            {{ registrationStatus.label }}
          </div>
          <button class="btn-notice-filter" @click="openNoticeModal(true)">전달사항</button>
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
          :loading="false"
          scrollable
          scrollHeight="calc(100vh - 220px)"
          class="custom-table performance-register-table"
        >
          <template #empty>
            <div v-if="!loading">등록된 병의원이 없습니다.</div>
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
          >
            <template #body="slotProps">
              {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
            </template>
          </Column>
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
              <Column footer="" footerClass="footer-cell" />
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

    <!-- 전달사항 모달 -->
    <div v-if="showNoticeModal" class="modal-overlay">
      <div class="modal-content modal-center">
        <div class="modal-header">
          <h2>{{ selectedSettlementMonth }} 실적 등록 전달사항</h2>
          <button class="modal-close-btn" @click="closeNoticeModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="noticeContent" style="padding: 20px; border-bottom: 1px solid #eee;">
            <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; line-height: 1.6; font-size: 14px;">{{ noticeContent }}</pre>
          </div>
          <div v-else style="text-align: center; color: #666; padding: 40px; border-bottom: 1px solid #eee;">
            등록된 전달사항이 없습니다.
          </div>
        </div>
        <div class="modal-footer" style="display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 16px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: #666; cursor: pointer;">
            <input 
              type="checkbox" 
              v-model="hideNoticeModal" 
              style="width: 16px; height: 16px; cursor: pointer;"
            >
            다시 보지 않기
          </label>
          <button class="btn-close" @click="closeNoticeModal">확인</button>
        </div>
      </div>
    </div>
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
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { getNoticeModalHidePreference, setNoticeModalHidePreference } from '@/utils/userPreferences'

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
const availableMonthsData = ref([]) // 정산월 관리 데이터 전체
const selectedSettlementMonth = ref('')
const clientList = ref([])
const isInputPeriod = ref(false)
const currentCompanyId = ref(null)
const loading = ref(true)
const router = useRouter()
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

// 전달사항 모달 관련 변수
const showNoticeModal = ref(false)
const noticeContent = ref('')
const hideNoticeModal = ref(false)
const currentSettlementMonthId = ref(null)

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  // 소수점 한자리까지 반올림해서 표기
  return Number(value).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// 정산월 목록 fetch
const fetchAvailableMonths = async () => {
  const { data, error } = await supabase
    .from('settlement_months')
    .select('*')
    .eq('status', 'active')
    .order('settlement_month', { ascending: false })
  if (!error && data) {
    availableMonthsData.value = data // 전체 데이터 저장
    availableMonths.value = data.map((m) => m.settlement_month) // 드롭다운용 월 목록
    if (availableMonths.value.length > 0) {
      selectedSettlementMonth.value = availableMonths.value[0]
      // 현재 선택된 정산월의 ID 저장
      const selectedMonthData = data.find(m => m.settlement_month === selectedSettlementMonth.value)
      currentSettlementMonthId.value = selectedMonthData?.id || null
    }
  }
}

// 내 회사ID fetch
const fetchCurrentCompanyId = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  if (company) currentCompanyId.value = company.id
}

// 내 거래처ID fetch
const fetchMyClientIds = async () => {
  if (!currentCompanyId.value) return []
  const { data, error } = await supabase
    .from('client_company_assignments')
    .select('client_id')
    .eq('company_id', currentCompanyId.value)
  if (!error && data) {
    return data.map((a) => a.client_id)
  }
  return []
}

// 거래처+실적 집계 fetch
const fetchClientList = async () => {
  loading.value = true
  if (!selectedSettlementMonth.value || !currentCompanyId.value) {
    loading.value = false
    return
  }
  const clientIds = await fetchMyClientIds()
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
    .eq('company_id', currentCompanyId.value)
    .eq('settlement_month', selectedSettlementMonth.value)

  // 거래처별 증빙파일 개수 집계 (PerformanceUploadView.vue 참고)
  const evidenceCounts = {}
  for (const client of clients) {
    const { count } = await supabase
      .from('performance_evidence_files')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentCompanyId.value)
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
  clientList.value.reduce((sum, c) => sum + (c.total_prescription_amount || 0), 0),
)
const totalEvidenceFilesCount = computed(() =>
  clientList.value.reduce((sum, c) => sum + (c.evidence_files_count || 0), 0),
)

// 실적 등록기간 계산
const registrationPeriod = computed(() => {
  if (!selectedSettlementMonth.value) {
    return { startDate: '-', endDate: '-' }
  }
  
  // 정산월 관리 테이블에서 설정된 기간을 가져오기
  const settlementMonthData = availableMonthsData.value?.find(month => month.settlement_month === selectedSettlementMonth.value)
  
  if (settlementMonthData) {
    // 날짜 형식을 YYYY-MM-DD로 변환
    const startDate = new Date(settlementMonthData.start_date).toISOString().split('T')[0]
    const endDate = new Date(settlementMonthData.end_date).toISOString().split('T')[0]
    return { startDate, endDate }
  }
  
  // 데이터가 없는 경우 기본값 (월의 시작일과 종료일)
  const [year, month] = selectedSettlementMonth.value.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
  
  return { startDate, endDate }
})

// 실적 등록 구분 계산
const registrationStatus = computed(() => {
  if (!selectedSettlementMonth.value) {
    return { label: '-', class: 'status-unknown' }
  }
  
  const now = new Date()
  const settlementMonthData = availableMonthsData.value?.find(month => month.settlement_month === selectedSettlementMonth.value)
  
  if (settlementMonthData) {
    // 정산월 관리 테이블의 설정된 기간 사용
    const startDate = new Date(settlementMonthData.start_date)
    const endDate = new Date(settlementMonthData.end_date)
    endDate.setHours(23, 59, 59, 999) // 종료일을 그날의 마지막 시간으로 설정
    
    if (now < startDate) {
      return { label: '예정', class: 'status-upcoming' }
    } else if (now > endDate) {
      return { label: '마감', class: 'status-closed' }
    } else {
      return { label: '진행중', class: 'status-active' }
    }
  }
  
  // 데이터가 없는 경우 기본값 (월의 시작일과 종료일)
  const [year, month] = selectedSettlementMonth.value.split('-')
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
  
  if (now < startDate) {
    return { label: '예정', class: 'status-upcoming' }
  } else if (now > endDate) {
    return { label: '마감', class: 'status-closed' }
  } else {
    return { label: '진행중', class: 'status-active' }
  }
})

// 조회 모달 합계 계산
const viewModalTotalQty = computed(() => {
  return viewModalData.value.reduce((sum, record) => sum + (record.prescription_qty || 0), 0)
})

const viewModalTotalAmount = computed(() => {
  return viewModalData.value.reduce((sum, record) => sum + (record.prescription_amount || 0), 0)
})

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
  if (!currentCompanyId.value || !selectedSettlementMonth.value) return

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
      .eq('company_id', currentCompanyId.value)
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('client_id', clientId)

    if (!error && data) {
      viewModalData.value = data.map((record) => {
        const qty = record.prescription_qty || 0
        const price = record.products?.price || 0
        const amount = Math.round(qty * price)
        
        return {
          product_name: record.products?.product_name || '',
          prescription_qty: qty,
          prescription_amount: amount,
        }
      })
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

  router.push({
    name: 'PerformanceRegisterEdit',
    query: {
      clientId: client.id,
      clientName: client.name,
      businessRegistrationNumber: client.business_registration_number,
      address: client.address,
      settlementMonth: selectedSettlementMonth.value,
    },
  })
}
const viewFiles = (client) => {}

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
  // console.log('모달 오픈', client) // 디버깅용
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
    .eq('company_id', currentCompanyId.value)
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
  if (!selectedClient.value || !currentCompanyId.value) return
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
        company_id: currentCompanyId.value,
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

// 정산월 변경 시 데이터 새로고침 및 전달사항 모달 표시
watch(selectedSettlementMonth, async () => {
  // 현재 선택된 정산월의 ID 업데이트
  const selectedMonthData = availableMonthsData.value.find(m => m.settlement_month === selectedSettlementMonth.value)
  currentSettlementMonthId.value = selectedMonthData?.id || null
  
  await checkInputPeriod()
  await fetchClientList()
  
  // 정산월 변경 시 전달사항 모달 자동 표시 (사용자 설정 확인 후)
  if (selectedSettlementMonth.value) {
    setTimeout(async () => {
      await openNoticeModal()
    }, 500); // 0.5초 후 표시
  }
})

onMounted(async () => {
  await fetchAvailableMonths()
  await fetchCurrentCompanyId()
  await checkInputPeriod()
  await fetchClientList()
})

// 병의원 상세 화면으로 이동
function goToClientDetail(clientId) {
  router.push({
    name: 'user-client-detail',
    params: { id: clientId },
    query: { from: 'performance-register' }
  })
}

// 엑셀 다운로드 함수
async function downloadExcel() {
  if (!clientList.value || clientList.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  try {
    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('실적 등록 현황')

    // 헤더 정의
    const headers = ['No', '병의원코드', '병의원명', '사업자등록번호', '주소', '처방건수', '처방액', '증빙파일']
    worksheet.addRow(headers)

    // 헤더 스타일 설정
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // 데이터 추가
    clientList.value.forEach((client, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        client.client_code || '',
        client.name || '',
        client.business_registration_number || '',
        client.address || '',
        client.performance_count || 0,
        client.total_prescription_amount || 0,
        client.evidence_files_count || 0
      ])

      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 }
        cell.alignment = { vertical: 'middle' }
        
        // 가운데 정렬이 필요한 컬럼들 (No, 병의원코드, 사업자등록번호)
        if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        
        // 숫자 형식 적용 (처방건수, 처방액, 증빙파일)
        if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
          cell.numFmt = '#,##0'
        }
      })
    })

    // 합계 행 추가
    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      '',
      '합계',
      totalPerformanceCount.value,
      totalPrescriptionAmount.value,
      totalEvidenceFilesCount.value
    ])

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

    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 8 },  // No
      { width: 12 }, // 병의원코드
      { width: 32 }, // 병의원명
      { width: 16 }, // 사업자등록번호
      { width: 64 }, // 주소
      { width: 12 }, // 처방건수
      { width: 16 }, // 처방액
      { width: 12 }  // 증빙파일
    ]

    // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
    for (let row = 1; row <= worksheet.rowCount; row++) {
      for (let col = 1; col <= 8; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      }
    }

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

  } catch (err) {
    console.error('엑셀 다운로드 오류:', err)
    alert('엑셀 다운로드 중 오류가 발생했습니다.')
  }
}

// 전달사항 관련 함수들
async function openNoticeModal(isManualClick = false) {
  if (!selectedSettlementMonth.value || !currentSettlementMonthId.value) {
    alert('정산월을 선택해주세요.');
    return;
  }
  
  // 수동 클릭이 아닌 경우에만 사용자 설정 확인 (자동 표시 시에만 숨김 처리)
  if (!isManualClick) {
    const shouldHide = await getNoticeModalHidePreference('performance', currentSettlementMonthId.value);
    if (shouldHide) {
      return; // 모달을 표시하지 않음
    }
  }
  
  try {
    const { data, error } = await supabase
      .from('settlement_months')
      .select('notice')
      .eq('settlement_month', selectedSettlementMonth.value)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('전달사항 조회 오류:', error);
      alert('전달사항을 불러오는 중 오류가 발생했습니다.');
      return;
    }
    
    noticeContent.value = data?.notice || '';
    
    // 사용자의 이전 설정 상태를 체크박스에 반영 (자동/수동 모두)
    const shouldHide = await getNoticeModalHidePreference('performance', currentSettlementMonthId.value);
    hideNoticeModal.value = shouldHide;
    
    showNoticeModal.value = true;
  } catch (err) {
    console.error('전달사항 조회 오류:', err);
    alert('전달사항을 불러오는 중 오류가 발생했습니다.');
  }
}

async function closeNoticeModal() {
  // 새로운 심플한 체크 로직 적용
  await setNoticeModalHidePreference('performance', hideNoticeModal.value, currentSettlementMonthId.value);
  
  showNoticeModal.value = false;
  noticeContent.value = '';
  hideNoticeModal.value = false; // 체크박스 초기화
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

.btn-notice-filter {
    background-color: var(--gray-100);
    color: var(--text-dark);
    border: 1px solid var(--gray-500);
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.btn-notice-filter:hover {
    background-color: var(--gray-200);
    color: var(--text-dark);
    border: 1px solid var(--gray-500);
}

</style>
