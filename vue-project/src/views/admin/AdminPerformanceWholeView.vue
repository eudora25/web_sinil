<template>
  <div class="performance-register-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">전체 등록 현황</div>
    </div>

    <!-- 필터 카드: 정산월, 처방월, 업체, 병의원 드롭다운 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month.settlement_month" :value="month.settlement_month">{{ month.settlement_month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>처방월</label>
          <select v-model="prescriptionOffset" class="select_month">
            <option v-for="opt in prescriptionOptions" :key="opt.value" :value="opt.value">{{ opt.month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>구분</label>
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
            <div v-if="showCompanyDropdown && filteredCompanies.length === 0 && companySearchText.trim()" class="company-dropdown">
              <div class="company-dropdown-item no-results">검색 결과가 없습니다</div>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>병의원</label>
          <div class="hospital-search-container" style="position: relative;">
            <input
              v-model="hospitalSearchText"
              @input="handleHospitalSearch"
              @focus="handleHospitalFocus"
              @blur="delayedHideHospitalDropdown"
              @keydown="handleHospitalKeydown"
              :placeholder="selectedHospitalId === '' ? '병의원명을 입력하세요...' : ''"
              class="select_240px"
              autocomplete="off"
            />
            <div v-if="showHospitalDropdown && filteredHospitals.length > 0" class="hospital-dropdown">
              <!-- 전체 옵션 -->
              <div
                :class="['hospital-dropdown-item', { 
                  selected: selectedHospitalId === '', 
                  highlighted: hospitalHighlightedIndex === 0 
                }]"
                @mousedown.prevent="selectHospital({ id: '', name: '전체' })"
              >
                전체
              </div>
              <!-- 병의원 목록 -->
              <div
                v-for="(hospital, index) in filteredHospitals"
                :key="hospital.id"
                :class="['hospital-dropdown-item', { 
                  selected: selectedHospitalId === hospital.id,
                  highlighted: hospitalHighlightedIndex === index + 1
                }]"
                @mousedown.prevent="selectHospital(hospital)"
              >
                {{ hospital.name }}
              </div>
            </div>
            <div v-if="showHospitalDropdown && filteredHospitals.length === 0 && hospitalSearchText.trim()" class="hospital-dropdown">
              <div class="hospital-dropdown-item no-results">검색 결과가 없습니다.</div>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-weight:400;">검수</label>
          <select v-model="selectedReviewStatus" class="select_100px">
            <option value="">- 전체 -</option>
            <option value="완료">완료</option>
            <option value="검수중">검수중</option>
            <option value="대기">신규</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 데이터 카드: 전체 n건 + 테이블 + 합계 행 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0;">
        <div class="total-count-display">전체 {{ displayRows.length }} 건</div>
        <div class="data-card-buttons">
          <button class="btn-excell-download" @click="downloadExcel" :disabled="displayRows.length === 0">
            엑셀 다운로드
          </button>
        </div>
      </div>
      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable 
          :value="displayRows" 
          :loading="false"
          scrollable 
          scrollHeight="calc(100vh - 220px)"
          scrollDirection="both"
          class="admin-performance-whole-table"
          :paginator="true"
          :rows="100"
          :rowsPerPageOptions="[100, 200, 500, 1000]"

          :pt="{
            wrapper: { style: 'min-width: 2400px;' },
            table: { style: 'min-width: 2400px;' }
          }"
          @page="onPageChange"
        >
          <template #empty>
            <div v-if="!loading">등록된 실적이 없습니다.</div>
          </template>
          
          <Column header="No" :headerStyle="{ width: columnWidths.no }" :frozen="true">
            <template #body="slotProps">
              {{ slotProps.index + currentPageFirstIndex + 1 }}
            </template>
          </Column>
          <Column header="검수" :headerStyle="{ width: columnWidths.review_status }" :frozen="true">
            <template #body="slotProps">
              <span v-if="slotProps.data.review_status === '완료'" class="status-completed">완료</span>
              <span v-else-if="slotProps.data.review_status === '검수중'" class="status-reviewing">검수중</span>
              <span v-else-if="slotProps.data.review_status === '대기'" class="status-pending">신규</span>
              <span v-else>-</span>
            </template>
          </Column>
          <Column field="company_group" header="구분" :headerStyle="{ width: columnWidths.company_group }" :sortable="true">
            <template #body="slotProps">
              <span style="font-weight: 400;">{{ slotProps.data.company_group }}</span>
            </template>
          </Column>
          <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true" :frozen="true">
            <template #body="slotProps">
              <span style="font-weight: 400;">{{ slotProps.data.company_name }}</span>
            </template>
          </Column>
          <Column field="client_name" header="병의원명" :headerStyle="{ width: columnWidths.client_name }" :sortable="true" :frozen="true">
            <template #body="slotProps">
              <span style="font-weight: 400;">{{ slotProps.data.client_name }}</span>
            </template>
          </Column>
          <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }" :sortable="true"/>
          <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name_display }" :sortable="true"  :frozen="true"/>
          <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true"/>
          <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true"/>
          <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true"/>
          <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :sortable="true"/>
          <Column field="prescription_type" header="처방구분" :headerStyle="{ width: columnWidths.prescription_type }" :sortable="true"/>
          <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true"/>
          <Column field="created_date" header="등록일시" :headerStyle="{ width: columnWidths.created_date }" :sortable="true"/>
          <Column field="created_by" header="등록자" :headerStyle="{ width: columnWidths.created_by }" :sortable="true"/>
          <Column field="updated_date" header="수정일시" :headerStyle="{ width: columnWidths.updated_date }" :sortable="true"/>
          <Column field="updated_by" header="수정자" :headerStyle="{ width: columnWidths.updated_by }" :sortable="true"/>
          <Column field="assigned_pharmacist_contact" header="관리자" :headerStyle="{ width: columnWidths.assigned_pharmacist_contact }" :sortable="true">
            <template #body="slotProps">
              <span style="font-weight: 400;">{{ slotProps.data.assigned_pharmacist_contact }}</span>
            </template>
          </Column>
          <ColumnGroup type="footer">
            <Row>
              <Column :colspan="2" footerClass="footer-cell" :frozen="true" />
              <Column :colspan="1" footerClass="footer-cell" />
              <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" :frozen="true" />
              <Column :colspan="1" footerClass="footer-cell" />
              <Column :colspan="1" footerClass="footer-cell" :frozen="true" />
              <Column :colspan="2" footerClass="footer-cell" />
              <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :colspan="7" footerClass="footer-cell" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase';
