<template>
  <div class="admin-settlement-share-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <!-- <div class="page-breadcrumb">정산 관리 &gt; 정산내역서 공유</div> -->
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">정산내역서 공유</div>
    </div>
    <!-- 필터 카드 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="selectedMonth" @change="loadSettlementData" class="select_month">
            <option v-for="month in availableMonths" :key="month.settlement_month" :value="month.settlement_month">{{ month.settlement_month }}</option>
          </select>
        </div>
      </div>
    </div>
    <!-- 데이터 카드 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
              <div class="data-card-header" style="flex-shrink: 0;">
          <div class="total-count-display">전체 {{ companySummary.length }} 건</div>
          <div class="action-buttons-group">
            <button class="btn-save" @click="saveShareStatus" :disabled="Object.keys(shareChanges).length === 0">저장</button>
          </div>
        </div>
      <div style="flex-grow: 1; overflow: auto;">
      <DataTable 
        :value="companySummary" 
        :loading="false"
        scrollable 
        scrollHeight="calc(100vh - 220px)"
        class="admin-settlement-share-table"
        :pt="{
          wrapper: { style: 'min-width: 2000px;' },
          table: { style: 'min-width: 2000px;' }
        }"
      >
        <template #empty>
          <div v-if="!loading">조회된 데이터가 없습니다.</div>
        </template>

        <Column header="No" :headerStyle="{ width: columnWidths.no }" :frozen="true">
          <template #body="slotProps">{{ slotProps.index + 1 }}</template>
        </Column>
        <Column field="company_group" header="구분" :headerStyle="{ width: columnWidths.company_group }" :sortable="true" :frozen="true"/>
        <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true" :frozen="true"/>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: columnWidths.business_registration_number }" :sortable="true" :frozen="true">
          <template #body="slotProps">
            {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
          </template>
        </Column>
        <Column field="representative_name" header="대표자" :headerStyle="{ width: columnWidths.representative_name }" :sortable="true" :frozen="true"/>
        <Column field="manager_name" header="관리자" :headerStyle="{ width: columnWidths.manager_name }" :sortable="true"/>
        <Column field="client_count" header="병의원 수" :headerStyle="{ width: columnWidths.client_count }" :sortable="true"/>
        <Column field="total_records" header="처방건수" :headerStyle="{ width: columnWidths.total_records }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.total_records ? Number(slotProps.data.total_records).toLocaleString() : '0'">
                {{ slotProps.data.total_records ? Number(slotProps.data.total_records).toLocaleString() : '0' }}
              </span>
            </template>
        </Column>
        <Column field="total_prescription_amount" header="총 처방액" :headerStyle="{ width: columnWidths.total_prescription_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="Math.round(slotProps.data.total_prescription_amount || 0).toLocaleString()">
                {{ Math.round(slotProps.data.total_prescription_amount || 0).toLocaleString() }}
              </span>
            </template>
        </Column>
        <Column field="payment_prescription_amount" header="지급 처방액" :headerStyle="{ width: columnWidths.payment_prescription_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="Math.round(slotProps.data.payment_prescription_amount || 0).toLocaleString()">
                {{ Math.round(slotProps.data.payment_prescription_amount || 0).toLocaleString() }}
              </span>
            </template>
        </Column>
        <Column field="section_commission_rate" header="구간 수수료율" :headerStyle="{ width: columnWidths.section_commission_rate }" :bodyStyle="{ textAlign: 'center !important' }" :sortable="true">
            <template #body="slotProps">
              <span v-if="slotProps.data.section_commission_rate !== null && slotProps.data.section_commission_rate !== undefined">
                {{ (slotProps.data.section_commission_rate * 100).toFixed(1) }}%
              </span>
              <span v-else style="color: #999;">-</span>
            </template>
        </Column>
        <Column field="section_commission_amount" header="구간 수수료" :headerStyle="{ width: columnWidths.section_commission_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <!-- 디버깅용: 실제 값 확인 -->
              <!-- {{ // console.log('section_commission_rate:', slotProps.data.section_commission_rate, 'type:', typeof slotProps.data.section_commission_rate) }} -->
              <div v-if="slotProps.data.section_commission_rate == null || slotProps.data.section_commission_rate == 0">
                <button 
                  class="btn-commission-input" 
                  @click="openCommissionModal(slotProps.data)"
                >
                  입력하기
                </button>
              </div>
              <div v-else>
                <span 
                  class="clickable-amount"
                  :title="Math.round(slotProps.data.section_commission_amount || 0).toLocaleString() + ' (클릭하여 수정)'"
                  @click="openCommissionEditModal(slotProps.data)"
                >
                  {{ Math.round(slotProps.data.section_commission_amount || 0).toLocaleString() }}
                </span>
              </div>
            </template>
        </Column>
        <Column field="payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span :title="Math.round(slotProps.data.payment_amount || 0).toLocaleString()">
                {{ Math.round(slotProps.data.payment_amount || 0).toLocaleString() }}
              </span>
            </template>
        </Column>
        <Column field="total_payment_amount" header="총 지급액" :headerStyle="{ width: columnWidths.total_payment_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span :title="Math.round(slotProps.data.total_payment_amount || 0).toLocaleString()">
                {{ Math.round(slotProps.data.total_payment_amount || 0).toLocaleString() }}
              </span>
            </template>
        </Column>
        <Column header="개별 전달사항" :headerStyle="{ width: columnWidths.notice_individual }">
          <template #body="slotProps">
            <button 
              :class="['btn-notice', slotProps.data.notice_individual ? 'btn-notice-filled' : 'btn-notice-empty']" 
              @click="openNoticeModal(slotProps.data)"
            >
              전달사항
            </button>
          </template>
        </Column>
        <Column header="상세" :headerStyle="{ width: columnWidths.detail }" :bodyStyle="{ textAlign: 'center !important' }">
          <template #body="slotProps">
            <button class="btn-detail" @click="goDetail(slotProps.data)">상세</button>
          </template>
        </Column>
        <Column :headerStyle="{ width: columnWidths.share, textAlign: 'center' }">
          <template #header>
            <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
              <input 
                type="checkbox" 
                :checked="isAllShared" 
                :indeterminate="isIndeterminate"
                @change="toggleAllShares"
                class="share-checkbox"
              />
            </div>
          </template>
          <template #body="slotProps">
            <div style="display: flex; justify-content: center; align-items: center;">
              <input type="checkbox" v-model="slotProps.data.is_shared" @change="onShareChange(slotProps.data, slotProps.data.is_shared)" class="share-checkbox" />
            </div>
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column footer="합계" :colspan="5" footerClass="footer-cell" footerStyle="text-align:center !important;" :frozen="true" />
            <Column footer="" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalClientCount" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalRecordsCount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalPaymentPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column footer="" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalSectionCommissionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalPaymentAmountOnly" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :colspan="3" footerClass="footer-cell" />
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

    <!-- 전달사항 모달 -->
    <div v-if="showNoticeModal" class="modal-overlay" @click="closeNoticeModal">
      <div class="modal-content modal-center" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedCompany?.company_name }} - 개별 전달사항</h2>
          <button class="modal-close-btn" @click="closeNoticeModal">×</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="noticeContent"
            placeholder="전달사항을 입력하세요..."
            style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-save" @click="saveNotice">저장</button>
          <button class="btn-close" @click="closeNoticeModal">닫기</button>
        </div>
      </div>
    </div>

    <!-- 구간 수수료 모달 -->
    <div v-if="showCommissionModal" class="modal-overlay" @click="closeCommissionModal">
      <div class="modal-content modal-center" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedCompany?.company_name }} - 구간 수수료율</h2>
          <button class="modal-close-btn" @click="closeCommissionModal">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">지급 처방액</label>
            <div style="padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; font-weight: 600;">
              {{ Math.round(selectedCompany?.payment_prescription_amount || 0).toLocaleString() }}원
            </div>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">구간 수수료율 (%)</label>
            <input
              v-model="commissionRate"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="수수료율을 입력하세요"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-save" @click="saveCommission">저장</button>
          <button class="btn-close" @click="closeCommissionModal">닫기</button>
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
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { supabase } from '@/supabase';

