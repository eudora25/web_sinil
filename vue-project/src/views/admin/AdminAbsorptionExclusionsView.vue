<template>
  <div class="admin-absorption-exclusions page-container">
    <div class="page-header-title-area">
      <div class="header-title">흡수율 제외 설정</div>
    </div>

    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ exclusions.length.toLocaleString() }} 건
          <span class="cutoff-badge">{{ cutoffMonth }} 정산월부터 적용</span>
        </div>
        <div class="action-buttons-group">
          <button class="btn-save" @click="openAddModal">신규 등록</button>
        </div>
      </div>

      <p style="margin: 0 0 12px; color: #666; font-size: 0.9rem;">
        지정한 (약국 × 품목)의 도매·직거래 매출을 흡수율 계산에서 제외합니다. (ETC/OTC 중복 반영 방지)
      </p>

      <DataTable
        :value="exclusions"
        :loading="loading"
        scrollable
        scrollHeight="calc(100vh - 280px)"
        class="custom-table"
      >
        <template #empty>
          <div v-if="!loading">등록된 제외 설정이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: '6%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">{{ slotProps.index + 1 }}</template>
        </Column>
        <Column header="제외 구분" :headerStyle="{ width: '9%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            <span
              class="type-badge"
              :class="{
                'type-wholesale': saleTypeLabel(slotProps.data) === '도매',
                'type-direct': saleTypeLabel(slotProps.data) === '직거래',
                'type-both': saleTypeLabel(slotProps.data) === '모두'
              }"
            >{{ saleTypeLabel(slotProps.data) }}</span>
          </template>
        </Column>
        <Column field="pharmacy_name" header="약국" :headerStyle="{ width: '20%' }" />
        <Column field="pharmacy_business_reg_no" header="약국 사업자번호" :headerStyle="{ width: '11%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }" />
        <Column field="insurance_code" header="보험코드" :headerStyle="{ width: '11%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }" />
        <Column field="product_name" header="품목" :headerStyle="{ width: '18%' }" />
        <Column field="remarks" header="비고" :headerStyle="{ width: '19%' }" />
        <Column header="작업" :headerStyle="{ width: '6%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            <button class="btn-delete-sm" @click="removeExclusion(slotProps.data)">삭제</button>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>

    <!-- 제외 등록 모달 (프로모션 제외병원 등록 디자인 참고) -->
    <Dialog
      v-model:visible="modalVisible"
      header="흡수율 제외 등록"
      :modal="true"
      :style="{ width: '760px' }"
      class="absorption-exclusion-modal"
    >
      <div class="exclusion-modal-content">
        <!-- 제외 매출 구분 (도매/직거래) -->
        <div class="search-section">
          <div class="search-header">
            <div class="search-header-icon icon-type"><i class="pi pi-sliders-h"></i></div>
            <div class="search-header-text">
              <h3 class="search-title">제외 매출 구분</h3>
              <p class="search-subtitle">흡수율에서 제외할 매출을 선택하세요 (하나 이상 필수)</p>
            </div>
          </div>
          <div class="type-checkbox-group">
            <label class="type-checkbox" :class="{ checked: excludeWholesale }">
              <input type="checkbox" v-model="excludeWholesale" />
              <span class="type-checkbox-box"><i class="pi pi-check"></i></span>
              <span class="type-checkbox-label">도매</span>
            </label>
            <label class="type-checkbox" :class="{ checked: excludeDirect }">
              <input type="checkbox" v-model="excludeDirect" />
              <span class="type-checkbox-box"><i class="pi pi-check"></i></span>
              <span class="type-checkbox-label">직거래</span>
            </label>
          </div>
          <p v-if="!excludeWholesale && !excludeDirect" class="type-warning">
            <i class="pi pi-exclamation-triangle"></i> 도매 또는 직거래 중 하나 이상을 선택해야 합니다.
          </p>
        </div>

        <!-- 약국 선택 -->
        <div class="search-section">
          <div class="search-header">
            <div class="search-header-icon"><i class="pi pi-building"></i></div>
            <div class="search-header-text">
              <h3 class="search-title">약국 선택</h3>
              <p class="search-subtitle">약국명 또는 사업자등록번호로 검색하세요</p>
            </div>
          </div>
          <div class="search-input-wrapper">
            <i class="pi pi-search search-input-icon"></i>
            <InputText v-model="pharmacySearch" placeholder="예: 군포종합약국 또는 123-45-67890" class="search-input-enhanced" @input="searchPharmacies" />
            <div v-if="pharmacySearch" class="search-clear" @click="pharmacySearch=''; pharmacyResults=[]"><i class="pi pi-times"></i></div>
          </div>

          <!-- 선택됨 -->
          <div v-if="selectedPharmacy" class="selected-card">
            <div class="selected-card-info">
              <i class="pi pi-check-circle"></i>
              <strong>{{ selectedPharmacy.name }}</strong>
              <span class="muted">({{ selectedPharmacy.business_registration_number }})</span>
            </div>
            <button class="btn-change" @click="selectedPharmacy = null">변경</button>
          </div>
          <!-- 검색 결과 -->
          <div v-else-if="pharmacyResults.length" class="result-list">
            <div v-for="ph in pharmacyResults" :key="ph.id" class="pick-card" @click="selectPharmacy(ph)">
              <div class="pick-card-content">
                <div class="pick-card-icon"><i class="pi pi-building"></i></div>
                <div class="pick-card-info">
                  <div class="pick-card-name">{{ ph.name }}</div>
                  <div class="pick-card-details">
                    <div class="detail-item"><i class="pi pi-id-card"></i><span class="detail-label">사업자번호</span><span class="detail-value">{{ ph.business_registration_number || '미등록' }}</span></div>
                  </div>
                </div>
              </div>
              <div class="pick-card-action"><div class="action-button"><i class="pi pi-plus"></i><span>선택</span></div></div>
            </div>
          </div>
        </div>

        <!-- 품목 선택 -->
        <div class="search-section">
          <div class="search-header">
            <div class="search-header-icon icon-product"><i class="pi pi-box"></i></div>
            <div class="search-header-text">
              <h3 class="search-title">품목 선택</h3>
              <p class="search-subtitle">품목명 또는 보험코드로 검색하세요</p>
            </div>
          </div>
          <div class="search-input-wrapper">
            <i class="pi pi-search search-input-icon"></i>
            <InputText v-model="productSearch" placeholder="예: 자누글리아정 또는 653806120" class="search-input-enhanced" @input="searchProducts" />
            <div v-if="productSearch" class="search-clear" @click="productSearch=''; productResults=[]"><i class="pi pi-times"></i></div>
          </div>

          <div v-if="selectedProduct" class="selected-card">
            <div class="selected-card-info">
              <i class="pi pi-check-circle"></i>
              <strong>{{ selectedProduct.product_name }}</strong>
              <span class="muted">({{ selectedProduct.insurance_code }})</span>
            </div>
            <button class="btn-change" @click="selectedProduct = null">변경</button>
          </div>
          <div v-else-if="productResults.length" class="result-list">
            <div v-for="pr in productResults" :key="pr.insurance_code" class="pick-card" @click="selectProduct(pr)">
              <div class="pick-card-content">
                <div class="pick-card-icon"><i class="pi pi-box"></i></div>
                <div class="pick-card-info">
                  <div class="pick-card-name">{{ pr.product_name }}</div>
                  <div class="pick-card-details">
                    <div class="detail-item"><i class="pi pi-hashtag"></i><span class="detail-label">보험코드</span><span class="detail-value">{{ pr.insurance_code }}</span></div>
                  </div>
                </div>
              </div>
              <div class="pick-card-action"><div class="action-button"><i class="pi pi-plus"></i><span>선택</span></div></div>
            </div>
          </div>
        </div>

        <!-- 비고 -->
        <div class="remark-section">
          <label>비고</label>
          <InputText v-model="remarks" placeholder="예: OTC 중복 제외" class="search-input-enhanced" />
        </div>
      </div>
      <template #footer>
        <Button label="취소" icon="pi pi-times" @click="modalVisible = false" class="p-button-text" />
        <Button label="저장" icon="pi pi-check" @click="saveExclusion" :disabled="!selectedPharmacy || !selectedProduct || (!excludeWholesale && !excludeDirect)" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { supabase } from '@/supabase'
