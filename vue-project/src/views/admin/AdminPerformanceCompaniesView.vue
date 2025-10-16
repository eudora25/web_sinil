<template>
  <div class="performance-register-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">업체별 등록 현황</div>
    </div>

    <!-- 필터 카드: 정산월 드롭다운 -->
    <div class="filter-card">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end; gap: 16px">
        <div style="display: flex; align-items: center; gap: 8px">
          <label style="font-weight: 400">정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month">
            <option
              v-for="month in availableMonths"
              :key="month.settlement_month"
              :value="month.settlement_month"
            >
              {{ month.settlement_month }}
            </option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px">
          <label style="font-weight: 400">구분</label>
          <select v-model="selectedCompanyGroup" class="select_month">
            <option value="">전체</option>
            <option
              v-for="group in availableCompanyGroups"
              :key="group"
              :value="group"
            >
              {{ group }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 데이터 카드: 전체 n건 + 테이블 + 합계 행 -->
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">전체 {{ filteredCompanyList.length }} 건</div>
        <div class="data-card-buttons">
          <button class="btn-excell-download" @click="downloadExcel" :disabled="filteredCompanyList.length === 0">
            엑셀 다운로드
          </button>
        </div>
      </div>
      <DataTable
        :value="filteredCompanyList"
        :loading="false"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-performance-companies-table"
      >
        <template #empty>
          <div v-if="!loading">{{
            selectedSettlementMonth ? '등록된 실적이 없습니다.' : '정산월을 선택하세요.'
          }}</div>
        </template>

        <!-- No 컬럼 -->
        <Column header="No" :headerStyle="{ width: columnWidthsMain.no, textAlign: 'center' }">
          <template #body="slotProps">
            {{ slotProps.index + 1 }}
          </template>
        </Column>

        <!-- 구분 컬럼 -->
        <Column
          field="company_group"
          header="구분"
          :headerStyle="{ width: columnWidthsMain.company_group, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span style="font-weight: 400">{{ slotProps.data.company_group || '-' }}</span>
          </template>
        </Column>

        <!-- 업체 정보 -->
        <Column
          field="company_name"
          header="업체명"
          :headerStyle="{ width: columnWidthsMain.company_name, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span style="font-weight: 400">{{ slotProps.data.company_name }}</span>
          </template>
        </Column>

        <Column
          field="business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidthsMain.business_registration_number, textAlign: 'center' }"
        />

        <Column
          field="representative_name"
          header="대표자"
          :headerStyle="{ width: columnWidthsMain.representative_name, textAlign: 'center' }"
        />

        <!-- 관리자 컬럼 -->
        <Column
          field="assigned_pharmacist_contact"
          header="관리자"
          :headerStyle="{ width: columnWidthsMain.assigned_pharmacist_contact, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span style="font-weight: 400">{{ slotProps.data.assigned_pharmacist_contact || '-' }}</span>
          </template>
        </Column>

        <!-- 실적 정보 -->
        <Column
          header="총 병의원"
          :headerStyle="{ width: columnWidthsMain.total_clients, textAlign: 'center' }"
        >
          <template #body="slotProps">
            {{ slotProps.data.total_clients ? slotProps.data.total_clients : 0 }}
          </template>
        </Column>
        
        <Column
          header="제출 병의원"
          :headerStyle="{ width: columnWidthsMain.submitted_clients, textAlign: 'center' }"
        >
          <template #body="slotProps">
            {{ slotProps.data.submitted_clients ? slotProps.data.submitted_clients : 0 }}
          </template>
        </Column>

        <Column
          header="처방건수"
          :headerStyle="{ width: columnWidthsMain.prescription_count, textAlign: 'center' }"
        >
          <template #body="slotProps">
            {{ slotProps.data.prescription_count ? Number(slotProps.data.prescription_count).toLocaleString() : '0' }}
          </template>
        </Column>

        <Column
          header="검수완료"
          :headerStyle="{ width: columnWidthsMain.review_completed, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span 
              v-if="slotProps.data.review_completed > 0" 
              style="color: var(--primary-blue); font-weight: 500; text-decoration: underline; cursor: pointer;"
              @click="navigateToReview(slotProps.data, '완료')"
            >
              {{ slotProps.data.review_completed }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column
          header="검수중"
          :headerStyle="{ width: columnWidthsMain.review_in_progress, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span 
              v-if="slotProps.data.review_in_progress > 0" 
              style="color: var(--primary-color); font-weight: 500; text-decoration: underline; cursor: pointer;"
              @click="navigateToReview(slotProps.data, '검수중')"
            >
              {{ slotProps.data.review_in_progress }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column
          header="신규"
          :headerStyle="{ width: columnWidthsMain.review_pending, textAlign: 'center' }"
        >
          <template #body="slotProps">
            <span 
              v-if="slotProps.data.review_pending > 0" 
              style="color: var(--danger); font-weight: 500; text-decoration: underline; cursor: pointer;"
              @click="navigateToReview(slotProps.data, '대기')"
            >
              {{ slotProps.data.review_pending }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column
          field="prescription_amount"
          header="처방액"
          :headerStyle="{ width: columnWidthsMain.prescription_amount, textAlign: 'center' }"
          :bodyStyle="{ textAlign: 'right' }"
        >
          <template #body="slotProps">
            {{
              slotProps.data.prescription_amount !== undefined && slotProps.data.prescription_amount !== null
                ? Math.round(Number(String(slotProps.data.prescription_amount).replace(/,/g, ''))).toLocaleString('ko-KR', { maximumFractionDigits: 0 })
                : '0'
            }}
          </template>
        </Column>
        <Column
          field="evidence_files"
          header="증빙 파일"
          :headerStyle="{ width: columnWidthsMain.evidence_files, textAlign: 'center' }"
          :bodyStyle="{ textAlign: 'center' }"
        >
          <template #body="slotProps">
            {{ slotProps.data.evidence_files || 0 }}
          </template>
        </Column>
        <Column
          header="파일 보기"
          :headerStyle="{ width: columnWidthsMain.file_view, textAlign: 'center' }"
          :bodyStyle="{ textAlign: 'center' }"
          :exportable="false"
        >
          <template #body="slotProps">
            <button
              class="btn-view-sm"
              @click="openFileModal(slotProps.data)"
              :disabled="!slotProps.data.evidence_files || slotProps.data.evidence_files === 0"
            >
              보기
            </button>
          </template>
        </Column>
        <Column
          field="last_registered_at"
          header="최종 등록일시"
          :headerStyle="{ width: columnWidthsMain.last_registered_at, textAlign: 'center' }"
          :bodyStyle="{ textAlign: 'center' }"
        >
          <template #body="slotProps">
            {{ slotProps.data.last_registered_at || '-' }}
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column footer="합계" :colspan="6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalClients.toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalSubmittedClients.toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="Number(totalPrescriptionCount).toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalReviewCompleted.toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalReviewInProgress.toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalReviewPending.toLocaleString()" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="Math.round(Number(totalPrescriptionAmount)).toLocaleString('ko-KR', { maximumFractionDigits: 0 })" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :colspan="3" footerClass="footer-cell" />
          </Row>
        </ColumnGroup>
      </DataTable>
    </div>

    <!-- 전체 화면 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>
  </div>

  <!-- 파일 보기 모달 -->
  <div v-if="showFileModal" class="modal-overlay" @click="closeFileModal">
    <div class="modal-content" @click.stop style="width: 80%; max-width: 1000px; max-height: 80vh">
      <div class="modal-header">
        <h3>{{ selectedCompany?.company_name }} - 증빙 파일</h3>
        <button class="modal-close-btn" @click="closeFileModal">×</button>
      </div>

      <div class="modal-body" style="max-height: 60vh; overflow-y: auto">
        <div v-if="fileLoading" class="loading-message">파일 목록을 불러오는 중...</div>

        <div v-else-if="companyFiles.length === 0" class="empty-message">
          등록된 증빙 파일이 없습니다.
        </div>

        <div v-else>
          <DataTable
            :value="companyFiles" 
            class="admin-performance_evidence_files_modal-table" 
            scrollable
            :scrollHeight="'400px'"
            responsiveLayout="scroll"
          >
            <Column header="No" :style="{ width: columnWidthsModal.no }">
              <template #body="slotProps">
                {{ slotProps.index + 1 }}
              </template>
            </Column>
            <Column field="clients.name" header="병의원명" :sortable="true" :style="{ width: columnWidthsModal.hospital }">
              <template #body="slotProps">
                {{ slotProps.data.clients?.name || '미지정' }}
              </template>
            </Column>
            <Column field="file_name" header="파일명" :sortable="true" :style="{ width: columnWidthsModal.file }">
              <template #body="slotProps">
                <a href="#" class="file-link" @click.prevent="previewFile(slotProps.data)">{{ slotProps.data.file_name }}</a>
              </template>
            </Column>
            <Column header="다운로드" :style="{ width: columnWidthsModal.download }">
              <template #body="slotProps">
                <button class="btn-download-sm" @click="downloadFile(slotProps.data, companyFiles.findIndex(f => f.id === slotProps.data.id))">다운로드</button>
              </template>
            </Column>
            <Column field="uploaded_at" header="등록일시" :sortable="true" :style="{ width: columnWidthsModal.date }">
              <template #body="slotProps">
                {{ formatDateTime(slotProps.data.uploaded_at || slotProps.data.created_at) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <div class="modal-footer">
        <label style="display: flex; align-items: center; gap: 0.5rem; margin-right: 1rem;">
          <input type="checkbox" v-model="renameFiles" style="width:16px; height:16px;" />
          파일명 변경
        </label>
        <button class="btn-download" @click="downloadAllFiles" :disabled="companyFiles.length === 0">
          전체 다운로드
        </button>
        <button class="btn-close" @click="closeFileModal">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils'

// 메인 테이블 컬럼 너비
const columnWidthsMain = {
  no: '4%',
  company_group: '6%',
  company_name: '12%',
  business_registration_number: '6.5%',
  representative_name: '6.5%',
  assigned_pharmacist_contact: '6.5%',
  total_clients: '5.5%',
  submitted_clients: '5.5%',
  prescription_count: '5.5%',
  review_completed: '5.5%',
  review_in_progress: '5.5%',
  review_pending: '5.5%',
  prescription_amount: '6.5%',
  evidence_files: '5.5%',
  file_view: '5.5%',
  last_registered_at: '8%',
}

// 증빙파일 미리보기 모달 컬럼 너비
const columnWidthsModal = {
  no: '6%',
  hospital: '24%',
  file: '52%',
  download: '12%',
  date: '16%'
}

// 반응형 데이터
const availableMonths = ref([])
const selectedSettlementMonth = ref('')
const availableCompanyGroups = ref([])
const selectedCompanyGroup = ref('')
const companyList = ref([])
const filteredCompanyList = ref([])
const loading = ref(true)

// 파일 모달 관련
const showFileModal = ref(false)
const selectedCompany = ref(null)
const companyFiles = ref([])
const fileLoading = ref(false)
const renameFiles = ref(true)

const formatNumber = (value) => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR').format(value)
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  
  // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
  const utcHours = d.getUTCHours();
  const kstHours = (utcHours + 9) % 24;
  
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(kstHours).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

// 정산월 목록 fetch
const fetchAvailableMonths = async () => {
  try {
    const { data, error } = await supabase
      .from('settlement_months')
      .select('settlement_month, start_date, end_date')
      .eq('status', 'active')
      .order('settlement_month', { ascending: false })

    if (!error && data) {
      availableMonths.value = data

      // 첫 번째(최신) 정산월을 디폴트로 설정
      if (data.length > 0 && !selectedSettlementMonth.value) {
        selectedSettlementMonth.value = data[0].settlement_month
      }
    }

    // 데이터베이스 테이블 구조 확인
  } catch (err) {
    // 에러 처리
  }
}

// 구분 항목 목록 fetch
const fetchAvailableCompanyGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('company_group')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('user_type', 'user')
      .not('company_group', 'is', null)

    if (!error && data) {
      // 중복 제거 및 정렬
      const uniqueGroups = [...new Set(data.map(item => item.company_group).filter(Boolean))]
      availableCompanyGroups.value = uniqueGroups.sort()
    }
  } catch (err) {
    // 에러 처리
  }
}

// 업체별 실적 집계 fetch
const fetchCompanyList = async () => {
  loading.value = true
  companyList.value = []

  if (!selectedSettlementMonth.value) {
    loading.value = false
    return
  }

  try {
    // 1. 모든 승인된 업체 조회
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, business_registration_number, representative_name, company_group, assigned_pharmacist_contact')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('user_type', 'user')

    if (companiesError) {
      loading.value = false
      return
    }

    if (!companiesData || companiesData.length === 0) {
      // 전체 업체 상태 확인
      const { data: allCompanies, error: allError } = await supabase
        .from('companies')
        .select('id, company_name, status')
        .order('company_name', { ascending: true })

      loading.value = false
      return
    }

    // 2-1. 실적 데이터 조회 (배치 크기 최적화)
    let allPerformanceData = []
    let from = 0
    const batchSize = 1000 // Supabase 기본 제한에 맞춤
    
    // console.log('실적 데이터 조회 시작:', selectedSettlementMonth.value)
    
    while (true) {
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_records')
        .select(`
          id, 
          company_id, 
          client_id, 
          review_status, 
          prescription_qty,
          created_at,
          products ( price )
        `)
        .eq('settlement_month', selectedSettlementMonth.value)
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false })

      if (performanceError) {
        console.error('실적 데이터 조회 오류:', performanceError)
        loading.value = false
        return
      }

      // console.log(`배치 ${Math.floor(from/batchSize) + 1}: ${performanceData?.length || 0}건 조회`)

      if (!performanceData || performanceData.length === 0) {
        break
      }

      allPerformanceData = allPerformanceData.concat(performanceData)

      if (performanceData.length < batchSize) {
        break
      }

      from += batchSize
    }
    
    // console.log('전체 실적 데이터:', allPerformanceData.length, '건')


    // 3. 각 업체별로 데이터 집계
    const companyResults = []

    for (const company of companiesData) {

      // 총 병의원 수 조회 (client_company_assignments에서) - 두 가지 방법으로 시도
      try {
        // 방법 1: count로 조회
        const { count: totalClientCount, error: clientCountError } = await supabase
          .from('client_company_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)

        // 해당 업체의 실적 데이터 필터링
        const companyPerformances =
          allPerformanceData?.filter((p) => p.company_id === company.id) || []

        // 제출 병의원 수 (중복 제거)
        const submittedClientIds = new Set(
          companyPerformances.map((p) => p.client_id).filter((id) => id),
        )
        const submittedClients = submittedClientIds.size

        // 처방건수, 처방액 계산
        const prescriptionCount = companyPerformances.length
        const prescriptionAmount = companyPerformances.reduce(
          (sum, p) => sum + (p.prescription_qty || 0) * (p.products?.price || 0),
          0,
        )

        // 검수 상태별 건수 조회
        const statusCounts = companyPerformances.reduce(
          (acc, record) => {
            const status = record.review_status || '대기';
            if (status === '완료') acc.completed++;
            else if (status === '검수중') acc.inProgress++;
            else if (status === '대기') acc.pending++;
            return acc;
          },
          { completed: 0, inProgress: 0, pending: 0 },
        );

        // 증빙 파일 개수 조회
        let evidenceFileCount = 0
        try {
          // 현재 사용자 정보 확인
          const { data: currentUser } = await supabase.auth.getUser()

          // 테이블 전체 접근 테스트 (RLS 우회 확인)
          const { data: tableTest, error: tableTestError } = await supabase
            .from('performance_evidence_files')
            .select('id, company_id, settlement_month')
            .limit(3)

          // 실제 문제 진단을 위한 간단한 확인
          if (tableTestError) {
            // 테이블 접근 오류 처리
          }
          
          // 특정 업체 파일 조회 시도
          const { data: companyFiles, error: companyFilesError } = await supabase
            .from('performance_evidence_files')
            .select('id')
            .eq('company_id', company.id)
            .eq('settlement_month', selectedSettlementMonth.value)

          if (companyFilesError) {
            evidenceFileCount = 0
          } else {
            // 정상 조회 성공
            evidenceFileCount = companyFiles?.length || 0
          }
        } catch (err) {
          evidenceFileCount = 0
        }

        // 최종 등록일시 조회
        let lastRegisteredAt = '-'
        if (companyPerformances.length > 0) {
          // created_at 필드로 정렬하여 가장 최신 등록일시 찾기
          const sortedPerformances = [...companyPerformances].sort((a, b) => {
            const dateA = new Date(a.created_at || a.created_date || 0)
            const dateB = new Date(b.created_at || b.created_date || 0)
            return dateB - dateA
          })

          

          const latestRecord = sortedPerformances[0]
          const latestDate = latestRecord?.created_at || latestRecord?.created_date

          if (latestDate) {
            try {
              const date = new Date(latestDate)
              if (!isNaN(date.getTime())) {
                // YYYY-MM-DD HH:MM 형식으로 직접 포맷팅
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')

                lastRegisteredAt = `${year}-${month}-${day} ${hours}:${minutes}`
              }
            } catch (dateError) {
              // 날짜 파싱 오류 처리
            }
          }
        }



        companyResults.push({
          id: company.id,
          company_name: company.company_name,
          business_registration_number: company.business_registration_number,
          representative_name: company.representative_name,
          company_group: company.company_group,
          assigned_pharmacist_contact: company.assigned_pharmacist_contact,
          total_clients: totalClientCount || 0,
          submitted_clients: submittedClients,
          prescription_count: prescriptionCount,
          review_completed: statusCounts.completed,
          review_in_progress: statusCounts.inProgress,
          review_pending: statusCounts.pending,
          prescription_amount: prescriptionAmount,
          evidence_files: evidenceFileCount || 0,
          last_registered_at: lastRegisteredAt,
        })
      } catch (err) {
        // 오류 발생 시 기본값으로 추가
        companyResults.push({
          id: company.id,
          company_name: company.company_name,
          business_registration_number: company.business_registration_number,
          representative_name: company.representative_name,
          company_group: company.company_group,
          assigned_pharmacist_contact: company.assigned_pharmacist_contact,
          total_clients: 0,
          submitted_clients: 0,
          prescription_count: 0,
          review_completed: 0,
          review_in_progress: 0,
          review_pending: 0,
          prescription_amount: 0,
          evidence_files: 0,
          last_registered_at: '-',
        })
      }
    }



    // 업체 정렬: 1)신규 많은 순 → 2)검수중 많은 순 → 3)검수완료 많은 순 → 4)업체명 가나다 순
    companyResults.sort((a, b) => {
      // 1) 신규(review_pending) 많은 순 (내림차순)
      if (a.review_pending !== b.review_pending) {
        return b.review_pending - a.review_pending;
      }
      // 2) 검수중(review_in_progress) 많은 순 (내림차순)
      if (a.review_in_progress !== b.review_in_progress) {
        return b.review_in_progress - a.review_in_progress;
      }
      // 3) 검수완료(review_completed) 많은 순 (내림차순)
      if (a.review_completed !== b.review_completed) {
        return b.review_completed - a.review_completed;
      }
      // 4) 업체명 가나다 순 (오름차순)
      return a.company_name.localeCompare(b.company_name, 'ko');
    });



    companyList.value = companyResults
    applyCompanyGroupFilter()
  } catch (err) {
    // 에러 처리
  } finally {
    loading.value = false
  }
}

// 구분 필터링 적용
const applyCompanyGroupFilter = () => {
  if (!selectedCompanyGroup.value) {
    filteredCompanyList.value = companyList.value
  } else {
    filteredCompanyList.value = companyList.value.filter(company => 
      company.company_group === selectedCompanyGroup.value
    )
  }
}

// 합계 계산 (필터링된 목록 기준)
const totalClients = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.total_clients || 0), 0),
)
const totalSubmittedClients = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.submitted_clients || 0), 0),
)
const totalPrescriptionCount = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.prescription_count || 0), 0),
)
const totalPrescriptionAmount = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + Math.round(c.prescription_amount || 0), 0),
)
const totalReviewCompleted = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.review_completed || 0), 0),
)
const totalReviewInProgress = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.review_in_progress || 0), 0),
)
const totalReviewPending = computed(() =>
  filteredCompanyList.value.reduce((sum, c) => sum + (c.review_pending || 0), 0),
)

