<template>
  <div class="absorption-analysis-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">흡수율 분석</div>
    </div>

    <!-- 필터 카드 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end; gap: 16px; flex-wrap: wrap;">
        
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
          <label>업체</label>
          <select v-model="selectedCompanyId" class="select_200px">
            <option v-for="company in companyOptions" :key="company.id" :value="company.id">{{ company.company_name }}</option>
          </select>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>병의원</label>
          <select v-model="selectedHospitalId" class="select_240px">
            <option v-for="hospital in hospitalOptions" :key="hospital.id" :value="hospital.id">{{ hospital.name }}</option>
          </select>
        </div>
        
      </div>
    </div>

    <!-- 데이터 카드 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0;">
        <div class="total-count-display">전체 {{ displayRows.length }} 건</div>
        <div class="data-card-buttons" style="margin-left: auto;">
          <button 
            class="btn-delete" 
            @click="deleteFilteredAnalysisData" 
            :disabled="displayRows.length === 0 || loading"
            style="margin-right: 1rem;"
          >
            분석 데이터 삭제
          </button>
           <button 
             class="btn-add" 
             @click="calculateAbsorptionRates" 
             :disabled="!hasCompletedData || loading"
             style="margin-right: 1rem;"
           >
             흡수율 분석
           </button>
           <button class="btn-excell-download" @click="downloadExcel" :disabled="displayRows.length === 0" style="margin-right: 1rem;">
             엑셀 다운로드
           </button>
           <div style="display: flex; align-items: center; gap: 8px;">
             <label :class="{ 'disabled-label': isTableSorting }">정렬</label>
             <select 
               v-model="sortCriteria" 
               class="select_120px" 
               :class="{ 'disabled-select': isTableSorting }"
             >
               <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
             </select>
           </div>
        </div>
      </div>
      
      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable 
          ref="dataTableRef"
          :key="displayRows.length"
          :value="displayRows" 
          :loading="false"
          paginator
          :rows="100"
          :rowsPerPageOptions="[100, 200, 500, 1000]"
          scrollable 
          scrollHeight="calc(100vh - 240px)"
          class="absorption-analysis-table"
          v-model:first="currentPageFirstIndex"
          v-model:sortField="tableSortField"
          v-model:sortOrder="tableSortOrder"
          @sort="onTableSort"
          @unsort="onTableUnsort"

          :pt="{
            wrapper: { style: 'min-width: 2900px;' },
            table: { style: 'min-width: 2900px;' }
          }"
        >
          <template #empty>
            <div v-if="!loading">등록된 데이터가 없습니다.</div>
          </template>
          
          <Column header="No" :headerStyle="{ width: columnWidths.no }" :frozen="true">
            <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
          </Column>
          
          <Column header="작업" field="review_action" :headerStyle="{ width: columnWidths.review_action }" :frozen="true">
            <template #body="slotProps">
              <Tag v-if="slotProps.data.review_action" :value="slotProps.data.review_action" :severity="getActionSeverity(slotProps.data.review_action)"/>
            </template>
          </Column>

          <Column field="company_type" header="구분" :headerStyle="{ width: columnWidths.company_type }" :sortable="true" :frozen="true" />
          <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true" :frozen="true" />
          <Column field="client_name" header="병의원명" :headerStyle="{ width: columnWidths.client_name }" :sortable="true" :frozen="true" />
          
          <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }" :sortable="true" />
          <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name_display }" :sortable="true" :frozen="true" />
          <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true" />
          <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true" />
          <Column field="prescription_qty" header="수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true">
            <template #body="slotProps">
              {{ Number(slotProps.data.prescription_qty).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}
            </template>
          </Column>
          <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount">
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount }}
              </span>
            </template>
          </Column>
          <Column field="prescription_type" header="처방구분" :headerStyle="{ width: columnWidths.prescription_type }" :sortable="true" />
          
          <Column field="wholesale_revenue" header="도매매출" :headerStyle="{ width: columnWidths.wholesale_revenue }" :sortable="true">
            <template #body="slotProps">
              <span :title="Math.round(slotProps.data.wholesale_revenue || 0).toLocaleString()">
                {{ Math.round(slotProps.data.wholesale_revenue || 0).toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column field="direct_revenue" header="직거래매출" :headerStyle="{ width: columnWidths.direct_revenue }" :sortable="true">
             <template #body="slotProps">
              <span :title="Math.round(slotProps.data.direct_revenue || 0).toLocaleString()">
                {{ Math.round(slotProps.data.direct_revenue || 0).toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column field="total_revenue" header="합산액" :headerStyle="{ width: columnWidths.total_revenue }" :sortable="true">
             <template #body="slotProps">
              <span :title="Math.round(slotProps.data.total_revenue || 0).toLocaleString()">
                {{ Math.round(slotProps.data.total_revenue || 0).toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column field="absorption_rate" header="흡수율" :headerStyle="{ width: columnWidths.absorption_rate }" :sortable="true">
             <template #body="slotProps">
              <span :title="formatAbsorptionRate(slotProps.data.absorption_rate)">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </span>
            </template>
          </Column>

          <Column field="commission_rate" header="수수료율" :headerStyle="{ width: columnWidths.commission_rate }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.commission_rate">{{ slotProps.data.commission_rate }}</span>
            </template>
          </Column>
          <Column field="payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount">
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount }}
              </span>
            </template>
          </Column>
          <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.remarks">{{ slotProps.data.remarks }}</span>
            </template>
          </Column>
          <Column field="created_date" header="등록일시" :headerStyle="{ width: columnWidths.created_date }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.created_date">{{ slotProps.data.created_date }}</span>
            </template>
          </Column>
          <Column field="created_by" header="등록자" :headerStyle="{ width: columnWidths.created_by }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.created_by">{{ slotProps.data.created_by }}</span>
            </template>
          </Column>
          <Column field="updated_date" header="수정일시" :headerStyle="{ width: columnWidths.updated_date }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.updated_date">{{ slotProps.data.updated_date || '-' }}</span>
            </template>
          </Column>
          <Column field="updated_by" header="수정자" :headerStyle="{ width: columnWidths.updated_by }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.updated_by">{{ slotProps.data.updated_by || '-' }}</span>
            </template>
          </Column>

          <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="5" footerClass="footer-cell" footerStyle="text-align:center;" :frozen="true" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" :frozen="true" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalQuantity" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalWholesaleRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalDirectRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalCombinedRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="averageAbsorptionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="averageCommissionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
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
        <div class="loading-subtext">대량 데이터 처리 중이므로 시간이 걸릴 수 있습니다.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { supabase } from '@/supabase';
import ExcelJS from 'exceljs';
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils';

const columnWidths = {
  no: '3.5%',
  review_action: '3.5%',
  company_type: '6%',
  company_name: '8%',
  client_name: '12%',
  prescription_month: '5%',
  product_name_display: '12%',
  insurance_code: '6%',
  price: '5%',
  prescription_qty: '6%',
  prescription_amount: '6%',
  prescription_type: '6%',
  wholesale_revenue: '6%',
  direct_revenue: '6%',
  total_revenue: '6%',
  absorption_rate: '5%',
  commission_rate: '5%',
  payment_amount: '6%',
  remarks: '10%',
  created_date: '7%',
  created_by: '8%',
  updated_date: '7%',
  updated_by: '8%'
};

// --- 상태 변수 정의 ---
const loading = ref(true);
const displayRows = ref([]);
const availableMonths = ref([]);
const companyOptions = ref([]);
const hospitalOptions = ref([]);
const prescriptionOptions = ref([]);
const currentPageFirstIndex = ref(0);
const dataTableRef = ref(null); // DataTable ref 추가
const tableSortField = ref(''); // 테이블 정렬 필드
const tableSortOrder = ref(1); // 테이블 정렬 순서 (1: 오름차순, -1: 내림차순)
const isTableSorting = ref(false); // 테이블 헤더 정렬 사용 중인지 여부

// 필터 선택값
const selectedSettlementMonth = ref('');
const selectedCompanyId = ref('ALL');
const selectedHospitalId = ref('ALL');
const prescriptionOffset = ref(0);

// 새로운 상태 변수들
const hasCompletedData = ref(false);
const changes = ref({
  added_count: 0,
  modified_count: 0,
  deleted_count: 0,
});
const showChangesModal = ref(false);
const changeInfo = ref({
  updated_reviews: 0,
  updated_mappings: 0,
  updated_sales: 0
});

// 재분석 체크 관련 변수
const latestAnalysisTime = ref(null);

// 정렬 관련 변수들
const sortCriteria = ref('alphabetical'); // 기본값: 가나다순
const sortOptions = ref([
  { label: '가나다순', value: 'alphabetical' },
  { label: '최신등록순', value: 'created' },
  { label: '최신수정순', value: 'updated' }
]);

// --- 합계 계산 ---
const totalPrescriptionAmount = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0';
  const total = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 처방액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(String(row.prescription_amount).replace(/,/g, '')) || 0);
  }, 0);
  return total.toLocaleString();
});