import { useNotifications } from '@/utils/notifications'
import { loadSettlementSettings, getAbsorptionExclusionCutoffMonth } from '@/utils/settlementSettings'

const { showSuccess, showError } = useNotifications()

const exclusions = ref([])
const loading = ref(false)
const cutoffMonth = ref(getAbsorptionExclusionCutoffMonth())

const modalVisible = ref(false)
const pharmacySearch = ref('')
const pharmacyResults = ref([])
const selectedPharmacy = ref(null)
const productSearch = ref('')
const productResults = ref([])
const selectedProduct = ref(null)
const excludeWholesale = ref(true)   // 기본값: 도매 선택
const excludeDirect = ref(false)
const remarks = ref('')

async function fetchExclusions() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('absorption_sales_exclusions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = data || []
    // 품목명 보강 (보험코드 → product_name)
    const codes = [...new Set(rows.map(r => r.insurance_code).filter(Boolean))]
    const productNameMap = new Map()
    if (codes.length) {
      const { data: prods } = await supabase.from('products').select('insurance_code, product_name').in('insurance_code', codes)
      ;(prods || []).forEach(p => { if (!productNameMap.has(p.insurance_code)) productNameMap.set(p.insurance_code, p.product_name) })
    }
    // 약국명 보강 (pharmacy_id → name, 없으면 사업자번호로)
    const pharmIds = [...new Set(rows.map(r => r.pharmacy_id).filter(Boolean))]
    const pharmacyNameMap = new Map()
    if (pharmIds.length) {
      const { data: phs } = await supabase.from('pharmacies').select('id, name').in('id', pharmIds)
      ;(phs || []).forEach(ph => pharmacyNameMap.set(ph.id, ph.name))
    }
    const brns = [...new Set(rows.filter(r => !r.pharmacy_id).map(r => r.pharmacy_business_reg_no).filter(Boolean))]
    const pharmacyNameByBrn = new Map()
    if (brns.length) {
      const { data: phs2 } = await supabase.from('pharmacies').select('name, business_registration_number').in('business_registration_number', brns)
      ;(phs2 || []).forEach(ph => { if (!pharmacyNameByBrn.has(ph.business_registration_number)) pharmacyNameByBrn.set(ph.business_registration_number, ph.name) })
    }
    exclusions.value = rows.map(r => ({
      ...r,
      product_name: productNameMap.get(r.insurance_code) || '-',
      pharmacy_name: pharmacyNameMap.get(r.pharmacy_id) || pharmacyNameByBrn.get(r.pharmacy_business_reg_no) || '-',
    }))
  } catch (e) {
    showError('제외 설정 조회 중 오류: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}

// 제외 구분 라벨: 도매/직거래/모두
function saleTypeLabel(row) {
  if (row.exclude_wholesale && row.exclude_direct) return '모두'
  if (row.exclude_wholesale) return '도매'
  if (row.exclude_direct) return '직거래'
  return '-'
}

function openAddModal() {
  pharmacySearch.value = ''; pharmacyResults.value = []; selectedPharmacy.value = null
  productSearch.value = ''; productResults.value = []; selectedProduct.value = null
  excludeWholesale.value = true; excludeDirect.value = false  // 기본값: 도매만 선택
  remarks.value = ''
  modalVisible.value = true
}

async function searchPharmacies() {
  const kw = pharmacySearch.value.trim()
  if (kw.length < 1) { pharmacyResults.value = []; return }
  const { data } = await supabase
    .from('pharmacies')
    .select('id, name, business_registration_number')
    .or(`name.ilike.%${kw}%,business_registration_number.ilike.%${kw}%`)
    .limit(20)
  pharmacyResults.value = data || []
}
function selectPharmacy(ph) { selectedPharmacy.value = ph; pharmacyResults.value = []; pharmacySearch.value = '' }

async function searchProducts() {
  const kw = productSearch.value.trim()
  if (kw.length < 1) { productResults.value = []; return }
  const { data } = await supabase
    .from('products')
    .select('product_name, insurance_code')
    .or(`product_name.ilike.%${kw}%,insurance_code.ilike.%${kw}%`)
    .limit(30)
  const seen = new Set(); const out = []
  ;(data || []).forEach(p => { if (p.insurance_code && !seen.has(p.insurance_code)) { seen.add(p.insurance_code); out.push(p) } })
  productResults.value = out
}
function selectProduct(pr) { selectedProduct.value = pr; productResults.value = []; productSearch.value = '' }

async function saveExclusion() {
  if (!selectedPharmacy.value || !selectedProduct.value) return
  if (!excludeWholesale.value && !excludeDirect.value) {
    showError('도매 또는 직거래 중 하나 이상을 선택해야 합니다.')
    return
  }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('absorption_sales_exclusions').insert({
      pharmacy_id: selectedPharmacy.value.id,
      pharmacy_business_reg_no: selectedPharmacy.value.business_registration_number,
      insurance_code: selectedProduct.value.insurance_code,
      exclude_wholesale: excludeWholesale.value,
      exclude_direct: excludeDirect.value,
      remarks: remarks.value || null,
      created_by: user?.id || null,
    })
    if (error) {
      if (error.code === '23505') { showError('이미 등록된 (약국×품목) 조합입니다.'); return }
      throw error
    }
    showSuccess('제외 설정이 추가되었습니다.')
    modalVisible.value = false
    await fetchExclusions()
  } catch (e) {
    showError('제외 설정 저장 중 오류: ' + (e.message || e))
  }
}

async function removeExclusion(row) {
  if (!confirm(`${row.pharmacy_name || row.pharmacy_business_reg_no} / ${row.insurance_code} 제외 설정을 삭제하시겠습니까?`)) return
  const { error } = await supabase.from('absorption_sales_exclusions').delete().eq('id', row.id)
  if (error) { showError('삭제 중 오류: ' + error.message); return }
  showSuccess('삭제되었습니다.')
  await fetchExclusions()
}

onMounted(async () => {
  // cutoff(흡수율 제외 적용 시작월)은 settlement_settings 단일 소스에서 로드
  await loadSettlementSettings()
  cutoffMonth.value = getAbsorptionExclusionCutoffMonth()
  await fetchExclusions()
})
</script>

<style scoped>
/* 적용 시작월(cutoff) 배지 */
.total-count-display { display: inline-flex; align-items: center; gap: 10px; }
.cutoff-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  background: #eef4ff; color: #1565c0;
  border: 1px solid #c5d9f5; border-radius: 999px;
  font-size: 0.8rem; font-weight: 600; letter-spacing: -0.2px;
}