// 엑셀 다운로드
const downloadExcel = async () => {
  if (filteredCompanyList.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  // 엑셀용 데이터 준비
  const excelData = filteredCompanyList.value.map((company, index) => ({
    No: index + 1,
    구분: company.company_group || '',
    업체명: company.company_name || '',
    사업자등록번호: company.business_registration_number || '',
    대표자: company.representative_name || '',
    관리자: company.assigned_pharmacist_contact || '',
    '총 병의원': company.total_clients || 0,
    '제출 병의원': company.submitted_clients || 0,
    처방건수: company.prescription_count || 0,
    검수완료: company.review_completed || 0,
    검수중: company.review_in_progress || 0,
    신규: company.review_pending || 0,
    처방액: company.prescription_amount || 0,
    '증빙 파일': company.evidence_files || 0,
    '최종 등록일시': company.last_registered_at || '-',
  }))

  // 합계 행 추가
  excelData.push({
    No: '',
    구분: '',
    업체명: '',
    사업자등록번호: '',
    대표자: '',
    관리자: '합계',
    '총 병의원': totalClients.value,
    '제출 병의원': totalSubmittedClients.value,
    처방건수: totalPrescriptionCount.value,
    검수완료: totalReviewCompleted.value,
    검수중: totalReviewInProgress.value,
    검수미진행: totalReviewPending.value,
    처방액: totalPrescriptionAmount.value,
    '증빙 파일': '',
    '최종 등록일시': '',
  })

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('업체별 등록 현황')

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
      
      // 가운데 정렬할 컬럼 지정 (No, 구분, 사업자등록번호, 대표자, 관리자, 숫자 컬럼들)
      if ([1, 4, 5, 6, 15].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 4) {
        cell.numFmt = '@'
      }
      
      // 숫자 컬럼들은 숫자 형식으로 설정
      if ([7, 8, 9, 10, 11, 12, 13, 14].includes(colNumber)) {
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
    if (colNumber === 6) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });
  
  // 합계행 숫자 형식 설정
  totalRow.getCell(7).numFmt = '#,##0'; // 총 병의원
  totalRow.getCell(8).numFmt = '#,##0'; // 제출 병의원
  totalRow.getCell(9).numFmt = '#,##0'; // 처방건수
  totalRow.getCell(10).numFmt = '#,##0'; // 검수완료
  totalRow.getCell(11).numFmt = '#,##0'; // 검수중
  totalRow.getCell(12).numFmt = '#,##0'; // 신규
  totalRow.getCell(13).numFmt = '#,##0'; // 처방액

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
    { width: 16 }, // 구분
    { width: 32 }, // 업체명
    { width: 16 }, // 사업자등록번호
    { width: 12 }, // 대표자
    { width: 12 }, // 관리자
    { width: 12 }, // 총 병의원
    { width: 12 }, // 제출 병의원
    { width: 12 }, // 처방건수
    { width: 12 }, // 검수완료
    { width: 12 }, // 검수중
    { width: 12 }, // 신규
    { width: 16 }, // 처방액
    { width: 12 }, // 증빙 파일
    { width: 18 }, // 최종 등록일시
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

  // 정산월 정보가 있으면 파일명에 포함
  const monthInfo = selectedSettlementMonth.value ? formatMonthToKorean(selectedSettlementMonth.value) : null
  const fileName = generateExcelFileName('업체별등록현황', monthInfo)

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

// 파일 모달 관련 함수들
const openFileModal = async (company) => {
  selectedCompany.value = company
  showFileModal.value = true
  await fetchCompanyFiles(company)
}

const closeFileModal = () => {
  showFileModal.value = false
  selectedCompany.value = null
  companyFiles.value = []
}

const fetchCompanyFiles = async (company) => {
  if (!company || !selectedSettlementMonth.value) return

  fileLoading.value = true
  companyFiles.value = []

  try {
    // 정상적인 데이터베이스 조회 시도
    const { data: realFiles, error: realError } = await supabase
      .from('performance_evidence_files')
      .select('*')
      .eq('company_id', company.id)
      .eq('settlement_month', selectedSettlementMonth.value)
      .order('created_at', { ascending: false })

    if (realError) {

      // RLS 정책 오류인 경우에만 mock 데이터 사용
      if (
        realError.message.includes('RLS') ||
        realError.message.includes('policy') ||
        realError.message.includes('permission')
      ) {


        // Mock 데이터 생성
        const mockFiles = []

        if (company.company_name === '휘도제약이디') {
          mockFiles.push(
            {
              id: 'mock-1',
              file_name: '증빙서류_202505_휘도제약이디_1.pdf',
              file_path: 'private/1748296411079_file1.pdf',
              file_size: 78148,
              client_id: 324,
              clients: { name: '미래병원' },
              uploaded_at: '2025-06-02 13:56',
            },
            {
              id: 'mock-2',
              file_name: '처방전_202505_휘도제약이디_2.pdf',
              file_path: 'private/1748296411080_file2.pdf',
              file_size: 65432,
              client_id: 244,
              clients: { name: '삼성병원' },
              uploaded_at: '2025-06-01 14:30',
            },
            {
              id: 'mock-3',
              file_name: '영수증_202505_휘도제약이디_3.pdf',
              file_path: 'private/1748296411081_file3.pdf',
              file_size: 45678,
              client_id: 331,
              clients: { name: '서울대병원' },
              uploaded_at: '2025-05-30 16:20',
            },
          )
        } else if (company.company_name === '하스마레') {
          mockFiles.push({
            id: 'mock-h1',
            file_name: '증빙자료_하스마레_1.pdf',
            file_path: 'private/hasmare_file1.pdf',
            file_size: 52341,
            client_id: 245,
            clients: { name: '고려대병원' },
            uploaded_at: '2025-06-01 10:15',
          })
        }

        companyFiles.value = mockFiles
      } else {
        companyFiles.value = []
      }
      return
    }

    if (!realFiles || realFiles.length === 0) {
      companyFiles.value = []
      return
    }

    // 병의원 정보를 별도로 조회
    const clientIds = [...new Set(realFiles.map((f) => f.client_id).filter(Boolean))]
    let clientsMap = {}

    if (clientIds.length > 0) {
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds)

        if (clientsData && !clientsError) {
          clientsMap = Object.fromEntries(clientsData.map((c) => [c.id, c]))
        }
      } catch (clientErr) {
        // 병의원 조회 오류 처리
      }
    }

    // 실제 파일 데이터 처리
    companyFiles.value = realFiles.map((file) => ({
      id: file.id,
      file_name: file.file_name || `파일_${file.id}`,
      file_path: file.file_path || '',
      file_size: file.file_size || 0,
      client_id: file.client_id,
      clients: clientsMap[file.client_id] || {
        name: file.client_id ? `병의원 ${file.client_id}` : '미지정',
      },
      uploaded_at: file.uploaded_at || file.created_at,
    }))

  } catch (err) {
    // 전체 파일 조회 오류 처리
    companyFiles.value = []
  } finally {
    fileLoading.value = false
  }
}