const columnWidths = {
  no: '3%',
  company_group: '6%',
  company_name: '10%',
  business_registration_number: '8%',
  representative_name: '6%',
  manager_name: '6%',
  client_count: '7%',
  total_records: '7%',
  total_prescription_amount: '8%',
  payment_prescription_amount: '8%',
  section_commission_amount: '8%',
  section_commission_rate: '8%',
  payment_amount: '8%',
  total_payment_amount: '8%',
  notice_individual: '6%',
  detail: '5%',
  share: '5%'
};

const loading = ref(true);
const router = useRouter();

// 사업자등록번호 포맷팅 함수
function formatBusinessNumber(number) {
  if (!number) return '';
  const cleanNumber = number.toString().replace(/\D/g, ''); // 숫자만 추출
  if (cleanNumber.length === 10) {
    return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 5)}-${cleanNumber.slice(5)}`;
  }
  return number; // 10자리가 아니면 원본 반환
}

// 필터
const selectedMonth = ref('');
const availableMonths = ref([]);

// 데이터
const companySummary = ref([]);
const shareChanges = ref({}); // 공유 상태 변경 사항 추적

// 전달사항 모달 관련
const showNoticeModal = ref(false);
const selectedCompany = ref(null);
const noticeContent = ref('');

// 구간 수수료 모달 관련
const showCommissionModal = ref(false);
const commissionRate = ref('');

// --- 계산된 속성 (합계) ---
const totalClientCount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Number(item.client_count || 0), 0);
  return total.toLocaleString();
});

const totalRecordsCount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Number(item.total_records || 0), 0);
  return total.toLocaleString();
});

const totalPrescriptionAmount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.total_prescription_amount || 0)), 0);
  return total.toLocaleString();
});

const totalPaymentPrescriptionAmount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.payment_prescription_amount || 0)), 0);
  return total.toLocaleString();
});

const totalSectionCommissionAmount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.section_commission_amount || 0)), 0);
  return total.toLocaleString();
});

const totalPaymentAmountOnly = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.payment_amount || 0)), 0);
  return total.toLocaleString();
});

const totalPaymentAmount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.total_payment_amount || 0)), 0);
  return total.toLocaleString();
});

// 구간수수료율은 현재 데이터베이스에 없으므로 제거


// --- 헤더 체크박스 상태 관리 ---
const isAllShared = computed(() => {
  if (companySummary.value.length === 0) return false;
  return companySummary.value.every(company => company.is_shared);
});

const isIndeterminate = computed(() => {
  if (companySummary.value.length === 0) return false;
  const sharedCount = companySummary.value.filter(company => company.is_shared).length;
  return sharedCount > 0 && sharedCount < companySummary.value.length;
});


// --- 초기 데이터 로딩 ---

onMounted(async () => {
  await fetchAvailableMonths();
});

watch(selectedMonth, async (newMonth) => {
  if(newMonth) {
    await loadSettlementData();
  }
});

async function fetchAvailableMonths() {
    try {
        const { data, error } = await supabase
            .from('settlement_months')
            .select('settlement_month')
            .order('settlement_month', { ascending: false });
            
        if (error) throw error;
        
        availableMonths.value = data || [];

        if (data && data.length > 0) {
            selectedMonth.value = data[0].settlement_month;
        } else {
            // 데이터가 없을 경우에 대한 처리
            companySummary.value = [];
            loading.value = false; // 로딩 상태 해제
        }
    } catch (err) {
        console.error('정산월 조회 오류', err);
        alert('정산월 목록을 불러오는 중 오류가 발생했습니다.');
        loading.value = false; // 에러 발생 시에도 로딩 상태 해제
    }
}

async function loadSettlementData() {
  if (!selectedMonth.value) return;
  loading.value = true;
  shareChanges.value = {};

  try {
    // 1. performance_records_absorption에서 해당 월의 데이터를 가져옵니다.
    // === 1,000행 제한 해결: 전체 데이터 가져오기 ===
    let allRecords = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
    const { data: records, error: recordsError } = await supabase
      .from('performance_records')
      .select(`
        id,
        company_id,
        client_id,
        settlement_month,
        prescription_qty,
        commission_rate,
        review_action,
        company:companies(*),
        product:products(price)
      `)
        .eq('settlement_month', selectedMonth.value)
        .eq('review_status', '완료')
        .range(from, from + batchSize - 1);

    if (recordsError) throw recordsError;
      
      if (!records || records.length === 0) {
        break;
      }
      
      allRecords = allRecords.concat(records);
      
      // 가져온 데이터가 batchSize보다 적으면 마지막 배치
      if (records.length < batchSize) {
        break;
      }
      
      from += batchSize;
    }

    // 2. 반영 흡수율 데이터를 별도로 조회합니다.
    const recordIds = allRecords.map(record => record.id);
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

    // 3. 회사별로 데이터를 집계합니다.
    const summaryMap = new Map();
    for (const record of allRecords) {
      if (!record.company) continue;

      const companyId = record.company.id;
      if (!summaryMap.has(companyId)) {
        summaryMap.set(companyId, {
          company_id: companyId,
          company_group: record.company.company_group,
          company_name: record.company.company_name,
          business_registration_number: record.company.business_registration_number,
          representative_name: record.company.representative_name,
          manager_name: record.company.assigned_pharmacist_contact,
          client_count: new Set(),
          total_records: 0,
          total_prescription_amount: 0, // 총 처방액: 실적이 등록된 모든 제품의 처방액 합계
          payment_prescription_amount: 0, // 지급 처방액: 수수료가 지급되는 제품의 처방액 합계
          section_commission_amount: 0, // 구간 수수료: (지급 처방액)*구간 수수료율
          payment_amount: 0, // 지급액: 수수료 합계
          total_payment_amount: 0, // 총 지급액: 구간 수수료+지급액
          section_commission_rate: 0, // 구간 수수료율
          is_shared: false, // 기본값
          settlement_share_id: null, // 기본값
          notice_individual: null // 기본값
        });
      }

      const summary = summaryMap.get(companyId);
      
      // 병의원 수와 처방건수는 모든 건 포함 (삭제건도 포함)
      summary.client_count.add(record.client_id);
      summary.total_records += 1;
      
      // 상세 페이지와 동일한 로직: 삭제 건은 처방수량을 0으로 처리
      const qty = record.prescription_qty ?? 0;
      const price = record.product?.price ?? 0;
      const finalQty = record.review_action === '삭제' ? 0 : qty;
      const prescriptionAmount = Math.round(finalQty * price);
      
      // 총 처방액 계산 (삭제 건은 처방수량이 0이므로 자동으로 제외됨)
      summary.total_prescription_amount += prescriptionAmount;
      
      // 삭제되지 않은 건만 지급 처방액과 지급액 계산에 포함
      if (record.review_action !== '삭제') {
        // 지급 처방액: 수수료율이 있는 정상 건의 처방액만 합계
        if (record.commission_rate !== null && record.commission_rate !== undefined && record.commission_rate > 0) {
          summary.payment_prescription_amount += prescriptionAmount;
        }
        
        // 지급액: 정상 건의 수수료 합계 (반영 흡수율 적용)
        let paymentAmount;
        if (record.commission_rate && record.commission_rate > 1) {
          // 수수료율이 1보다 크면 퍼센트(%) 단위로 간주
          paymentAmount = Math.round(prescriptionAmount * (record.commission_rate || 0) / 100);
        } else {
          // 수수료율이 1 이하면 소수점 단위로 간주
          paymentAmount = Math.round(prescriptionAmount * (record.commission_rate || 0));
        }
        
        // 반영 흡수율 적용하여 최종 지급액 계산 (정수 반올림)
        const appliedAbsorptionRate = absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined ? absorptionRates[record.id] : 1.0;
        const finalPaymentAmount = Math.round(paymentAmount * appliedAbsorptionRate);
        
        summary.payment_amount += finalPaymentAmount;
      }
    }

    // 3. 공유 상태를 별도로 조회하여 병합합니다.
    const companyIds = Array.from(summaryMap.keys());
    if (companyIds.length > 0) {
      const { data: shares, error: sharesError } = await supabase
        .from('settlement_share')
        .select('*')
        .eq('settlement_month', selectedMonth.value)
        .in('company_id', companyIds);

      if (sharesError) throw sharesError;

      for (const share of shares) {
        if (summaryMap.has(share.company_id)) {
          const summary = summaryMap.get(share.company_id);
          summary.is_shared = share.share_enabled;
          summary.section_commission_rate = share.section_commission_rate || 0;
          summary.settlement_share_id = share.id;
          summary.notice_individual = share.notice_individual;
        }
      }
    }

    // 4. 최종 데이터를 생성하고 정렬합니다.
    const finalSummary = Array.from(summaryMap.values()).map(s => {
      s.client_count = s.client_count.size;
      
      // 구간 수수료 계산: (지급 처방액) * 구간 수수료율
      s.section_commission_amount = Math.round((s.payment_prescription_amount || 0) * (s.section_commission_rate || 0));
      
      // 총 지급액 계산: 구간 수수료 + 지급액
      s.total_payment_amount = (s.section_commission_amount || 0) + (s.payment_amount || 0);
      
      return s;
    });

    companySummary.value = finalSummary.sort((a,b) => {
      if (b.total_payment_amount !== a.total_payment_amount) {
        return b.total_payment_amount - a.total_payment_amount;
      }
      return a.company_name.localeCompare(b.company_name, 'ko');
    });
    
    // 디버깅용 로그: 최종 결과 확인
    // console.log('최종 정산내역서 요약:', companySummary.value);
    companySummary.value.forEach(company => {
      // console.log(`${company.company_name}: 병의원수=${company.client_count.size}, 처방건수=${company.total_records}, 총처방액=${company.total_prescription_amount} (삭제건 처방수량=0), 지급처방액=${company.payment_prescription_amount} (삭제건 제외), 총지급액=${company.total_payment_amount} (삭제건 제외)`);
    });

  } catch (err) {
      console.error('정산 공유 데이터 로드 오류:', err);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
  } finally {
      loading.value = false;
  }
}

function onShareChange(companyData, isChecked) {
  // 1. 화면에 보이는 데이터(companySummary)의 is_shared 값을 직접 변경합니다.
  const itemInSummary = companySummary.value.find(item => item.company_id === companyData.company_id);
  if (itemInSummary) {
    itemInSummary.is_shared = isChecked;
  }

  // 2. 변경된 내역을 shareChanges에 별도로 기록합니다.
  shareChanges.value[companyData.company_id] = {
    is_shared: isChecked,
    id: companyData.settlement_share_id
  };
}

// 전체 공유/해제 (헤더 체크박스용)
function toggleAllShares() {
  const newShareState = !isAllShared.value;
  companySummary.value.forEach(company => {
    company.is_shared = newShareState;
    onShareChange(company, newShareState);
  });
}


async function saveShareStatus() {
  if (Object.keys(shareChanges.value).length === 0) {
    alert('변경사항이 없습니다.');
    return;
  }
  loading.value = true;
  
  // console.log('shareChanges.value:', shareChanges.value);

  try {
    // 1단계: 기존 settlement_share 레코드가 있는지 확인
    const companyIds = Object.keys(shareChanges.value);
    const { data: existingShares, error: checkError } = await supabase
      .from('settlement_share')
      .select('id, company_id')
      .eq('settlement_month', selectedMonth.value)
      .in('company_id', companyIds);

    if (checkError) throw checkError;

    // console.log('기존 레코드:', existingShares);

    // 2단계: 기존 레코드가 있는 회사와 없는 회사 분리
    const existingCompanyIds = new Set(existingShares?.map(share => share.company_id) || []);
    const existingSharesMap = new Map(existingShares?.map(share => [share.company_id, share.id]) || []);

    const dataToUpdate = []; // 기존 레코드 업데이트용
    const dataToInsert = []; // 새 레코드 삽입용

    Object.entries(shareChanges.value).forEach(([companyId, change]) => {
      const data = {
        settlement_month: selectedMonth.value,
        company_id: companyId,
        share_enabled: change.is_shared,
      };

      if (existingCompanyIds.has(companyId)) {
        // 기존 레코드가 있는 경우: id 포함하여 UPDATE
        data.id = existingSharesMap.get(companyId);
        dataToUpdate.push(data);
        // console.log(`UPDATE용 데이터:`, data);
      } else {
        // 기존 레코드가 없는 경우: id 제외하여 INSERT
        dataToInsert.push(data);
        // console.log(`INSERT용 데이터:`, data);
      }
    });

    // 3단계: UPDATE와 INSERT 각각 실행
    let error = null;

    // UPDATE 실행 (기존 레코드가 있는 경우)
    if (dataToUpdate.length > 0) {
      // console.log('UPDATE 실행:', dataToUpdate);
      const { error: updateError } = await supabase
        .from('settlement_share')
        .upsert(dataToUpdate, { onConflict: 'id' });
      
      if (updateError) {
        console.error('UPDATE 오류:', updateError);
        error = updateError;
      }
    }

    // INSERT 실행 (기존 레코드가 없는 경우)
    if (dataToInsert.length > 0 && !error) {
      // console.log('INSERT 실행:', dataToInsert);
      const { error: insertError } = await supabase
        .from('settlement_share')
        .insert(dataToInsert);
      
      if (insertError) {
        console.error('INSERT 오류:', insertError);
        error = insertError;
      }
    }

    if (error) throw error;
    
    shareChanges.value = {};
    alert('공유 상태가 성공적으로 저장되었습니다.');
    // 데이터를 다시 불러와 화면을 최신 상태로 유지합니다.
    await loadSettlementData();

  } catch (err) {
    console.error('공유 상태 저장 오류:', err);
    alert(`공유 상태 저장 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

