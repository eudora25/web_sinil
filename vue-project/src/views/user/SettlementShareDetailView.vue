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
          <span style="font-weight: 600;">공급가 : {{ settlementSummary.supply_price?.toLocaleString() }}원</span>
          <span style="font-weight: 600;">부가세 : {{ settlementSummary.vat_price?.toLocaleString() }}원</span>
          <span style="font-weight: 600;">합계액 : {{ settlementSummary.total_price?.toLocaleString() }}원</span>
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-download" @click="downloadExcel">엑셀 다운로드</button>
        </div>
      </div>
      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable
          :value="detailRows" 
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
          <Column field="client_name" header="병의원명" :headerStyle="{ width: columnWidths.client_name }" :sortable="true">
            <template #body="slotProps">
              <span class="ellipsis-cell" :title="slotProps.data.client_name" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.client_name }}</span>
            </template>
          </Column>
          <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }" :sortable="true" />
          <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name }" :sortable="true">
            <template #body="slotProps">
              <span class="ellipsis-cell" :title="slotProps.data.product_name_display" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.product_name_display }}</span>
            </template>
          </Column>
          <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true" />
          <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true">
            <template #body="slotProps">{{ Math.round(slotProps.data._raw_price || 0).toLocaleString() }}</template>
          </Column>
          <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true">
            <template #body="slotProps">{{ (slotProps.data._raw_qty || 0).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}</template>
          </Column>
          <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount">
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.prescription_amount }}
              </span>
            </template>
          </Column>
          <Column field="commission_rate" header="수수료율" :headerStyle="{ width: columnWidths.commission_rate }" :sortable="true" />
          <Column field="payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :sortable="true">
            <template #body="slotProps">
              <span :title="slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount">
                {{ slotProps.data.review_action === '삭제' ? '0' : slotProps.data.payment_amount }}
              </span>
            </template>
          </Column>
          <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
            <template #body="slotProps">
              <span class="ellipsis-cell" :title="slotProps.data.remarks" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.remarks }}</span>
            </template>
          </Column>
          <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
  const totalPrice = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_payment_amount || 0);
  }, 0);

  const supplyPrice = Math.round(totalPrice / 1.1);
  const vatPrice = Math.round(totalPrice - supplyPrice);
  
  return {
    total_price: totalPrice,
    supply_price: supplyPrice,
    vat_price: vatPrice,
  };
});

const columnWidths = {
   no: '4%',
   client_name: '18%',
   prescription_month: '6%',
   product_name: '16%',
   insurance_code: '7%',
   price: '7%',
   prescription_qty: '7%',
   prescription_amount: '7%',
   commission_rate: '7%',
   payment_amount: '7%',
   remarks: '14%' };

async function fetchCompanyId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;
  const { data, error } = await supabase.from('companies').select('id').eq('user_id', session.user.id).single();
  if (!error && data) companyId.value = data.id;
}

async function fetchAvailableMonths() {
  if (!companyId.value) return;
  const { data, error } = await supabase
    .from('settlement_share')
    .select('settlement_month')
    .eq('company_id', companyId.value)
    .eq('share_enabled', true);
  if (!error && data) {
    availableMonths.value = Array.from(new Set(data.map(d => d.settlement_month))).sort((a, b) => b.localeCompare(a));
    if (availableMonths.value.length > 0) selectedMonth.value = availableMonths.value[0];
  }
}