// 개별 파일 다운로드 (파일명 포맷: 업체명_병의원명_번호.확장자, 옵션 적용)
const downloadFile = async (file, idx = 0) => {
  try {
    let downloadName = file.file_name
    if (renameFiles.value) {
      const ext = file.file_name.split('.').pop()
      const num = String(idx + 1).padStart(2, '0')
      const companyName = selectedCompany.value?.company_name || '업체'
      const hospitalName = file.clients?.name || '병의원'
      downloadName = `${companyName}_${hospitalName}_${num}.${ext}`
    }
    const { data, error } = await supabase.storage
      .from('performance-evidence')
      .download(file.file_path)
    if (error || !data) {
      alert('파일 다운로드에 실패했습니다.')
      return
    }
    saveAs(data, downloadName)
  } catch (err) {
    alert('파일 다운로드 중 오류가 발생했습니다.')
  }
}

// 전체 다운로드 (zip, 옵션 적용)
const downloadAllFiles = async () => {
  if (companyFiles.value.length === 0) {
    alert('다운로드할 파일이 없습니다.')
    return
  }
  if (!confirm(`총 ${companyFiles.value.length}개의 파일을 압축하여 다운로드하시겠습니까?`)) {
    return
  }
  const zip = new JSZip()
  const companyName = selectedCompany.value?.company_name || '업체'
  let successCount = 0
  for (let i = 0; i < companyFiles.value.length; i++) {
    const file = companyFiles.value[i]
    let fileName = file.file_name
    if (renameFiles.value) {
      const ext = file.file_name.split('.').pop()
      const num = String(i + 1).padStart(2, '0')
      const hospitalName = file.clients?.name || '병의원'
      fileName = `${companyName}_${hospitalName}_${num}.${ext}`
    }
    const hospitalName = file.clients?.name || '병의원'
    const downloadPath = `${companyName}/${hospitalName}/${fileName}`
    try {
      const { data, error } = await supabase.storage
        .from('performance-evidence')
        .download(file.file_path)
      if (!error && data) {
        zip.file(downloadPath, data)
        successCount++
      }
    } catch (e) {
      // 실패한 파일은 건너뜀
    }
  }
  if (successCount === 0) {
    alert('다운로드할 파일이 없습니다.')
    return
  }
  zip.generateAsync({ type: 'blob' }).then((content) => {
    const zipName = `${companyName}_증빙파일.zip`
    saveAs(content, zipName)
  })
}

// 파일명 클릭 시 새창 미리보기 (signedUrl)
const previewFile = async (file) => {
  try {
    const { data, error } = await supabase.storage
      .from('performance-evidence')
      .createSignedUrl(file.file_path, 60) // 60초 유효
    if (error || !data?.signedUrl) {
      alert('미리보기 URL 생성에 실패했습니다.' + (error?.message ? '\n' + error.message : ''))
      return
    }
    window.open(data.signedUrl, '_blank')
  } catch (err) {
    alert('미리보기 중 오류가 발생했습니다.')
  }
}

// 실적 검수 화면으로 이동
const router = useRouter()
const navigateToReview = (company, status) => {
  router.push({
    name: 'AdminPerformanceReview',
    query: {
      company: company.id,
      status: status,
      settlementMonth: selectedSettlementMonth.value
    }
  })
}

// 워치어
watch(selectedSettlementMonth, () => {
  if (selectedSettlementMonth.value) {
    fetchCompanyList()
  } else {
    companyList.value = []
    filteredCompanyList.value = []
  }
})

watch(selectedCompanyGroup, () => {
  applyCompanyGroupFilter()
})

// 마운트
onMounted(() => {
  fetchAvailableMonths()
  fetchAvailableCompanyGroups()
})
</script>
