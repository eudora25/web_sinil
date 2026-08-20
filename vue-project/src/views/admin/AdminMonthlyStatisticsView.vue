<template>
  <div class="monthly-statistics-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">월별 통계</div>
    </div>

    <div class="filter-card">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end; gap: 16px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="startMonth" class="select_month" @change="onMonthChange">
            <option v-for="m in availableMonths" :key="`s-${m}`" :value="m">{{ m }}</option>
          </select>
          <span style="color: #888;">~</span>
          <select v-model="endMonth" class="select_month" @change="onMonthChange">
            <option v-for="m in availableMonths" :key="`e-${m}`" :value="m">{{ m }}</option>
          </select>
          <span class="range-hint">최대 12개월</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <label>지표</label>
          <select v-model="metric" class="select_month" @change="rebuildTable">
            <option value="prescription_amount">처방액</option>
            <option value="payment_amount">지급액</option>
            <option value="total_revenue">매출액</option>
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <label>구분</label>
          <select v-model="selectedGroup" class="select_month" @change="rebuildTable">
            <option value="">전체</option>
            <option v-for="g in companyGroups" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <button class="search-btn" :disabled="loading" @click="loadData">조회</button>
      </div>
    </div>

    <div class="data-card monthly-data-card">
      <div class="data-card-header monthly-data-header">
        <div class="tab-group">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="tab-btn"
            :class="{ active: viewMode === tab.value }"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="viewMode === 'company'" class="tab-search">
          <span class="p-input-icon-left tab-search-wrap">
            <input
              v-model="companySearch"
              type="text"
              class="tab-search-input"
              placeholder="업체명, 구분 검색"
              @keydown.enter.prevent
            />
            <button
              v-if="companySearch"
              type="button"
              class="tab-search-clear"
              title="검색어 초기화"
              @click="companySearch = ''"
            >×</button>
          </span>
        </div>

        <div v-if="viewMode === 'product'" class="tab-search">
          <span class="p-input-icon-left tab-search-wrap">
            <input
              v-model="productSearch"
              type="text"
              class="tab-search-input"
              placeholder="제품명, 보험코드 검색"
              @keydown.enter.prevent
            />
            <button
              v-if="productSearch"
              type="button"
              class="tab-search-clear"
              title="검색어 초기화"
              @click="productSearch = ''"
            >×</button>
          </span>
        </div>

        <div class="action-buttons-group">
          <span class="total-count-display" style="margin-right: 12px;">
            {{ filteredTableRows.length.toLocaleString() }}
            <template v-if="filteredTableRows.length !== tableRows.length">
              / {{ tableRows.length.toLocaleString() }}
            </template>
            행 · {{ monthColumns.length }}개월
          </span>
          <button class="btn-excell-download" :disabled="loading || !filteredTableRows.length" @click="downloadExcel">
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div class="monthly-table-wrap">
        <DataTable
          :value="displayRows"
          :loading="loading"
          scrollable
          scrollHeight="calc(100vh - 280px)"
          scrollDirection="both"
          class="monthly-stats-table"
          :rowClass="rowClass"
          sortMode="single"
        >
          <template #empty>
            <div v-if="!loading">표시할 통계가 없습니다. 정산월 범위를 확인하거나 통계를 재계산해 주세요.</div>
          </template>

          <Column
            field="label"
            :header="dimensionHeader"
            frozen
            :sortable="true"
            :headerStyle="{ width: '220px', minWidth: '220px' }"
          >
            <template #body="{ data }">
              <span :style="{ fontWeight: data._isTotal ? 600 : 400 }">{{ data.label }}</span>
            </template>
          </Column>

          <Column
            v-if="viewMode === 'company'"
            field="company_group"
            header="구분"
            frozen
            :sortable="true"
            :headerStyle="{ width: '90px', minWidth: '90px' }"
            :bodyStyle="{ textAlign: 'center' }"
          >
            <template #body="{ data }">
              {{ data._isTotal ? '' : (data.company_group || '-') }}
            </template>
          </Column>

          <Column
            v-if="viewMode === 'product'"
            field="insurance_code"
            header="보험코드"
            frozen
            :sortable="true"
            :headerStyle="{ width: '110px', minWidth: '110px' }"
            :bodyStyle="{ textAlign: 'center' }"
          >
            <template #body="{ data }">
              {{ data._isTotal ? '' : (data.insurance_code || '-') }}
            </template>
          </Column>

          <Column
            v-for="month in monthColumns"
            :key="month"
            :field="`m_${month}`"
            :header="month"
            :sortable="true"
            :headerStyle="{ width: '120px', minWidth: '120px' }"
            :bodyStyle="{ textAlign: 'right' }"
          >
            <template #body="{ data }">
              {{ formatNumber(data[`m_${month}`] || 0) }}
            </template>
          </Column>

          <Column
            field="row_total"
            header="합계"
            :sortable="true"
            :headerStyle="{ width: '130px', minWidth: '130px' }"
            :bodyStyle="{ textAlign: 'right', fontWeight: 600 }"
          >
            <template #body="{ data }">
              {{ formatNumber(data.row_total || 0) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ExcelJS from 'exceljs';
import { supabase } from '@/supabase';
import { formatNumber } from '@/utils/formatUtils';
import { useNotifications } from '@/utils/notifications';
import { translateSupabaseError } from '@/utils/errorMessages';

const { showError, showSuccess, showWarning } = useNotifications();

const tabs = [
  { value: 'group', label: '그룹구분' },
  { value: 'company', label: '업체별' },
  { value: 'product', label: '제품별' },
];

/** 조회 가능 최대 개월 수(시작·종료 포함) */
const MAX_MONTH_RANGE = 12;
/** 최근 N개월(당월 포함)은 조회 시 요약 재갱신. 그 이전은 적재분만 사용 */
const LIVE_MONTH_WINDOW = 2;

const availableMonths = ref([]);
const startMonth = ref('');
const endMonth = ref('');
const metric = ref('prescription_amount');
const selectedGroup = ref('');
const companyGroups = ref([]);
const viewMode = ref('group');
const loading = ref(false);
const rawRows = ref([]);
const tableRows = ref([]);
const monthColumns = ref([]);
const companySearch = ref('');
const productSearch = ref('');

const dimensionHeader = computed(() => {
  if (viewMode.value === 'group') return '그룹구분';
  if (viewMode.value === 'company') return '업체명';
  return '제품명';
});

const filteredTableRows = computed(() => {
  const rows = tableRows.value;
  if (viewMode.value === 'company') {
    const q = companySearch.value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.label || '').toLowerCase().includes(q)
      || String(r.company_group || '').toLowerCase().includes(q)
    );
  }
  if (viewMode.value === 'product') {
    const q = productSearch.value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.label || '').toLowerCase().includes(q)
      || String(r.insurance_code || '').toLowerCase().includes(q)
    );
  }
  return rows;
});