import ExcelJS from 'exceljs';
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils';

const columnWidths = {
  no: '3%',
  review_status: '4%',
  company_group: '6%',
  company_name: '8%',
  client_name: '12%',
  prescription_month: '5%',
  product_name_display: '12%',
  insurance_code: '6%',
  price: '5%',
  prescription_qty: '6%',
  prescription_amount: '6%',
  prescription_type: '6%',
  remarks: '11%',
  created_date: '7%',
  created_by: '8%',
  updated_date: '7%',
  updated_by: '8%',
  assigned_pharmacist_contact: '5%'
};

// 반응형 데이터
const availableMonths = ref([]); // 선택 가능한 정산월 목록
const selectedSettlementMonth = ref(''); // 선택된 정산월
const selectedMonthInfo = ref(null); // 선택된 정산월 정보
const prescriptionMonth = ref('');
const prescriptionOffset = ref(0); // 0: 전체, 1: -1M, 2: -2M, 3: -3M
const prescriptionOptions = ref([]);
const loading = ref(false);
const selectedReviewStatus = ref('');
const availableCompanyGroups = ref([]); // 구분 항목 목록
const selectedCompanyGroup = ref(''); // 선택된 구분

// 페이지네이션 관련
const currentPageFirstIndex = ref(0);

// 업체 관련
const selectedCompanyId = ref(''); // 선택된 업체 ID (빈 문자열 = 전체)
const companies = ref([]); // 업체 목록 (기존 호환성)
const monthlyCompanies = ref([]); // 해당 월의 모든 승인된 업체 목록
const allCompanies = ref([]); // 모든 업체 목록
const companySearchText = ref(''); // 업체 검색 텍스트
const showCompanyDropdown = ref(false); // 업체 드롭다운 표시 여부
const filteredCompanies = ref([]); // 필터링된 업체 목록
const companyHighlightedIndex = ref(-1); // 업체 드롭다운 하이라이트 인덱스