const totalWholesaleRevenue = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0';
  const total = displayRows.value.reduce((sum, row) => sum + (row.wholesale_revenue || 0), 0);
  return Math.round(total).toLocaleString();
});

const totalDirectRevenue = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0';
  const total = displayRows.value.reduce((sum, row) => sum + (row.direct_revenue || 0), 0);
  return Math.round(total).toLocaleString();
});

const totalCombinedRevenue = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0';
  const total = displayRows.value.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
  return Math.round(total).toLocaleString();
});

const totalPaymentAmount = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0';
  const total = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(String(row.payment_amount).replace(/,/g, '')) || 0);
  }, 0);
  return total.toLocaleString();
});

// --- Computed 속성 (버튼 활성화 로직) ---

// --- Computed 속성 (합계 계산) ---
const totalQuantity = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '0.0';
  const total = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 수량을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(row.prescription_qty) || 0);
  }, 0);
  return total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});

const averageAbsorptionRate = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '- %';

  // 합계 처방액과 합계 합산액 계산
  const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 처방액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(String(row.prescription_amount).replace(/,/g, '')) || 0);
  }, 0);
  const totalCombinedRevenue = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 합산액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (row.total_revenue || 0);
  }, 0);

  if (totalPrescriptionAmount === 0) return '- %';

  // 흡수율 = (합계 합산액 ÷ 합계 처방액) × 100
  const absorptionRate = (totalCombinedRevenue / totalPrescriptionAmount) * 100;
  
  return `${absorptionRate.toFixed(1)}%`;
});

const averageCommissionRate = computed(() => {
  if (!displayRows.value || displayRows.value.length === 0) return '- %';

  // 합계 처방액과 합계 지급액 계산
  const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 처방액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(String(row.prescription_amount).replace(/,/g, '')) || 0);
  }, 0);
  const totalPaymentAmount = displayRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (Number(String(row.payment_amount).replace(/,/g, '')) || 0);
  }, 0);

  if (totalPrescriptionAmount === 0) return '- %';

  // 수수료율 = (합계 지급액 ÷ 합계 처방액) × 100
  const commissionRate = (totalPaymentAmount / totalPrescriptionAmount) * 100;

  return `${commissionRate.toFixed(1)}%`;
});

// --- 초기화 및 데이터 로딩 ---
onMounted(async () => {
  await fetchAvailableMonths();
});

async function fetchAvailableMonths() {
  try {
    const { data, error } = await supabase
      .from('settlement_months')
      .select('settlement_month')
      .order('settlement_month', { ascending: false });

    if (error) throw error;
    
    availableMonths.value = data;

    if (data.length > 0) {
      selectedSettlementMonth.value = data[0].settlement_month;
    }
  } catch (err) { console.error('정산월 조회 오류:', err); }
}

