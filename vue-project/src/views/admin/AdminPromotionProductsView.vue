<template>
  <div class="admin-promotion-products-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">프로모션 제품</div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-card">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="white-space: nowrap; font-weight: 400">기준년월</label>
          <select
            v-model="selectedBaseMonth"
            @change="onBaseMonthChange"
            class="select_month"
          >
            <option value="">전체</option>
            <option v-for="month in availableBaseMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ promotionProducts.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-check" @click="checkStatistics" :disabled="checkingStatistics">
            {{ checkingStatistics ? '확인 중...' : '통계 확인' }}
          </button>
          <button class="btn-save" @click="openAddModal">제품 추가</button>
        </div>
      </div>

      <DataTable
        :value="promotionProducts"
        :loading="loading"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-products-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 프로모션 제품이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: '5%' }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column field="insurance_code" header="보험코드" :headerStyle="{ width: '15%' }" :sortable="true">
          <template #body="slotProps">
            <span>{{ slotProps.data.insurance_code }}</span>
          </template>
        </Column>
        <Column field="product_name" header="제품명" :headerStyle="{ width: '25%' }" :sortable="true">
          <template #body="slotProps">
            <router-link 
              :to="`/admin/products/promotion/${slotProps.data.id}`"
              style="color: #007bff; text-decoration: underline; cursor: pointer;"
            >
              {{ slotProps.data.product_name }}
            </router-link>
          </template>
        </Column>
        <Column v-if="selectedBaseMonth" field="commission_rate_b" header="수수료율 B" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ formatCommissionRate(slotProps.data.commission_rate_b) }}
          </template>
        </Column>
        <Column field="commission_rate" header="수수료율" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ formatCommissionRate(slotProps.data.commission_rate) }}
          </template>
        </Column>
        <Column field="final_commission_rate" header="최종수수료율" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ formatCommissionRate(slotProps.data.final_commission_rate) }}
          </template>
        </Column>
        <Column header="생성일시" :headerStyle="{ width: '20%' }" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 추가 모달 -->
    <Dialog 
      v-model:visible="showModal" 
      header="프로모션 제품 추가" 
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeModal"
    >
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 8px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">보험코드 *</label>
          <InputText 
            v-model="formData.insurance_code" 
            placeholder="보험코드를 입력하세요"
            style="width: 100%;"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">제품명 *</label>
          <InputText 
            v-model="formData.product_name" 
            placeholder="제품명을 입력하세요"
            style="width: 100%;"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">수수료율 (%)</label>
          <InputNumber 
            v-model="formData.commission_rate_percent" 
            :min="0"
            :max="100"
            :step="0.1"
            suffix="%"
            placeholder="수수료율을 입력하세요"
            style="width: 100%;"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">최종수수료율 (%)</label>
          <InputNumber 
            v-model="formData.final_commission_rate_percent" 
            :min="0"
            :max="100"
            :step="0.1"
            suffix="%"
            placeholder="최종수수료율을 입력하세요"
            style="width: 100%;"
          />
        </div>
      </div>
      <template #footer>
        <Button label="취소" icon="pi pi-times" @click="closeModal" class="p-button-text" />
        <Button label="저장" icon="pi pi-check" @click="saveProduct" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { supabase } from '@/supabase';

const loading = ref(false);
const saving = ref(false);
const checkingStatistics = ref(false);
const promotionProducts = ref([]);
const showModal = ref(false);
const currentPageFirstIndex = ref(0);

// 기준년월 관련
const selectedBaseMonth = ref('');
const availableBaseMonths = ref([]);

const formData = ref({
  insurance_code: '',
  product_name: '',
  commission_rate_percent: null,
  final_commission_rate_percent: null
});

// 기준년월 목록 조회 (products 테이블에서)
async function fetchBaseMonths() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('base_month')
      .not('base_month', 'is', null);

    if (error) throw error;
    
    if (data && data.length > 0) {
      const monthSet = new Set();
      data.forEach(p => {
        if (p.base_month) {
          monthSet.add(p.base_month);
        }
      });
      availableBaseMonths.value = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
      
      // 가장 최신 월을 기본값으로 설정
      if (availableBaseMonths.value.length > 0 && !selectedBaseMonth.value) {
        selectedBaseMonth.value = availableBaseMonths.value[0];
      }
    }
  } catch (error) {
    console.error('기준년월 조회 오류:', error);
  }
}