function goDetail(companyData) {
  router.push({ 
      name: 'AdminSettlementShareDetail', 
      query: { month: selectedMonth.value, company_id: companyData.company_id } 
  });
}

// 전달사항 모달 관련 함수들
function openNoticeModal(companyData) {
  selectedCompany.value = companyData;
  noticeContent.value = companyData.notice_individual || '';
  showNoticeModal.value = true;
}

function closeNoticeModal() {
  showNoticeModal.value = false;
  selectedCompany.value = null;
  noticeContent.value = '';
}

async function saveNotice() {
  if (!selectedCompany.value) return;
  
  try {
    const { error } = await supabase
      .from('settlement_share')
      .update({ notice_individual: noticeContent.value })
      .eq('settlement_month', selectedMonth.value)
      .eq('company_id', selectedCompany.value.company_id);
    
    if (error) throw error;
    
    // 로컬 데이터 업데이트
    const company = companySummary.value.find(c => c.company_id === selectedCompany.value.company_id);
    if (company) {
      company.notice_individual = noticeContent.value;
    }
    
    alert('전달사항이 저장되었습니다.');
    closeNoticeModal();
  } catch (err) {
    console.error('전달사항 저장 오류:', err);
    alert(`전달사항 저장 중 오류가 발생했습니다: ${err.message}`);
  }
}

