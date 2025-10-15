<template>
  <div class="admin-settlement-share-detail-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <!-- 상단 필터카드 -->
    <div class="filter-card" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom:0rem; padding:0.15rem 1.5rem 0.15rem 1rem !important;">
      <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="goBack" />
      <div>
        <div style="font-size:1.1rem; font-weight:700;">{{ companyInfo.company_name }}</div>
        <div style="font-size:0.88rem; color:#444;">
          {{ companyInfo.business_registration_number }} / {{ companyInfo.representative_name }} / {{ companyInfo.business_address }}
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
      <div style="flex-grow: 1; overflow: auto;">
      <DataTable 
        :value="detailRows" 
        :loading="false"
        paginator
        :rows="100"
        :rowsPerPageOptions="[100, 200, 500, 1000]"
        scrollable 
        scrollHeight="calc(100vh - 240px)"
        class="admin-settlement-share-detail-table"
        v-model:first="currentPageFirstIndex">
        <template #empty>
          <div v-if="!loading">조회된 데이터가 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
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
        <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }">
          <template #body="slotProps">
            <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
              {{ slotProps.data.prescription_month }}
            </span>
          </template>
        </Column>
        <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name_display }" :sortable="true">
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
        <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true" >
          <template #body="slotProps">
            <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
              {{ Math.round(slotProps.data._raw_price || 0).toLocaleString() }}
            </span>
          </template>
        </Column>
        <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true" >
          <template #body="slotProps">
            <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
              {{ (slotProps.data._raw_qty || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}
            </span>
          </template>
        </Column>
        <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true" >
          <template #body="slotProps">
            <span 
              :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
              :title="slotProps.data.review_action === '삭제' ? '0' : Math.round(slotProps.data.prescription_amount || 0).toLocaleString()"
            >
              {{ slotProps.data.review_action === '삭제' ? '0' : Math.round(slotProps.data.prescription_amount || 0).toLocaleString() }}
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
        <Column field="final_payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true" >
          <template #body="slotProps">
            <span 
              :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }"
              :title="slotProps.data.review_action === '삭제' ? '0' : Math.round(slotProps.data.final_payment_amount || 0).toLocaleString()"
            >
              {{ slotProps.data.review_action === '삭제' ? '0' : Math.round(slotProps.data.final_payment_amount || 0).toLocaleString() }}
            </span>
          </template>
        </Column>
        <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
          <template #body="slotProps">
            <span :class="{ 'deleted-text': slotProps.data.review_action === '삭제' }">
              {{ slotProps.data.remarks }}
            </span>
          </template>
        </Column>
        <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="8" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import ExcelJS from 'exceljs';

const route = useRoute();
const router = useRouter();
const month = ref(route.query?.month);
const companyId = ref(route.query?.company_id);

const companyInfo = ref({});
const detailRows = ref([]);
const loading = ref(true);
const currentPageFirstIndex = ref(0);
const sectionCommissionRate = ref(0);



const columnWidths = {
  no: '4%',
  review_action: '4%',
  client_name: '18%',
  prescription_month: '5%',
  product_name_display: '15%',
  insurance_code: '7%',
  price: '7%',
  prescription_qty: '7%',
  prescription_amount: '7%',
  commission_rate: '7%',
  applied_absorption_rate: '7%',
  payment_amount: '7%',
  remarks: '12%'
};

onMounted(async () => {
  if (!month.value || !companyId.value) {
    alert('잘못된 접근입니다. 정산 공유 페이지에서 다시 접근해주세요.');
    router.push('/admin/settlement-share');
    return;
  }
  await loadDetailData();
});

async function loadDetailData() {
  if (!month.value || !companyId.value) return;
  loading.value = true;
  try {
    // performance_records_absorption 테이블에서 데이터 조회 (반영 흡수율 포함)
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('performance_records')
        .select(`
          *,
          clients ( name ),
          products ( product_name, insurance_code, price )
        `)
        .eq('settlement_month', month.value)
        .eq('company_id', companyId.value)
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
    
    // 반영 흡수율 데이터를 별도로 조회합니다.
    const recordIds = allData.map(record => record.id);
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
    
    // 데이터 가공 (약가, 처방액, 지급액 계산)
    let mappedData = [];
    if (allData && allData.length > 0) {
        mappedData = allData.map(row => {
      // 데이터 매핑 시
      const qty = row.prescription_qty ?? 0;
      const price = row.products?.price ?? 0;
      // review_action이 '삭제'인 경우 처방수량을 0으로 설정
      const finalQty = row.review_action === '삭제' ? 0 : qty;
      const prescriptionAmount = Math.round(finalQty * price);
      const commissionRate = row.commission_rate ?? 0;
      const paymentAmount = Math.round(prescriptionAmount * commissionRate);
      
      // 반영 흡수율 처리 (별도 조회한 performance_records_absorption 테이블에서 가져온 값 사용)
      const appliedAbsorptionRate = absorptionRates[row.id] !== null && absorptionRates[row.id] !== undefined ? absorptionRates[row.id] : 1.0;
      
      // 최종 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const finalPaymentAmount = Math.round(prescriptionAmount * appliedAbsorptionRate * commissionRate);
      
      return {
        ...row,
        client_name: row.clients?.name || 'N/A',
        product_name_display: row.products?.product_name || 'N/A',
        insurance_code: row.products?.insurance_code || 'N/A',
        price: price,
        prescription_qty: finalQty,
        prescription_amount: prescriptionAmount,
        payment_amount: paymentAmount, // 기본 지급액 (수수료율만 적용)
        final_payment_amount: finalPaymentAmount, // 최종 지급액 (반영 흡수율 적용)
        commission_rate: `${((commissionRate || 0) * 100).toFixed(1)}%`,
        // 반영 흡수율 처리 (performance_records_absorption 테이블에서 가져온 값)
        applied_absorption_rate: appliedAbsorptionRate,
        // 합계 계산용 원본 숫자값 보존
        _raw_price: price,
        _raw_qty: finalQty,
        _raw_prescription_amount: prescriptionAmount,
        _raw_payment_amount: paymentAmount, // 기본 지급액
        _raw_final_payment_amount: finalPaymentAmount, // 최종 지급액
      };
    });

    // 4. 데이터 정렬
    mappedData.sort((a, b) => {
      if (a.client_name !== b.client_name) {
        return a.client_name.localeCompare(b.client_name, 'ko');
      }
      if (a.product_name_display !== b.product_name_display) {
        return a.product_name_display.localeCompare(b.product_name_display, 'ko');
      }
      return (b.prescription_amount || 0) - (a.prescription_amount || 0);
    });

    // 5. 화면 표시용으로 최종 포맷팅
    detailRows.value = mappedData.map((row, index) => {
      const formattedRow = {
        ...row,
        // 화면 표시용 포맷팅 (원본 데이터는 _raw_ 접두사로 보존됨)
        price: Math.round(row.price).toLocaleString(),
        prescription_qty: row.prescription_qty.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        prescription_amount: Math.round(row.prescription_amount).toLocaleString(),
        payment_amount: Math.round(row.payment_amount).toLocaleString(),
        final_payment_amount: Math.round(row.final_payment_amount).toLocaleString()
      };
      return formattedRow;
        });
        detailRows.value = mappedData;
    } else {
        detailRows.value = [];
    }

    // 업체 정보 설정 (데이터가 없어도 업체 정보는 조회)
    const { data: cInfo, error: cError } = await supabase
      .from('companies')
      .select('company_name, business_registration_number, representative_name, business_address')
      .eq('id', companyId.value)
      .maybeSingle();
    
    if(cError) {
      console.error('업체 정보 조회 오류:', cError);
      throw cError;
    }
    
    companyInfo.value = cInfo;

    // 구간수수료율 조회
    const { data: shareData, error: shareError } = await supabase
      .from('settlement_share')
      .select('section_commission_rate')
      .eq('settlement_month', month.value)
      .eq('company_id', companyId.value)
      .maybeSingle();
    
    if (shareError) {
      console.error('구간수수료율 조회 오류:', shareError);
      sectionCommissionRate.value = 0;
    } else {
      sectionCommissionRate.value = shareData?.section_commission_rate || 0;
    }

  } catch (err) {
    console.error('상세 데이터 조회 오류:', err);
    console.error('오류 상세:', { 
      message: err.message, 
      code: err.code, 
      details: err.details,
      hint: err.hint 
    });
    alert('상세 데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
    detailRows.value = [];
  } finally {
    loading.value = false;
  }
}

// 합계 계산 (전체 데이터 기준)
const totalQty = computed(() => {
  const sum = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 수량을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_qty ?? 0);
  }, 0);
  return sum.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});