// 병의원 관련
const selectedHospitalId = ref(''); // 빈 문자열로 초기화 (전체)
const hospitals = ref([]); // 기존 호환성
const allHospitals = ref([]); // 모든 병의원 목록
const hospitalSearchText = ref(''); // 병의원 검색 텍스트
const showHospitalDropdown = ref(false); // 병의원 드롭다운 표시 여부
const filteredHospitals = ref([]); // 필터링된 병의원 목록
const hospitalHighlightedIndex = ref(-1); // 병의원 드롭다운 하이라이트 인덱스

// 실적 데이터
const performanceRecords = ref([]); // DB에서 가져온 실적 데이터
const rawRows = ref([]);
const displayRows = computed(() => {
  let rows = rawRows.value;
  if (selectedReviewStatus.value) {
    rows = rows.filter(row => row.review_status === selectedReviewStatus.value);
  }
  return rows;
});

const companyOptions = computed(() => {
  const options = [{ id: '', company_name: '- 전체 -' }, ...monthlyCompanies.value];
  // console.log('companyOptions computed:', options);
  // console.log('monthlyCompanies.value:', monthlyCompanies.value);
  return options;
});

// 유틸리티 함수들
function getPrescriptionMonth(settlementMonth, offset) {
  if (!settlementMonth) return '';
  const [y, m] = settlementMonth.split('-');
  let mm = parseInt(m, 10) - offset;
  let yy = parseInt(y, 10);
  while (mm <= 0) { mm += 12; yy -= 1; }
  return `${yy}-${String(mm).padStart(2, '0')}`;
}

function updatePrescriptionOptions() {
  if (!selectedMonthInfo.value) {
    prescriptionOptions.value = [];
    return;
  }
  
  // "- 전체 -" 옵션을 첫 번째로 추가
  prescriptionOptions.value = [
    { value: 0, month: '- 전체 -' },
    ...([1, 2, 3, 4, 5, 6].map(offset => ({
      value: offset,
      month: getPrescriptionMonth(selectedMonthInfo.value.settlement_month, offset)
    })))
  ];
}

// 워치어
watch(selectedSettlementMonth, () => {
  const monthInfo = availableMonths.value.find(m => m.settlement_month === selectedSettlementMonth.value);
  selectedMonthInfo.value = monthInfo || null;
  updatePrescriptionOptions();
  prescriptionOffset.value = 0; // 기본값을 "- 전체 -"로 설정
  prescriptionMonth.value = ''; // 전체 선택 시 빈 값
  
  // 업체 선택 초기화
  selectedCompanyId.value = '';
  
  // 병의원 선택 초기화
  selectedHospitalId.value = '';
  
  if (selectedSettlementMonth.value) {
    fetchCompanies();
    fetchHospitals();
    fetchPerformanceRecords();
  } else {
    companies.value = [];
    monthlyCompanies.value = [];
    hospitals.value = [];
    allHospitals.value = [];
    rawRows.value = [];
    performanceRecords.value = [];
  }
});

watch(prescriptionOffset, (val) => {
  if (val === 0) {
    prescriptionMonth.value = ''; // 전체 선택 시 빈 값
  } else {
    prescriptionMonth.value = getPrescriptionMonth(selectedSettlementMonth.value, val);
  }
  
  // 업체 선택 초기화
  selectedCompanyId.value = '';
  
  // 병의원 선택 초기화
  selectedHospitalId.value = '';
  
  if (selectedSettlementMonth.value) {
    fetchCompanies();
    fetchHospitals();
    fetchPerformanceRecords();
  }
});

watch(selectedCompanyId, () => {
  // 업체가 변경되면 검색 텍스트도 업데이트
  if (selectedCompanyId.value === '') {
    companySearchText.value = '';
  } else {
    const selectedCompany = allCompanies.value.find(c => c.id === selectedCompanyId.value);
    if (selectedCompany) {
      companySearchText.value = selectedCompany.company_name;
    }
  }
  
  if (selectedSettlementMonth.value) {
    fetchPerformanceRecords();
  }
});

watch(selectedHospitalId, () => {
  // 병의원 선택이 변경되면 검색 텍스트 업데이트
  if (selectedHospitalId.value === '') {
    hospitalSearchText.value = '';
  }
  
  if (selectedSettlementMonth.value) {
    fetchPerformanceRecords();
  }
});

watch(selectedCompanyGroup, () => {
  // 구분이 변경되면 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchPerformanceRecords();
  }
});

