<template>
  <div class="performance-register-view">
    <div class="header-title">실적 등록</div>
    <div class="filter-card" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom:0rem; padding:0.15rem 1.5rem 0.15rem 1rem !important;">
      <div style="display:flex; align-items:center; flex:1;">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="goBackToList" style="margin-right:12px;" />
        <div>
          <div style="font-size:1.1rem; font-weight:700;">{{ route.query?.clientName }}</div>
          <div style="font-size:0.88rem; color:#444;">
            {{ route.query?.businessRegistrationNumber }} / {{ route.query?.address }}
          </div>
        </div>
      </div>
      <div v-if="hasNonEditableRow" class="status-message status-warning">
        검수 상태가 완료, 또는 검수중인 실적은 수정이 불가능합니다.
      </div>
    </div>

    <div class="data-card">
      <div class="input-table-wrapper performance-edit-table">
        <div class="top-bar-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <div class="total-count-display">실적: {{ validRowCount }} 건</div>
          <div v-if="clientSettlementRemarks && isAdminUser" 
            class="settlement-remarks" 
            style="background: #e3f2fd; 
            color: #1976d2; 
            padding: 0.25rem 1rem;
            min-width: 240px;
            text-align: center;
            border-radius: 4px; 
            border: 1px solid #bbdefb; 
            font-size: 0.9rem; 
            font-weight: 500;">
            {{ clientSettlementRemarks }}
          </div>
          <div style="display:flex; gap: 0.5rem; align-items:center;">

            <button class="btn-delete" @click="deleteSelected" :disabled="!hasSelectedItems" style="min-width:80px !important;">삭제</button>
            <button class="btn-save" @click="onSave" :disabled="!canSave || !isInputEnabled" style="min-width:80px !important;">저장</button>
          </div>
        </div>
        <div class="table-header-fixed">
          <table style="table-layout: fixed; width: 100%;">
            <thead>
              <tr>
                <th style="width:3%;">
                  <input 
                    type="checkbox" 
                    class="performance-checkbox"
                    @change="toggleSelectAll" 
                    :checked="isAllSelected"
                  />
                </th>
                <th style="width:3%;">No</th>
                <th style="width:7%;">처방월</th>
                <th style="width:18%;">제품명</th>
                <th style="width:6%;">보험코드</th>
                <th style="width:6%;">단가</th>
                <th style="width:6%;">처방수량</th>
                <th style="width:7%;">처방액</th>
                <th style="width:5%;">수수료율</th>
                <th style="width:7%;">지급액</th>
                <th style="width:8%;">처방구분</th>
                <th style="width:12%;">비고</th>
                <th style="width:4%;">삭제</th>
                <th style="width:4%;">추가</th>
                <th style="width:4%;">검수상태</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <div class="table-body-scroll">
          <table class="input-table prime-like-table" style="table-layout: fixed; width: 100%;">
            <tbody>
              <tr v-for="(row, rowIdx) in inputRows" :key="rowIdx">
                <td style="text-align:center;width:3%;">
                  <input 
                    type="checkbox" 
                    class="performance-checkbox"
                    v-model="row.selected" 
                    :disabled="!isRowEditable(row)"
                    :class="{ 'disabled-area': !isRowEditable(row) }"
                  />
                </td>
                <td style="text-align:center;width:3%;" :class="{ 'disabled-area': !isRowEditable(row) }">{{ rowIdx + 1 }}</td>
                <td style="width:7%;text-align:center;">
                  <select
                    v-model="row.prescription_month"
                    :tabindex="isRowEditable(row) ? 0 : -1"
                    :disabled="!isRowEditable(row)"
                    @keydown="onArrowKey($event, rowIdx, 'prescription_month')"
                    @change="handlePrescriptionMonthChange(rowIdx)"
                    :class="['select_month', { 'disabled-area': !isRowEditable(row) }]"
                  >
                    <option v-for="opt in prescriptionOptions" :key="opt.value" :value="opt.month">{{ opt.month }}</option>
                  </select>
                </td>
                <td style="position:relative;text-align:left;width:18%;">
                  <div class="product-input-container">
                    <input
                      v-model="row.product_name_display"
                      :tabindex="isRowEditable(row) ? 0 : -1"
                      :readonly="!isRowEditable(row)"
                      @input="handleProductNameInput(rowIdx, $event)"
                      @keydown.enter.prevent="applySelectedProductFromSearch(rowIdx)"
                      @keydown.down.prevent="navigateProductSearchList('down')"
                      @keydown.up.prevent="navigateProductSearchList('up')"
                      @keydown="onArrowKey($event, rowIdx, 'product_name')"
                      @focus="handleProductNameFocus(rowIdx)"
                      @blur="delayedHideProductSearchList(rowIdx)" 
                      :disabled="!isRowEditable(row)"
                      :class="[
                        cellClass(rowIdx, 'product_name'),
                        { 'disabled-area': !isRowEditable(row) }
                      ]"
                      autocomplete="off"
                      :ref="el => setProductInputRef(rowIdx, el)"
                    />
                    <button 
                      type="button"
                      @click="toggleProductDropdown(rowIdx)"
                      @mousedown.prevent
                      class="dropdown-arrow-btn"
                      tabindex="-1"
                      :disabled="!isRowEditable(row)"
                    >
                      <span class="dropdown-arrow">▼</span>
                    </button>
                  </div>
                  <teleport to="body">
                    <div v-if="productSearchForRow.show && productSearchForRow.activeRowIndex === rowIdx && productSearchForRow.results.length > 0"
                      class="search-dropdown product-search-dropdown"
                      :style="productDropdownStyle[rowIdx]"
                    >
                      <ul>
                        <li
                          v-for="(product, index) in productSearchForRow.results"
                          :key="product.id"
                          @click="clickProductFromSearchList(product, rowIdx)"
                          :class="{ 'selected': productSearchForRow.selectedIndex === index }"
                        >
                          <div class="product-item">
                            <span 
                              class="product-name"
                              :style="productSearchForRow.selectedIndex === index ? 'color: #fff !important;' : ''"
                            >{{ truncateText(product.product_name, 25) }}</span>
                            <span class="insurance-code">{{ product.insurance_code }}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </teleport>
                </td>
                <td style="text-align:center;width:6%;">
                  <span :class="['readonly-span', !isRowEditable(row) ? 'disabled-area' : '']">{{ row.insurance_code }}</span>
                </td>
                <td style="text-align:right;width:6%;">
                  <span :class="['readonly-span', !isRowEditable(row) ? 'disabled-area' : '']">{{ row.price }}</span>
                </td>
                <td style="text-align:right;position:relative; width:6%;">
                  <input
                    v-model="row.prescription_qty"
                    :tabindex="isRowEditable(row) ? 0 : -1"
                    :readonly="!isRowEditable(row)"
                    @keydown.enter.prevent="addOrFocusNextRow(rowIdx)"
                    @keydown="onArrowKey($event, rowIdx, 'prescription_qty')"
                    @input="onQtyInput(rowIdx)"
                    @focus="handlePrescriptionQtyFocus(rowIdx)"
                    @blur="row.prescription_qty = row.prescription_qty ? Number(row.prescription_qty.toString().replace(/,/g, '')).toLocaleString() : ''"
                    :disabled="!isRowEditable(row)"
                    :class="[
                      cellClass(rowIdx, 'prescription_qty'),
                      { 'disabled-area': !isRowEditable(row) }
                    ]"
                    style="text-align:right;"
                  />
                </td>
                <td style="text-align:right;width:7%;">
                  <span :class="['readonly-span', !isRowEditable(row) ? 'disabled-area' : '']">{{ row.prescription_amount }}</span>
                </td>
                <td style="text-align:right;width:5%;">
                  <input
                    v-model="row.commission_rate"
                    :tabindex="isRowEditable(row) && isAdminUser ? 0 : -1"
                    :readonly="!isRowEditable(row) || !isAdminUser"
                    @keydown="onArrowKey($event, rowIdx, 'commission_rate')"
                    @input="onCommissionRateInput(rowIdx)"
                    @focus="handleCommissionRateFocus(rowIdx)"
                    @blur="formatCommissionRate(rowIdx)"
                    :disabled="!isRowEditable(row) || !isAdminUser"
                    :class="[
                      cellClass(rowIdx, 'commission_rate'),
                      { 'disabled-area': !isRowEditable(row) || !isRowEditable(row) || !isAdminUser }
                    ]"
                    style="text-align:center;"
                  />
                </td>
                <td style="text-align:right;width:7%;">
                  <span :class="['readonly-span', !isRowEditable(row) ? 'disabled-area' : '']">{{ formatPaymentAmount(row.payment_amount) }}</span>
                </td>
                <td style="text-align:center;width:8%;">
                  <select
                    v-model="row.prescription_type"
                    :tabindex="isRowEditable(row) ? 0 : -1"
                    :readonly="!isRowEditable(row)"
                    @change="onPrescriptionTypeInput(rowIdx)"
                    @keydown="onArrowKey($event, rowIdx, 'prescription_type')"
                    @focus="handleFieldFocus(rowIdx, 'prescription_type')"
                    :disabled="!isRowEditable(row)"
                    :class="[
                      cellClass(rowIdx, 'prescription_type'),
                      { 'disabled-area': !isRowEditable(row) }
                    ]"
                    style="text-align:center;"
                  >
                    <option v-for="type in prescriptionTypeOptions" :key="type" :value="type">{{ type }}</option>
                  </select>
                </td>
                <td style="text-align:left; width:12%;">
                  <input
                    v-model="row.remarks"
                    :tabindex="isRowEditable(row) ? 0 : -1"
                    :readonly="!isRowEditable(row)"
                    @keydown.enter.prevent="addOrFocusNextRow(rowIdx)"
                    @keydown="onArrowKey($event, rowIdx, 'remarks')"
                    @focus="handleFieldFocus(rowIdx, 'remarks')"
                    :disabled="!isRowEditable(row)"
                    :class="[
                      cellClass(rowIdx, 'remarks'),
                      { 'disabled-area': !isRowEditable(row) }
                    ]"
                    style="text-align:left;"
                  />
                </td>
                <td class="action-cell" style="width:4%;">
                  <button 
                    class="btn-delete-sm" 
                    @click="confirmDeleteRow(rowIdx)" 
                    :disabled="inputRows.length === 1 || !isRowEditable(row)" 
                    title="삭제"
                    :class="{ 'disabled-area': !isRowEditable(row) }"
                  >삭제</button>
                </td>
                <td class="action-cell" style="width:4%;">
                  <button 
                    class="btn-add-sm" 
                    @click="confirmAddRowBelow(rowIdx)" 
                    title="추가"
                    :disabled="!isRowEditable(row)"
                    :class="{ 'disabled-area': !isRowEditable(row) }"
                  >추가</button>
                </td>
                <td style="width:4%;text-align:center;">
                  <span :class="getStatusClass(row.review_status || '대기')">
                    {{ getStatusLabel(row.review_status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="table-footer-wrapper"
      style="width:100%; background:#f8f9fa;
        height: 38px;
        border:1px solid #dee2e6;
        border-bottom:2px solid #aaa;
        position:sticky;
        bottom:0;z-index:2;">
        <table style="width:100%;table-layout:fixed;">
                      <tr>
              <td style="width:43%;text-align:center;font-weight:bold;">합계</td>
              <td style="width:6%;text-align:right;font-weight:bold;">{{ totalQty }}</td>
              <td style="width:7%;text-align:right;font-weight:bold;">{{ totalAmount }}</td>
              <td style="width:5%;"></td>
              <td style="width:7%;text-align:right;font-weight:bold;">{{ totalPaymentAmount }}</td>
              <td style="width:32%;"></td>
            </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';
// 주석: updatePromotionProductHospitalPerformance는 트리거가 자동 처리하므로 불필요
import Button from 'primevue/button';
import { translateSupabaseError, translateGeneralError } from '@/utils/errorMessages';

const route = useRoute();
const router = useRouter();

// 정산월 정보를 이전 화면에서 전달받음
const selectedSettlementMonth = ref(route.params.settlementMonth || route.query?.settlementMonth || '');

// 처방월 옵션을 설정
const prescriptionOffset = ref(1); // 1: -1M, 2: -2M, 3: -3M
const prescriptionMonth = ref('');
const prescriptionOptions = ref([]);

// 실적 입력행들 (최소 1행은 유지)
const inputRows = ref([{ 
  prescription_month: getDefaultPrescriptionMonth(),
  product_name_display: '', 
  product_id: null, 
  insurance_code: '', 
  standard_code: '', // 표준코드 추가
  price: '', 
  prescription_qty: '', 
  prescription_amount: '', 
          commission_rate: '', // 수수료율
  payment_amount: '', // 지급액
  prescription_type: 'EDI', 
  remarks: '',
  commission_rate_a: null,
  commission_rate_b: null,
  commission_rate_c: null,
  commission_rate_d: null,
  commission_rate_e: null,
  review_status: '대기',
  selected: false, // 선택 체크박스
}]);

// 편집 가능 여부 (review_status에 따라 결정)
const isInputEnabled = ref(true);
const reviewStatus = ref('대기');
const statusMessage = ref('');
const canSave = computed(() => {
  const currentValidRows = getValidRows(inputRows.value);
  const originalValidRows = getValidRows(originalRows.value);
  return isRowsChanged(currentValidRows, originalValidRows);
});
// 입력된 실적(제품+수량)만 추려주는 함수
function getValidRows(rows) {
  return rows
    .filter(row => row.product_id && row.prescription_qty)
    .map(row => ({
      id: row.id,
      prescription_month: row.prescription_month,
      product_id: row.product_id,
      prescription_qty: String(row.prescription_qty || '').replace(/,/g, ''),
      prescription_type: row.prescription_type,
      remarks: row.remarks || '',
      commission_rate: String(row.commission_rate || '').replace(/,/g, '').replace(/%/g, ''),
      commission_rate_a: row.commission_rate_a,
      commission_rate_b: row.commission_rate_b,
      commission_rate_c: row.commission_rate_c,
      commission_rate_d: row.commission_rate_d,
      commission_rate_e: row.commission_rate_e
    }));
}

// 두 배열의 주요 필드가 모두 같은지 비교
function isRowsChanged(current, original) {
  if (current.length !== original.length) return true;
  for (let i = 0; i < current.length; i++) {
    const a = current[i];
    const b = original[i];
    if (
      a.prescription_month !== b.prescription_month ||
      a.product_id !== b.product_id ||
      String(a.prescription_qty || '').replace(/,/g, '') !== String(b.prescription_qty || '').replace(/,/g, '') ||
      a.prescription_type !== b.prescription_type ||
      (a.remarks || '') !== (b.remarks || '') ||
      String(a.commission_rate || '').replace(/,/g, '') !== String(b.commission_rate || '').replace(/,/g, '')
    ) {
      return true;
    }
  }
  return false;
}

// 화면 진입 시점의 원본 데이터 저장
const originalRows = ref([]);
const currentCell = ref({ row: 0, col: 'product_name' });

const prescriptionTypeOptions = [
  'EDI',
  'ERP직거래자료',
  '매출자료',
  '약국조제',
  '원내매출',
  '원외매출',
  '차감',
];
const products = ref([]);
const productSearchForRow = ref({
  query: '',
  results: [],
  selectedIndex: -1,
  show: false,
  activeRowIndex: -1,
});
const productInputRefs = ref({});
const productDropdownStyle = ref({});

const productsByMonth = ref({}); // { '2025-06': [...], '2025-05': [...], ... }

function setProductInputRef(rowIdx, el) {
  if (el) productInputRefs.value[rowIdx] = el;
}

function updateProductDropdownPosition(rowIdx) {
  nextTick(() => {
    const el = productInputRefs.value[rowIdx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    
    // 화면 높이와 드롭다운 높이 계산
    const windowHeight = window.innerHeight;
    const dropdownHeight = 220; // 드롭다운 예상 높이
    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // 아래쪽 공간이 부족하고 위쪽 공간이 충분하면 위로 표시
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
    
    productDropdownStyle.value[rowIdx] = {
      position: 'fixed',
      left: rect.left + 'px',
      top: showAbove ? (rect.top - dropdownHeight) + 'px' : rect.bottom + 'px',
      width: rect.width + 'px',
      zIndex: 9999,
      maxHeight: showAbove ? Math.min(dropdownHeight, spaceAbove - 10) + 'px' : Math.min(dropdownHeight, spaceBelow - 10) + 'px',
      overflowY: 'auto',
    };
  });
}

watch(() => productSearchForRow.value.activeRowIndex, (rowIdx) => {
  if (productSearchForRow.value.show && rowIdx !== -1) {
    updateProductDropdownPosition(rowIdx);
  }
});
watch(() => productSearchForRow.value.show, (show) => {
  if (show && productSearchForRow.value.activeRowIndex !== -1) {
    updateProductDropdownPosition(productSearchForRow.value.activeRowIndex);
  }
});
watch(inputRows, () => {
  if (productSearchForRow.value.show && productSearchForRow.value.activeRowIndex !== -1) {
    updateProductDropdownPosition(productSearchForRow.value.activeRowIndex);
  }
}, { deep: true });
window.addEventListener('scroll', () => {
  const rowIdx = productSearchForRow.value.activeRowIndex;
  if (productSearchForRow.value.show && rowIdx !== -1) {
    updateProductDropdownPosition(rowIdx);
  }
}, true);
function getPrescriptionMonth(settlementMonth, offset) {
  if (!settlementMonth) return '';
  const [y, m] = settlementMonth.split('-');
  let mm = parseInt(m, 10) - offset;
  let yy = parseInt(y, 10);
  while (mm <= 0) { mm += 12; yy -= 1; }
  return `${yy}-${String(mm).padStart(2, '0')}`;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 상태에 따른 CSS 클래스 반환
function getStatusClass(status) {
  if (status === '완료') return 'status-completed';
  if (status === '검수중') return 'status-reviewing';
  return 'status-pending';
}

function getStatusLabel(status) {
  if (status === '완료') return '완료';
  if (status === '검수중') return '검수중';
  return '대기';
}

// 편집 상태 확인 및 메시지 설정
function checkEditStatus() {
  // 관리자는 항상 편집 가능
  if (isAdminUser.value) {
    isInputEnabled.value = true;
    statusMessage.value = '';
    return;
  }
  
  // 일반 사용자는 상태에 따라 편집 제한
  switch (reviewStatus.value) {
    case '대기':
      isInputEnabled.value = true;
      statusMessage.value = '';
      break;
    case '검수중':
      isInputEnabled.value = false;
      statusMessage.value = '검수 중인 실적으로 수정할 수 없습니다';
      break;
    case '완료':
      isInputEnabled.value = false;
      statusMessage.value = '검수 완료된 실적으로 수정할 수 없습니다';
      break;
    default:
      isInputEnabled.value = true;
      statusMessage.value = '';
  }
}

// 해당 거래처의 실적 상태 확인
async function checkPerformanceEditStatus() {
  try {
    const clientId = route.query?.clientId;
    if (!clientId || !selectedSettlementMonth.value || !prescriptionMonth.value) {
      return;
    }

    // 관리자가 companyId로 접근하는 경우 기간 체크 우회
    if (route.query?.companyId && isAdminUser.value) {
      reviewStatus.value = '대기';
      checkEditStatus();
      return;
    }

    // 해당 거래처의 실적 중 하나라도 검수중/완료 상태인지 확인
    const { data, error } = await supabase
      .from('performance_records')
      .select('review_status')
      .eq('settlement_month', selectedSettlementMonth.value)
      .eq('prescription_month', prescriptionMonth.value)
      .eq('client_id', clientId)
      .limit(1);
    if (error) {
      console.error('실적 상태 확인 오류:', error);
      return;
    }

    if (data && data.length > 0) {
      reviewStatus.value = data[0].review_status || '대기';
    } else {
      reviewStatus.value = '대기';
    }

    checkEditStatus();
  } catch (err) {
    console.error('실적 상태 확인 예외:', err);
  }
}

function updatePrescriptionOptions() {
  if (!selectedSettlementMonth.value) {
    prescriptionOptions.value = [];
    return;
  }
  prescriptionOptions.value = [1, 2, 3, 4, 5, 6].map(offset => ({
    value: offset,
    month: getPrescriptionMonth(selectedSettlementMonth.value, offset)
  }));
}

watch(selectedSettlementMonth, () => {
  if (selectedSettlementMonth.value) {
    updatePrescriptionOptions();
    prescriptionOffset.value = 1;
    prescriptionMonth.value = getPrescriptionMonth(selectedSettlementMonth.value, 1);
  }
}, { immediate: true });
watch(prescriptionOffset, (val) => {
  prescriptionMonth.value = getPrescriptionMonth(selectedSettlementMonth.value, val);
  // 처방월 변경 시 편집 상태 확인
  checkPerformanceEditStatus();
});
// 처방월이 변경되면 편집 상태 재확인
watch(prescriptionMonth, (val) => {
  // console.log('처방월 변경 감지:', val);
  if (val) {
    fetchProducts(val);
    checkPerformanceEditStatus();
  }
});
watch(
  () => inputRows.value[0].prescription_month,
  (val) => {
    if (val) {
      fetchProducts(val);
    }
  }
);
async function fetchProducts(prescriptionMonth) {
  try {
    // 1. 현재 사용자/관리자의 업체 정보 확인
    const clientId = route.query?.clientId;
    const companyId = route.query?.companyId;
    let currentCompanyId;

    if (companyId) {
      // 관리자가 특정 업체의 실적을 등록하는 경우
      currentCompanyId = companyId;
    } else {
      // 일반 사용자가 자신의 실적을 등록하는 경우
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (!company) return;
      currentCompanyId = company.id;
    }

    // 2. product_company_not_assignments에서 현재 업체의 미할당 제품 ID 목록 조회
    const { data: assignedProductIds, error: assignedError } = await supabase
      .from('product_company_not_assignments')
      .select('product_id')
      .eq('company_id', currentCompanyId);

    if (assignedError) {
      console.error('미할당 제품 ID 조회 오류:', assignedError);
      return;
    }

    const excludedProductIds = assignedProductIds.map(item => item.product_id);

    // 3. 해당월의 모든 제품 조회 (미할당 제품 제외)
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('base_month', prescriptionMonth)
      .order('product_name', { ascending: true })
      .range(0, 2999);

    if (excludedProductIds.length > 0) {
      query = query.not('id', 'in', `(${excludedProductIds.join(',')})`);
    }

    const { data, error } = await query;

    if (!error && data) {
      products.value = data;
      // console.log('불러온 제품 개수:', data.length, '처방월:', prescriptionMonth);
    }
  } catch (err) {
    console.error('제품 데이터 로딩 오류:', err);
  }
}

// 제품 검색 관련 함수들
function handleProductNameInput(rowIndex, event) {
  if (!isInputEnabled.value) return;
  const query = event.target.value.toLowerCase();
  inputRows.value[rowIndex].product_name_display = event.target.value;
  inputRows.value[rowIndex].product_id = null;
  inputRows.value[rowIndex].insurance_code = '';
  inputRows.value[rowIndex].price = '';

  productSearchForRow.value.activeRowIndex = rowIndex;
  if (query.length < 1) {
    productSearchForRow.value.show = false;
    productSearchForRow.value.results = [];
    // 제품명이 삭제되면 관련 필드들 초기화
    clearProductRelatedFields(rowIndex);
    // console.log('show:', productSearchForRow.value.show, 'results:', productSearchForRow.value.results);
    return;
  }
  // 처방월에 맞는 제품만 필터링
  const month = inputRows.value[rowIndex].prescription_month;
  const productList = productsByMonth.value[month] || [];
  productSearchForRow.value.results = productList.filter(
    p =>
      (p.product_name && p.product_name.toLowerCase().includes(query)) ||
      (p.insurance_code && p.insurance_code.toLowerCase().includes(query))
  );
  productSearchForRow.value.selectedIndex = -1;
  productSearchForRow.value.show = productSearchForRow.value.results.length > 0;
  // console.log('show:', productSearchForRow.value.show, 'results:', productSearchForRow.value.results);
}

function navigateProductSearchList(direction) {
  if (!productSearchForRow.value.show || productSearchForRow.value.results.length === 0) return;
  if (direction === 'down') {
    productSearchForRow.value.selectedIndex = (productSearchForRow.value.selectedIndex + 1) % productSearchForRow.value.results.length;
  } else if (direction === 'up') {
    productSearchForRow.value.selectedIndex = (productSearchForRow.value.selectedIndex - 1 + productSearchForRow.value.results.length) % productSearchForRow.value.results.length;
  }

  // 선택된 항목이 보이도록 스크롤
  nextTick(() => {
    const listElement = document.querySelector('.product-search-dropdown ul');
    const newIndex = productSearchForRow.value.selectedIndex;
    if (listElement && listElement.children[newIndex]) {
      listElement.children[newIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  });
}

async function applySelectedProduct(product, rowIndex) {
  inputRows.value[rowIndex].product_name_display = product.product_name;
  inputRows.value[rowIndex].product_id = product.id;
  inputRows.value[rowIndex].insurance_code = product.insurance_code;
  inputRows.value[rowIndex].standard_code = product.standard_code; // 표준코드 추가
  inputRows.value[rowIndex].price = product.price ? Number(product.price).toLocaleString() : '';
  inputRows.value[rowIndex].commission_rate_a = product.commission_rate_a;
  inputRows.value[rowIndex].commission_rate_b = product.commission_rate_b;
  inputRows.value[rowIndex].commission_rate_c = product.commission_rate_c;
  inputRows.value[rowIndex].commission_rate_d = product.commission_rate_d;
  inputRows.value[rowIndex].commission_rate_e = product.commission_rate_e;
  
  // 등급에 맞는 수수료율 자동 설정
  const clientId = route.query?.clientId;
  const companyId = route.query?.companyId;
  let myCompany;
  
  if (companyId) {
    // 관리자가 특정 업체의 실적을 등록하는 경우
    const { data } = await supabase.from('companies').select('id').eq('id', companyId).single();
    myCompany = data;
  } else {
    // 일반 사용자가 자신의 실적을 등록하는 경우
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserUid = session?.user?.id;
    const { data } = await supabase.from('companies').select('id').eq('user_id', currentUserUid).single();
    myCompany = data;
  }
  
  if (myCompany && clientId) {
    const grade = await getCommissionGradeForClientCompany(myCompany.id, Number(clientId));
    let commissionRate = 0;
    
    if (grade === 'A') {
      commissionRate = product.commission_rate_a;
    } else if (grade === 'B') {
      commissionRate = product.commission_rate_b;
    } else if (grade === 'C') {
      commissionRate = product.commission_rate_c;
    } else if (grade === 'D') {
      commissionRate = product.commission_rate_d;
    } else if (grade === 'E') {
      commissionRate = product.commission_rate_e;
    }
    
    if (commissionRate !== null && commissionRate !== undefined) {
      inputRows.value[rowIndex].commission_rate = (Number(commissionRate) * 100).toFixed(1) + '%';
    } else {
      inputRows.value[rowIndex].commission_rate = '';
    }
  } else {
    // 기본값은 A등급 수수료율
    if (product.commission_rate_a !== null && product.commission_rate_a !== undefined) {
      inputRows.value[rowIndex].commission_rate = (Number(product.commission_rate_a) * 100).toFixed(1) + '%';
    } else {
      inputRows.value[rowIndex].commission_rate = '';
    }
  }
  
  // 제품 정보 설정 후 처방액과 지급액 계산
  calculateAmounts(rowIndex);
  
  productSearchForRow.value.show = false;
  productSearchForRow.value.activeRowIndex = -1;
  nextTick(() => {
    focusField(rowIndex, 'prescription_qty');
  });
}

function applySelectedProductFromSearch(rowIndexToApply) {
  const idx = productSearchForRow.value.selectedIndex;
  const currentActionRow = productSearchForRow.value.activeRowIndex;
  if (productSearchForRow.value.show && idx !== -1 && productSearchForRow.value.results[idx] && currentActionRow === rowIndexToApply) {
    const product = productSearchForRow.value.results[idx];
    applySelectedProduct(product, currentActionRow);
  } else if (productSearchForRow.value.show && productSearchForRow.value.results.length > 0 && currentActionRow === rowIndexToApply) {
    const product = productSearchForRow.value.results[0];
    applySelectedProduct(product, currentActionRow);
  } else {
    focusField(rowIndexToApply, 'prescription_qty');
  }
  productSearchForRow.value.show = false;
}

function clickProductFromSearchList(product, rowIndex) {
  applySelectedProduct(product, rowIndex);
}

function delayedHideProductSearchList(rowIdx) {
  setTimeout(() => hideProductSearchList(rowIdx), 200);
}

function hideProductSearchList(rowIndex) {
  if (productSearchForRow.value.activeRowIndex === rowIndex) {
    if (!inputRows.value[rowIndex].product_id) {
      inputRows.value[rowIndex].product_name_display = '';
      // 제품 정보가 없으면 관련 필드들 초기화
      clearProductRelatedFields(rowIndex);
    }
    productSearchForRow.value.show = false;
    productSearchForRow.value.activeRowIndex = -1;
  }
}

// 제품 관련 필드들을 초기화하는 함수
function clearProductRelatedFields(rowIndex) {
  const row = inputRows.value[rowIndex];
  row.insurance_code = '';
  row.price = '';
  row.prescription_amount = '';
  row.commission_rate = '';
  row.payment_amount = '';
  row.commission_rate_a = null;
  row.commission_rate_b = null;
  row.commission_rate_c = null;
  row.commission_rate_d = null;
  row.commission_rate_e = null;
}

function toggleProductDropdown(rowIndex) {
  if (!isInputEnabled.value) return;
  if (isProductSearchOpen.value && productSearchForRow.value.activeRowIndex !== rowIndex) {
    return;
  }
  if (productSearchForRow.value.show && productSearchForRow.value.activeRowIndex === rowIndex) {
    productSearchForRow.value.show = false;
    productSearchForRow.value.activeRowIndex = -1;
    return;
  }
  // 처방월에 맞는 제품만 필터링
  const month = inputRows.value[rowIndex].prescription_month;
  productSearchForRow.value.activeRowIndex = rowIndex;
  productSearchForRow.value.results = productsByMonth.value[month] || [];
  productSearchForRow.value.selectedIndex = -1;
  productSearchForRow.value.show = productSearchForRow.value.results.length > 0;
  // console.log('show:', productSearchForRow.value.show, 'results:', productSearchForRow.value.results);
  nextTick(() => {
    focusField(rowIndex, 'product_name');
  });
}

// 제품 검색 드롭다운이 열려있는지 확인하는 computed
const isProductSearchOpen = computed(() => {
  return productSearchForRow.value.show && productSearchForRow.value.activeRowIndex !== -1;
});
// 제품명 필드 포커스 핸들러
function handleProductNameFocus(rowIdx) {
  if (!isInputEnabled.value) { // Added .value
    event.target.blur();
    return;
  }
  
  // 다른 행의 제품 검색이 열려있으면 차단
  if (isProductSearchOpen.value && productSearchForRow.value.activeRowIndex !== rowIdx) {
    event.target.blur();
    return;
  }
  
  currentCell.value = { row: rowIdx, col: 'product_name' };
  productSearchForRow.value.activeRowIndex = rowIdx;
  
  // 포커스 시 해당 월의 제품 목록이 로드되어 있지 않으면 로드
  const month = inputRows.value[rowIdx].prescription_month;
  if (!productsByMonth.value[month]) {
    fetchProductsForMonth(month);
  }
  
  // 포커스 시 드롭다운 표시 (제품이 있는 경우)
  if (productsByMonth.value[month] && productsByMonth.value[month].length > 0) {
    productSearchForRow.value.results = productsByMonth.value[month];
    productSearchForRow.value.selectedIndex = -1;
    productSearchForRow.value.show = true;
  }
}

// 일반 필드 포커스 핸들러
function handleFieldFocus(rowIdx, col) {
  if (!isInputEnabled.value) { // Added .value
    event.target.blur();
    return;
  }
  
  // 제품 검색 드롭다운이 열려있으면 포커스 차단
  if (isProductSearchOpen.value) {
    event.target.blur();
    return;
  }
  
  currentCell.value = { row: rowIdx, col: col };
}

// 수수료율 포커스 핸들러
function handleCommissionRateFocus(rowIdx) {
  if (!isInputEnabled.value) {
    event.target.blur();
    return;
  }
  
  // 제품 검색 드롭다운이 열려있으면 포커스 차단
  if (isProductSearchOpen.value) {
    event.target.blur();
    return;
  }
  
  // 포커스 시 백분율 기호 제거하고 숫자만 표시 (42.5% -> 42.5, 소수점 유지)
  const row = inputRows.value[rowIdx];
  if (row.commission_rate) {
    // 백분율 기호와 콤마만 제거하고 숫자와 소수점은 그대로 유지
    const rateStr = row.commission_rate.toString().replace(/,/g, '').replace(/%/g, '');
    const rate = Number(rateStr);
    if (!isNaN(rate)) {
      // 입력된 값의 원본 문자열을 그대로 유지 (소수점 포함)
      row.commission_rate = rateStr;
    }
  }
  
  currentCell.value = { row: rowIdx, col: 'commission_rate' };
}

// 처방수량 필드 포커스 핸들러
function handlePrescriptionQtyFocus(rowIdx) {
  if (!isInputEnabled.value) { // Added .value
    event.target.blur();
    return;
  }
  
  // 제품 검색 드롭다운이 열려있으면 포커스 차단
  if (isProductSearchOpen.value) {
    event.target.blur();
    return;
  }
  
  // 포커스시 콤마 제거
  inputRows.value[rowIdx].prescription_qty = inputRows.value[rowIdx].prescription_qty ? inputRows.value[rowIdx].prescription_qty.toString().replace(/,/g, '') : '';
  currentCell.value = { row: rowIdx, col: 'prescription_qty' };
}

// 테이블 네비게이션 함수들
function focusField(rowIdx, col) {
  nextTick(() => {
    const table = document.querySelector('.input-table');
    if (!table) return;
    const row = table.querySelectorAll('tbody tr')[rowIdx];
    if (!row) return;

    let el = null;
    if (col === 'prescription_month') el = row.querySelector('td:nth-child(3) select');
    else if (col === 'product_name') el = row.querySelector('td:nth-child(4) input');
    else if (col === 'prescription_qty') el = row.querySelector('td:nth-child(7) input');
    else if (col === 'commission_rate') el = row.querySelector('td:nth-child(9) input');
    else if (col === 'prescription_type') el = row.querySelector('td:nth-child(11) select');
    else if (col === 'remarks') el = row.querySelector('td:nth-child(12) input');
 
    if (el) {
      el.focus();
      if (el.tagName === 'INPUT') {
        el.select();
      }
    }
  });
}

function addOrFocusNextRow(rowIdx) {
  const currentRow = inputRows.value[rowIdx];
  // 현재 행의 제품명 입력 중일 때
  if (currentCell.value.col === 'product_name') {
    // 제품이 선택되어 있지 않으면 다음으로 진행하지 않음
    if (!currentRow.product_id) {
      return;
    }
    // 제품이 선택되어 있으면 수량 입력으로 이동
    focusField(rowIdx, 'prescription_qty');
    return;
  }
  
  // 현재 행의 수량 입력 중일 때
  if (currentCell.value.col === 'prescription_qty') {
    // 제품명과 수량이 모두 입력되어 있어야만 다음행 생성
    if (!currentRow.product_id || !currentRow.prescription_qty) {
      return;
    }
    
    // 마지막 행이면 새 행 추가
    if (rowIdx === inputRows.value.length - 1) {
      inputRows.value.push({ 
        prescription_month: getDefaultPrescriptionMonth(),
        product_name_display: '', 
        product_id: null, 
        insurance_code: '', 
        price: '', 
        prescription_qty: '', 
        prescription_amount: '', 
        commission_rate: '',
        payment_amount: '',
        prescription_type: 'EDI',
        remarks: '',
        commission_rate_a: null,
        commission_rate_b: null,
        review_status: '대기',
        selected: false,
      });
    }
    // 다음 행의 제품명으로 이동
    focusField(rowIdx + 1, 'product_name');
  }
  
  // 비고 입력 중일 때
  if (currentCell.value.col === 'remarks') {
    // 제품명과 수량이 모두 입력되어 있어야만 다음행 생성
    if (!currentRow.product_id || !currentRow.prescription_qty) {
      return;
    }
    
    // 마지막 행이면 새 행 추가
    if (rowIdx === inputRows.value.length - 1) {
      inputRows.value.push({ 
        prescription_month: getDefaultPrescriptionMonth(),
        product_name_display: '', 
        product_id: null, 
        insurance_code: '', 
        price: '', 
        prescription_qty: '', 
        prescription_amount: '', 
        commission_rate: '',
        payment_amount: '',
        prescription_type: 'EDI',
        remarks: '',
        commission_rate_a: null,
        commission_rate_b: null,
        review_status: '대기',
        selected: false,
      });
    }
    // 다음 행의 제품명으로 이동
    focusField(rowIdx + 1, 'product_name');
  }
}

function onPrescriptionTypeInput(rowIdx) {
  const value = inputRows.value[rowIdx].prescription_type;
  for (let i = rowIdx + 1; i < inputRows.value.length; i++) {
    inputRows.value[i].prescription_type = value;
  }
}

function onQtyInput(rowIdx) {
  const row = inputRows.value[rowIdx];
  let qtyValue = row.prescription_qty.toString().replace(/,/g, '');
  
  // 숫자가 아닌 문자 제거 (소수점은 허용하지 않음)
  qtyValue = qtyValue.replace(/[^0-9]/g, '');
  
  // 빈 문자열이면 그대로 유지, 아니면 숫자로 변환
  if (qtyValue === '') {
    row.prescription_qty = '';
    row.prescription_amount = '';
    row.payment_amount = '';
    return;
  }
  
  // 숫자로 변환하여 저장
  const qty = Number(qtyValue);
  if (isNaN(qty) || qty < 0) {
    row.prescription_qty = '';
    row.prescription_amount = '';
    row.payment_amount = '';
    return;
  }
  
  row.prescription_qty = qtyValue;
  
  const price = Number(row.price.toString().replace(/,/g, ''));
  if (!isNaN(qty) && !isNaN(price) && price > 0) {
    row.prescription_amount = (qty * price).toLocaleString();
    // 처방액이 변경되면 지급액도 재계산
    calculatePaymentAmount(rowIdx);
  } else {
    row.prescription_amount = '';
    row.payment_amount = '';
  }
}

// 처방액과 지급액을 모두 계산하는 함수
function calculateAmounts(rowIdx) {
  const row = inputRows.value[rowIdx];
  const qty = Number(row.prescription_qty.toString().replace(/,/g, ''));
  const price = Number(row.price.toString().replace(/,/g, ''));
  
  // 처방액 계산 (처방수량과 단가가 모두 있을 때만)
  if (!isNaN(qty) && qty !== 0 && !isNaN(price) && price > 0) {
    row.prescription_amount = (qty * price).toLocaleString();
  } else {
    row.prescription_amount = '';
  }
  
  // 지급액 계산
  calculatePaymentAmount(rowIdx);
}

// 수수료율 입력 시 지급액만 계산 (처방액은 변경하지 않음)
function onCommissionRateInput(rowIdx) {
  const row = inputRows.value[rowIdx];
  // 백분율 기호 제거하고 숫자만 추출
  let rate = row.commission_rate.toString().replace(/,/g, '').replace(/%/g, '');
  if (rate && !isNaN(Number(rate))) {
    // 입력값을 그대로 저장 (포커스 아웃 시 변환)
    row.commission_rate = rate;
  }
  // 지급액만 계산 (처방액은 변경하지 않음)
  calculatePaymentAmount(rowIdx);
}

// 지급액 계산 함수
function calculatePaymentAmount(rowIdx) {
  const row = inputRows.value[rowIdx];
  const prescriptionAmount = Number(row.prescription_amount.toString().replace(/,/g, ''));
  const commissionRate = Number(row.commission_rate.toString().replace(/,/g, '').replace(/%/g, ''));
  
  // console.log(`지급액 계산 - 행 ${rowIdx}:`, { prescriptionAmount, commissionRate, commissionRateRaw: row.commission_rate });
  
  // 지급액 계산 (처방액과 수수료율이 모두 있을 때만)
  if (!isNaN(prescriptionAmount) && prescriptionAmount !== 0 && !isNaN(commissionRate) && commissionRate >= 0) {
    // commissionRate는 백분율 형태이므로 그대로 사용 (100배 계산)
    const rateForCalculation = commissionRate;
    const paymentAmount = (prescriptionAmount * rateForCalculation / 100);
    row.payment_amount = paymentAmount.toLocaleString();
    
    // console.log(`지급액 계산 결과:`, { rateForCalculation, paymentAmount, formattedPaymentAmount: row.payment_amount });
  } else {
    row.payment_amount = '';
    // console.log(`지급액 계산 실패:`, { prescriptionAmountValid: !isNaN(prescriptionAmount), commissionRateValid: !isNaN(commissionRate), prescriptionAmountNonZero: prescriptionAmount !== 0 });
  }
}

// 수수료율 포맷팅 함수 (백분율로 표시, 소수점 유지)
function formatCommissionRate(rowIdx) {
  const row = inputRows.value[rowIdx];
  if (row.commission_rate) {
    const rateStr = row.commission_rate.toString().replace(/,/g, '').replace(/%/g, '');
    const rate = Number(rateStr);
    if (!isNaN(rate)) {
      // 입력된 값의 소수점 자릿수 확인
      const decimalPlaces = rateStr.includes('.') ? rateStr.split('.')[1].length : 0;
      
      // 입력된 소수점 자릿수를 그대로 유지하면서 백분율로 표시
      // 예: 42.5 -> 42.5%, 42.55 -> 42.55%, 42 -> 42%
      let displayRate;
      if (decimalPlaces > 0) {
        // 소수점이 있는 경우 입력된 자릿수 그대로 유지
        displayRate = rate.toFixed(decimalPlaces);
        // 불필요한 뒤의 0 제거 (예: 42.50 -> 42.5)
        displayRate = parseFloat(displayRate).toString();
      } else {
        // 정수인 경우 그대로 표시
        displayRate = rate.toString();
      }
      
      row.commission_rate = displayRate + '%';
    }
  }
}

// 지급액 포맷팅 함수 (정수로 표시)
function formatPaymentAmount(paymentAmount) {
  if (!paymentAmount) return '';
  const amount = Number(paymentAmount.toString().replace(/,/g, ''));
  if (!isNaN(amount)) {
    return Math.round(amount).toLocaleString();
  }
  return paymentAmount;
}

function onArrowKey(e, rowIdx, col) {
  // 제품 검색 드롭다운이 열려있을 때는 좌우 화살표만 막고, 상하키는 리스트 탐색을 위해 허용
  if (isProductSearchOpen.value && productSearchForRow.value.activeRowIndex === rowIdx) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
    }
    return;
  }
  
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();

  const cols = ["prescription_month", "product_name", "prescription_qty", "commission_rate", "prescription_type", "remarks"];
  const currentColIdx = cols.indexOf(col);

  if (currentColIdx === -1) return;

  let newRow = rowIdx;
  let newColIdx = currentColIdx;

  if (e.key === "ArrowUp") {
    newRow = Math.max(0, rowIdx - 1);
  } else if (e.key === "ArrowDown") {
    newRow = Math.min(inputRows.value.length - 1, rowIdx + 1);
  } else if (e.key === "ArrowLeft") {
    newColIdx = Math.max(0, currentColIdx - 1);
  } else if (e.key === "ArrowRight") {
    newColIdx = Math.min(cols.length - 1, currentColIdx + 1);
  }

  // 이동하려는 행이 편집 가능한 경우에만 포커스 이동
  if (isRowEditable(inputRows.value[newRow])) {
    const newCol = cols[newColIdx];
    currentCell.value = { row: newRow, col: newCol };
    focusField(newRow, newCol);
  }
}

function cellClass(rowIdx, col) {
  return currentCell.value.row === rowIdx && currentCell.value.col === col ? 'cell-focused' : '';
}

// 회사-거래처 매핑에서 수수료율 등급 조회 함수
async function getCommissionGradeForClientCompany(companyId, clientId) {
  const { data, error } = await supabase
    .from('client_company_assignments')
    .select('modified_commission_grade, company:companies(default_commission_grade)')
    .eq('company_id', companyId)
    .eq('client_id', clientId)
    .single();
  
  if (error || !data) {
    // 매핑 정보가 없으면 회사의 기본 등급 사용
    const { data: company } = await supabase
      .from('companies')
      .select('default_commission_grade')
      .eq('id', companyId)
      .single();
    return company?.default_commission_grade || 'A';
  }
  
  // modified_commission_grade가 있으면 우선 사용, 없으면 companies 테이블의 default_commission_grade 사용
  return data.modified_commission_grade || data.company?.default_commission_grade || 'A';
}

// 실적 저장로직 - 기존 데이터를 삭제 후 새로 저장
async function savePerformanceData() {
  const clientId = route.query?.clientId;
  const settlementMonth = route.query?.settlementMonth;
  if (!settlementMonth || !clientId) {
    throw new Error('정산월이나 병원이 선택되지 않았습니다.');
  }

  // 현재 로그인한 사용자 ID 가져오기 (등록자 정보용)
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserUid = session?.user?.id;
  if (!currentUserUid) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  // 관리자가 전달한 companyId 확인 (관리자가 대신 등록하는 경우)
  let companyId = route.query?.companyId;
  let myCompany;
  
  if (companyId) {
    // 관리자가 특정 업체의 실적을 등록하는 경우
    const { data } = await supabase.from('companies').select('id, default_commission_grade').eq('id', companyId).single();
    myCompany = data;
  } else {
    // 일반 사용자가 자신의 실적을 등록하는 경우
    const { data } = await supabase.from('companies').select('id, default_commission_grade').eq('user_id', currentUserUid).single();
    myCompany = data;
  }
  
  if (!myCompany) {
    throw new Error('회사 정보를 찾을 수 없습니다.');
  }

  const currentValidRows = getValidRows(inputRows.value);
  const originalValidRows = originalRows.value; // 이제 getValidRows를 이미 통과한 상태

  // 변경된 행, 추가된 행, 삭제된 행 식별
  const rowsToUpdate = currentValidRows.filter(currentRow => {
    if (!currentRow.id) return false;
    const originalRow = originalValidRows.find(or => or.id === currentRow.id);
    if (!originalRow) return false;
    return (
      currentRow.prescription_month !== originalRow.prescription_month ||
      currentRow.product_id !== originalRow.product_id ||
      currentRow.prescription_qty !== originalRow.prescription_qty ||
      currentRow.prescription_type !== originalRow.prescription_type ||
      currentRow.remarks !== originalRow.remarks ||
      currentRow.commission_rate !== originalRow.commission_rate
    );
  });

  const rowsToInsert = currentValidRows.filter(currentRow => !currentRow.id);
  const rowsToDelete = originalValidRows.filter(originalRow => !currentValidRows.some(cr => cr.id === originalRow.id));

  // 1. INSERT
  if (rowsToInsert.length > 0) {
    // 저장 전 유효성 검사: 수량이 숫자인지 확인
    for (let i = 0; i < rowsToInsert.length; i++) {
      const row = rowsToInsert[i];
      const qtyStr = String(row.prescription_qty || '').replace(/,/g, '');
      const qtyNum = Number(qtyStr);
      
      if (!qtyStr || qtyStr.trim() === '' || isNaN(qtyNum) || qtyNum < 0) {
        throw new Error(`처방 수량은 0 이상의 숫자여야 합니다. (${i + 1}번째 행)`);
      }
    }
    
    const grade = await getCommissionGradeForClientCompany(myCompany.id, Number(clientId));
    
    // 관리자가 입력하는 경우 바로 완료 상태로 저장
    const reviewStatus = (route.query?.companyId && isAdminUser.value) ? '완료' : '대기';
    
    const       dataToInsert = rowsToInsert.map(row => {
      let commissionRate = 0;
      if (grade === 'A') {
        commissionRate = row.commission_rate_a;
      } else if (grade === 'B') {
        commissionRate = row.commission_rate_b;
      } else if (grade === 'C') {
        commissionRate = row.commission_rate_c;
      } else if (grade === 'D') {
        commissionRate = row.commission_rate_d;
      } else if (grade === 'E') {
        commissionRate = row.commission_rate_e;
      }

      const qtyStr = String(row.prescription_qty || '').replace(/,/g, '');
      const qtyNum = Number(qtyStr);
      
      if (isNaN(qtyNum) || qtyNum < 0) {
        throw new Error('처방 수량은 0 이상의 숫자여야 합니다.');
      }

      return {
      company_id: myCompany.id,
      settlement_month: settlementMonth,
      prescription_month: row.prescription_month,
      client_id: Number(clientId),
      product_id: row.product_id,
      prescription_qty: qtyNum,
      prescription_type: row.prescription_type,
      remarks: row.remarks,
      registered_by: currentUserUid, // 실제 등록한 사용자 ID (관리자 또는 일반사용자)
        review_status: reviewStatus,
        commission_rate: (() => {
          const calculatedRate = Number((Number(row.commission_rate.toString().replace(/,/g, '').replace(/%/g, '')) / 100).toFixed(3));
          return isNaN(calculatedRate) ? commissionRate : calculatedRate;
        })()
      };
    });
    const { error } = await supabase.from('performance_records').insert(dataToInsert);
    if (error) {
      console.error('실적 INSERT 오류 상세:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        dataCount: dataToInsert.length
      });
      const errorMessage = translateSupabaseError(error, '실적 추가');
      throw new Error(errorMessage);
    }
    
    // 주석: 트리거가 자동으로 promotion_product_hospital_performance를 업데이트하므로
    // 프론트엔드에서 수동 호출 불필요
  }

  // 2. UPDATE
  if (rowsToUpdate.length > 0) {
    const grade = await getCommissionGradeForClientCompany(myCompany.id, Number(clientId));
    
    // 관리자가 입력하는 경우 바로 완료 상태로 저장
    const reviewStatus = (route.query?.companyId && isAdminUser.value) ? '완료' : '대기';
    
    const updatePromises = rowsToUpdate.map(row => {
      let commissionRate = 0;
      if (grade === 'A') {
        commissionRate = row.commission_rate_a;
      } else if (grade === 'B') {
        commissionRate = row.commission_rate_b;
      } else if (grade === 'C') {
        commissionRate = row.commission_rate_c;
      } else if (grade === 'D') {
        commissionRate = row.commission_rate_d;
      } else if (grade === 'E') {
        commissionRate = row.commission_rate_e;
      }
      return supabase
        .from('performance_records')
        .update({
          prescription_month: row.prescription_month,
          product_id: row.product_id,
          prescription_qty: Number(row.prescription_qty),
          prescription_type: row.prescription_type,
          remarks: row.remarks,
          commission_rate: (() => {
            const calculatedRate = Number((Number(row.commission_rate.toString().replace(/,/g, '').replace(/%/g, '')) / 100).toFixed(3));
            return isNaN(calculatedRate) ? commissionRate : calculatedRate;
          })(),
          review_status: reviewStatus,
          updated_by: currentUserUid,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id)
    });
    const results = await Promise.all(updatePromises);
    const firstError = results.find(res => res.error);
    if (firstError) {
      console.error('실적 UPDATE 오류 상세:', {
        error: firstError.error,
        message: firstError.error.message,
        code: firstError.error.code,
        details: firstError.error.details,
        hint: firstError.error.hint,
        updateCount: rowsToUpdate.length
      });
      const errorMessage = translateSupabaseError(firstError.error, '실적 수정');
      throw new Error(errorMessage);
    }
    
    // 주석: 트리거가 자동으로 promotion_product_hospital_performance를 업데이트하므로
    // 프론트엔드에서 수동 호출 불필요
  }

  // 3. DELETE
  if (rowsToDelete.length > 0) {
    const deletePromises = rowsToDelete.map(row => 
      supabase.from('performance_records').delete().eq('id', row.id)
    );
    const results = await Promise.all(deletePromises);
    const firstError = results.find(res => res.error);
    if (firstError) {
      console.error('실적 DELETE 오류 상세:', {
        error: firstError.error,
        message: firstError.error.message,
        code: firstError.error.code,
        details: firstError.error.details,
        hint: firstError.error.hint,
        deleteCount: rowsToDelete.length
      });
      const errorMessage = translateSupabaseError(firstError.error, '실적 삭제');
      throw new Error(errorMessage);
    }
  }

  return currentValidRows.length;
}

// 저장 버튼 클릭 핸들러 (기존 데이터 삭제 후 새로 저장)
async function onSave() {
  // 제품 검색 드롭다운이 열려있으면 차단
  if (isProductSearchOpen.value) {
    return;
  }
  
  // clientId, settlementMonth를 query에서 찾음
  const clientId = route.query?.clientId;
  const settlementMonth = route.query?.settlementMonth;
  if (!settlementMonth || !clientId) {
    alert('정산월이나 병원이 선택되지 않았습니다.');
    return;
  }

  // 1. 행 분류 (부족한 정보 확인)
  const partialRows = [];
  inputRows.value.forEach((row, index) => {
    const hasProduct = !!row.product_id;
    const hasQty = !!row.prescription_qty;

    if ((hasProduct || hasQty) && !(hasProduct && hasQty)) {
      partialRows.push({ ...row, rowNumber: index + 1 });
    }
  });
  // 2. 부족한 정보 행이 있는 경우 사용자 확인
  if (partialRows.length > 0) {
    const partialRowNumbers = partialRows.map(row => `No ${row.rowNumber}`).join(', ');
    const message = `${partialRows.length}건의 실적이 필수 정보(제품, 처방수량)가 누락되었습니다.\n${partialRowNumbers}\n제외하고 저장하시겠습니까?`;
    
    if (!confirm(message)) {
      return; // 취소 시 저장 중단
    }
  }

  try {
    // 3. 저장 처리 (기존 데이터 삭제 후 새로 저장)
    const savedCount = await savePerformanceData();
    // 4. 성공 메시지
    alert(`${savedCount}건의 실적이 저장되었습니다.`);
    // 5. 저장 후 실적 목록 화면으로 이동
    if (route.query?.companyId) {
      // 관리자가 대신 등록한 경우
      router.push('/admin/performance/register');
    } else {
      // 일반 사용자가 등록한 경우
      router.push('/performance/register');
    }
  } catch (err) {
    // 상세 에러 로깅
    console.error('실적 저장 처리 오류:', err);
    console.error('에러 상세:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    });
    
    // 사용자 친화적인 에러 메시지 생성
    let errorMessage = '실적 저장 시 오류가 발생했습니다.';
    
    // 이미 한글화된 메시지인 경우 그대로 사용
    if (err.message && !err.message.includes('null value') && !err.message.includes('prescription_qty')) {
      errorMessage = err.message;
    } else if (err.message) {
      // Supabase 오류인 경우 한글화
      errorMessage = translateSupabaseError(err, '실적 저장');
    } else {
      errorMessage = translateGeneralError(err, '실적 저장');
    }
    
    if (err.message) {
      if (err.message.includes('정산월') || err.message.includes('병원')) {
        errorMessage = err.message;
      } else if (err.message.includes('로그인')) {
        errorMessage = '로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.';
      } else if (err.message.includes('회사 정보')) {
        errorMessage = '회사 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.';
      } else if (err.message.includes('duplicate') || err.message.includes('중복')) {
        errorMessage = '중복된 데이터가 있습니다. 다시 확인해주세요.';
      } else if (err.message.includes('foreign key') || err.message.includes('참조')) {
        errorMessage = '연관된 데이터가 없습니다. 제품, 업체, 병원 정보를 확인해주세요.';
      } else if (err.message.includes('null') || err.message.includes('필수')) {
        errorMessage = '필수 항목이 누락되었습니다. 모든 항목을 입력해주세요.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
      } else {
        errorMessage = `저장 실패: ${err.message}`;
      }
    }
    
    alert(errorMessage);
  }

  // 저장 후에는 originalRows를 inputRows에서 입력된 행만 복사해서 동기화
  originalRows.value = getValidRows(inputRows.value).map(row => ({ ...row }));
  // canSave.value = false; // canSave is a computed property, no need to set it manually
  
  // 저장 성공 시 변경사항 플래그 리셋
  hasUnsavedChanges.value = false;
  isLeaving.value = false;
}

// 클라이언트 정산 비고 정보 가져오기
async function loadClientSettlementRemarks() {
  const clientId = route.query?.clientId;
  if (!clientId) return;
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('remarks_settlement')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('클라이언트 정산 비고 조회 오류:', error);
      return;
    }
    
    if (data && data.remarks_settlement) {
      clientSettlementRemarks.value = data.remarks_settlement;
    }
  } catch (err) {
    console.error('클라이언트 정산 비고 로드 오류:', err);
  }
}

// 기존 실적 데이터 불러오기
async function loadExistingData() {
  const clientId = route.query?.clientId;
  const settlementMonth = route.query?.settlementMonth;
  
  if (!clientId || !settlementMonth) return;
  
  try {
    // 관리자가 전달한 companyId 확인 (관리자가 대신 등록하는 경우)
    let companyId = route.query?.companyId;
    let myCompany;
    
    if (companyId) {
      // 관리자가 특정 업체의 실적을 조회하는 경우
      const { data } = await supabase.from('companies').select('id').eq('id', companyId).single();
      myCompany = data;
    } else {
      // 일반 사용자가 자신의 실적을 조회하는 경우
      const { data: { session } } = await supabase.auth.getSession();
      const userUid = session?.user?.id;
      if (!userUid) return;
      const { data } = await supabase.from('companies').select('id').eq('user_id', userUid).single();
      myCompany = data;
    }
    
    if (!myCompany) return;
    // 기존 실적 데이터 조회 (products 테이블과 조인)
    const { data, error } = await supabase
      .from('performance_records')
      .select(`
        *,
        products ( * )
     
      `)
      .eq('company_id', myCompany.id)
      .eq('settlement_month', settlementMonth)
      .eq('client_id', clientId);
    if (error) {
      console.error('기존 실적 조회 오류:', error);
      return;
    }

    if (data && data.length > 0) {
      // 기존 데이터를 inputRows에 설정
      inputRows.value = data.map(record => ({
        id: record.id,
        prescription_month: record.prescription_month,
        product_name_display: record.products?.product_name || '',
        product_id: record.product_id,
        insurance_code: record.products?.insurance_code || '',
        price: record.products?.price ? Number(record.products.price).toLocaleString() : '',
        prescription_qty: record.prescription_qty ? Number(record.prescription_qty).toLocaleString() : '',
        prescription_amount: record.prescription_qty && record.products?.price 
          ? (record.prescription_qty * record.products.price).toLocaleString() 
          : '',
        commission_rate: record.commission_rate !== null && record.commission_rate !== undefined ? (Number(record.commission_rate) * 100).toFixed(1) + '%' : '',
        payment_amount: record.commission_rate !== null && record.commission_rate !== undefined && record.prescription_qty && record.products?.price
          ? (record.prescription_qty * record.products.price * record.commission_rate).toLocaleString()
          : (record.prescription_qty && record.products?.price ? '0' : ''),
        prescription_type: record.prescription_type || 'EDI',
        remarks: record.remarks || '',
        review_status: record.review_status || '대기',
        commission_rate_a: record.products?.commission_rate_a,
        commission_rate_b: record.products?.commission_rate_b,
        commission_rate_c: record.products?.commission_rate_c,
        commission_rate_d: record.products?.commission_rate_d,
        commission_rate_e: record.products?.commission_rate_e,
      }));
      
      // *** MODIFICATION START ***
      // 1. 원본 동기화 (빈 행 추가 전)
      originalRows.value = getValidRows(inputRows.value).map(row => ({ ...row }));
      // *** MODIFICATION END ***

      // 처방월도 기존 데이터에서 가져오기
      if (data[0].prescription_month) {
        const prescMonth = data[0].prescription_month;
        const settlementDate = new Date(settlementMonth + '-01');
        const prescDate = new Date(prescMonth + '-01');
        const monthDiff = (settlementDate.getFullYear() - prescDate.getFullYear()) * 12 + 
          (settlementDate.getMonth() - prescDate.getMonth());
        if (monthDiff >= 1 && monthDiff <= 6) {
          prescriptionOffset.value = monthDiff;
        }
      }

      // 2. 마지막에 빈 행 추가
      inputRows.value.push({
        prescription_month: getDefaultPrescriptionMonth(),
        product_name_display: '', 
        product_id: null, 
        insurance_code: '', 
        price: '', 
        prescription_qty: '', 
        prescription_amount: '', 
        prescription_type: 'EDI', 
        remarks: '',
        review_status: '대기',
        commission_rate_a: null,
        commission_rate_b: null,
        commission_rate_c: null,
        commission_rate_d: null,
        commission_rate_e: null,
      });
    }
  } catch (err) {
    console.error('기존 실적 로드 오류:', err);
  }
}

// 합계 계산
const totalQty = computed(() => {
  const total = inputRows.value.reduce((sum, row) => {
    const prescriptionQty = row.prescription_qty;
    if (!prescriptionQty) return sum;
    const qty = Number(prescriptionQty.toString().replace(/,/g, '')) || 0;
    return sum + qty;
  }, 0);
  return total.toLocaleString();
});
const totalAmount = computed(() => {
  return inputRows.value.reduce((sum, row) => {
    const prescriptionAmount = row.prescription_amount;
    if (!prescriptionAmount) return sum;
    const amount = Number(prescriptionAmount.toString().replace(/,/g, '')) || 0;
    return sum + amount;
  }, 0).toLocaleString();
});

const totalPaymentAmount = computed(() => {
  return inputRows.value.reduce((sum, row) => {
    const paymentAmount = row.payment_amount;
    if (!paymentAmount) return sum;
    const amount = Number(paymentAmount.toString().replace(/,/g, '')) || 0;
    return sum + amount;
  }, 0).toLocaleString();
});
// 행 추가/행 삭제
function addRowBelow(idx) {
  inputRows.value.splice(idx + 1, 0, {
    prescription_month: getDefaultPrescriptionMonth(),
    product_name_display: '', product_id: null, insurance_code: '', price: '', prescription_qty: '', prescription_amount: '', commission_rate: '', payment_amount: '', prescription_type: 'EDI', remarks: '', review_status: '대기', commission_rate_a: null, commission_rate_b: null, commission_rate_c: null, commission_rate_d: null, commission_rate_e: null, selected: false,
  });
  nextTick(() => focusField(idx + 1, 'product_name'));
}

function deleteRow(idx) {
  if (inputRows.value.length === 1) return;
  inputRows.value.splice(idx, 1);
}

// 확인 다이얼로그를 브라우저 confirm으로 변경
function confirmDeleteRow(idx) {
  // 제품 검색 드롭다운이 열려있으면 차단
  if (isProductSearchOpen.value) {
    return;
  }
  
  if (confirm('선택한 행을 삭제하시겠습니까?')) {
    deleteRow(idx);
  }
}

function confirmAddRowBelow(idx) {
  // 제품 검색 드롭다운이 열려있으면 차단
  if (isProductSearchOpen.value) {
    return;
  }
  
  if (confirm('아래에 새 행을 추가하시겠습니까?')) {
    addRowBelow(idx);
  }
}

// 행 초기화 함수
function resetRow(rowIdx) {
  const row = inputRows.value[rowIdx];
  if (!row) return;
  
  // 해당 행을 초기화
  row.prescription_month = getDefaultPrescriptionMonth(); // 정산월 - 1M
  row.product_name_display = '';
  row.product_id = null;
  row.insurance_code = '';
  row.price = '';
  row.prescription_qty = '';
  row.prescription_amount = '';
  row.commission_rate = '';
  row.payment_amount = '';
  row.prescription_type = 'EDI';
  row.remarks = '';
  row.commission_rate_a = null;
  row.commission_rate_b = null;
  row.commission_rate_c = null;
  row.commission_rate_d = null;
  row.commission_rate_e = null;
  row.selected = false;
  
  // 제품 검색 드롭다운 숨기기
  if (productSearchForRow.value.show && productSearchForRow.value.activeRowIndex === rowIdx) {
    productSearchForRow.value.show = false;
    productSearchForRow.value.activeRowIndex = -1;
  }
  
  // 해당 행의 제품명 필드로 포커스 이동
  nextTick(() => {
    focusField(rowIdx, 'product_name');
  });
}

// 단축키 처리
function handleGlobalKeydown(e) {
  // 제품 검색 드롭다운이 열려있으면 Insert/Escape 키 차단
  if (isProductSearchOpen.value) {
    if (e.key === 'Insert' || e.key === 'Escape') {
      e.preventDefault();
      return;
    }
  }
  
  if (e.key === 'Insert') {
    e.preventDefault();
    const currentRowIdx = currentCell.value.row;
    confirmAddRowBelow(currentRowIdx);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    // 현재 포커스된 요소를 기반으로 행 인덱스 찾기
    const activeElement = document.activeElement;
    const table = document.querySelector('.input-table');
    if (table && activeElement) {
      const row = activeElement.closest('tr');
      if (row) {
        const rowIndex = Array.from(table.querySelectorAll('tbody tr')).indexOf(row);
        if (rowIndex !== -1 && isRowEditable(inputRows.value[rowIndex])) {
          resetRow(rowIndex);
        }
      }
    }
  }
}

// 전역 클릭 이벤트 처리
function handleGlobalClick(e) {
  // 제품 검색 드롭다운 처리
  if (isProductSearchOpen.value) {
    const productContainer = e.target.closest('.product-input-container');
    const searchDropdown = e.target.closest('.search-dropdown');
    
    if (!productContainer && !searchDropdown) {
      const activeRowIndex = productSearchForRow.value.activeRowIndex;
      if (activeRowIndex !== -1) {
        hideProductSearchList(activeRowIndex);
      }
    }
  }
}

// 이탈방지 핸들러
function handleBeforeUnload(e) {
  if (hasUnsavedChanges.value && !isLeaving.value) {
    e.preventDefault();
    e.returnValue = '저장하지 않고 나가시겠습니까?';
    return '저장하지 않고 나가시겠습니까?';
  }
}

// 이탈 확인 후 처리 함수
function confirmAndLeave() {
  if (confirm('저장하지 않고 나가시겠습니까?')) {
    isLeaving.value = true;
    return true;
  }
  return false;
}

// 사용자 권한 정보를 저장할 ref
const isAdminUser = ref(false);

// 클라이언트 정산 비고 정보
const clientSettlementRemarks = ref('');

// 이탈방지 관련 변수
const hasUnsavedChanges = ref(false);
const isLeaving = ref(false);

function isRowEditable(row) {
  const status = row.review_status;
  
  // 관리자는 모든 상태 편집 가능
  if (isAdminUser.value) {
    return true;
  }
  
  // 일반 사용자는 '대기' 상태만 편집 가능
  return status === '대기' || !status;
}



// 검수중/완료 행이 하나라도 있으면 안내문구 표시 (관리자는 제외)
const hasNonEditableRow = computed(() => {
  if (isAdminUser.value) return false; // 관리자는 모든 행 편집 가능하므로 경고 메시지 숨김
  return inputRows.value.some(row => {
    const status = row.review_status || '대기';
    return status === '완료' || status === '검수중';
  });
});
// 항상 마지막에 입력 가능한 빈 행이 1개 남아있도록 유지
watch(inputRows, (rows) => {
  const lastRow = rows[rows.length - 1];
  const isLastRowEmpty = !lastRow.product_id && !lastRow.product_name_display && !lastRow.prescription_qty;
  if (!isLastRowEmpty) {
    inputRows.value.push({
      prescription_month: getDefaultPrescriptionMonth(),
      product_name_display: '',
      product_id: null,
      insurance_code: '',
      price: '',
      prescription_qty: '',
      prescription_amount: '',
              commission_rate: '',
      payment_amount: '',
      prescription_type: 'EDI',
      remarks: '',
      review_status: '대기',
      commission_rate_a: null,
      commission_rate_b: null,
      selected: false,
    });
  }
}, { deep: true });

// 변경사항 추적
watch(canSave, (newValue) => {
  hasUnsavedChanges.value = newValue;
});

// 라이프사이클
onMounted(async () => {
  // 사용자 권한 확인
  try {
    const { data: { session } } = await supabase.auth.getSession();
    isAdminUser.value = session?.user?.user_metadata?.user_type === 'admin';
  } catch (error) {
    console.error('사용자 권한 확인 오류:', error);
    isAdminUser.value = false;
  }

  if (selectedSettlementMonth.value) {
    updatePrescriptionOptions();
    prescriptionOffset.value = 1;
    prescriptionMonth.value = getPrescriptionMonth(selectedSettlementMonth.value, 1);
  }
  await fetchProducts(prescriptionMonth.value);
  await loadClientSettlementRemarks(); // 클라이언트 정산 비고 정보 로드
  await loadExistingData(); // 기존 실적 데이터 불러오기
  // 편집 상태 확인
  await checkPerformanceEditStatus();
  // 편집 가능한 경우에만 포커스
  if (isInputEnabled.value) {
    // 편집 가능한 첫 행의 제품명에 포커스
    nextTick(() => {
      const firstEditableRowIndex = inputRows.value.findIndex(row => isRowEditable(row));
      if (firstEditableRowIndex !== -1) {
        focusField(firstEditableRowIndex, 'product_name');
      }
    });
  }
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleGlobalClick);

  // 이탈방지 이벤트 리스너 추가
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Vue Router 네비게이션 가드 추가
  const unregisterGuard = router.beforeEach((to, from, next) => {
    if (from.path === route.path && hasUnsavedChanges.value && !isLeaving.value) {
      if (confirmAndLeave()) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });

  // 최초 1행의 처방월 값
  const firstMonth = inputRows.value[0].prescription_month;
  if (firstMonth) {
    await fetchProductsForMonth(firstMonth);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  // 네비게이션 가드 제거
  if (typeof unregisterGuard === 'function') {
    unregisterGuard();
  }
});

// 새 행 추가 시 prescription_month 기본값 적용
function getDefaultPrescriptionMonth() {
  if (!selectedSettlementMonth.value) return '';
  return getPrescriptionMonth(selectedSettlementMonth.value, 1); // -1M
}

// 유효 실적 건수
const validRowCount = computed(() => getValidRows(inputRows.value).length);

// 선택 관련 computed 속성들
const isAllSelected = computed(() => {
  const validRows = inputRows.value.filter(row => row.product_id && row.prescription_qty);
  return validRows.length > 0 && validRows.every(row => row.selected);
});

const hasSelectedItems = computed(() => {
  return inputRows.value.some(row => row.selected);
});

// 선택 관련 함수들
function toggleSelectAll() {
  const validRows = inputRows.value.filter(row => row.product_id && row.prescription_qty);
  const newState = !isAllSelected.value;
  validRows.forEach(row => {
    row.selected = newState;
  });
}

function deleteSelected() {
  const selectedRows = inputRows.value.filter(row => row.selected);
  if (selectedRows.length === 0) return;
  
  if (confirm(`선택된 ${selectedRows.length}건의 실적을 삭제하시겠습니까?`)) {
    // 선택된 행들을 제거 (마지막 빈 행은 유지)
    const rowsToRemove = selectedRows.filter(row => !row.product_id || !row.prescription_qty);
    rowsToRemove.forEach(row => {
      const index = inputRows.value.indexOf(row);
      if (index > -1) {
        inputRows.value.splice(index, 1);
      }
    });
    
    // 선택된 행들을 초기화
    selectedRows.forEach(row => {
      if (row.product_id || row.prescription_qty) {
        row.prescription_month = getDefaultPrescriptionMonth();
        row.product_name_display = '';
        row.product_id = null;
        row.insurance_code = '';
        row.price = '';
        row.prescription_qty = '';
        row.prescription_amount = '';
        row.commission_rate = '';
        row.payment_amount = '';
        row.prescription_type = 'EDI';
        row.remarks = '';
        row.commission_rate_a = null;
        row.commission_rate_b = null;
        row.selected = false;
      }
    });
  }
}

function goBackToList() {
  // 변경사항이 있으면 확인 후 이동
  if (hasUnsavedChanges.value) {
    if (confirmAndLeave()) {
      if (route.query?.companyId) {
        // 관리자가 대신 등록한 경우
        router.push('/admin/performance/register');
      } else {
        // 일반 사용자가 등록한 경우
        router.push('/performance/register');
      }
    }
  } else {
    // 변경사항이 없으면 바로 이동
    if (route.query?.companyId) {
      // 관리자가 대신 등록한 경우
      router.push('/admin/performance/register');
    } else {
      // 일반 사용자가 등록한 경우
      router.push('/performance/register');
    }
  }
}

if (typeof window !== 'undefined') {
  window.products = products;
}

async function fetchProductsForMonth(month) {
  // 이미 불러온 월이면 캐시 사용
  if (productsByMonth.value[month]) return;

  try {
    // 1. 현재 사용자/관리자의 업체 정보 확인
    const clientId = route.query?.clientId;
    const companyId = route.query?.companyId;
    let currentCompanyId;

    if (companyId) {
      // 관리자가 특정 업체의 실적을 등록하는 경우
      currentCompanyId = companyId;
    } else {
      // 일반 사용자가 자신의 실적을 등록하는 경우
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (!company) return;
      currentCompanyId = company.id;
    }

    // 2. product_company_not_assignments에서 현재 업체의 미할당 제품 ID 목록 조회
    const { data: assignedProductIds, error: assignedError } = await supabase
      .from('product_company_not_assignments')
      .select('product_id')
      .eq('company_id', currentCompanyId);

    if (assignedError) {
      console.error('미할당 제품 ID 조회 오류:', assignedError);
      productsByMonth.value[month] = [];
      return;
    }

    const excludedProductIds = assignedProductIds.map(item => item.product_id);

    // 3. 해당월의 모든 제품 조회 (미할당 제품 제외)
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('base_month', month)
      .order('product_name', { ascending: true })
      .range(0, 2999);

    if (excludedProductIds.length > 0) {
      query = query.not('id', 'in', `(${excludedProductIds.join(',')})`);
    }

    const { data, error } = await query;

    if (!error && data) {
      productsByMonth.value[month] = data;
    } else {
      productsByMonth.value[month] = []; // 에러 시 빈 배열
    }
  } catch (err) {
    console.error('제품 데이터 로딩 오류:', err);
    productsByMonth.value[month] = [];
  }
}

watch(
  () => inputRows.value.map(row => row.prescription_month),
  async (months) => {
    // 중복 없이 월별로 fetch
    const uniqueMonths = [...new Set(months.filter(Boolean))];
    for (const month of uniqueMonths) {
      await fetchProductsForMonth(month);
    }
  },
  { deep: true }
);

// 처방월 변경 시 제품 정보 자동 업데이트 함수
async function updateProductInfoForMonthChange(rowIdx) {
  const row = inputRows.value[rowIdx];
  if (!row.insurance_code || !row.prescription_month) return;

  try {
    // 보험코드로 새 처방월에서 해당 제품 정보 조회
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('insurance_code', row.insurance_code)
      .eq('base_month', row.prescription_month)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('제품 조회 오류:', error);
      return;
    }

    if (!data || data.length === 0) {
      // 새 처방월에 해당 제품이 없으면 제품 선택 해제
      // console.log(`보험코드 ${row.insurance_code} 제품이 ${row.prescription_month}에 존재하지 않습니다. 제품 선택을 해제합니다.`);
      row.product_name_display = '';
      row.product_id = null;
      row.insurance_code = '';
      row.price = '';
      row.prescription_qty = '';
      row.prescription_amount = '';
      row.commission_rate_a = null;
      row.commission_rate_b = null;
      return;
    }

    const productData = data[0]; // 첫 번째 결과 사용

    // 새 처방월에 해당 제품이 있으면 정보 업데이트
    // console.log(`보험코드 ${row.insurance_code} 제품의 ${row.prescription_month} 정보로 업데이트:`, { product_id: productData.id, product_name: productData.product_name, price: productData.price, commission_rate_a: productData.commission_rate_a, commission_rate_b: productData.commission_rate_b });
    

    row.product_id = productData.id; // 새로운 product_id로 업데이트
    row.product_name_display = productData.product_name;
    row.insurance_code = productData.insurance_code;
    row.price = productData.price ? Number(productData.price).toLocaleString() : '';
    row.commission_rate_a = productData.commission_rate_a;
    row.commission_rate_b = productData.commission_rate_b;

    // 처방수량이 있으면 처방액 재계산
    if (row.prescription_qty) {
      const qty = Number(row.prescription_qty.toString().replace(/,/g, ''));
      const price = Number(productData.price) || 0;
      if (!isNaN(qty) && !isNaN(price) && price > 0) {
        row.prescription_amount = (qty * price).toLocaleString();
      }
    }
  } catch (err) {
    console.error('제품 정보 업데이트 오류:', err);
  }
}

// 처방월 변경 이벤트 핸들러
async function handlePrescriptionMonthChange(rowIdx) {
  const row = inputRows.value[rowIdx];
  const oldMonth = row.prescription_month;
  
  // 처방월이 변경되었고 제품이 선택되어 있으면 정보 업데이트
  if (row.product_id) {
    await updateProductInfoForMonthChange(rowIdx);
  }
  
  // 해당 월의 제품 목록이 로드되어 있지 않으면 로드
  if (!productsByMonth.value[row.prescription_month]) {
    await fetchProductsForMonth(row.prescription_month);
  }
}
</script>

<style scoped>

/* 비활성화된 입력 필드 스타일 */
.disabled-area {
  background-color: #f8f9fa !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
  opacity: 0.7 !important;
}

.disabled-area:focus {
  outline: none !important;
  box-shadow: none !important;
}



/* 테이블 레이아웃 고정 */
.table-header-fixed table,
.table-body-scroll table {
  table-layout: fixed !important;
  width: 100% !important;
}

.table-header-fixed th,
.table-body-scroll td {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.status-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  margin-left: 1rem;
}

.back-btn:hover {
  color: #1976d2;
  text-decoration: underline;
}

/* 제품 검색 드롭다운 스타일 */
.product-search-dropdown {
  position: absolute !important;
  background: white !important;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  z-index: 1000 !important;
  max-height: 480px !important; /* 기존보다 2배로 증가 */
  overflow-y: auto !important;
  width: 280px !important;
}

.product-search-dropdown ul {
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.product-search-dropdown li {
  cursor: pointer !important;
  border-bottom: 1px solid #f0f0f0 !important;
  display: flex !important;
  align-items: center !important;
  min-height: 2.0rem !important;
}

.product-search-dropdown li:hover,
.product-search-dropdown li.selected {
  background-color: var(--primary-color) !important;
  color: #fff !important;
}

.product-search-dropdown li.selected * {
  color: #fff !important;
}

.product-search-dropdown li.selected .product-name {
  color: #fff !important;
  color: white !important;
}

.product-search-dropdown li:last-child {
  border-bottom: none !important;
}

.product-item {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between !important;
  align-items: center !important;
  width: 100% !important;
  padding: 0 0.5rem !important;
  min-height: 1.0rem !important;
}

.product-name {
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  color: #222 !important;
  text-align: left !important;
}
.product-name:hover,
li.selected .product-name,
.product-search-dropdown li.selected .product-name,
.product-search-dropdown li.selected div .product-name {
  color: #fff !important;
}

.insurance-code {
  font-size: 0.85rem !important;
  font-weight: 400 !important;
  color: #444 !important;
  text-align: right !important;
  flex-shrink: 0 !important;
}
.insurance-code:hover,
li.selected .insurance-code,
.product-search-dropdown li.selected .insurance-code,
.product-search-dropdown li.selected div .insurance-code {
  color: #fff !important;
}
</style>