async function fetchAllDataForMonth() {
  if (!companyId.value || !selectedMonth.value) {
    allDataForMonth.value = [];
    return;
  }

  loading.value = true;
  try {
  
  // 1. settlement_share 테이블에서 공유 여부 확인
  const { data: shareData, error: shareError } = await supabase
    .from('settlement_share')
    .select('share_enabled')
    .eq('settlement_month', selectedMonth.value)
    .eq('company_id', companyId.value)
    .single();

  // 공유되지 않았거나 오류 발생 시, 빈 화면 처리
  if (shareError || !shareData || !shareData.share_enabled) {
    allDataForMonth.value = [];
    updateFilterOptions();
    filterDetailRows();
    return;
  }

  // 2. 공유된 경우에만 performance_records_absorption 데이터 조회
  const { data, error } = await supabase
    .from('performance_records_absorption')
    .select(`
      *,
      clients ( name ),
      products ( product_name, insurance_code, price )
    `)
    .eq('settlement_month', selectedMonth.value)
    .eq('company_id', companyId.value);
  
  if (error) {
    allDataForMonth.value = [];
    return;
  }
  
  allDataForMonth.value = data.map(row => {
    const price = row.products?.price || 0;
    const qty = row.prescription_qty || 0;
    const prescriptionAmount = Math.round(qty * price);
    const paymentAmount = Math.round(prescriptionAmount * (row.commission_rate || 0));
    
    return {
      ...row,
      client_name: row.clients?.name || 'N/A',
      product_name_display: row.products?.product_name || 'N/A',
      insurance_code: row.products?.insurance_code || 'N/A',
      price: price,
      prescription_qty: qty,
      prescription_amount: prescriptionAmount,
      payment_amount: paymentAmount,
      commission_rate: `${((row.commission_rate || 0) * 100).toFixed(1)}%`,
      // 원본 숫자 데이터 보존
      _raw_price: price,
      _raw_qty: qty,
      _raw_prescription_amount: prescriptionAmount,
      _raw_payment_amount: paymentAmount,
    };
  });
  
  updateFilterOptions();
  filterDetailRows();
  } finally {
    loading.value = false;
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

onMounted(async () => {
  await fetchCompanyId();
  await fetchAvailableMonths();
  if (selectedMonth.value) {
    // 현재 선택된 정산월의 ID 설정
    const { data: monthData } = await supabase
      .from('settlement_months')
      .select('id')
      .eq('settlement_month', selectedMonth.value)
      .single();
    currentSettlementMonthId.value = monthData?.id || null;
    
    await loadDetailData();
    // 페이지 진입 시 전달사항 팝업 자동 표시 (사용자 설정 확인 후)
    setTimeout(async () => {
      await showNoticePopup();
    }, 1000); // 1초 후 표시
  }
});

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
        .single();
      
      // 개별 전달사항 조회
      const { data: individualData } = await supabase
        .from('settlement_share')
        .select('notice_individual')
        .eq('settlement_month', selectedMonth.value)
        .eq('company_id', companyId.value)
        .single();
      
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
    
    // B5: 세금계산서 발행 금액
    const taxTitleCell = summarySheet.getCell('B5');
    taxTitleCell.value = '세금계산서 발행 금액';
    taxTitleCell.font = { bold: true, size: 11 };
    
    // B7-C9: 세금계산서 상세
    const totalAmount = detailRows.value.reduce((sum, row) => sum + (row._raw_payment_amount || 0), 0);
    const supplyPrice = Math.round(totalAmount / 1.1);
    const vatPrice = totalAmount - supplyPrice;
    
    // 헤더 행 추가
    summarySheet.getCell('B7').value = '공급가';
    summarySheet.getCell('C7').value = '부가세';
    summarySheet.getCell('D7').value = '합계액';
    
    // 헤더 스타일 설정 (상세내역과 동일)
    summarySheet.getCell('B7').font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    summarySheet.getCell('B7').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '76933C' } // RGB(118, 147, 60)
    };
    summarySheet.getCell('B7').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('C7').font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    summarySheet.getCell('C7').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '76933C' }
    };
    summarySheet.getCell('C7').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('D7').font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    summarySheet.getCell('D7').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '76933C' }
    };
    summarySheet.getCell('D7').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 데이터 행 추가
    summarySheet.getCell('B8').value = supplyPrice;
    summarySheet.getCell('B8').numFmt = '#,##0';
    summarySheet.getCell('B8').font = { size: 11 };
    summarySheet.getCell('B8').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('C8').value = vatPrice;
    summarySheet.getCell('C8').numFmt = '#,##0';
    summarySheet.getCell('C8').font = { size: 11 };
    summarySheet.getCell('C8').alignment = { horizontal: 'center', vertical: 'middle' };
    
    summarySheet.getCell('D8').value = totalAmount;
    summarySheet.getCell('D8').numFmt = '#,##0';
    summarySheet.getCell('D8').font = { size: 11 };
    summarySheet.getCell('D8').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 세금계산서 테이블 테두리 설정 (얇은 실선)
    for (let row = 7; row <= 8; row++) {
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
    
    // B12: 전달사항
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
      { width: 16 }   // D열
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
    const headers = ['No', '병의원명', '처방월', '제품명', '보험코드', '약가', '처방수량', '처방액', '수수료율', '지급액', '비고'];
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
    
    // 데이터 추가
    detailRows.value.forEach((row, index) => {
      const dataRow = detailSheet.addRow([
        index + 1,
        row.client_name,
        row.prescription_month,
        row.product_name_display,
        row.insurance_code,
        row._raw_price || 0,
        row._raw_qty || 0,
        row._raw_prescription_amount || 0,
        Number(String(row.commission_rate).replace('%', '')) / 100,
        row._raw_payment_amount || 0,
        row.remarks || ''
      ]);
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle' };
        
        // 가운데 정렬이 필요한 컬럼들 (No, 처방월, 보험코드)
        if (colNumber === 1 || colNumber === 3 || colNumber === 5 || colNumber === 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // 숫자 형식 설정
        if (colNumber === 6) { // 약가
          cell.numFmt = '#,##0';
        } else if (colNumber === 7) { // 처방수량
          cell.numFmt = '#,##0.0';
        } else if (colNumber === 8) { // 처방액
          cell.numFmt = '#,##0';
        } else if (colNumber === 9) { // 수수료율
          cell.numFmt = '0.0%';
        } else if (colNumber === 10) { // 지급액
          cell.numFmt = '#,##0';
        }
      });
    });
    
    // 합계 행 추가
    const totalQtySum = detailRows.value.reduce((sum, row) => sum + (row._raw_qty || 0), 0);
    const totalPrescriptionAmountSum = detailRows.value.reduce((sum, row) => sum + (row._raw_prescription_amount || 0), 0);
    const totalPaymentAmountSum = detailRows.value.reduce((sum, row) => sum + (row._raw_payment_amount || 0), 0);
    
    const totalRow = detailSheet.addRow([
      '',
      '',
      '',
      '',
      '',
      '합계',
      totalQtySum,
      totalPrescriptionAmountSum,
      '',
      totalPaymentAmountSum,
      ''
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
      if (colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
    
    // 합계행 숫자 형식 설정
    totalRow.getCell(7).numFmt = '#,##0.0'; // 처방수량
    totalRow.getCell(8).numFmt = '#,##0'; // 처방액
    totalRow.getCell(10).numFmt = '#,##0'; // 지급액
    
    // 컬럼 너비 설정
    detailSheet.columns = [
      { width: 8 },   // No
      { width: 32 },  // 병의원명
      { width: 10 },  // 처방월
      { width: 32 },  // 제품명
      { width: 12 },  // 보험코드
      { width: 12 },  // 약가
      { width: 12 },  // 처방수량
      { width: 16 },  // 처방액
      { width: 12 },  // 수수료율
      { width: 16 },  // 지급액
      { width: 24 }   // 비고
    ];
    
    // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
    for (let row = 1; row <= detailSheet.rowCount; row++) {
      for (let col = 1; col <= 11; col++) {
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
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
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
  
  console.log('이용자 정산내역서 오버플로우 체크:', {
    text: element.textContent,
    textWidth,
    availableWidth,
    isOverflowed
  });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    console.log('이용자 정산내역서 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    console.log('이용자 정산내역서 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  console.log('이용자 정산내역서 오버플로우 클래스 제거됨');
}

// 전달사항 관련 함수들
async function showNoticePopup(isManualClick = false) {
  if (!selectedMonth.value || !companyId.value || !currentSettlementMonthId.value) {
    alert('정산월을 선택해주세요.');
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
      .single();
    
    // 개별 전달사항 조회
    const { data: individualNotice, error: individualError } = await supabase
      .from('settlement_share')
      .select('notice_individual')
      .eq('settlement_month', selectedMonth.value)
      .eq('company_id', companyId.value)
      .single();
    
    if (generalError && individualError) {
      console.log('전달사항이 없습니다.');
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
    alert('전달사항을 불러오는 중 오류가 발생했습니다.');
  }
}

async function closeNoticeModal() {
  // 새로운 심플한 체크 로직 적용
  await setNoticeModalHidePreference('settlement', hideNoticeModal.value, currentSettlementMonthId.value);
  
  showNoticeModal.value = false;
  noticeData.value = null;
  hideNoticeModal.value = false; // 체크박스 초기화
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

</style>