// 데이터 fetch 함수들
async function fetchAvailableMonths() {
  try {
    const { data, error } = await supabase
      .from('settlement_months')
      .select('settlement_month, start_date, end_date')
      .order('settlement_month', { ascending: false });
    if (!error && data) {
      availableMonths.value = data;
      // 첫 번째(최신) 정산월을 디폴트로 설정
      if (data.length > 0 && !selectedSettlementMonth.value) {
        selectedSettlementMonth.value = data[0].settlement_month;
      }
    }
  } catch (err) {
    console.error('정산월 조회 오류:', err);
  }
}

// 구분 항목 목록 fetch
async function fetchAvailableCompanyGroups() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('company_group')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('user_type', 'user')
      .not('company_group', 'is', null);

    if (!error && data) {
      // 중복 제거 및 정렬
      const uniqueGroups = [...new Set(data.map(item => item.company_group).filter(Boolean))]
      availableCompanyGroups.value = uniqueGroups.sort()
    }
  } catch (err) {
    console.error('구분 항목 조회 오류:', err);
  }
}

async function fetchCompanies() {
  // console.log('fetchCompanies 호출됨, selectedSettlementMonth:', selectedSettlementMonth.value);
  
  try {
    // === 기존 방식: 해당 월에 실적을 제출한 업체들만 조회 (호환성 유지) ===
    if (selectedSettlementMonth.value) {
      let query = supabase
        .from('performance_records')
        .select(`
          company_id,
          companies!inner(*)
        `)
        .eq('settlement_month', selectedSettlementMonth.value);
      
      // 처방월 필터링 (0이 아닐 때만)
      if (prescriptionOffset.value !== 0) {
        query = query.eq('prescription_month', prescriptionMonth.value);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error('업체 조회 오류:', error);
      } else {
        // 중복 제거하여 고유한 업체들만 추출
        const uniqueCompanies = [];
        const companyIds = new Set();
        
        data?.forEach(record => {
          if (!companyIds.has(record.company_id)) {
            companyIds.add(record.company_id);
            uniqueCompanies.push({
              id: record.companies.id,
              company_name: record.companies.company_name,
              company_group: record.companies.company_group,
              assigned_pharmacist_contact: record.companies.assigned_pharmacist_contact
            });
          }
        });
        
        // 업체명으로 정렬
        companies.value = uniqueCompanies.sort((a, b) => a.company_name.localeCompare(b.company_name));
      }
    } else {
      companies.value = [];
    }
    
    // === 새로운 방식: 모든 승인된 업체를 별도로 쿼리 (정산월과 관계없이) ===
    const { data: allCompanies, error: allCompaniesError } = await supabase
      .from('companies')
      .select('id, company_name, company_group, assigned_pharmacist_contact')
      .eq('user_type', 'user')
      .eq('approval_status', 'approved')
      .order('company_name', { ascending: true });
    
    if (allCompaniesError) {
      console.error('전체 업체 조회 오류:', allCompaniesError);
      monthlyCompanies.value = [];
    } else {
      monthlyCompanies.value = allCompanies || [];
      // console.log(`전체 승인된 업체 ${monthlyCompanies.value.length}개 로드 완료:`, monthlyCompanies.value);
    }
    
  } catch (err) {
    console.error('업체 조회 예외:', err);
  }
}