async function fetchCompaniesForMonth() {
  if (!selectedSettlementMonth.value) {
    companyOptions.value = [{ id: 'ALL', company_name: '- 전체 -' }];
    return;
  }
  try {
    // === 1,000행 제한 해결: 전체 데이터 가져오기 ===
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
    const { data, error } = await supabase
      .from('performance_records')
      .select('company_id, companies ( company_name, company_group )')
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('review_status', '완료')
        .not('company_id', 'is', null)
        .range(from, from + batchSize - 1);

    if (error) throw error;
    
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
    
    const uniqueCompanies = Array.from(new Map(allData.map(item => [item.company_id, { id: item.company_id, company_name: item.companies.company_name, company_group: item.companies.company_group }])).values());
    const sortedCompanies = uniqueCompanies.sort((a, b) => a.company_name.localeCompare(b.company_name));
    companyOptions.value = [{ id: 'ALL', company_name: '- 전체 -' }, ...sortedCompanies];
    selectedCompanyId.value = 'ALL';
  } catch (err) {
    console.error('해당 월의 업체 조회 오류:', err);
    companyOptions.value = [{ id: 'ALL', company_name: '- 전체 -' }];
  }
}

async function fetchClientsForMonth(companyId = null) {
    if (!selectedSettlementMonth.value) {
        hospitalOptions.value = [{ id: 'ALL', name: '- 전체 -' }];
        return;
    }
    try {
        let query = supabase
          .from('performance_records')
          .select('client_id, clients ( name )')
          .eq('settlement_month', selectedSettlementMonth.value)
          .eq('review_status', '완료')
          .not('client_id', 'is', null);

        const finalCompanyId = companyId || (selectedCompanyId.value === 'ALL' ? null : selectedCompanyId.value);
        if (finalCompanyId) {
            query = query.eq('company_id', finalCompanyId);
        }

        // === 1,000행 제한 해결: 전체 데이터 가져오기 ===
        let allData = [];
        let from = 0;
        const batchSize = 1000;
        
        while (true) {
          const { data, error } = await query
            .range(from, from + batchSize - 1);

        if (error) throw error;

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

        const uniqueClients = Array.from(new Map(allData.map(item => [item.client_id, { id: item.client_id, name: item.clients.name }])).values());
        const sortedClients = uniqueClients.sort((a, b) => a.name.localeCompare(b.name));
        hospitalOptions.value = [{ id: 'ALL', name: '- 전체 -' }, ...sortedClients];
        selectedHospitalId.value = 'ALL';
    } catch (err) {
        console.error('해당 월의 거래처 조회 오류:', err);
        hospitalOptions.value = [{ id: 'ALL', name: '- 전체 -' }];
    }
}

// --- 분석 상태 확인 및 변경 감지 함수 ---
const checkAnalysisStatus = async () => {
  if (!selectedSettlementMonth.value) return;
  loading.value = true;
  try {
    // 분석할 원본 데이터(완료 상태)가 있는지 확인
    const { count: completedCount, error: completedError } = await supabase
      .from('performance_records')
      .select('id', { count: 'exact', head: true })
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('review_status', '완료');
    if (completedError) throw completedError;
    hasCompletedData.value = (completedCount || 0) > 0;

  } catch (err) {
    console.error('분석 상태 확인 중 오류:', err);
    hasCompletedData.value = false;
  } finally {
    loading.value = false;
  }
};

// 정산월 변경 시 상태 확인 함수 호출
watch(selectedSettlementMonth, checkAnalysisStatus, { immediate: true });

// --- 핵심 데이터 처리 함수 ---
async function loadAbsorptionAnalysisResults() {
  if (!selectedSettlementMonth.value) {
    loading.value = false;
    return;
  }
  
  loading.value = true;
  displayRows.value = [];
  
  // 타임아웃 설정 (5분 후 자동으로 로딩 해제)
  const timeoutId = setTimeout(() => {
    console.warn('loadAbsorptionAnalysisResults 타임아웃 발생');
    loading.value = false;
  }, 300000);
  
  try {
    let allData = [];
    
    if (selectedCompanyId.value === 'ALL') {
      // === 전체 조회 시: 단일 쿼리로 모든 데이터 가져오기 (성능 최적화) ===
      
      let query = supabase
        .from('performance_records_absorption')
        .select(`
          *,
          company:companies(company_name, company_group),
          client:clients(name),
          product:products(product_name, insurance_code, price)
        `)
        .eq('settlement_month', selectedSettlementMonth.value);
      
      if (selectedHospitalId.value !== 'ALL') {
        query = query.eq('client_id', selectedHospitalId.value);
      }
      
      if (prescriptionOffset.value !== 0) {
        const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
        query = query.eq('prescription_month', prescriptionMonth);
      }
      
      // 전체 데이터 배치 처리
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await query
          .range(from, from + batchSize - 1)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          break;
        }
        
        allData = allData.concat(data);
        
        if (data.length < batchSize) {
          break;
        }
        
        from += batchSize;
      }
      
      // 데이터가 없으면 바로 로딩 멈춤
      if (allData.length === 0) {
        loading.value = false;
        return;
      }
    
    } else {
      // === 개별 업체 조회 시: 기존 로직 ===
      
      let query = supabase
        .from('performance_records_absorption')
        .select(`
          *,
          company:companies(company_name, company_group),
          client:clients(name),
          product:products(product_name, insurance_code, price)
        `)
        .eq('settlement_month', selectedSettlementMonth.value)
        .eq('company_id', selectedCompanyId.value);
      
      if (selectedHospitalId.value !== 'ALL') {
        query = query.eq('client_id', selectedHospitalId.value);
      }
      
      if (prescriptionOffset.value !== 0) {
        const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
        query = query.eq('prescription_month', prescriptionMonth);
      }
      
      // 배치 처리
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await query
          .range(from, from + batchSize - 1)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          break;
        }
        
        allData = allData.concat(data);
        
        if (data.length < batchSize) {
          break;
        }
        
        from += batchSize;
      }
      
      // 데이터가 없으면 바로 로딩 멈춤
      if (allData.length === 0) {
        loading.value = false;
        return;
      }
    }

    // NULL 값 체크
    const companyNullCount = allData.filter(row => !row.company).length;
    const clientNullCount = allData.filter(row => !row.client).length;
    const productNullCount = allData.filter(row => !row.product).length;

    // 사용자 ID를 업체명으로 변환하기 위한 매핑 생성 (성능 최적화)
    const userIds = [...new Set(allData.map(row => row.registered_by).filter(id => id && id !== null))];
    const updatedByIds = allData.map(row => row.updated_by).filter(id => id && id !== null);
    userIds.push(...updatedByIds);
    
    let userMap = new Map();
    if (userIds.length > 0) {
      // companies 테이블에서 user_id를 통해 업체명 가져오기 (배치 처리)
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', userIds);
      
      if (!companyError && companies) {
        companies.forEach(company => {
          if (company.user_id) {
            userMap.set(company.user_id, company.company_name || 'N/A');
          }
        });
      }
    }

    // 데이터 매핑 최적화 (배치 처리)
    const mappedData = allData.map((row, i) => {
        try {
            // null 체크 및 기본값 설정
            const prescriptionQty = Number(row.prescription_qty) || 0;
            const productPrice = Number(row.product?.price) || 0;
            const commissionRate = Number(row.commission_rate) || 0;
            const absorptionRate = Number(row.absorption_rate) || 0;
            
            const prescriptionAmount = Math.round(prescriptionQty * productPrice);
            const paymentAmount = Math.round(prescriptionAmount * commissionRate);

            return {
                id: row.id || null,
                settlement_month: row.settlement_month || '',
                company_id: row.company_id || null,
                client_id: row.client_id || null,
                product_id: row.product_id || null,
                prescription_month: row.prescription_month || '',
                prescription_qty: prescriptionQty,
                prescription_type: row.prescription_type || '',
                commission_rate: commissionRate,
                remarks: row.remarks || '',
                registered_by: row.registered_by || null,
                created_at: row.created_at || null,
                updated_at: row.updated_at || null,
                updated_by: row.updated_by || null,
                review_action: row.review_action || '',
                wholesale_revenue: Number(row.wholesale_revenue) || 0,
                direct_revenue: Number(row.direct_revenue) || 0,
                total_revenue: Number(row.total_revenue) || 0,
                absorption_rate: absorptionRate,
                company_type: row.company?.company_group || 'N/A',
                company_name: row.company?.company_name || 'N/A',
                client_name: row.client?.name || 'N/A',
                product_name_display: row.product?.product_name || 'N/A',
                insurance_code: row.product?.insurance_code || 'N/A',
                price: productPrice ? Math.round(productPrice).toLocaleString() : '0',
                prescription_amount: prescriptionAmount.toLocaleString(),
                payment_amount: paymentAmount.toLocaleString(),
                commission_rate: `${(commissionRate * 100).toFixed(1)}%`,
                absorption_rate: absorptionRate,
                created_date: formatDateTime(row.created_at),
                created_by: userMap.get(row.registered_by) || '-',
                updated_date: row.updated_at ? formatDateTime(row.updated_at) : null,
                updated_by: row.updated_by ? userMap.get(row.updated_by) || '-' : null,
            };
        } catch (error) {
            console.error('데이터 매핑 오류 (행 ' + i + '):', error, row);
            // 오류 발생 시 기본값으로 반환
            return {
                id: row.id || null,
                settlement_month: row.settlement_month || '',
                company_id: row.company_id || null,
                client_id: row.client_id || null,
                product_id: row.product_id || null,
                prescription_month: row.prescription_month || '',
                prescription_qty: 0,
                prescription_type: row.prescription_type || '',
                commission_rate: 0,
                remarks: row.remarks || '',
                registered_by: row.registered_by || null,
                created_at: row.created_at || null,
                updated_at: row.updated_at || null,
                updated_by: row.updated_by || null,
                review_action: row.review_action || '',
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                absorption_rate: 0,
                company_type: 'N/A',
                company_name: 'N/A',
                client_name: 'N/A',
                product_name_display: 'N/A',
                insurance_code: 'N/A',
                price: '0',
                prescription_amount: '0',
                payment_amount: '0',
                commission_rate: '0.0%',
                absorption_rate: 0,
                created_date: formatDateTime(row.created_at),
                created_by: '-',
                updated_date: null,
                updated_by: null,
            };
        }
    });

    // 정렬은 applySorting 함수에서 처리
    
    // 데이터 설정 전에 안전성 검증
    if (Array.isArray(mappedData) && mappedData.length > 0) {
      // 로딩 상태 해제
      loading.value = false;
      
      // 간단하게 데이터 설정
      displayRows.value = mappedData;
    } else {
      loading.value = false;
      displayRows.value = [];
    }

    // 업체별 집계 (Map 사용으로 성능 향상)
    const companyCount = new Map();
    mappedData.forEach(row => {
      const companyName = row.company_name || 'N/A';
      companyCount.set(companyName, (companyCount.get(companyName) || 0) + 1);
    });

  } catch (err) {
    console.error('분석 결과 데이터 로딩 오류:', err);
    alert(`분석 결과 데이터 로딩 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    clearTimeout(timeoutId); // 타임아웃 제거
    // 로딩 상태는 이미 위에서 해제했으므로 여기서는 제거
  }
}

// --- Watchers ---
watch(selectedSettlementMonth, async (newMonth) => {
  if (newMonth) { 
    try {
      await fetchCompaniesForMonth();
      await fetchClientsForMonth(null);
      updatePrescriptionOptions();
      prescriptionOffset.value = 0;
      await checkAnalysisStatus();
      await checkReanalysisNeeded();
      await loadAbsorptionAnalysisResults();
    } catch (err) {
      console.error('정산월 변경 처리 중 오류:', err);
      loading.value = false; // 오류 발생 시 로딩 상태 해제
    }
  }
});

watch(selectedCompanyId, async (newCompanyId) => {
  try {
    await fetchClientsForMonth(newCompanyId === 'ALL' ? null : newCompanyId);
    
    // 업체 변경 시, 현재 선택된 병의원이 새 업체 목록에 없으면 병의원 선택을 '전체'로 초기화
    if (selectedHospitalId.value !== 'ALL') {
      const isHospitalInList = hospitalOptions.value.some(h => h.id === selectedHospitalId.value);
      if (!isHospitalInList) {
        selectedHospitalId.value = 'ALL';
      }
    }
    
    // 분석 데이터가 있으면 필터링된 결과 로딩
    if (selectedSettlementMonth.value) {
      await loadAbsorptionAnalysisResults();
    }
  } catch (err) {
    console.error('업체 변경 처리 중 오류:', err);
    loading.value = false;
  }
});

watch(selectedHospitalId, async () => {
  try {
    // 분석 데이터가 있으면 필터링된 결과 로딩
    if (selectedSettlementMonth.value) {
      await loadAbsorptionAnalysisResults();
    }
  } catch (err) {
    console.error('병의원 변경 처리 중 오류:', err);
    loading.value = false;
  }
});

watch(prescriptionOffset, async () => {
  try {
    // 분석 데이터가 있으면 필터링된 결과 로딩
    if (selectedSettlementMonth.value) {
      await loadAbsorptionAnalysisResults();
    }
  } catch (err) {
    console.error('처방월 변경 처리 중 오류:', err);
    loading.value = false;
  }
});

watch(sortCriteria, () => {
  applySorting();
});

// --- 유틸리티 함수 ---
const calculateAbsorptionRates = async () => {
  if (!selectedSettlementMonth.value) {
    alert('정산월을 선택해주세요.');
    return;
  }

  // 2번 모달 제거 - 바로 분석 시작

  loading.value = true;
  try {
    // 1단계: 필터 조건에 맞는 원본 데이터 복사
    
    // 먼저 기존 분석 데이터에서 해당 조건의 데이터 삭제
    let deleteQuery = supabase
      .from('performance_records_absorption')
      .delete()
      .eq('settlement_month', selectedSettlementMonth.value);
    
    if (selectedCompanyId.value !== 'ALL') {
      deleteQuery = deleteQuery.eq('company_id', selectedCompanyId.value);
    }
    if (selectedHospitalId.value !== 'ALL') {
      deleteQuery = deleteQuery.eq('client_id', selectedHospitalId.value);
    }
    if (prescriptionOffset.value !== 0) {
      const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
      deleteQuery = deleteQuery.eq('prescription_month', prescriptionMonth);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.warn('기존 분석 데이터 삭제 중 오류 (무시):', deleteError);
    }

    // 필터 조건에 맞는 performance_records 데이터 조회
    let sourceQuery = supabase
      .from('performance_records')
      .select('*')
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('review_status', '완료');
    
    if (selectedCompanyId.value !== 'ALL') {
      sourceQuery = sourceQuery.eq('company_id', selectedCompanyId.value);
    }
    if (selectedHospitalId.value !== 'ALL') {
      sourceQuery = sourceQuery.eq('client_id', selectedHospitalId.value);
    }
    if (prescriptionOffset.value !== 0) {
      const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
      sourceQuery = sourceQuery.eq('prescription_month', prescriptionMonth);
    }

    // === 전체 데이터 조회 (1,000건 제한 해결) ===
    let allSourceData = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await sourceQuery
        .range(from, from + batchSize - 1);
      
      if (error) throw error;

      if (!data || data.length === 0) {
        break;
      }
      
      allSourceData = allSourceData.concat(data);
      
      if (data.length < batchSize) {
        break;
      }
      
      from += batchSize;
    }

    if (allSourceData.length === 0) {
      alert('필터 조건에 맞는 완료된 실적 데이터가 없습니다.');
      return;
    }

    // performance_records_absorption에 데이터 복사 (배치 처리 최적화)
    const insertBatchSize = 500; // 배치 크기를 줄여서 메모리 사용량 감소
    let insertedCount = 0;
    
    for (let i = 0; i < allSourceData.length; i += insertBatchSize) {
      const batchData = allSourceData.slice(i, i + insertBatchSize);
      
      const { error: insertError } = await supabase
        .from('performance_records_absorption')
        .insert(batchData.map(record => {
          // 실제 데이터 수정 여부 판단
          // review_action이 '수정'이거나 updated_at이 created_at보다 늦은 경우에만 updated_at, updated_by 사용
          const isActuallyModified = record.review_action === '수정' || 
            (record.updated_at && new Date(record.updated_at) > new Date(record.created_at));
          
          return {
            id: record.id, // 원본 performance_records의 id 사용
            settlement_month: record.settlement_month,
            company_id: record.company_id,
            client_id: record.client_id,
            product_id: record.product_id,
            prescription_month: record.prescription_month,
            prescription_qty: record.prescription_qty,
            prescription_type: record.prescription_type,
            commission_rate: record.commission_rate,
            remarks: record.remarks,
            registered_by: record.registered_by,
            review_action: record.review_action, // review_action 필드 추가
            created_at: record.created_at, // performance_records의 created_at 그대로 사용
            // 실제 수정된 데이터만 updated_at, updated_by 정보 가져옴
            updated_at: isActuallyModified ? record.updated_at : null,
            updated_by: isActuallyModified ? record.updated_by : null,
            analysis_time: new Date().toISOString() // 데이터 복사 시점의 시간
          };
        }));

      if (insertError) throw insertError;
      
      insertedCount += batchData.length;
      
      // 메모리 해제를 위한 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 2단계: 흡수율 계산 (복사된 데이터에 대해서만)
    const { error: step2Error } = await supabase.rpc('calculate_absorption_rates', {
      p_settlement_month: selectedSettlementMonth.value
    });
     if (step2Error) {
      console.error('2단계 오류:', step2Error);
      throw new Error(`2단계(흡수율 계산) 실패: ${step2Error.message}`);
    }

    // 4번 모달: alert (확인만 필요, 취소 없음)
    alert(`흡수율 분석이 완료되었습니다. (${insertedCount}건 처리)`);
    await checkAnalysisStatus();
    await loadAbsorptionAnalysisResults();

  } catch (err) {
    console.error('흡수율 분석 실행 오류:', JSON.stringify(err, null, 2));
    alert(`흡수율 분석 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

function getPrescriptionMonth(settlementMonth, offset) {
  if (!settlementMonth || offset === null) return '';
  const [y, m] = settlementMonth.split('-');
  let month = parseInt(m, 10) - offset;
  let year = parseInt(y, 10);
  while (month <= 0) { month += 12; year -= 1; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function updatePrescriptionOptions() {
  prescriptionOptions.value = [
    { value: 0, month: '- 전체 -' },
    ...[1, 2, 3].map(offset => ({
      value: offset,
      month: getPrescriptionMonth(selectedSettlementMonth.value, offset)
    }))
  ];
}

function getActionSeverity(action) {
  if (action === '수정') return 'info';
  if (action === '추가') return 'success';
  if (action === '삭제') return 'danger';
  return 'secondary';
}

// 테이블 헤더 정렬 이벤트 핸들러
function onTableSort() {
  // 테이블 헤더 정렬이 적용되면 상단 정렬을 비활성화 상태로 표시
  isTableSorting.value = true;
}

// 테이블 헤더 정렬 해제 이벤트 핸들러
function onTableUnsort() {
  // 테이블 헤더 정렬이 해제되면 상단 정렬을 다시 활성화
  isTableSorting.value = false;
}

// 정렬 함수
function applySorting() {
  try {
    if (!displayRows.value || displayRows.value.length === 0) return;
    
    // 상단 정렬이 적용될 때는 테이블 헤더 정렬을 초기화
    tableSortField.value = '';
    tableSortOrder.value = 1;
    isTableSorting.value = false;
    
    // 깊은 복사로 안전하게 처리
    const sortedRows = JSON.parse(JSON.stringify(displayRows.value));
    
    switch (sortCriteria.value) {
      case 'alphabetical':
        // 가나다순: 업체명 > 병의원명 > 제품명 순
        sortedRows.sort((a, b) => {
          try {
            // null 체크 강화
            const aCompany = String(a?.company_name || '');
            const bCompany = String(b?.company_name || '');
            const companyCompare = aCompany.localeCompare(bCompany, 'ko');
            if (companyCompare !== 0) return companyCompare;
            
            const aClient = String(a?.client_name || '');
            const bClient = String(b?.client_name || '');
            const clientCompare = aClient.localeCompare(bClient, 'ko');
            if (clientCompare !== 0) return clientCompare;
            
            const aProduct = String(a?.product_name_display || '');
            const bProduct = String(b?.product_name_display || '');
            return aProduct.localeCompare(bProduct, 'ko');
          } catch (error) {
            console.error('정렬 비교 오류:', error);
            return 0;
          }
        });
        break;
        
      case 'created':
        // 등록순: created_at 기준 (최신순)
        sortedRows.sort((a, b) => {
          try {
            const dateA = a?.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b?.created_at ? new Date(b.created_at) : new Date(0);
            return dateB.getTime() - dateA.getTime(); // 최신순
          } catch (error) {
            console.error('날짜 정렬 오류:', error);
            return 0;
          }
        });
        break;
        
      case 'updated':
        // 수정순: updated_at 기준 (최신순)
        sortedRows.sort((a, b) => {
          try {
            const dateA = a?.updated_at ? new Date(a.updated_at) : (a?.created_at ? new Date(a.created_at) : new Date(0));
            const dateB = b?.updated_at ? new Date(b.updated_at) : (b?.created_at ? new Date(b.created_at) : new Date(0));
            return dateB.getTime() - dateA.getTime(); // 최신순
          } catch (error) {
            console.error('날짜 정렬 오류:', error);
            return 0;
          }
        });
        break;
    }
    
    // nextTick을 사용하여 안전하게 업데이트
    nextTick(() => {
      displayRows.value = sortedRows;
    });
  } catch (error) {
    console.error('정렬 함수 전체 오류:', error);
  }
}

function formatAbsorptionRate(value) {
  try {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    const numValue = Number(value) * 100;  // 소수점 형태를 퍼센트로 변환
    return `${numValue.toFixed(1)}%`;
  } catch (error) {
    console.error('흡수율 포맷 오류:', error, value);
    return '0.0%';
  }
}

function formatDateTime(dateTimeString) {
  try {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) return '-';
    
    // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
    const utcHours = date.getUTCHours();
    const kstHours = (utcHours + 9) % 24;
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(kstHours).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error, dateTimeString);
    return '-';
  }
}

async function downloadExcel() {
  if (displayRows.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  try {
    // 2. 데이터 변환 (이미 매핑된 데이터 사용)
    const dataToExport = displayRows.value.map((row, index) => ({
      'No': index + 1,
      '작업': row.review_action || '',
      '구분': row.company_type,
      '업체명': row.company_name,
      '병의원명': row.client_name,
      '처방월': row.prescription_month,
      '제품명': row.product_name_display,
      '보험코드': row.insurance_code,
      '약가': Math.round(Number(String(row.price).replace(/,/g, '')) || 0),
      '수량': Number(row.prescription_qty) || 0,
      '처방액': Math.round(Number(String(row.prescription_amount).replace(/,/g, '')) || 0),
      '처방구분': row.prescription_type,
      '도매매출': Math.round(row.wholesale_revenue || 0),
      '직거래매출': Math.round(row.direct_revenue || 0),
      '합산액': Math.round(row.total_revenue || 0),
      '흡수율': (row.absorption_rate ? parseFloat(row.absorption_rate) : 0),
      '수수료율': (row.commission_rate ? parseFloat(String(row.commission_rate).replace('%', '')) / 100 : 0),
      '지급액': Math.round(Number(String(row.payment_amount).replace(/,/g, '')) || 0),
      '비고': row.remarks,
      '등록일시': row.created_date,
      '등록자': row.created_by || '-',
      '수정일시': row.updated_date || '',
      '수정자': row.updated_by || ''
    }));

    // 합계 행 추가 (삭제된 건 제외한 계산으로 통일)
    const totalPrescriptionAmountForExcel = displayRows.value.reduce((sum, row) => {
      // 삭제된 건은 처방액을 0으로 계산
      if (row.review_action === '삭제') return sum;
      return sum + (Number(String(row.prescription_amount).replace(/,/g, '')) || 0);
    }, 0);
    
    const totalCombinedRevenueForExcel = displayRows.value.reduce((sum, row) => {
      // 삭제된 건은 합산액을 0으로 계산
      if (row.review_action === '삭제') return sum;
      return sum + (row.total_revenue || 0);
    }, 0);
    
    const totalPaymentAmountForExcel = displayRows.value.reduce((sum, row) => {
      // 삭제된 건은 지급액을 0으로 계산
      if (row.review_action === '삭제') return sum;
      return sum + (Number(String(row.payment_amount).replace(/,/g, '')) || 0);
    }, 0);
    
    dataToExport.push({
      'No': '',
      '작업': '',
      '구분': '',
      '업체명': '',
      '병의원명': '',
      '처방월': '',
      '제품명': '',
      '보험코드': '',
      '약가': '합계',
      '수량': Number(totalQuantity.value.replace(/,/g, '')),
      '처방액': totalPrescriptionAmountForExcel,
      '처방구분': '',
      '도매매출': Number(totalWholesaleRevenue.value.replace(/,/g, '')),
      '직거래매출': Number(totalDirectRevenue.value.replace(/,/g, '')),
      '합산액': totalCombinedRevenueForExcel,
      '흡수율': (totalPrescriptionAmountForExcel > 0 ? (totalCombinedRevenueForExcel / totalPrescriptionAmountForExcel) : 0),
      '수수료율': (totalPrescriptionAmountForExcel > 0 ? (totalPaymentAmountForExcel / totalPrescriptionAmountForExcel) : 0),
      '지급액': totalPaymentAmountForExcel,
      '비고': '',
      '등록일시': '',
      '등록자': ''
    });

    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('흡수율 분석')

    // 헤더 정의
    const headers = Object.keys(dataToExport[0])
    worksheet.addRow(headers)

    // 헤더 스타일 설정
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // 데이터 추가 (합계 행 제외)
    dataToExport.slice(0, -1).forEach((row) => {
      const dataRow = worksheet.addRow(Object.values(row))
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 }
        cell.alignment = { vertical: 'middle' }
        
        // 가운데 정렬할 컬럼 지정 (No, 작업, 구분, 처방월, 보험코드, 처방구분, 등록일시, 등록자, 수정일시, 수정자)
        if ([1, 2, 6, 8, 9, 12, 16, 17, 20, 22].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        
        // 약가 (9번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 9) {
          cell.numFmt = '#,##0'
        }
        
        // 수량 (10번째 컬럼): 천단위 콤마, 소수점 한자리
        if (colNumber === 10) {
          cell.numFmt = '#,##0.0'
        }
        
        // 처방액 (11번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 11) {
          cell.numFmt = '#,##0'
        }
        
        // 도매매출 (13번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 13) {
          cell.numFmt = '#,##0'
        }
        
        // 직거래매출 (14번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 14) {
          cell.numFmt = '#,##0'
        }
        
        // 합산액 (15번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 15) {
          cell.numFmt = '#,##0'
        }
        
        // 흡수율 (16번째 컬럼): 백분율, 소수점 세자리
        if (colNumber === 16) {
          cell.numFmt = '0.000%'
        }
        
        // 수수료율 (17번째 컬럼): 백분율, 소수점 한자리
        if (colNumber === 17) {
          cell.numFmt = '0.0%'
        }
        
        // 지급액 (18번째 컬럼): 천단위 콤마, 소수점 없음
        if (colNumber === 18) {
          cell.numFmt = '#,##0'
        }
      })
    })

    // 합계 행 추가
    const totalRow = worksheet.addRow(Object.values(dataToExport[dataToExport.length - 1]))
    
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
    });
    
    // 합계행 숫자 형식 설정
    totalRow.getCell(9).numFmt = '#,##0'; // 약가
    totalRow.getCell(10).numFmt = '#,##0.0'; // 수량
    totalRow.getCell(11).numFmt = '#,##0'; // 처방액
    totalRow.getCell(13).numFmt = '#,##0'; // 도매매출
    totalRow.getCell(14).numFmt = '#,##0'; // 직거래매출
    totalRow.getCell(15).numFmt = '#,##0'; // 합산액
    totalRow.getCell(16).numFmt = '0.000%'; // 흡수율
    totalRow.getCell(17).numFmt = '0.0%'; // 수수료율
    totalRow.getCell(18).numFmt = '#,##0'; // 지급액

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
      { width: 10 }, // 작업
      { width: 16 }, // 구분
      { width: 24 }, // 업체명
      { width: 32 }, // 병의원명
      { width: 12 }, // 처방월
      { width: 32 }, // 제품명
      { width: 12 }, // 보험코드
      { width: 12 }, // 약가
      { width: 12 }, // 수량
      { width: 16 }, // 처방액
      { width: 12 }, // 처방구분
      { width: 16 }, // 도매매출
      { width: 16 }, // 직거래매출
      { width: 16 }, // 합산액
      { width: 12 }, // 흡수율
      { width: 12 }, // 수수료율
      { width: 16 }, // 지급액
      { width: 24 }, // 비고
      { width: 18 }, // 등록일시
      { width: 16 }, // 등록자
      { width: 18 }, // 수정일시
      { width: 16 }, // 수정자
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
    const fileName = generateExcelFileName('흡수율분석', monthInfo)

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
    console.error('엑셀 다운로드 오류:', err);
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
  }
}