const totalPrescriptionAmount = computed(() => {
  const sum = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 처방액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_prescription_amount ?? 0);
  }, 0);
  return sum.toLocaleString();
});
const totalPaymentAmount = computed(() => {
  const sum = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    // 최종 지급액 사용 (반영 흡수율 적용된 금액)
    return sum + (row._raw_final_payment_amount ?? 0);
  }, 0);
  return sum.toLocaleString();
});

const settlementSummary = computed(() => {
  // 지급 처방액 계산 (수수료율이 있는 정상 건의 처방액만)
  const paymentPrescriptionAmount = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    if (row.commission_rate && parseFloat(row.commission_rate.replace('%', '')) > 0) {
      return sum + (row._raw_prescription_amount || 0);
    }
    return sum;
  }, 0);

  // 기본 지급액 계산 (구간수수료 제외) - 최종 지급액 사용
  const basePaymentAmount = detailRows.value.reduce((sum, row) => {
    // 삭제된 건은 지급액을 0으로 계산
    if (row.review_action === '삭제') return sum;
    // 최종 지급액 사용 (반영 흡수율 적용된 금액)
    return sum + (row._raw_final_payment_amount || 0);
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

function goBack() {
  router.push('/admin/settlement-share');
}



async function downloadExcel() {
  if (detailRows.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }
  
  // No 컬럼과 함께 데이터 생성
  const excelData = detailRows.value.map((row, index) => ({
    'No': index + 1,
    '상태': row.review_action || '정상',
    '병의원명': row.client_name,
    '처방월': row.prescription_month,
    '제품명': row.product_name_display,
    '보험코드': row.insurance_code,
    '약가': row._raw_price || 0,
    '처방수량': row._raw_qty || 0,
    '처방액': row._raw_prescription_amount || 0,
    '수수료율': Number(String(row.commission_rate).replace('%', '')) / 100,
    '반영 흡수율': formatAppliedAbsorptionRateForExcel(row.applied_absorption_rate),
    '지급액': row._raw_final_payment_amount || 0,
    '비고': row.remarks || '',
  }));

  // 엑셀용 합계 계산 (원본 데이터에서 직접 계산)
  const excelTotalQty = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_qty || 0);
  }, 0);
  
  const excelTotalPrescriptionAmount = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_prescription_amount || 0);
  }, 0);
  
  const excelTotalPaymentAmount = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    return sum + (row._raw_final_payment_amount || 0);
  }, 0);

  // 구간수수료 계산 (엑셀용)
  const excelPaymentPrescriptionAmount = detailRows.value.reduce((sum, row) => {
    if (row.review_action === '삭제') return sum;
    if (row.commission_rate && parseFloat(row.commission_rate.replace('%', '')) > 0) {
      return sum + (row._raw_prescription_amount || 0);
    }
    return sum;
  }, 0);
  const excelSectionCommissionAmount = Math.round(excelPaymentPrescriptionAmount * (sectionCommissionRate.value || 0));
  const excelTotalPaymentAmountWithCommission = excelTotalPaymentAmount + excelSectionCommissionAmount;

  // 합계 행 추가
  excelData.push({
    'No': '',
    '상태': '',
    '병의원명': '',
    '처방월': '',
    '제품명': '',
    '보험코드': '합계',
    '약가': '',
    '처방수량': excelTotalQty,
    '처방액': excelTotalPrescriptionAmount,
    '수수료율': '',
    '반영 흡수율': '',
    '지급액': excelTotalPaymentAmountWithCommission,
    '비고': `구간수수료 ${(sectionCommissionRate.value * 100)?.toFixed(1)}% 포함`,
  });

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('정산내역서상세')

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
      
      // 가운데 정렬할 컬럼 지정 (No, 상태, 병의원명, 처방월, 제품명, 보험코드)
      if ([1, 2, 3, 4, 5, 6].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
      
      // 우측 정렬할 컬럼 지정 (약가, 처방액, 지급액)
      if ([7, 9, 12].includes(colNumber)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
      
      // 숫자 컬럼들은 숫자 형식으로 설정 (약가, 처방액, 지급액)
      if ([7, 9, 12].includes(colNumber)) {
        cell.numFmt = '#,##0'
      }
      
      // 처방수량 컬럼은 소수점 1자리 형식으로 설정
      if (colNumber === 8) {
        cell.numFmt = '#,##0.0'
      }
      
      // 수수료율과 반영 흡수율 컬럼은 백분율 형식으로 설정
      if ([10, 11].includes(colNumber)) {
        cell.numFmt = '0.0%'
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
  totalRow.getCell(8).numFmt = '#,##0.0'; // 처방수량
  totalRow.getCell(9).numFmt = '#,##0'; // 처방액
  totalRow.getCell(12).numFmt = '#,##0'; // 지급액

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
    { width: 8 },  // 상태
    { width: 32 }, // 병의원명
    { width: 10 }, // 처방월
    { width: 32 }, // 제품명
    { width: 12 }, // 보험코드
    { width: 12 }, // 약가
    { width: 12 }, // 처방수량
    { width: 16 }, // 처방액
    { width: 10 }, // 수수료율
    { width: 12 }, // 반영 흡수율
    { width: 16 }, // 지급액
    { width: 24 }  // 비고
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

  const today = new Date().toISOString().split('T')[0];
  const fileName = `정산내역서상세_${companyInfo.value.company_name || ''}_${month.value}_${today}.xlsx`;

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

// 반영 흡수율 포맷팅 함수
function formatAppliedAbsorptionRate(value) {
  try {
    if (value === null || value === undefined) {
      return '100.0%';
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return '100.0%';
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

// 엑셀용 반영 흡수율 포맷팅 함수 (소수점 형태로 반환)
function formatAppliedAbsorptionRateForExcel(value) {
  try {
    if (value === null || value === undefined) {
      return 1.0; // 100% = 1.0
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 1.0;
    }
    
    // 값이 1보다 크면 이미 퍼센트 형태로 저장된 것 -> 소수점으로 변환
    // 값이 1 이하면 소수점 형태로 저장된 것 -> 그대로 사용
    const decimalValue = numValue > 1 ? numValue / 100 : numValue;
    
    return decimalValue;
  } catch (error) {
    console.error('엑셀용 반영 흡수율 포맷 오류:', error, value);
    return 1.0;
  }
}
</script>

<style scoped>
/* 삭제된 항목 텍스트 스타일 */
.deleted-text {
  text-decoration: line-through;
  color: #999;
}
</style>