async function fetchHospitals() {
  if (!selectedSettlementMonth.value) {
    hospitals.value = [];
    allHospitals.value = [];
    return;
  }
  
  try {
    // === 기존 방식: 해당 월에 실적을 제출한 병의원들만 조회 (호환성 유지) ===
    let query = supabase
      .from('performance_records')
      .select(`
        client_id,
        clients!inner(*)
      `)
      .eq('settlement_month', selectedSettlementMonth.value);
    
    // 처방월 필터링 (0이 아닐 때만)
    if (prescriptionOffset.value !== 0) {
      query = query.eq('prescription_month', prescriptionMonth.value);
    }
    
    // 업체가 선택된 경우 해당 업체의 실적만 조회
    if (selectedCompanyId.value) {
      query = query.eq('company_id', selectedCompanyId.value);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('병의원 조회 오류:', error);
      return;
    }
    
    // 중복 제거 후 병의원 정보만 추출
    const uniqueHospitals = [];
    const seenIds = new Set();
    
    data?.forEach(record => {
      if (record.clients && !seenIds.has(record.clients.id)) {
        seenIds.add(record.clients.id);
        uniqueHospitals.push({
          id: record.clients.id,
          name: record.clients.name
        });
      }
    });

    // 이름순으로 정렬
    hospitals.value = uniqueHospitals.sort((a, b) => a.name.localeCompare(b.name));
    
    // === 전체 병의원 리스트: 모든 병의원을 별도로 쿼리 (중복 제거) ===
    try {
      const { data: hospitals, error: hospitalError } = await supabase
        .from('clients')
        .select('id, name, business_registration_number')
        .order('name', { ascending: true });

      if (hospitalError) {
        console.error('전체 병의원 로딩 실패:', hospitalError);
        allHospitals.value = [];
      } else {
        // 사업자등록번호 기준으로 중복 제거 (같은 사업자등록번호 중 가장 늦게 생성된 것만 유지)
        const uniqueHospitals = [];
        const businessNumberMap = new Map();
        
        hospitals.forEach(hospital => {
          const businessNumber = hospital.business_registration_number;
          if (!businessNumber || !businessNumberMap.has(businessNumber)) {
            businessNumberMap.set(businessNumber, hospital);
            uniqueHospitals.push(hospital);
          }
        });
        
        allHospitals.value = uniqueHospitals;
        // console.log(`전체 병의원 ${hospitals.length}개 → 중복 제거 후 ${allHospitals.value.length}개 로드 완료`);
      }
    } catch (err) {
      console.error('병의원 데이터 로딩 오류:', err);
      allHospitals.value = [];
    }
    
  } catch (err) {
    console.error('병의원 조회 예외:', err);
    hospitals.value = [];
  }
}

