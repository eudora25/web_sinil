<template>
  <div class="user-settlement-detail-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <!-- 상단 필터카드 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px">
          <label>정산월</label>
          <select v-model="selectedMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px">
          <label>처방월</label>
          <select v-model="selectedPrescriptionMonth" class="select_month">
            <option value="">- 전체 -</option>
            <option v-for="m in availablePrescriptionMonths" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="white-space: nowrap; font-weight: 400">병의원</label>
          <select v-model="selectedClient" class="select_240px">
            <option value="">- 전체 -</option>
            <option v-for="c in availableClients" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn-notice-filter" @click="showNoticePopup(true)">전달사항</button>
        </div>
      </div>
    </div>

    <!-- 데이터 카드 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0; justify-content: space-between;">
        <div class="total-count-display">전체 {{ detailRows.length }} 건</div>
        <div class="settlement-summary">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; gap: 16px;">
              <span style="font-weight: 600;">지급 처방액 : {{ settlementSummary.payment_prescription_amount?.toLocaleString() }}원</span>
              <span style="font-weight: 600;">구간수수료 : {{ settlementSummary.section_commission_amount?.toLocaleString() }}원 ({{ (settlementSummary.section_commission_rate * 100)?.toFixed(1) }}%)</span>
            </div>
            <div style="display: flex; gap: 16px;">
              <span style="font-weight: 600;">공급가 : {{ settlementSummary.supply_price?.toLocaleString() }}원</span>
              <span style="font-weight: 600;">부가세 : {{ settlementSummary.vat_price?.toLocaleString() }}원</span>
              <span style="font-weight: 600;">합계액(총 지급액 기준) : {{ settlementSummary.total_price?.toLocaleString() }}원</span>
            </div>
          </div>
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-download" @click="downloadExcel">엑셀 다운로드</button>
        </div>
      </div>
      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable
          :value="detailRows" 
          :loading="loading"
          scrollable 
          scrollHeight="calc(100vh - 220px)"
          class="user-settlement-detail-table"
          >
          <template #empty>
            <div v-if="!loading">공유된 정산 내역이 없습니다.</div>
          </template>
          <Column header="No" :headerStyle="{ width: columnWidths.no }">
            <template #body="slotProps">{{ slotProps.index + 1 }}</template>
          </Column>
          <Column field="review_action" header="상태" :headerStyle="{ width: columnWidths.review_action }" :bodyStyle="{ textAlign: 'center !important' }">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ slotProps.data.review_action || '정상' }}
              </span>
            </template>
          </Column>
          <Column field="client_name" header="병의원명" :headerStyle="{ width: columnWidths.client_name }" :sortable="true">
            <template #body="slotProps">
              <span 
                class="ellipsis-cell" 
                :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
                :title="slotProps.data.client_name" 
                @mouseenter="checkOverflow" 
                @mouseleave="removeOverflowClass"
              >
                {{ slotProps.data.client_name }}
              </span>
            </template>
          </Column>
          <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }" :bodyStyle="{ textAlign: 'center !important' }">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ slotProps.data.prescription_month }}
              </span>
            </template>
          </Column>
          <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name }" :sortable="true">
            <template #body="slotProps">
              <span 
                class="ellipsis-cell" 
                :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
                :title="slotProps.data.product_name_display" 
                @mouseenter="checkOverflow" 
                @mouseleave="removeOverflowClass"
              >
                {{ slotProps.data.product_name_display }}
              </span>
            </template>
          </Column>
          <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ slotProps.data.insurance_code }}
              </span>
            </template>
          </Column>
          <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ Math.round(slotProps.data._raw_price || 0).toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ (slotProps.data._raw_qty || 0).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}
              </span>
            </template>
          </Column>
          <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span 
                :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
                :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount"
              >
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount }}
              </span>
            </template>
          </Column>
          <Column field="commission_rate" header="수수료율" :headerStyle="{ width: columnWidths.commission_rate }" :sortable="true">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ slotProps.data.commission_rate }}
              </span>
            </template>
          </Column>
          <Column field="applied_absorption_rate" header="반영 흡수율" :headerStyle="{ width: columnWidths.applied_absorption_rate }" :bodyStyle="{ textAlign: 'center !important' }" :sortable="true">
            <template #body="slotProps">
              <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
                {{ slotProps.data.review_action === '삭제' ? '0%' : formatAppliedAbsorptionRate(slotProps.data.applied_absorption_rate) }}
              </span>
            </template>
          </Column>
          <Column field="payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span 
                :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
                :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount"
              >
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount }}
              </span>
            </template>
          </Column>
          <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
            <template #body="slotProps">
              <span 
                class="ellipsis-cell" 
                :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
                :title="slotProps.data.remarks" 
                @mouseenter="checkOverflow" 
                @mouseleave="removeOverflowClass"
              >
                {{ slotProps.data.remarks }}
              </span>
            </template>
          </Column>
          <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="7" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footerClass="footer-cell" />
              <Column footerClass="footer-cell" />
              <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footerClass="footer-cell" />
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

    <!-- 전달사항 팝업 -->
    <div v-if="showNoticeModal" class="modal-overlay">
      <div class="modal-content modal-center">
        <div class="modal-header">
          <h2>{{ selectedMonth }} 정산내역서 전달사항</h2>
          <button class="modal-close-btn" @click="closeNoticeModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="noticeData" style="display: flex; flex-direction: column; gap: 20px;">
            <!-- 전체 전달사항 -->
            <div v-if="noticeData.generalNotice">
              <h4 style="margin: 0 0 10px 0; color: #333; padding-bottom: 5px; border-bottom: 1px solid #eee;">
                📢 전체 전달사항
              </h4>
              <div style="padding: 15px;">
                <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; line-height: 1.5;">{{ noticeData.generalNotice }}</pre>
              </div>
            </div>
            
            <!-- 개별 전달사항 -->
            <div v-if="noticeData.individualNotice">
              <h4 style="margin: 0 0 10px 0; color: #333; padding-bottom: 5px; border-bottom: 1px solid #eee;">
                📋 개별 전달사항
              </h4>
              <div style="padding: 15px;">
                <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; line-height: 1.5;">{{ noticeData.individualNotice }}</pre>
              </div>
            </div>
            
            <!-- 전달사항이 없는 경우 -->
            <div v-if="!noticeData.generalNotice && !noticeData.individualNotice" style="text-align: center; color: #666; padding: 40px;">
              등록된 전달사항이 없습니다.
            </div>
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
import { ref, onMounted, watch, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { getNoticeModalHidePreference, setNoticeModalHidePreference } from '@/utils/userPreferences';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const companyId = ref('');
const availableMonths = ref([]);
const selectedMonth = ref('');
const availablePrescriptionMonths = ref([]);
const selectedPrescriptionMonth = ref('');
const availableClients = ref([]);
const selectedClient = ref('');
const detailRows = ref([]);
const allDataForMonth = ref([]);
const loading = ref(true);
const sectionCommissionRate = ref(0);

// 전달사항 관련
const showNoticeModal = ref(false);
const noticeData = ref(null);
const hideNoticeModal = ref(false);
const currentSettlementMonthId = ref(null);

const totalQty = computed(() => detailRows.value.reduce((sum, row) => {
  // 삭제된 건은 수량을 0으로 계산
  if (row.review_action === '삭제') return sum;
  return sum + (row._raw_qty || 0);
}, 0).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const totalPrescriptionAmount = computed(() => detailRows.value.reduce((sum, row) => {
  // 삭제된 건은 처방액을 0으로 계산
  if (row.review_action === '삭제') return sum;
  return sum + (row._raw_prescription_amount || 0);
}, 0).toLocaleString());
const totalPaymentAmount = computed(() => detailRows.value.reduce((sum, row) => {
  // 삭제된 건은 지급액을 0으로 계산
  if (row.review_action === '삭제') return sum;
  return sum + (row._raw_payment_amount || 0);
}, 0).toLocaleString());

const settlementSummary = computed(() => {
  // 지급 처방액 계산 (수수료율이 있는 정상 건의 처방액만)
  const paymentPrescriptionAmount = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    // 수수료율을 숫자로 변환하여 비교 (목록 페이지와 동일한 로직)
    const commissionRate = parseFloat(row.commission_rate?.replace('%', '') || '0') / 100;
    if (commissionRate > 0) {
      return sum + (row._raw_prescription_amount || 0);
    }
    return sum;
  }, 0);

  // 기본 지급액 계산 (구간수수료 제외)
  const basePaymentAmount = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_payment_amount || 0);
  }, 0);

  // 구간수수료 계산: (지급 처방액) * 구간수수료율
  const sectionCommissionAmount = Math.round(paymentPrescriptionAmount * (sectionCommissionRate.value || 0));

  // 총 지급액: 기본 지급액 + 구간수수료
  const totalPaymentAmount = basePaymentAmount + sectionCommissionAmount;

  const supplyPrice = Math.round(totalPaymentAmount / 1.1);
  const vatPrice = Math.round(totalPaymentAmount - supplyPrice);
  
  return {
    payment_prescription_amount: paymentPrescriptionAmount,
    base_payment_amount: basePaymentAmount,
    section_commission_amount: sectionCommissionAmount,
    total_price: totalPaymentAmount,
    supply_price: supplyPrice,
    vat_price: vatPrice,
    section_commission_rate: sectionCommissionRate.value,
  };
});