// 기준년월 변경 시 제품의 commission_rate_b 조회
async function fetchProductCommissionRateB() {
  if (!selectedBaseMonth.value) {
    // 기준년월이 선택되지 않으면 commission_rate_b 제거
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      commission_rate_b: null
    }));
    return;
  }

  try {
    // promotion_product_list의 보험코드로 products 테이블에서 해당 기준년월의 commission_rate_b 조회
    const insuranceCodes = promotionProducts.value
      .map(p => p.insurance_code)
      .filter(code => code)
      .map(code => String(code)); // 문자열로 변환하여 타입 일치
    
    if (insuranceCodes.length === 0) return;

    console.log('기준년월 변경:', selectedBaseMonth.value);
    console.log('조회할 보험코드 목록:', insuranceCodes);

    const { data, error } = await supabase
      .from('products')
      .select('insurance_code, commission_rate_b')
      .eq('base_month', selectedBaseMonth.value)
      .in('insurance_code', insuranceCodes);

    if (error) throw error;

    console.log('조회된 제품 데이터:', data);

    // commission_rate_b 매핑 (insurance_code를 문자열로 변환하여 매칭)
    const commissionRateMap = {};
    if (data) {
      data.forEach(product => {
        // insurance_code를 문자열로 변환하여 키로 사용
        const key = String(product.insurance_code);
        commissionRateMap[key] = product.commission_rate_b;
      });
    }

    console.log('수수료율 B 매핑:', commissionRateMap);

    // promotionProducts에 commission_rate_b 추가
    promotionProducts.value = promotionProducts.value.map(p => {
      const key = String(p.insurance_code);
      return {
        ...p,
        commission_rate_b: commissionRateMap[key] || null
      };
    });

    console.log('업데이트된 프로모션 제품:', promotionProducts.value);
  } catch (error) {
    console.error('수수료율 B 조회 오류:', error);
    alert('수수료율 B 조회 중 오류가 발생했습니다: ' + (error.message || error));
  }
}

// 데이터 조회
async function fetchPromotionProducts() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('promotion_product_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    promotionProducts.value = data || [];
    
    // 기준년월이 선택되어 있으면 commission_rate_b 조회
    if (selectedBaseMonth.value) {
      await fetchProductCommissionRateB();
    }
  } catch (error) {
    console.error('프로모션 제품 조회 오류:', error);
    alert('프로모션 제품 조회 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    loading.value = false;
  }
}

// 기준년월 변경 핸들러
async function onBaseMonthChange() {
  if (selectedBaseMonth.value) {
    await fetchProductCommissionRateB();
  } else {
    // 기준년월이 선택 해제되면 commission_rate_b 제거
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      commission_rate_b: null
    }));
  }
}

// 모달 열기 (추가)
function openAddModal() {
  formData.value = {
    insurance_code: '',
    product_name: '',
    commission_rate_percent: null,
    final_commission_rate_percent: null
  };
  showModal.value = true;
}

// 모달 닫기
function closeModal() {
  showModal.value = false;
  formData.value = {
    insurance_code: '',
    product_name: '',
    commission_rate_percent: null,
    final_commission_rate_percent: null
  };
}

// 저장
async function saveProduct() {
  if (!formData.value.insurance_code || !formData.value.product_name) {
    alert('보험코드와 제품명은 필수 입력 항목입니다.');
    return;
  }

  saving.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');

    const saveData = {
      insurance_code: formData.value.insurance_code,
      product_name: formData.value.product_name,
      commission_rate: formData.value.commission_rate_percent ? (formData.value.commission_rate_percent / 100) : 0,
      final_commission_rate: formData.value.final_commission_rate_percent ? (formData.value.final_commission_rate_percent / 100) : 0,
      updated_by: user.id
    };

    // 추가
    saveData.created_by = user.id;
    const { error } = await supabase
      .from('promotion_product_list')
      .insert(saveData);

    if (error) throw error;
    alert('프로모션 제품이 추가되었습니다.');

    closeModal();
    await fetchPromotionProducts();
  } catch (error) {
    console.error('프로모션 제품 저장 오류:', error);
    alert('프로모션 제품 저장 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    saving.value = false;
  }
}