/* 모달 (프로모션 제외병원 등록 디자인 참고) */
.exclusion-modal-content { display: flex; flex-direction: column; gap: 20px; padding: 4px; }

.search-section {
  background: #fff;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
}
.search-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
.search-header-icon {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; box-shadow: 0 4px 12px rgba(220,53,69,0.3); flex-shrink: 0;
}
.search-header-icon.icon-product { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); box-shadow: 0 4px 12px rgba(25,118,210,0.3); }
.search-header-text { flex: 1; }
.search-title { margin: 0 0 2px; font-size: 16px; font-weight: 700; color: #212529; letter-spacing: -0.3px; }
.search-subtitle { margin: 0; font-size: 12px; color: #6c757d; }

.search-input-wrapper { position: relative; display: flex; align-items: center; }
.search-input-icon { position: absolute; left: 14px; color: #6c757d; font-size: 15px; z-index: 1; pointer-events: none; }
:deep(.search-input-enhanced) {
  width: 100%; padding: 12px 16px 12px 40px; border: 2px solid #e9ecef; border-radius: 10px;
  font-size: 14px; transition: all 0.2s ease; background: #f8f9fa;
}
:deep(.search-input-enhanced:focus) { outline: none; border-color: #1976d2; background: #fff; box-shadow: 0 0 0 4px rgba(25,118,210,0.1); }
.search-clear {
  position: absolute; right: 12px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #e9ecef; color: #6c757d; cursor: pointer; transition: all 0.2s ease; z-index: 1;
}
.search-clear:hover { background: #dc3545; color: #fff; transform: rotate(90deg); }

.result-list { margin-top: 14px; max-height: 230px; overflow-y: auto; padding-right: 6px; }

.pick-card {
  display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #fff;
  border: 2px solid #e9ecef; border-radius: 12px; margin-bottom: 10px; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
}
.pick-card:hover { border-color: #1976d2; transform: translateX(3px); box-shadow: 0 8px 20px rgba(25,118,210,0.13); }
.pick-card-content { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.pick-card-icon {
  width: 46px; height: 46px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #1976d2; font-size: 20px; flex-shrink: 0; transition: all 0.25s ease;
}
.pick-card:hover .pick-card-icon { transform: scale(1.08); }
.pick-card-info { flex: 1; min-width: 0; }
.pick-card-name { font-size: 15px; font-weight: 700; color: #212529; margin-bottom: 6px; line-height: 1.3; }
.pick-card-details { display: flex; flex-direction: column; gap: 4px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.detail-item i { color: #6c757d; font-size: 11px; }
.detail-label { color: #6c757d; font-weight: 500; }
.detail-value { color: #495057; font-family: 'Courier New', monospace; font-weight: 600; }
.pick-card-action { margin-left: 12px; flex-shrink: 0; }
.action-button {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #fff; border-radius: 8px;
  font-size: 13px; font-weight: 600; transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(40,167,69,0.2);
}
.pick-card:hover .action-button { transform: scale(1.05); box-shadow: 0 4px 12px rgba(40,167,69,0.3); }

.selected-card {
  margin-top: 14px; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px;
  background: linear-gradient(135deg, #e8f5e9 0%, #d7f0db 100%); border: 2px solid #28a745; border-radius: 12px;
}
.selected-card-info { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1b5e20; }
.selected-card-info i { color: #28a745; font-size: 18px; }
.selected-card-info .muted { color: #557; font-weight: 500; }
.btn-change { background: #fff; border: 1px solid #28a745; color: #28a745; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-weight: 600; }
.btn-change:hover { background: #28a745; color: #fff; }

.remark-section { display: flex; flex-direction: column; gap: 6px; }
.remark-section label { font-weight: 700; color: #212529; font-size: 14px; }

/* 제외 매출 구분 아이콘 */
.search-header-icon.icon-type { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); box-shadow: 0 4px 12px rgba(111,66,193,0.3); }

/* 도매/직거래 체크박스 */
.type-checkbox-group { display: flex; gap: 12px; }
.type-checkbox {
  display: flex; align-items: center; gap: 10px; flex: 1;
  padding: 14px 18px; border: 2px solid #e9ecef; border-radius: 10px;
  background: #f8f9fa; cursor: pointer; transition: all 0.2s ease; user-select: none;
}
.type-checkbox:hover { border-color: #c5cbd3; }
.type-checkbox.checked { border-color: #1976d2; background: #fff; box-shadow: 0 0 0 4px rgba(25,118,210,0.08); }
.type-checkbox input { display: none; }
.type-checkbox-box {
  width: 22px; height: 22px; border: 2px solid #ced4da; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: #fff; color: #fff; font-size: 12px; transition: all 0.2s ease; flex-shrink: 0;
}
.type-checkbox.checked .type-checkbox-box { background: #1976d2; border-color: #1976d2; }
.type-checkbox-box i { opacity: 0; transition: opacity 0.2s ease; }
.type-checkbox.checked .type-checkbox-box i { opacity: 1; }
.type-checkbox-label { font-size: 14px; font-weight: 600; color: #212529; }
.type-warning { margin: 10px 0 0; color: #dc3545; font-size: 12.5px; display: flex; align-items: center; gap: 6px; }

/* 목록 제외 구분 배지 */
.type-badge {
  display: inline-block; padding: 2px 8px; margin: 0 2px; border-radius: 6px;
  font-size: 0.78rem; font-weight: 600;
}
.type-wholesale { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
.type-direct { background: #f3e5f5; color: #6f42c1; border: 1px solid #e1bee7; }
.type-both { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }

.loading-spinner { width: 18px; height: 18px; border: 2px solid #e3f2fd; border-top-color: #007bff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