// 구간 수수료 모달 관련 함수들
function openCommissionModal(companyData) {
  selectedCompany.value = companyData;
  commissionRate.value = '';
  showCommissionModal.value = true;
}

function openCommissionEditModal(companyData) {
  selectedCompany.value = companyData;
  const rate = Math.round((companyData.section_commission_rate || 0) * 100);
  commissionRate.value = rate === 0 ? '' : rate.toString();
  showCommissionModal.value = true;
}

function closeCommissionModal() {
  showCommissionModal.value = false;
  selectedCompany.value = null;
  commissionRate.value = '';
}

async function saveCommission() {
  if (!selectedCompany.value) {
    alert('업체 정보가 없습니다.');
    return;
  }
  
  // 빈 문자열이면 경고 메시지 표시
  if (commissionRate.value === '' || commissionRate.value === null || commissionRate.value === undefined) {
    alert('구간 수수료율을 입력해주세요.');
    return;
  }
  
  try {
    const rate = parseInt(commissionRate.value);
    if (isNaN(rate) || rate < 0 || rate > 100 || !Number.isInteger(parseFloat(commissionRate.value))) {
      alert('구간 수수료율은 0~100 사이의 정수여야 합니다.');
      return;
    }
    
    // settlement_share 테이블에 구간 수수료율 저장 (기존 공유 상태 유지)
    const { error } = await supabase
      .from('settlement_share')
      .upsert({
        settlement_month: selectedMonth.value,
        company_id: selectedCompany.value.company_id,
        section_commission_rate: rate / 100, // 퍼센트를 소수점으로 변환
        share_enabled: selectedCompany.value.is_shared || false,
        notice_individual: selectedCompany.value.notice_individual || null
      }, {
        onConflict: 'settlement_month,company_id'
      });
    
    if (error) throw error;
    
    // 로컬 데이터 업데이트
    const company = companySummary.value.find(c => c.company_id === selectedCompany.value.company_id);
    if (company) {
      company.section_commission_rate = rate / 100;
      // 구간 수수료 계산: (지급 처방액) * 구간 수수료율
      company.section_commission_amount = Math.round((company.payment_prescription_amount || 0) * (rate / 100));
      // 총 지급액 재계산: 구간 수수료 + 지급액
      company.total_payment_amount = (company.section_commission_amount || 0) + (company.payment_amount || 0);
    }
    
    alert('구간 수수료율이 저장되었습니다.');
    closeCommissionModal();
  } catch (err) {
    console.error('구간 수수료율 저장 오류:', err);
    alert(`구간 수수료율 저장 중 오류가 발생했습니다: ${err.message}`);
  }
}