// 수수료율 포맷팅
function formatCommissionRate(rate) {
  if (rate === null || rate === undefined) return '-';
  return (rate * 100).toFixed(2) + '%';
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 통계 확인 및 promotion_product_hospital_performance 테이블 업데이트
async function checkStatistics() {
  if (!confirm('제품별 병원 실적을 확인하고 통계를 업데이트하시겠습니까?')) {
    return;
  }

  checkingStatistics.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // 각 프로모션 제품에 대해 처리
    for (const promotionProduct of promotionProducts.value) {
      try {
        const insuranceCode = String(promotionProduct.insurance_code);
        
        // 1. products 테이블에서 해당 보험코드의 제품 ID 찾기
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('insurance_code', insuranceCode)
          .eq('status', 'active');

        if (productsError) {
          console.error(`제품 ${promotionProduct.product_name} 조회 오류:`, productsError);
          totalErrors++;
          continue;
        }

        if (!products || products.length === 0) {
          console.log(`제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode})에 해당하는 활성 제품이 없습니다.`);
          continue;
        }

        const productIds = products.map(p => p.id);

        // 2. performance_records에서 해당 제품의 실적이 있는 병원들 찾기
        // 배치 처리로 전체 데이터 가져오기
        let allPerformanceRecords = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          const { data: records, error: recordsError } = await supabase
            .from('performance_records')
            .select(`
              client_id,
              company_id,
              prescription_qty,
              prescription_month,
              created_at,
              products!inner(price),
              companies!inner(company_group)
            `)
            .in('product_id', productIds)
            .eq('companies.company_group', 'NEWCSO')
            .neq('review_action', '삭제')
            .order('prescription_month', { ascending: true })
            .order('created_at', { ascending: true })
            .range(from, from + batchSize - 1);

          if (recordsError) {
            console.error(`실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
            break;
          }

          if (!records || records.length === 0) {
            break;
          }

          allPerformanceRecords = allPerformanceRecords.concat(records);

          if (records.length < batchSize) {
            break;
          }

          from += batchSize;
        }

        // 3. 병원별로 그룹화하고 최초 실적 CSO, 실적 월, 총 금액 계산
        const hospitalPerformanceMap = new Map();

        for (const record of allPerformanceRecords) {
          if (!record.client_id) continue;

          const hospitalId = record.client_id;
          // prescription_amount는 계산: prescription_qty * products.price
          const productPrice = Number(record.products?.price) || 0;
          const prescriptionQty = Number(record.prescription_qty) || 0;
          const prescriptionAmount = prescriptionQty * productPrice;
          
          if (!hospitalPerformanceMap.has(hospitalId)) {
            hospitalPerformanceMap.set(hospitalId, {
              hospital_id: hospitalId,
              has_performance: true,
              first_performance_cso_id: record.company_id,
              first_performance_month: record.prescription_month || null,
              first_prescription_qty: record.prescription_qty || 0,
              total_performance_amount: prescriptionAmount
            });
          } else {
            const existing = hospitalPerformanceMap.get(hospitalId);
            // 총 금액 누적
            existing.total_performance_amount = (existing.total_performance_amount || 0) + prescriptionAmount;
            
            // 최초 실적 CSO와 월 찾기 (처방수량이 0보다 큰 첫 번째 CSO)
            if (existing.first_prescription_qty === 0 && record.prescription_qty > 0) {
              existing.first_performance_cso_id = record.company_id;
              existing.first_performance_month = record.prescription_month || null;
              existing.first_prescription_qty = record.prescription_qty;
            } else if (!existing.first_performance_month && record.prescription_month) {
              // 처방수량이 0이어도 최초 실적 월은 기록
              existing.first_performance_month = record.prescription_month;
            }
          }
        }

        // 4. promotion_product_hospital_performance 테이블에 데이터 삽입/업데이트
        const performanceData = Array.from(hospitalPerformanceMap.values()).map(item => ({
          promotion_product_id: promotionProduct.id,
          hospital_id: item.hospital_id,
          has_performance: true,
          first_performance_cso_id: item.first_performance_cso_id,
          first_performance_month: item.first_performance_month || null,
          total_performance_amount: item.total_performance_amount || 0,
          created_by: user.id,
          updated_by: user.id
        }));

        if (performanceData.length > 0) {
          // 배치로 삽입 (UPSERT 사용)
          const batchSize = 100;
          for (let i = 0; i < performanceData.length; i += batchSize) {
            const batch = performanceData.slice(i, i + batchSize);
            
            const { error: upsertError } = await supabase
              .from('promotion_product_hospital_performance')
              .upsert(batch, {
                onConflict: 'promotion_product_id,hospital_id',
                ignoreDuplicates: false
              });

            if (upsertError) {
              console.error(`데이터 삽입 오류 (제품 ${promotionProduct.product_name}, 배치 ${Math.floor(i / batchSize) + 1}):`, upsertError);
              totalErrors++;
            } else {
              totalUpdated += batch.length;
            }
          }
        }

        totalProcessed++;
        console.log(`제품 ${promotionProduct.product_name}: ${performanceData.length}개 병원 실적 처리 완료`);
      } catch (error) {
        console.error(`제품 ${promotionProduct.product_name} 처리 오류:`, error);
        totalErrors++;
      }
    }

    alert(`통계 확인 완료!\n처리된 제품: ${totalProcessed}개\n업데이트된 병원 실적: ${totalUpdated}개\n오류: ${totalErrors}개`);
  } catch (error) {
    console.error('통계 확인 오류:', error);
    alert('통계 확인 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    checkingStatistics.value = false;
  }
}

onMounted(async () => {
  await fetchBaseMonths();
  await fetchPromotionProducts();
  // 기준년월이 설정되었으면 수수료율 B 조회
  if (selectedBaseMonth.value) {
    await fetchProductCommissionRateB();
  }
});
</script>

<style scoped>
.admin-promotion-products-view {
  padding: 20px;
}

.page-header-title-area {
  margin-bottom: 20px;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
}

.data-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.data-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.total-count-display {
  font-weight: 500;
  color: #333;
}

.action-buttons-group {
  display: flex;
  gap: 8px;
}

.btn-check {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.btn-check:hover:not(:disabled) {
  background-color: #218838;
}

.btn-check:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-save {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:hover {
  background-color: #0056b3;
}

.filter-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.select_month {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.select_month:focus {
  outline: none;
  border-color: #007bff;
}

</style>