const displayRows = computed(() => {
  const rows = filteredTableRows.value;
  if (!rows.length) return [];
  const total = {
    key: '__total__',
    label: '합계',
    company_group: '',
    insurance_code: '',
    row_total: 0,
    _isTotal: true,
  };
  for (const m of monthColumns.value) {
    total[`m_${m}`] = 0;
  }
  for (const row of rows) {
    total.row_total += Number(row.row_total) || 0;
    for (const m of monthColumns.value) {
      total[`m_${m}`] += Number(row[`m_${m}`]) || 0;
    }
  }
  return [...rows, total];
});

function rowClass(data) {
  return data?._isTotal ? 'monthly-total-row' : '';
}

function rangeBounds() {
  const a = startMonth.value;
  const b = endMonth.value;
  if (!a || !b) return { low: '', high: '' };
  return a <= b ? { low: a, high: b } : { low: b, high: a };
}

/** 'YYYY-MM' 달력 기준 포함 개월 수 */
function monthSpanInclusive(low, high) {
  const [y1, m1] = low.split('-').map(Number);
  const [y2, m2] = high.split('-').map(Number);
  if (!y1 || !m1 || !y2 || !m2) return 0;
  return (y2 - y1) * 12 + (m2 - m1) + 1;
}

/** high 기준 n개월 이전(포함 관계로 high-n+1) → addMonths(high, 1-n) */
function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

/**
 * 조회 기간이 12개월을 넘으면 종료월을 유지하고 시작월을 앞으로 당긴다.
 * @returns {boolean} 보정했는지
 */