onBeforeRouteLeave((to, from, next) => {
  if (Object.keys(shareChanges.value).length > 0) {
    if (confirm('저장하지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?')) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  
  // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
  const utcHours = date.getUTCHours();
  const kstHours = (utcHours + 9) % 24;
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(kstHours).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// formatSectionCommissionRate 함수는 현재 사용하지 않으므로 제거

</script>

<style scoped>
.action-buttons-group {
    display: flex;
}

.btn-commission-input {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-commission-input:hover {
  background-color: #0056b3;
}

/* 우측 정렬 스타일 */
:deep(.p-datatable-tbody > tr > td:nth-child(10)),
:deep(.p-datatable-tbody > tr > td:nth-child(11)),
:deep(.p-datatable-tbody > tr > td:nth-child(12)) {
  text-align: right !important;
}

:deep(.p-datatable-tfoot > tr > td:nth-child(8)),
:deep(.p-datatable-tfoot > tr > td:nth-child(9)),
:deep(.p-datatable-tfoot > tr > td:nth-child(10)) {
  text-align: right !important;
}

/* 전달사항 버튼 중앙 정렬 */
:deep(.p-datatable-tbody > tr > td:nth-child(14)) {
  text-align: center !important;
}

/* 상세 버튼 중앙 정렬 */
:deep(.p-datatable-tbody > tr > td:nth-child(15)) {
  text-align: center !important;
}

/* PrimeVue frozen 컬럼 스타일링 */
.admin-settlement-share-table {
  overflow-x: auto;
}

/* 테이블 최소 너비 보장 및 투명도 제거 */
:deep(.p-datatable-table) {
  min-width: 2000px;
  opacity: 1 !important;
}

:deep(.p-datatable) {
  opacity: 1 !important;
}

:deep(.p-datatable-wrapper) {
  opacity: 1 !important;
}

:deep(.p-datatable-thead),
:deep(.p-datatable-tbody),
:deep(.p-datatable-tfoot) {
  opacity: 1 !important;
}

:deep(.p-datatable-thead th),
:deep(.p-datatable-tbody td),
:deep(.p-datatable-tfoot td) {
  opacity: 1 !important;
}

/* frozen 컬럼 배경색 완전 불투명 */
:deep(.p-frozen-column) {
  background-color: white !important;
  background: white !important;
  opacity: 1 !important;
}

:deep(.p-datatable-thead .p-frozen-column) {
  background-color: #f8f9fa !important;
  background: #f8f9fa !important;
  opacity: 1 !important;
}

/* 본문 frozen 컬럼 배경색 - 더 강력한 선택자 */
:deep(.p-datatable-tbody .p-frozen-column),
:deep(.p-datatable-tbody td.p-frozen-column),
:deep(.p-datatable-tbody tr td:first-child),
:deep(.p-datatable-tbody tr td:nth-child(2)),
:deep(.p-datatable-tbody tr td:nth-child(3)),
:deep(.p-datatable-tbody tr td:nth-child(4)),
:deep(.p-datatable-tbody tr td:nth-child(5)) {
  background-color: white !important;
  background: white !important;
  opacity: 1 !important;
}

:deep(.p-datatable-tfoot .p-frozen-column) {
  background-color: #f8f9fa !important;
  background: #f8f9fa !important;
  opacity: 1 !important;
}

/* 행 상태별 배경색 - 불투명하게 */
:deep(.row-added .p-frozen-column),
:deep(.row-added td) {
  background-color: #e3f2fd !important;
  background: #e3f2fd !important;
  opacity: 1 !important;
}

:deep(.row-modified .p-frozen-column),
:deep(.row-modified td) {
  background-color: #fffde7 !important;
  background: #fffde7 !important;
  opacity: 1 !important;
}

:deep(.deleted-row .p-frozen-column),
:deep(.deleted-row td) {
  background-color: #ffebee !important;
  background: #ffebee !important;
  opacity: 1 !important;
}

/* 스크롤바 스타일링 */
.admin-settlement-share-table::-webkit-scrollbar {
  height: 8px;
}

.admin-settlement-share-table::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.admin-settlement-share-table::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.admin-settlement-share-table::-webkit-scrollbar-thumb:hover {
  background: #555;
}

</style>
