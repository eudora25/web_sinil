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
      >
        <template #empty>
          <div v-if="!loading">조회된 데이터가 없습니다.</div>
        </template>

        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + 1 }}</template>
        </Column>
        <Column field="company_group" header="구분" :headerStyle="{ width: columnWidths.company_group }" :sortable="true"/>
        <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true"/>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: columnWidths.business_registration_number }" :sortable="true"/>
        <Column field="representative_name" header="대표자" :headerStyle="{ width: columnWidths.representative_name }" :sortable="true"/>
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
        <Column field="total_payment_amount" header="총 지급액" :headerStyle="{ width: columnWidths.total_payment_amount }" :sortable="true">
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
        <Column header="상세" :headerStyle="{ width: columnWidths.detail }">
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
            <Column footer="합계" :colspan="6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalClientCount" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="totalRecordsCount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
            <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
  no: '4%',
  company_group: '8%',
  company_name: '12%',
  business_registration_number: '10%',
  representative_name: '8%',
  manager_name: '8%',
  client_count: '9%',
  total_records: '9%',
  total_prescription_amount: '9%',
  total_payment_amount: '9%',
  notice_individual: '8%',
  detail: '6%',
  share: '6%'
};

const loading = ref(true);
const router = useRouter();

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

const totalPaymentAmount = computed(() => {
  const total = companySummary.value.reduce((sum, item) => sum + Math.round(Number(item.total_payment_amount || 0)), 0);
  return total.toLocaleString();
});

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
      .from('performance_records_absorption')
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

    // 2. 회사별로 데이터를 집계합니다.
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
          total_prescription_amount: 0,
          total_payment_amount: 0,
          is_shared: false, // 기본값
          settlement_share_id: null, // 기본값
          notice_individual: null // 기본값
        });
      }

      const summary = summaryMap.get(companyId);
      
      // 병의원 수와 처방건수는 모든 건 포함 (삭제건도 포함)
      summary.client_count.add(record.client_id);
      summary.total_records += 1;
      
      // 총 처방액과 총 지급액은 삭제되지 않은 건만 포함
      if (record.review_action !== '삭제') {
        // 처방액과 지급액을 계산 (개별 건을 먼저 원단위로 반올림)
        const prescriptionAmount = Math.round((record.prescription_qty || 0) * (record.product?.price || 0));
        // 수수료율이 퍼센트(%)인지 소수점인지 확인하여 계산
        let paymentAmount;
        if (record.commission_rate && record.commission_rate > 1) {
          // 수수료율이 1보다 크면 퍼센트(%) 단위로 간주
          paymentAmount = Math.round(prescriptionAmount * (record.commission_rate || 0) / 100);
        } else {
          // 수수료율이 1 이하면 소수점 단위로 간주
          paymentAmount = Math.round(prescriptionAmount * (record.commission_rate || 0));
        }
        
        summary.total_prescription_amount += prescriptionAmount;
        summary.total_payment_amount += paymentAmount;
        
        // 디버깅용 로그
        console.log(`회사: ${record.company.company_name}, 처방액: ${prescriptionAmount}, 지급액: ${paymentAmount}, 누적 처방액: ${summary.total_prescription_amount}, 누적 지급액: ${summary.total_payment_amount}`);
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
          summary.settlement_share_id = share.id;
          summary.notice_individual = share.notice_individual;
        }
      }
    }

    // 4. 최종 데이터를 생성하고 정렬합니다.
    const finalSummary = Array.from(summaryMap.values()).map(s => {
      s.client_count = s.client_count.size;
      return s;
    });

    companySummary.value = finalSummary.sort((a,b) => {
      if (b.total_payment_amount !== a.total_payment_amount) {
        return b.total_payment_amount - a.total_payment_amount;
      }
      return a.company_name.localeCompare(b.company_name, 'ko');
    });
    
    // 디버깅용 로그: 최종 결과 확인
    console.log('최종 정산내역서 요약:', companySummary.value);
    companySummary.value.forEach(company => {
      console.log(`${company.company_name}: 병의원수=${company.client_count}, 처방건수=${company.total_records}, 총처방액=${company.total_prescription_amount}, 총지급액=${company.total_payment_amount}`);
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
  
  console.log('shareChanges.value:', shareChanges.value);

  try {
    // 1단계: 기존 settlement_share 레코드가 있는지 확인
    const companyIds = Object.keys(shareChanges.value);
    const { data: existingShares, error: checkError } = await supabase
      .from('settlement_share')
      .select('id, company_id')
      .eq('settlement_month', selectedMonth.value)
      .in('company_id', companyIds);

    if (checkError) throw checkError;

    console.log('기존 레코드:', existingShares);

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
        console.log(`UPDATE용 데이터:`, data);
      } else {
        // 기존 레코드가 없는 경우: id 제외하여 INSERT
        dataToInsert.push(data);
        console.log(`INSERT용 데이터:`, data);
      }
    });

    // 3단계: UPDATE와 INSERT 각각 실행
    let error = null;

    // UPDATE 실행 (기존 레코드가 있는 경우)
    if (dataToUpdate.length > 0) {
      console.log('UPDATE 실행:', dataToUpdate);
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
      console.log('INSERT 실행:', dataToInsert);
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

</script>

<style scoped>
.action-buttons-group {
    display: flex;
}

</style>