async function fetchPerformanceRecords() {
  if (!selectedSettlementMonth.value) {
    rawRows.value = [];
    performanceRecords.value = [];
    return;
  }

  // prescriptionOffset이 0이면 전체 처방월 조회
  if (prescriptionOffset.value !== 0 && !prescriptionMonth.value) {
    rawRows.value = [];
    performanceRecords.value = [];
    return;
  }
  
  loading.value = true;
  
  try {
    let query = supabase
      .from('performance_records')
      .select(`
        id,
        review_status,
        review_action,
        prescription_month,
        prescription_qty,
        prescription_type,
        remarks,
        created_at,
        updated_at,
        registered_by,
        updated_by,
        company_id,
        client_id,
        product_id,
        companies!inner(company_name, company_group, representative_name, assigned_pharmacist_contact),
        products!inner(product_name, insurance_code, price),
        clients!inner(name)
      `)
      .eq('settlement_month', selectedSettlementMonth.value);
      
    // 처방월 필터링 (0이 아닐 때만)
    if (prescriptionOffset.value !== 0) {
      query = query.eq('prescription_month', prescriptionMonth.value);
    }
    
    // 업체 필터링
    if (selectedCompanyId.value) {
      query = query.eq('company_id', selectedCompanyId.value);
    }
    
    // 병의원 필터링
    if (selectedHospitalId.value) {
      query = query.eq('client_id', selectedHospitalId.value);
    }
    
    // 검수 상태 필터링
    if (selectedReviewStatus.value) {
      query = query.eq('review_status', selectedReviewStatus.value);
    }
    
    // 구분 필터링
    if (selectedCompanyGroup.value) {
      query = query.eq('companies.company_group', selectedCompanyGroup.value);
    }

    // === 1,000행 제한 해결: 전체 데이터 가져오기 ===
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await query
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false });
    
    if (error) {
      console.error('실적 데이터 조회 오류:', error);
      rawRows.value = [];
        loading.value = false;
      return;
    }
    
    if (!data || data.length === 0) {
        break;
      }
      
      allData = allData.concat(data);
      
      // 가져온 데이터가 batchSize보다 적으면 마지막 배치
      if (data.length < batchSize) {
        break;
      }
      
      from += batchSize;
    }
    
    if (allData.length === 0) {
      rawRows.value = [];
      loading.value = false;
      return;
    }

    const registrarIds = [...new Set(allData.map(item => item.registered_by).filter(id => id))];
    const updaterIds = [...new Set(allData.map(item => item.updated_by).filter(id => id))];
    let registrarMap = new Map();
    let updaterMap = new Map();

    if (registrarIds.length > 0) {
      const { data: registrars, error: registrarError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', registrarIds);
      
      if (registrarError) {
        console.error("등록자 정보 조회 실패:", registrarError);
      } else {
        registrars.forEach(r => registrarMap.set(r.user_id, r.company_name));
      }
    }

    if (updaterIds.length > 0) {
      const { data: updaters, error: updaterError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', updaterIds);
      
      if (updaterError) {
        console.error("수정자 정보 조회 실패:", updaterError);
      } else {
        updaters.forEach(u => updaterMap.set(u.user_id, u.company_name));
      }
    }
    
    // 데이터 변환
    let mappedData = allData.map(record => {
      // 삭제 처리된 건은 처방액을 0으로 표시
      let prescriptionAmount = 0;
      if (record.review_action !== '삭제') {
        prescriptionAmount = (record.prescription_qty || 0) * (record.products?.price || 0);
      }
      
      return {
        id: record.id,
        review_status: record.review_status || '대기',
        company_group: record.companies?.company_group || '',
        company_name: record.companies?.company_name || '',
        client_name: record.clients?.name || '',
        prescription_month: record.prescription_month || '',
        product_name_display: record.products?.product_name || '',
        insurance_code: record.products?.insurance_code || '',
        price: record.products?.price ? Number(record.products.price).toLocaleString() : '0',
        prescription_qty: record.prescription_qty ? Number(record.prescription_qty).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0',
        prescription_amount: Math.round(prescriptionAmount).toLocaleString(),
        prescription_type: record.prescription_type || '',
        remarks: record.remarks || '',
        created_date: new Date(record.created_at).toLocaleString('ko-KR', { 
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\. /g, '-').replace(/\./g, '').replace(/-(\d{2}):(\d{2})$/, ' $1:$2'),
        created_by: registrarMap.get(record.registered_by) || '관리자',
        updated_date: record.updated_at ? new Date(record.updated_at).toLocaleString('ko-KR', { 
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\. /g, '-').replace(/\./g, '').replace(/-(\d{2}):(\d{2})$/, ' $1:$2') : '',
        updated_by: record.updated_by ? (updaterMap.get(record.updated_by) || '관리자') : '',
        assigned_pharmacist_contact: record.companies?.assigned_pharmacist_contact || '',
      };
    });

    // 데이터 정렬 - 가나다순: 업체명 > 병의원명 > 제품명
    mappedData.sort((a, b) => {
      // 1순위: 업체명 가나다순
      if (a.company_name !== b.company_name) {
        return a.company_name.localeCompare(b.company_name, 'ko');
      }
      // 2순위: 병의원명 가나다순
      if (a.client_name !== b.client_name) {
        return a.client_name.localeCompare(b.client_name, 'ko');
      }
      // 3순위: 제품명 가나다순
      if (a.product_name_display !== b.product_name_display) {
        return a.product_name_display.localeCompare(b.product_name_display, 'ko');
      }
      // 4순위: 등록일시 (최신순)
      return new Date(b.created_date) - new Date(a.created_date);
    });

    rawRows.value = mappedData;
    
  } catch (err) {
    console.error('실적 데이터 조회 예외:', err);
    rawRows.value = [];
  } finally {
    loading.value = false;
  }
}

// 합계 계산
const totalQty = computed(() => {
  const sum = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_qty.toString().replace(/,/g, '')) || 0), 0);
  return sum.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});

const totalAmount = computed(() => {
  const sum = displayRows.value.reduce((sum, row) => {
    const amount = Number(row.prescription_amount.toString().replace(/,/g, '')) || 0;
    return sum + amount;
  }, 0);
  return sum.toLocaleString();
});

// 페이지네이션 이벤트 핸들러
function onPageChange(event) {
  currentPageFirstIndex.value = event.first;
}