const columnWidths = {
   no: '4%',
   review_action: '6%',
   client_name: '16%',
   prescription_month: '6%',
   product_name: '14%',
   insurance_code: '7%',
   price: '7%',
   prescription_qty: '7%',
   prescription_amount: '7%',
   commission_rate: '7%',
   applied_absorption_rate: '7%',
   payment_amount: '7%',
   remarks: '12%' };

async function fetchCompanyId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;
  const { data, error } = await supabase.from('companies').select('id').eq('user_id', session.user.id).maybeSingle();
  if (!error && data) companyId.value = data.id;
}

async function fetchAvailableMonths() {
  if (!companyId.value) return;
  
  try {
    const { data, error } = await supabase
      .from('settlement_share')
      .select('settlement_month')
      .eq('company_id', companyId.value)
      .eq('share_enabled', true);
    
    if (error) {
      console.error('정산월 조회 오류:', error);
      availableMonths.value = [];
      return;
    }
    
    if (data && data.length > 0) {
      availableMonths.value = Array.from(new Set(data.map(d => d.settlement_month))).sort((a, b) => b.localeCompare(a));
      if (availableMonths.value.length > 0) {
        selectedMonth.value = availableMonths.value[0];
      }
    } else {
      availableMonths.value = [];
    }
  } catch (err) {
    console.error('정산월 조회 예외:', err);
    availableMonths.value = [];
  }
}