function clampMonthRange() {
  const { low, high } = rangeBounds();
  if (!low || !high) return false;
  if (monthSpanInclusive(low, high) <= MAX_MONTH_RANGE) return false;

  const clampedLow = shiftMonth(high, 1 - MAX_MONTH_RANGE);
  if (startMonth.value <= endMonth.value) {
    startMonth.value = clampedLow;
  } else {
    endMonth.value = clampedLow;
  }
  return true;
}

function monthsInRange(low, high) {
  return availableMonths.value
    .filter((m) => m >= low && m <= high)
    .slice()
    .sort();
}

async function fetchSettlementMonths() {
  const { data, error } = await supabase
    .from('settlement_months')
    .select('settlement_month')
    .order('settlement_month', { ascending: false });
  if (error) throw error;
  availableMonths.value = (data || []).map((r) => r.settlement_month).filter(Boolean);
  if (availableMonths.value.length) {
    endMonth.value = availableMonths.value[0];
    // 기본: 최근 6개월(또는 전체)
    const idx = Math.min(5, availableMonths.value.length - 1);
    startMonth.value = availableMonths.value[idx];
  }
}

async function fetchCompanyGroups() {
  const { data, error } = await supabase
    .from('companies')
    .select('company_group')
    .eq('approval_status', 'approved')
    .not('company_group', 'is', null);
  if (error) {
    console.warn('company_group 조회 실패:', error);
    return;
  }
  companyGroups.value = [...new Set((data || []).map((r) => r.company_group).filter(Boolean))].sort();
}

/** 오늘 기준 YYYY-MM */
function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 최근 LIVE_MONTH_WINDOW개월의 시작 월(포함) — 이 이상이면 조회 시 재갱신 */
function liveMonthFrom() {
  return shiftMonth(currentYearMonth(), 1 - LIVE_MONTH_WINDOW);
}

/**
 * 최근 월은 항상 재집계, 그 이전은 performance_statistics 가 있는데 요약이 없을 때만 백필.
 */
async function ensureSummaryFresh(months) {
  if (!months.length) return;
  const liveFrom = liveMonthFrom();
  const liveMonths = months.filter((m) => m >= liveFrom);
  const frozenMonths = months.filter((m) => m < liveFrom);

  const present = new Set();
  {
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('monthly_statistics_summary')
        .select('settlement_month')
        .in('settlement_month', months)
        // range() 페이징은 정렬이 고유해야 같은 행이 두 페이지에 나오거나 빠지는 일이 없다.
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const chunk = data || [];
      for (const r of chunk) present.add(r.settlement_month);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
  }

  let backfill = frozenMonths.filter((m) => !present.has(m));
  if (backfill.length) {
    const hasPs = new Set();
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('performance_statistics')
        .select('settlement_month')
        .in('settlement_month', backfill)
        // range() 페이징은 정렬이 고유해야 같은 행이 두 페이지에 나오거나 빠지는 일이 없다.
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const chunk = data || [];
      for (const r of chunk) hasPs.add(r.settlement_month);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
    backfill = backfill.filter((m) => hasPs.has(m));
  }

  const toRefresh = [...new Set([...liveMonths, ...backfill])].sort();
  for (const m of toRefresh) {
    const { error } = await supabase.rpc('refresh_monthly_statistics_summary', {
      p_settlement_month: m,
    });
    if (error) throw error;
  }
}