// 엑셀 다운로드
const downloadExcel = async () => {
  if (displayRows.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('전체 등록 현황')

  // 헤더 정의
  const headers = [
    'No', '검수상태', '구분', '업체명', '병의원명', '처방월', '제품명', '보험코드', 
    '약가', '처방수량', '처방액', '처방구분', '비고', 
    '등록일시', '등록자', '수정일시', '수정자', '관리자'
  ]
  
  // 헤더 추가
  worksheet.addRow(headers)

  // 헤더 스타일 설정
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 데이터 추가
  displayRows.value.forEach((row, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      row.review_status || '',
      row.company_group || '',
      row.company_name || '',
      row.client_name || '',
      row.prescription_month || '',
      row.product_name_display || '',
      row.insurance_code || '',
      Number(String(row.price).replace(/,/g, '')) || 0,
      Number(String(row.prescription_qty).replace(/,/g, '')) || 0,
      Number(String(row.prescription_amount).replace(/,/g, '')) || 0,
      row.prescription_type || '',
      row.remarks || '',
      row.created_date || '',
      row.created_by || '',
      row.updated_date || '',
      row.updated_by || '',
      row.assigned_pharmacist_contact || ''
    ])

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }
      
      // 가운데 정렬할 컬럼 지정 (No, 검수상태, 구분, 보험코드, 처방구분, 등록일시, 등록자, 수정일시, 수정자)
      if ([1, 2, 6, 8, 12, 14, 16].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 숫자 컬럼은 오른쪽 정렬
      if ([9, 10, 11].includes(colNumber)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })
  })

  // 합계 행 추가
  const totalRow = worksheet.addRow([
    '', '', '', '', '', '', '', '', '합계', 
    Number(totalQty.value.replace(/,/g, '')),
    Number(totalAmount.value.replace(/,/g, '')),
    '', '', '', '', '', '', ''
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
    if (colNumber === 9) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // 숫자 컬럼들은 우측 정렬
    if ([10, 11].includes(colNumber)) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });
  
  // 합계행 숫자 형식 설정
  totalRow.getCell(10).numFmt = '#,##0.0'; // 처방수량
  totalRow.getCell(11).numFmt = '#,##0'; // 처방액

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
    { width: 12 }, // 검수상태
    { width: 12 }, // 구분
    { width: 24 }, // 업체명
    { width: 32 }, // 병의원명
    { width: 12 }, // 처방월
    { width: 32 }, // 제품명
    { width: 12 }, // 보험코드
    { width: 12 }, // 약가
    { width: 12 }, // 처방수량
    { width: 16 }, // 처방액
    { width: 16 }, // 처방구분
    { width: 24 }, // 비고
    { width: 18 }, // 등록일시
    { width: 16 }, // 등록자
    { width: 18 }, // 수정일시
    { width: 16 }, // 수정자
    { width: 16 }  // 관리자
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

  // 약가, 처방액 컬럼에 천단위 콤마 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const priceCell = worksheet.getCell(row, 9) // I컬럼 (약가)
    priceCell.numFmt = '#,##0'
    
    const amountCell = worksheet.getCell(row, 11) // K컬럼 (처방액)
    amountCell.numFmt = '#,##0'
  }

  // 처방수량 컬럼에 소수점 한 자리 형식 적용
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const qtyCell = worksheet.getCell(row, 10) // J컬럼 (처방수량)
    qtyCell.numFmt = '#,##0.0'
  }

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // 정산월 정보가 있으면 파일명에 포함
  const monthInfo = selectedSettlementMonth.value ? formatMonthToKorean(selectedSettlementMonth.value) : null
  link.download = generateExcelFileName('전체등록현황', monthInfo)
  
  link.click()
  window.URL.revokeObjectURL(url)
};

// 병의원 검색 관련 함수들
function handleHospitalSearch() {
  const searchTerm = hospitalSearchText.value.toLowerCase().trim();
  
  if (!searchTerm) {
    // 검색어가 없으면 모든 병의원 표시 (최대 100개)
    filteredHospitals.value = allHospitals.value.slice(0, 100);
  } else {
    // 검색어가 있으면 필터링
    filteredHospitals.value = allHospitals.value
      .filter(hospital => hospital.name.toLowerCase().includes(searchTerm))
      .slice(0, 100); // 최대 100개로 제한
  }
  
  hospitalHighlightedIndex.value = -1; // 검색 시 하이라이트 초기화
  showHospitalDropdown.value = true;
}

function selectHospital(hospital) {
  selectedHospitalId.value = hospital.id;
  hospitalSearchText.value = hospital.id === '' ? '' : hospital.name;
  showHospitalDropdown.value = false;
  hospitalHighlightedIndex.value = -1;
  
  // 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchPerformanceRecords();
  }
}