async function deleteFilteredAnalysisData() {
  if (!selectedSettlementMonth.value) {
    alert('정산월을 선택해주세요.');
    return;
  }

  if (!confirm(`'${selectedSettlementMonth.value}'월의 현재 필터 조건(${selectedCompanyId.value === 'ALL' ? '전체' : companyOptions.value.find(c => c.id === selectedCompanyId.value)?.company_name}, ${selectedHospitalId.value === 'ALL' ? '전체' : hospitalOptions.value.find(h => h.id === selectedHospitalId.value)?.name}, ${prescriptionOffset.value === 0 ? '전체' : getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value)})에 해당하는 흡수율 분석 데이터를 삭제하시겠습니까?`)) {
    return;
  }

     loading.value = true;
   try {
     // === 전체 데이터 조회 (1,000건 제한 해결) ===
     let allIds = [];
     let from = 0;
     const batchSize = 1000;
     
     while (true) {
       let query = supabase
         .from('performance_records_absorption')
         .select('id')
         .eq('settlement_month', selectedSettlementMonth.value);
       
       if (selectedCompanyId.value !== 'ALL') {
         query = query.eq('company_id', selectedCompanyId.value);
       }
       if (selectedHospitalId.value !== 'ALL') {
         query = query.eq('client_id', selectedHospitalId.value);
       }
       
       if (prescriptionOffset.value !== 0) {
         const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
         query = query.eq('prescription_month', prescriptionMonth);
       }

       const { data, error } = await query
         .range(from, from + batchSize - 1);
       
       if (error) throw error;

       if (!data || data.length === 0) {
         break;
       }
       
       allIds = allIds.concat(data.map(item => item.id));
       
       // 가져온 데이터가 batchSize보다 적으면 마지막 배치
       if (data.length < batchSize) {
         break;
       }
       
       from += batchSize;
     }

     if (allIds.length === 0) {
       alert('삭제할 흡수율 분석 데이터가 없습니다.');
       return;
     }

     // === 배치 단위로 삭제 (Supabase 삭제 제한 대응) ===
     const deleteBatchSize = 500; // 배치 크기를 줄여서 안정성 향상
     let deletedCount = 0;
     
     for (let i = 0; i < allIds.length; i += deleteBatchSize) {
       const batchIds = allIds.slice(i, i + deleteBatchSize);
       
       const { error: deleteError } = await supabase
         .from('performance_records_absorption')
         .delete()
         .in('id', batchIds);

       if (deleteError) throw deleteError;
       
       deletedCount += batchIds.length;
       
       // 메모리 해제를 위한 짧은 지연
       await new Promise(resolve => setTimeout(resolve, 10));
     }

     alert(`흡수율 분석 데이터 ${deletedCount}건이 삭제되었습니다.`);
     await loadAbsorptionAnalysisResults();

  } catch (err) {
    console.error('흡수율 분석 데이터 삭제 오류:', err);
    alert(`흡수율 분석 데이터 삭제 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

async function checkReanalysisNeeded() {
  if (!selectedSettlementMonth.value) return;

  try {
    // 1. performance_records_absorption에서 가장 최근 analysis_time 조회
    const { data: latestAnalysisData, error: analysisError } = await supabase
      .from('performance_records_absorption')
      .select('analysis_time')
      .eq('settlement_month', selectedSettlementMonth.value)
      .not('analysis_time', 'is', null)
      .order('analysis_time', { ascending: false })
      .limit(1);

    if (analysisError) throw analysisError;

    // 분석 데이터가 없으면 검수 완료한 실적 정보만 체크
    if (!latestAnalysisData || latestAnalysisData.length === 0) {
      // 조건1: performance_records에서 해당 정산월, review_status 완료인 데이터
      const { data: performanceData, error: perfError } = await supabase
        .from('performance_records')
        .select('id')
        .eq('settlement_month', selectedSettlementMonth.value)
        .eq('review_status', '완료')
        .limit(1);

      if (perfError) throw perfError;

      if (performanceData && performanceData.length > 0) {
        const modalMessage = '검수 완료한 실적 정보가 있습니다.\n\n흡수율 분석을 실행하시겠습니까?';
        const reanalyze = confirm(modalMessage);
        
        if (reanalyze) {
          await calculateAbsorptionRates();
        }
      }
      
      // return 제거 - loadAbsorptionAnalysisResults가 호출되도록 함
    }

    // 분석 데이터가 있으면 기존 로직 실행 (변경사항 체크)
    let latestAnalysisDate = null;
    
    if (latestAnalysisData && latestAnalysisData.length > 0 && latestAnalysisData[0]) {
      // analysis_time을 기준으로 설정
      latestAnalysisDate = new Date(latestAnalysisData[0].analysis_time);
      
      latestAnalysisTime.value = latestAnalysisDate.toISOString();
    } else {
      loading.value = false;
      return;
    }

    // 2. 핵심 조건 체크: performance_records의 review_completed_at vs analysis_time
    const messages = [];

    // 조건1: performance_records에서 해당 정산월, review_status 완료인 데이터의 review_completed_at 체크
    const { data: performanceCompleted, error: perfCompletedError } = await supabase
      .from('performance_records')
      .select('id, review_completed_at')
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('review_status', '완료')
      .not('review_completed_at', 'is', null)
      .gte('review_completed_at', latestAnalysisDate.toISOString())
      .limit(5);

    if (perfCompletedError) throw perfCompletedError;

    if (performanceCompleted && performanceCompleted.length > 0) {
      messages.push('분석 이후에 검수 완료된 실적이 있습니다.');
    }

    // 조건2: 간단한 마스터 데이터 변경사항 체크 (선택사항)
    // 실제로는 performance_records의 review_completed_at만 체크하면 충분
    // 마스터 데이터 변경은 흡수율 계산에 직접적인 영향을 주지 않음

    // 3. 메시지가 있으면 모달 표시
    if (messages.length > 0) {
      const modalMessage = messages.join('\n') + '\n\n흡수율 분석을 다시 실행하시겠습니까?';
      const reanalyze = confirm(modalMessage);
      
      if (reanalyze) {
        await calculateAbsorptionRates();
      }
    }

  } catch (err) {
    console.error('재분석 필요성 체크 중 오류:', err);
  }
}

</script>

<style scoped>
.absorption-analysis-view { padding: 0px; }
.data-card-buttons { display: flex; }

/* 셀 배경색을 흰색으로 지정 */
:deep(.p-datatable-tbody > tr > td) {
  background: #ffffff !important;
}


:deep(.p-datatable-tfoot > tr > td) {
    background: #f8f9fa !important;
    font-weight: bold;
}

/* 비활성화된 정렬 컨트롤 스타일 */
.disabled-label {
  color: #6c757d !important;
}

.disabled-select {
  background-color: #f8f9fa !important;
  background-color: #e4e4e4 !important;
  color: #495057 !important;
}

/* 로딩 오버레이 스타일 개선 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #666;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 