async function fetchSummaryRows(low, high) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from('monthly_statistics_summary')
      .select(
        'settlement_month, dim_type, dim_key, company_group, company_id, company_name, product_id, product_name, insurance_code, prescription_amount, payment_amount, total_revenue'
      )
      .gte('settlement_month', low)
      .lte('settlement_month', high)
      // range() 페이징은 정렬이 고유해야 같은 행이 두 페이지에 나오거나 빠지는 일이 없다.
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const chunk = data || [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function buildPivot(rows, mode, months, metricKey) {
  const map = new Map();

  const makeLabel = (r) => {
    if (mode === 'group') return r.company_group || r.dim_key || '(미지정)';
    if (mode === 'company') return r.company_name || r.dim_key || '(미지정)';
    return r.product_name || r.insurance_code || r.dim_key || '(미지정)';
  };

  for (const r of rows) {
    if (r.dim_type !== mode) continue;
    const key = r.dim_key || makeLabel(r);
    if (!map.has(key)) {
      const base = {
        key,
        label: makeLabel(r),
        company_group: r.company_group || '',
        insurance_code: r.insurance_code || '',
        row_total: 0,
      };
      for (const m of months) base[`m_${m}`] = 0;
      map.set(key, base);
    }
    const row = map.get(key);
    if (mode === 'company' && !row.company_group && r.company_group) row.company_group = r.company_group;
    if (mode === 'product' && !row.insurance_code && r.insurance_code) row.insurance_code = r.insurance_code;
    if (mode !== 'group' && row.label === '(미지정)' && makeLabel(r) !== '(미지정)') row.label = makeLabel(r);

    const amount = Number(r[metricKey]) || 0;
    const m = r.settlement_month;
    if (m && Object.prototype.hasOwnProperty.call(row, `m_${m}`)) {
      row[`m_${m}`] += amount;
      row.row_total += amount;
    }
  }

  return [...map.values()].sort((a, b) => b.row_total - a.row_total);
}

function rebuildTable() {
  const { low, high } = rangeBounds();
  if (!low || !high) {
    tableRows.value = [];
    monthColumns.value = [];
    return;
  }
  const months = monthsInRange(low, high);
  monthColumns.value = months;
  // 제품 요약은 업체 그룹이 없어, 구분 필터는 그룹/업체 탭에만 적용
  let filtered = rawRows.value;
  if (selectedGroup.value && viewMode.value !== 'product') {
    filtered = rawRows.value.filter((r) => r.company_group === selectedGroup.value);
  }
  tableRows.value = buildPivot(filtered, viewMode.value, months, metric.value);
}

async function loadData() {
  if (clampMonthRange()) {
    showWarning(`조회 기간은 최대 ${MAX_MONTH_RANGE}개월까지 가능합니다. 시작월을 조정했습니다.`);
  }
  const { low, high } = rangeBounds();
  if (!low || !high) {
    showError('정산월을 선택해 주세요.');
    return;
  }
  loading.value = true;
  try {
    const months = monthsInRange(low, high);
    await ensureSummaryFresh(months);
    rawRows.value = await fetchSummaryRows(low, high);
    rebuildTable();
  } catch (err) {
    console.error('월별 통계 조회 실패:', err);
    showError(translateSupabaseError(err, '월별 통계 조회'));
    rawRows.value = [];
    tableRows.value = [];
  } finally {
    loading.value = false;
  }
}

function onMonthChange() {
  // 월 변경 시 12개월 제한 후 자동 재조회
  loadData();
}

function switchTab(mode) {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  rebuildTable();
}

async function downloadExcel() {
  if (!displayRows.value.length) return;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheetName =
      viewMode.value === 'group' ? '그룹구분' : viewMode.value === 'company' ? '업체별' : '제품별';
    const ws = workbook.addWorksheet(sheetName);

    const metricLabel =
      metric.value === 'payment_amount'
        ? '지급액'
        : metric.value === 'total_revenue'
          ? '매출액'
          : '처방액';

    const headers = [dimensionHeader.value];
    if (viewMode.value === 'company') headers.push('구분');
    if (viewMode.value === 'product') headers.push('보험코드');
    headers.push(...monthColumns.value, '합계');

    ws.addRow([`월별 통계 — ${sheetName} / ${metricLabel} / ${startMonth.value}~${endMonth.value}`]);
    ws.addRow(headers);

    for (const row of displayRows.value) {
      const line = [row.label];
      if (viewMode.value === 'company') line.push(row._isTotal ? '' : row.company_group || '');
      if (viewMode.value === 'product') line.push(row._isTotal ? '' : row.insurance_code || '');
      for (const m of monthColumns.value) line.push(Number(row[`m_${m}`]) || 0);
      line.push(Number(row.row_total) || 0);
      ws.addRow(line);
    }

    ws.getRow(1).font = { bold: true };
    ws.getRow(2).font = { bold: true };
    ws.columns.forEach((col, i) => {
      col.width = i === 0 ? 28 : 14;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `월별통계_${sheetName}_${startMonth.value}_${endMonth.value}_${stamp}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('엑셀 다운로드가 완료되었습니다.');
  } catch (err) {
    console.error('엑셀 다운로드 실패:', err);
    showError('엑셀 다운로드에 실패했습니다.');
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchSettlementMonths(), fetchCompanyGroups()]);
    if (availableMonths.value.length) {
      await loadData();
    }
  } catch (err) {
    console.error(err);
    showError(translateSupabaseError(err, '월별 통계 초기화'));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.monthly-statistics-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.monthly-data-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.monthly-data-header {
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 10px;
}
.monthly-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.tab-group {
  display: flex;
  gap: 6px;
  align-items: center;
}
.tab-btn {
  border: 1px solid #ced4da;
  background: #fff;
  color: #495057;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.9rem;
  cursor: pointer;
}
.tab-btn.active {
  background: #1e3a5f;
  border-color: #1e3a5f;
  color: #fff;
  font-weight: 600;
}
.tab-btn:hover:not(.active) {
  background: #f1f3f5;
}
.tab-search {
  display: flex;
  align-items: center;
}
.tab-search-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.tab-search-input {
  width: 260px;
  height: 34px;
  padding: 0 28px 0 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
}
.tab-search-input:focus {
  outline: none;
  border-color: #1e3a5f;
}
.tab-search-clear {
  position: absolute;
  right: 6px;
  border: none;
  background: transparent;
  color: #868e96;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
}
.tab-search-clear:hover {
  color: #212529;
}
.range-hint {
  color: #868e96;
  font-size: 0.85rem;
  white-space: nowrap;
}
:deep(.monthly-total-row) {
  background: #f8f9fa !important;
  font-weight: 600;
}
:deep(.monthly-total-row > td) {
  background: #f8f9fa !important;
}

/* sticky 헤더 + frozen 컬럼 겹침 방지
   frozen(left) 본문 셀이 thead(top) 위로 그려지는 브라우저 이슈 대응:
   filter로 헤더 전용 스택 컨텍스트를 만들고 z-index를 강제 */
:deep(.monthly-stats-table .p-datatable-table-container) {
  position: relative;
}
:deep(.monthly-stats-table .p-datatable-table) {
  border-collapse: separate !important;
  border-spacing: 0;
}
:deep(.monthly-stats-table .p-datatable-thead) {
  position: relative;
  z-index: 5;
}
:deep(.monthly-stats-table .p-datatable-thead > tr > th) {
  position: sticky !important;
  top: 0 !important;
  background: #f8f9fa !important;
  opacity: 1 !important;
  z-index: 5 !important;
}
:deep(.monthly-stats-table .p-datatable-thead > tr > th.p-datatable-frozen-column),
:deep(.monthly-stats-table .p-datatable-thead > tr > th[data-p-frozen-column='true']) {
  position: sticky !important;
  top: 0 !important;
  background: #f8f9fa !important;
  opacity: 1 !important;
  z-index: 6 !important;
  /* stacking context: tbody sticky 셀보다 위에 페인트 */
  filter: opacity(1);
}
:deep(.monthly-stats-table .p-datatable-tbody) {
  position: relative;
  z-index: 1;
}
:deep(.monthly-stats-table .p-datatable-tbody > tr > td.p-datatable-frozen-column),
:deep(.monthly-stats-table .p-datatable-tbody > tr > td[data-p-frozen-column='true']) {
  position: sticky !important;
  background: #ffffff !important;
  opacity: 1 !important;
  z-index: 1 !important;
}
:deep(.monthly-stats-table .monthly-total-row > td.p-datatable-frozen-column),
:deep(.monthly-stats-table .monthly-total-row > td[data-p-frozen-column='true']) {
  background: #f8f9fa !important;
  z-index: 1 !important;
}
/* frozen 영역과 스크롤 영역 경계 */
:deep(.monthly-stats-table [data-p-frozen-column='true']:has(+ :not([data-p-frozen-column='true']))),
:deep(.monthly-stats-table .p-datatable-frozen-column:has(+ :not(.p-datatable-frozen-column))) {
  border-right: 2px solid #dee2e6 !important;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04);
}
</style>