// 병의원 키보드 네비게이션
function handleHospitalKeydown(event) {
  if (!showHospitalDropdown.value) return;
  
  const totalItems = filteredHospitals.value.length + 1; // +1 for "전체" option
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.min(hospitalHighlightedIndex.value + 1, totalItems - 1);
      scrollToHighlightedHospital();
      break;
    case 'ArrowUp':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.max(hospitalHighlightedIndex.value - 1, -1);
      scrollToHighlightedHospital();
      break;
    case 'Enter':
      event.preventDefault();
      if (hospitalHighlightedIndex.value === 0) {
        // "전체" 선택
        selectHospital({ id: '', name: '전체' });
      } else if (hospitalHighlightedIndex.value > 0) {
        // 병의원 선택
        const hospitalIndex = hospitalHighlightedIndex.value - 1;
        if (hospitalIndex < filteredHospitals.value.length) {
          selectHospital(filteredHospitals.value[hospitalIndex]);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      showHospitalDropdown.value = false;
      hospitalHighlightedIndex.value = -1;
      break;
  }
}

// 병의원 드롭다운 스크롤 함수
function scrollToHighlightedHospital() {
  nextTick(() => {
    const dropdown = document.querySelector('.hospital-dropdown');
    if (!dropdown) return;
    
    const highlightedItem = dropdown.querySelector('.hospital-dropdown-item.highlighted');
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

function handleHospitalFocus() {
  // 포커스 시 드롭다운 표시
  if (allHospitals.value.length > 0) {
    handleHospitalSearch();
  }
}

function delayedHideHospitalDropdown() {
  // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
  setTimeout(() => {
    showHospitalDropdown.value = false;
  }, 200);
}

// === 업체 검색 관련 함수들 ===
async function fetchAllCompanies() {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, company_name, company_group, assigned_pharmacist_contact')
      .eq('user_type', 'user')
      .eq('approval_status', 'approved')
      .order('company_name', { ascending: true });

    if (error) throw error;
    
    allCompanies.value = companies || [];
    // console.log('전체 업체 목록 로드 완료:', allCompanies.value.length);
  } catch (err) {
    console.error('전체 업체 목록 로딩 실패:', err);
    allCompanies.value = [];
  }
}

function handleCompanySearch() {
  const searchTerm = companySearchText.value.toLowerCase().trim();
  
  if (!searchTerm) {
    // 검색어가 없으면 모든 업체 표시 (최대 100개)
    filteredCompanies.value = allCompanies.value.slice(0, 100);
  } else {
    // 검색어가 있으면 필터링
    filteredCompanies.value = allCompanies.value
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
  
  // 실적 데이터 다시 로드
  fetchPerformanceRecords();
}

// 업체 키보드 네비게이션
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

// 업체 드롭다운 스크롤 함수
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

function handleCompanyFocus() {
  // 포커스 시 드롭다운 표시
  if (allCompanies.value.length > 0) {
    handleCompanySearch();
  }
}

function delayedHideCompanyDropdown() {
  // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
  setTimeout(() => {
    showCompanyDropdown.value = false;
  }, 200);
}

// 마운트
onMounted(async () => {
  await fetchAvailableMonths();
  await fetchAvailableCompanyGroups();
  // 정산월과 관계없이 항상 업체 목록을 로드
  await fetchCompanies();
  // 전체 업체 목록도 로드 (검색용)
  await fetchAllCompanies();
  
  // 정산월이 설정되면 병의원도 로드
  if (selectedSettlementMonth.value) {
    await fetchHospitals();
  }
});

</script>

<style scoped>
/* 기존 스타일 유지 */
.performance-register-view { padding: 0px; }
.data-card-buttons { display: flex; gap: 8px; }

/* 셀 배경색을 흰색으로 지정 */
:deep(.p-datatable-tbody > tr > td) {
  background: #ffffff !important;
}

/* 푸터 셀 스타일 */
:deep(.p-datatable-tfoot > tr > td) {
    background: #f8f9fa !important;
    font-weight: bold;
}

/* 병의원 검색 드롭다운 스타일 */
.hospital-search-container {
  position: relative;
}

.hospital-dropdown {
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.hospital-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.hospital-dropdown-item:hover {
  background-color: #f5f5f5;
}

.hospital-dropdown-item.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.hospital-dropdown-item.highlighted {
  background-color: #f0f8ff;
  color: #1976d2;
}

.hospital-dropdown-item.no-results {
  color: #999;
  font-style: italic;
  cursor: default;
}

.hospital-dropdown-item.no-results:hover {
  background-color: transparent;
}

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