async function fetchAllDataForMonth() {
  if (!companyId.value || !selectedMonth.value) {
    allDataForMonth.value = [];
    return;
  }


  try {
  
  // 1. settlement_share 테이블에서 공유 여부 확인
  const { data: shareData, error: shareError } = await supabase
    .from('settlement_share')
    .select('share_enabled')
    .eq('settlement_month', selectedMonth.value)
    .eq('company_id', companyId.value)
    .maybeSingle();

  // 공유되지 않았거나 오류 발생 시, 빈 화면 처리
  if (shareError || !shareData || !shareData.share_enabled) {
    allDataForMonth.value = [];
    updateFilterOptions();
    filterDetailRows();
    return;
  }

  // 2. 공유된 경우에만 performance_records 데이터 조회 (관리자 페이지와 동일한 방식)
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('performance_records')
      .select(`
        *,
        clients ( name ),
        products ( id, product_name, insurance_code, price )
      `)
      .eq('settlement_month', selectedMonth.value)
      .eq('company_id', companyId.value)
      .range(from, from + batchSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('데이터 조회 오류:', error);
      allDataForMonth.value = [];
      return;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData = allData.concat(data);
    
    if (data.length < batchSize) {
      break;
    }
    
    from += batchSize;
  }
  
  // 검토 완료된 건만 필터링 (사용자 페이지는 완료된 실적만 표시)
  const data = allData.filter(record => record.review_status === '완료');
  // 반영 흡수율 데이터를 별도로 조회합니다.
  const recordIds = data.map(record => record.id);
  let absorptionRates = {};
  
  if (recordIds.length > 0) {
    const { data: absorptionData, error: absorptionError } = await supabase
      .from('applied_absorption_rates')
      .select('performance_record_id, applied_absorption_rate')
      .in('performance_record_id', recordIds);
    
    if (!absorptionError && absorptionData) {
      absorptionRates = absorptionData.reduce((acc, item) => {
        acc[item.performance_record_id] = item.applied_absorption_rate;
        return acc;
      }, {});
    }
  }
  
  // 프로모션 수수료 정보 조회 (성능 최적화를 위해 한 번에 조회)
  const productIds = [...new Set(data.map(r => r.products?.id).filter(id => id))];
  const productInsuranceCodeMap = new Map();
  
  if (productIds.length > 0) {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, insurance_code')
      .in('id', productIds);
    
    if (!productsError && productsData) {
      productsData.forEach(p => {
        if (p.insurance_code) {
          // 보험코드를 문자열로 정규화 (앞뒤 공백 제거, 숫자도 문자열로 변환)
          const normalizedCode = String(p.insurance_code).trim();
          productInsuranceCodeMap.set(p.id, normalizedCode);
        }
      });
    }
  }

  // 병원별 프로모션 실적 정보 조회
  const hospitalIds = [...new Set(data.map(r => r.client_id).filter(id => id))];
  const insuranceCodes = Array.from(productInsuranceCodeMap.values());
  let hospitalPerformanceMap = new Map();
  let promotionProductsMap = new Map();
  let excludedHospitalsMap = new Set();
  
  if (hospitalIds.length > 0 && companyId.value) {
    // 1. promotion_product_hospital_performance에서 조회 (조인 없이, RLS 정책 수정 후 조회 가능)
    // 관리자 페이지와 동일하게 has_performance = true 조건 추가
    const { data: hospitalPerf, error: hospitalPerfError } = await supabase
      .from('promotion_product_hospital_performance')
      .select(`
        hospital_id,
        first_performance_cso_id,
        has_performance,
        promotion_product_id
      `)
      .in('hospital_id', hospitalIds)
      .eq('first_performance_cso_id', companyId.value)
      .eq('has_performance', true);
    
    if (!hospitalPerfError && hospitalPerf && hospitalPerf.length > 0) {
      // 2. promotion_product_id 목록 추출
      const promotionProductIds = [...new Set(hospitalPerf.map(hp => hp.promotion_product_id).filter(id => id))];
      
      // 3. promotion_product_list에서 상세 정보 조회 (id로 조회, RLS 제약 없음)
      if (promotionProductIds.length > 0) {
        const { data: promotionProducts, error: promotionError } = await supabase
          .from('promotion_product_list')
          .select('id, insurance_code, final_commission_rate, promotion_start_date, promotion_end_date')
          .in('id', promotionProductIds);
        
        if (!promotionError && promotionProducts) {
          // promotionProductsMap 구성
          promotionProducts.forEach(pp => {
            const key = String(pp.insurance_code).trim();
            promotionProductsMap.set(key, pp);
          });
          
          // hospitalPerformanceMap 구성
          hospitalPerf.forEach(hp => {
            const promotionProduct = promotionProducts.find(pp => pp.id === hp.promotion_product_id);
            if (promotionProduct) {
              const insuranceCode = String(promotionProduct.insurance_code).trim();
              const hospitalId = hp.hospital_id;
              const companyIdValue = hp.first_performance_cso_id;
              const key = `${hospitalId}_${insuranceCode}_${companyIdValue}`;
              
              hospitalPerformanceMap.set(key, {
                insurance_code: promotionProduct.insurance_code,
                final_commission_rate: promotionProduct.final_commission_rate,
                promotion_start_date: promotionProduct.promotion_start_date,
                promotion_end_date: promotionProduct.promotion_end_date
              });
            }
          });
        }
      }
    }
  }
  
  // 제외 병원 목록 조회
  if (hospitalIds.length > 0) {
    const { data: excludedHospitals, error: excludedError } = await supabase
      .from('promotion_product_excluded_hospitals')
      .select(`
        hospital_id,
        promotion_product_list!inner(insurance_code)
      `);
    
    if (!excludedError && excludedHospitals) {
      excludedHospitals.forEach(eh => {
        const insuranceCode = eh.promotion_product_list?.insurance_code;
        if (insuranceCode) {
          const key = `${String(insuranceCode)}_${eh.hospital_id}`;
          excludedHospitalsMap.add(key);
        }
      });
    }
  }
  
  // 병의원별 처방액 합계 계산 (소액처 판별용)
  const clientPrescriptionMap = new Map();
  for (const row of data) {
    if (row.review_action === '삭제') continue;
    const qty = row.prescription_qty ?? 0;
    const price = row.products?.price ?? 0;
    const amt = Math.round(qty * price);
    clientPrescriptionMap.set(row.client_id, (clientPrescriptionMap.get(row.client_id) || 0) + amt);
  }

  allDataForMonth.value = data.map(row => {
    const price = row.products?.price || 0;
    const qty = row.prescription_qty || 0;
    // review_action이 '삭제'인 경우 처방수량을 0으로 설정
    const finalQty = row.review_action === '삭제' ? 0 : qty;
    const prescriptionAmount = Math.round(finalQty * price);
    
    // 기본 수수료율 확인 (숫자로 변환)
    let commissionRate = 0;
    if (row.commission_rate !== null && row.commission_rate !== undefined) {
      // 이미 숫자면 그대로 사용, 문자열이면 변환
      commissionRate = typeof row.commission_rate === 'number' 
        ? row.commission_rate 
        : parseFloat(row.commission_rate) || 0;
    }
    
    // 프로모션 수수료 적용 확인 (관리자 뷰와 동일한 로직)
    const productId = row.products?.id;
    if (productId) {
      const insuranceCode = productInsuranceCodeMap.get(productId);
      if (insuranceCode) {
        const hospitalId = row.client_id;
        const key = `${hospitalId}_${insuranceCode}_${companyId.value}`;
        const promotionInfo = hospitalPerformanceMap.get(key);
        
        // 제외 병원 확인
        const excludedKey = `${insuranceCode}_${hospitalId}`;
        const isExcluded = excludedHospitalsMap.has(excludedKey);
        
        if (promotionInfo && !isExcluded) {
          // 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
          let isWithinPromotionPeriod = true;
          
          const settlementDate = new Date(selectedMonth.value + '-01'); // 정산월의 첫 날
          const lastDayOfSettlementMonth = new Date(settlementDate.getFullYear(), settlementDate.getMonth() + 1, 0); // 정산월의 마지막 날
          
          if (promotionInfo.promotion_start_date) {
            const startDate = new Date(promotionInfo.promotion_start_date);
            // 정산월의 첫 날이 시작일 이후 또는 같아야 함
            if (settlementDate < startDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          if (promotionInfo.promotion_end_date) {
            const endDate = new Date(promotionInfo.promotion_end_date);
            // 정산월의 마지막 날이 종료일 이전 또는 같아야 함
            if (lastDayOfSettlementMonth > endDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          // 프로모션 기간 내에 있는 경우에만 final_commission_rate 사용
          if (isWithinPromotionPeriod && promotionInfo.final_commission_rate !== null && promotionInfo.final_commission_rate !== undefined) {
            const finalRate = Number(promotionInfo.final_commission_rate);
            commissionRate = finalRate;
          }
        }
      }
    }
    
    // 반영 흡수율 적용하여 최종 지급액 계산 (정수 반올림)
    // 관리자 상세 뷰와 동일한 계산 방식: 처방액 × 반영 흡수율 × 수수료율. 미설정 시 100% (기본값 1)
    const appliedAbsorptionRate = absorptionRates[row.id] !== null && absorptionRates[row.id] !== undefined ? absorptionRates[row.id] : 1;
    // 소액처 체크: 병의원별 처방액 합계가 10만원 미만이면 지급액 0원
    const clientTotal = clientPrescriptionMap.get(row.client_id) || 0;
    const isSmallClient = clientTotal < 100000;
    const finalPaymentAmount = isSmallClient ? 0 : Math.round(prescriptionAmount * appliedAbsorptionRate * commissionRate);
    
    return {
      ...row,
      client_name: row.clients?.name || 'N/A',
      product_name_display: row.products?.product_name || 'N/A',
      insurance_code: row.products?.insurance_code || 'N/A',
      price: price,
      prescription_qty: finalQty,
      prescription_amount: prescriptionAmount,
      payment_amount: finalPaymentAmount, // 최종 지급액 사용
      commission_rate: `${((commissionRate || 0) * 100).toFixed(1)}%`,
      applied_absorption_rate: appliedAbsorptionRate, // 반영 흡수율 추가
      // 원본 숫자 데이터 보존
      _raw_price: price,
      _raw_qty: finalQty,
      _raw_prescription_amount: prescriptionAmount,
      _raw_payment_amount: finalPaymentAmount, // 최종 지급액 사용
    };
  });
  
  updateFilterOptions();
  filterDetailRows();
  } catch (error) {
    console.error('데이터 로딩 오류:', error);
    allDataForMonth.value = [];
    updateFilterOptions();
    filterDetailRows();
  }
}

function updateFilterOptions() {
  if (allDataForMonth.value.length > 0) {
    availablePrescriptionMonths.value = [...new Set(allDataForMonth.value.map(r => r.prescription_month))].sort((a, b) => b.localeCompare(a));
    availableClients.value = [...new Set(allDataForMonth.value.map(r => r.client_name))].sort();
  } else {
    availablePrescriptionMonths.value = [];
    availableClients.value = [];
  }
}

function filterDetailRows() {
  let filtered = [...allDataForMonth.value];
  if (selectedPrescriptionMonth.value) {
    filtered = filtered.filter(row => row.prescription_month === selectedPrescriptionMonth.value);
  }
  if (selectedClient.value) {
    filtered = filtered.filter(row => row.client_name === selectedClient.value);
  }

  filtered.sort((a, b) => {
    // 1. 병의원명 가나다순
    const clientNameCompare = a.client_name.localeCompare(b.client_name, 'ko');
    if (clientNameCompare !== 0) return clientNameCompare;

    // 2. 제품명 가나다순
    const productNameCompare = a.product_name_display.localeCompare(b.product_name_display, 'ko');
    if (productNameCompare !== 0) return productNameCompare;

    // 3. 처방수량 높은 순
    const qtyA = a._raw_qty || 0;
    const qtyB = b._raw_qty || 0;
    return qtyB - qtyA;
  });

  detailRows.value = filtered.map(row => ({
    ...row,
    price: (row.price || 0).toLocaleString(),
    prescription_qty: (row.prescription_qty || 0).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    prescription_amount: Math.round(row.prescription_amount || 0).toLocaleString(),
    payment_amount: Math.round(row.payment_amount || 0).toLocaleString()
  }));
}

watch(selectedMonth, async () => {
  selectedPrescriptionMonth.value = '';
  selectedClient.value = '';
  await fetchAllDataForMonth();
  
  // 현재 선택된 정산월의 ID 업데이트
  if (selectedMonth.value) {
    const { data: monthData } = await supabase
      .from('settlement_months')
      .select('id')
      .eq('settlement_month', selectedMonth.value)
      .single();
    currentSettlementMonthId.value = monthData?.id || null;
  }
  
  // 정산월 변경 시 전달사항 모달 자동 표시 (사용자 설정 확인 후)
  if (selectedMonth.value) {
    setTimeout(async () => {
      await showNoticePopup();
    }, 500); // 0.5초 후 표시
  }
});
watch([selectedPrescriptionMonth, selectedClient], filterDetailRows);

onMounted(() => {
  initializeData();
});

async function initializeData() {
  loading.value = true;
  try {
    await fetchCompanyId();
    await fetchAvailableMonths();
    if (selectedMonth.value) {
      // 현재 선택된 정산월의 ID 설정
      const { data: monthData } = await supabase
        .from('settlement_months')
        .select('id')
        .eq('settlement_month', selectedMonth.value)
        .maybeSingle();
      currentSettlementMonthId.value = monthData?.id || null;
      
      // 구간수수료율 조회
      const { data: shareData, error: shareError } = await supabase
        .from('settlement_share')
        .select('section_commission_rate')
        .eq('settlement_month', selectedMonth.value)
        .eq('company_id', companyId.value)
        .maybeSingle();
      
      if (shareError) {
        console.error('구간수수료율 조회 오류:', shareError);
        sectionCommissionRate.value = 0;
      } else {
        sectionCommissionRate.value = shareData?.section_commission_rate || 0;
      }
      
      await fetchAllDataForMonth();
      // 페이지 진입 시 전달사항 팝업 자동 표시 (사용자 설정 확인 후)
      setTimeout(async () => {
        await showNoticePopup();
      }, 1000); // 1초 후 표시
    }
  } finally {
    loading.value = false;
  }
}

async function downloadExcel() {
  if (!detailRows.value.length) return;
  
  try {
    // 전달사항 조회
    let generalNotice = null;
    let individualNotice = null;
    
    if (selectedMonth.value && companyId.value) {
      // 전체 전달사항 조회
      const { data: generalData } = await supabase
        .from('settlement_months')
        .select('notice_payment')
        .eq('settlement_month', selectedMonth.value)
        .maybeSingle();
      
      // 개별 전달사항 조회
      const { data: individualData } = await supabase
        .from('settlement_share')
        .select('notice_individual')
        .eq('settlement_month', selectedMonth.value)
        .eq('company_id', companyId.value)
        .maybeSingle();
      
      generalNotice = generalData?.notice_payment;
      individualNotice = individualData?.notice_individual;
    }

    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook();
    
    // 첫 번째 시트: 정산내역서 요약
    const summarySheet = workbook.addWorksheet(`${selectedMonth.value.split('-')[0]}년${selectedMonth.value.split('-')[1]}월`);
    
    // B2: 제목
    const year = selectedMonth.value.split('-')[0];
    const month = selectedMonth.value.split('-')[1];
    const title = `${year}년 ${month}월 신일제약 정산내역서`;
    
    const titleCell = summarySheet.getCell('B2');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    
    // 계산을 위한 변수들 (구간수수료 포함한 총 지급액으로 계산)
    const basePaymentAmount = detailRows.value.reduce((sum, row) => sum + (row._raw_payment_amount || 0), 0);
    const sectionCommissionAmount = settlementSummary.value.section_commission_amount || 0;
    const totalAmount = basePaymentAmount + sectionCommissionAmount; // 구간수수료 포함한 총 지급액
    const supplyPrice = Math.round(totalAmount / 1.1);
    const vatPrice = Math.round(totalAmount - supplyPrice); // 관리자 상세 뷰와 동일하게 Math.round 적용
    
    // B5: 요약 정보 테이블 헤더 (2행 3열 구조)
    // 1행: 지급 처방액 | 구간 수수료율 | 구간 수수료
    summarySheet.getCell('B5').value = '지급 처방액';
    summarySheet.getCell('C5').value = '구간 수수료율';
    summarySheet.getCell('D5').value = '구간 수수료';
    
    // B6: 요약 정보 데이터 (1행) - 지급 처방액, 구간 수수료율, 구간 수수료
    summarySheet.getCell('B6').value = settlementSummary.value.payment_prescription_amount || 0;
    summarySheet.getCell('B6').numFmt = '#,##0';
    summarySheet.getCell('B6').font = { size: 11 };
    summarySheet.getCell('B6').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('C6').value = sectionCommissionRate.value;
    summarySheet.getCell('C6').numFmt = '0.0%';
    summarySheet.getCell('C6').font = { size: 11 };
    summarySheet.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('D6').value = settlementSummary.value.section_commission_amount || 0;
    summarySheet.getCell('D6').numFmt = '#,##0';
    summarySheet.getCell('D6').font = { size: 11 };
    summarySheet.getCell('D6').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // B8: 헤더 2행 - 공급가 | 부가세 | 합계액 (B7은 빈칸)
    summarySheet.getCell('B8').value = '공급가';
    summarySheet.getCell('C8').value = '부가세';
    summarySheet.getCell('D8').value = '합계액';
    
    // 헤더 스타일 설정 (기존 테이블과 동일)
    for (let col = 2; col <= 4; col++) { // B, C, D 열
      for (let row = 5; row <= 8; row++) { // 5행(1행 헤더), 8행(2행 헤더)
        if (row === 5 || row === 8) { // 헤더 행만 스타일 적용
          const cell = summarySheet.getCell(row, col);
          cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '76933C' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    }
    
    // B9: 요약 정보 데이터 (2행) - 공급가, 부가세, 합계액
    summarySheet.getCell('B9').value = supplyPrice;
    summarySheet.getCell('B9').numFmt = '#,##0';
    summarySheet.getCell('B9').font = { size: 11 };
    summarySheet.getCell('B9').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('C9').value = vatPrice;
    summarySheet.getCell('C9').numFmt = '#,##0';
    summarySheet.getCell('C9').font = { size: 11 };
    summarySheet.getCell('C9').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('D9').value = totalAmount;
    summarySheet.getCell('D9').numFmt = '#,##0';
    summarySheet.getCell('D9').font = { size: 11 };
    summarySheet.getCell('D9').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 요약 정보 테이블 테두리 설정 (B, C, D 열, 5-6행, 8-9행)
    for (let row = 5; row <= 6; row++) { // 1행 테이블
      for (let col = 2; col <= 4; col++) { // B, C, D 열
        const cell = summarySheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      }
    }
    for (let row = 8; row <= 9; row++) { // 2행 테이블
      for (let col = 2; col <= 4; col++) { // B, C, D 열
        const cell = summarySheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      }
    }
    
    // B11: 전달사항
    const noticeTitleCell = summarySheet.getCell('B11');
    noticeTitleCell.value = '전달사항';
    noticeTitleCell.font = { bold: true, size: 11 };
    
    // 전달사항 내용 추가
    let currentRow = 13;
    if (generalNotice || individualNotice) {
      if (generalNotice) {
        const generalLines = generalNotice.split('\n');
        generalLines.forEach(line => {
          if (line.trim()) {
            summarySheet.getCell(`B${currentRow}`).value = line.trim();
            currentRow++;
          }
        });
        currentRow++; // 빈 줄
      }
      if (individualNotice) {
        const individualLines = individualNotice.split('\n');
        individualLines.forEach(line => {
          if (line.trim()) {
            summarySheet.getCell(`B${currentRow}`).value = line.trim();
            currentRow++;
          }
        });
      }
    } else {
      summarySheet.getCell('B13').value = '등록된 전달사항이 없습니다.';
    }
    
    // 첫 번째 시트 컬럼 너비 설정
    summarySheet.columns = [
      { width: 8 },   // A열
      { width: 16 },  // B열
      { width: 16 },  // C열
      { width: 16 },  // D열
      { width: 16 }   // E열
    ];
    
    // 첫 번째 시트 눈금선 숨기기
    summarySheet.views = [
      {
        showGridLines: false
      }
    ];
    
    // 두 번째 시트: 상세 내역
    const detailSheet = workbook.addWorksheet('상세내역');
    
    // 헤더 추가
    const headers = ['No', '상태', '병의원명', '처방월', '제품명', '보험코드', '약가', '처방수량', '처방액', '수수료율', '반영 흡수율', '지급액', '비고'];
    detailSheet.addRow(headers);
    
    // 헤더 스타일 설정
    const headerRow = detailSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '76933C' } // RGB(118, 147, 60)
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // 데이터 추가 (삭제 행은 화면과 동일하게 상태 '삭제', 처방액·지급액·반영 흡수율 0으로 표시)
    detailRows.value.forEach((row, index) => {
      const isDeleted = row.review_action === '삭제';
      const dataRow = detailSheet.addRow([
        index + 1,
        row.review_action || '정상',
        row.client_name,
        row.prescription_month,
        row.product_name_display,
        row.insurance_code,
        row._raw_price || 0,
        row._raw_qty || 0,
        isDeleted ? 0 : (row._raw_prescription_amount || 0),
        Number(String(row.commission_rate).replace('%', '')) / 100,
        isDeleted ? 0 : appliedAbsorptionRateForExcel(row.applied_absorption_rate),
        isDeleted ? 0 : (row._raw_payment_amount || 0),
        row.remarks || ''
      ]);
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle' };
        
        // 가운데 정렬이 필요한 컬럼들 (No, 상태, 처방월, 보험코드)
        if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // 숫자 형식 설정
        if (colNumber === 7) { // 약가
          cell.numFmt = '#,##0';
        } else if (colNumber === 8) { // 처방수량
          cell.numFmt = '#,##0.0';
        } else if (colNumber === 9) { // 처방액
          cell.numFmt = '#,##0';
        } else if (colNumber === 10) { // 수수료율
          cell.numFmt = '0.0%';
        } else if (colNumber === 11) { // 반영 흡수율
          cell.numFmt = '0.0%';
        } else if (colNumber === 12) { // 지급액
          cell.numFmt = '#,##0';
        }
      });
    });
    
    // 합계 행 추가
    const totalQtySum = detailRows.value.reduce((sum, row) => sum + (row._raw_qty || 0), 0);
    const totalPrescriptionAmountSum = detailRows.value.reduce((sum, row) => sum + (row._raw_prescription_amount || 0), 0);
    const totalPaymentAmountSum = detailRows.value.reduce((sum, row) => sum + (row._raw_payment_amount || 0), 0);
    
    // 구간수수료 계산 (엑셀용)
    const excelPaymentPrescriptionAmount = detailRows.value.reduce((sum, row) => {
      if (row.review_action === '삭제') return sum;
      if (row.commission_rate && parseFloat(row.commission_rate.replace('%', '')) > 0) {
        return sum + (row._raw_prescription_amount || 0);
      }
      return sum;
    }, 0);
    const excelSectionCommissionAmount = Math.round(excelPaymentPrescriptionAmount * (sectionCommissionRate.value || 0));
    const totalPaymentAmountWithCommission = totalPaymentAmountSum + excelSectionCommissionAmount;
    
    const totalRow = detailSheet.addRow([
      '',
      '',
      '',
      '',
      '',
      '',
      '합계',
      totalQtySum,
      totalPrescriptionAmountSum,
      '',
      '',
      totalPaymentAmountWithCommission,
      `구간수수료 ${(sectionCommissionRate.value * 100)?.toFixed(1)}% 포함`
    ]);
    
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
      if (colNumber === 7) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
    
    // 합계행 숫자 형식 설정
    totalRow.getCell(8).numFmt = '#,##0.0'; // 처방수량
    totalRow.getCell(9).numFmt = '#,##0'; // 처방액
    totalRow.getCell(12).numFmt = '#,##0'; // 지급액
    
    // 컬럼 너비 설정
    detailSheet.columns = [
      { width: 8 },   // No
      { width: 8 },   // 상태
      { width: 28 },  // 병의원명
      { width: 10 },  // 처방월
      { width: 28 },  // 제품명
      { width: 12 },  // 보험코드
      { width: 12 },  // 약가
      { width: 12 },  // 처방수량
      { width: 16 },  // 처방액
      { width: 12 },  // 수수료율
      { width: 12 },  // 반영 흡수율
      { width: 16 },  // 지급액
      { width: 20 }   // 비고
    ];
    
    // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
    for (let row = 1; row <= detailSheet.rowCount; row++) {
      for (let col = 1; col <= 13; col++) {
        const cell = detailSheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      }
    }
    
    // 헤더행 고정 및 눈금선 숨기기
    detailSheet.views = [
      {
        showGridLines: false,
        state: 'frozen',
        xSplit: 0,
        ySplit: 1
      }
    ];
    
    // 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    const fileName = `정산내역서상세_${selectedMonth.value || ''}_${today}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    
  } catch (err) {
    console.error('엑셀 다운로드 오류:', err);
    showError('엑셀 다운로드 중 오류가 발생했습니다.');
  }
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

// 전달사항 관련 함수들
async function showNoticePopup(isManualClick = false) {
  if (!selectedMonth.value || !companyId.value || !currentSettlementMonthId.value) {
    showWarning('정산월을 선택해주세요.');
    return;
  }
  
  // 수동 클릭이 아닌 경우에만 사용자 설정 확인 (자동 표시 시에만 숨김 처리)
  if (!isManualClick) {
    const shouldHide = await getNoticeModalHidePreference('settlement', currentSettlementMonthId.value);
    if (shouldHide) {
      return; // 모달을 표시하지 않음
    }
  }
  
  try {
    // 전체 전달사항 조회
    const { data: generalNotice, error: generalError } = await supabase
      .from('settlement_months')
      .select('notice_payment')
      .eq('settlement_month', selectedMonth.value)
      .maybeSingle();
    
    // 개별 전달사항 조회
    const { data: individualNotice, error: individualError } = await supabase
      .from('settlement_share')
      .select('notice_individual')
      .eq('settlement_month', selectedMonth.value)
      .eq('company_id', companyId.value)
      .maybeSingle();
    
    if (generalError || individualError) {
    }
    
    noticeData.value = {
      generalNotice: generalNotice?.notice_payment || null,
      individualNotice: individualNotice?.notice_individual || null
    };
    
    // 사용자의 이전 설정 상태를 체크박스에 반영 (자동/수동 모두)
    const shouldHide = await getNoticeModalHidePreference('settlement', currentSettlementMonthId.value);
    hideNoticeModal.value = shouldHide;
    
    showNoticeModal.value = true;
  } catch (err) {
    console.error('전달사항 조회 오류:', err);
    showError('전달사항을 불러오는 중 오류가 발생했습니다.');
  }
}

async function closeNoticeModal() {
  // 새로운 심플한 체크 로직 적용
  await setNoticeModalHidePreference('settlement', hideNoticeModal.value, currentSettlementMonthId.value);
  
  showNoticeModal.value = false;
  noticeData.value = null;
  hideNoticeModal.value = false; // 체크박스 초기화
}

// 엑셀용 반영 흡수율 수치 (0~1, 미설정/없음 = 1.0 → 100% 표시). 화면 formatAppliedAbsorptionRate와 동일하게 0-1/0-100 스케일 모두 처리
function appliedAbsorptionRateForExcel(value) {
  if (value === null || value === undefined) return 1.0;
  const num = Number(value);
  if (isNaN(num)) return 0;
  // Excel 퍼센트 포맷(0.0%)은 0~1 기준: 1이면 100% 표시. 0-100 스케일이 오면 0-1로 변환
  return num > 1 ? num / 100 : num;
}

// 반영 흡수율 포맷팅 함수 (미설정/없음 = 100.0%)
function formatAppliedAbsorptionRate(value) {
  try {
    if (value === null || value === undefined) {
      return '100.0%';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return '0%';
    }

    // 값이 1보다 크면 이미 퍼센트 형태로 저장된 것
    // 값이 1 이하면 소수점 형태로 저장된 것
    const percentage = numValue > 1 ? numValue : numValue * 100;

    return `${percentage.toFixed(1)}%`;
  } catch (error) {
    console.error('반영 흡수율 포맷 오류:', error, value);
    return '100.0%';
  }
}
</script>

<style scoped>
.action-buttons-group {
    display: flex;
    gap: 8px;
}

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

.deleted-text {
    color: #999;
    text-decoration: line-through;
}

</style>
