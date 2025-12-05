<template>
  <div class="admin-promotion-products-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">정산관리 > 프로모션 관리</div>
    </div>

    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ promotionProducts.length }} 건
        </div>
        <div class="action-buttons-group">
          <div v-if="lastUpdateTime" class="last-update-time">
            마지막 업데이트: {{ formatLastUpdateTime(lastUpdateTime) }}
          </div>
          <button class="btn-check" @click="checkStatistics" :disabled="checkingStatistics || resettingStatistics">
            {{ checkingStatistics ? '업데이트 중...' : '데이터 업데이트' }}
          </button>
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
        <Column field="insurance_code" header="보험코드" :headerStyle="{ width: '15%', textAlign: 'center' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            <div style="text-align: center;">{{ slotProps.data.insurance_code }}</div>
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
        <Column field="hospital_count" header="적용 병의원" :headerStyle="{ width: '12%', textAlign: 'center' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            <div style="text-align: center;">{{ slotProps.data.hospital_count !== undefined ? slotProps.data.hospital_count : 0 }}</div>
          </template>
        </Column>
        <Column field="commission_rate_b" header="기존 수수료율" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ formatCommissionRate(slotProps.data.commission_rate_b) }}
          </template>
        </Column>
        <Column field="final_commission_rate" header="최종 수수료율" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ formatCommissionRate(slotProps.data.final_commission_rate) }}
          </template>
        </Column>
        <Column field="promotion_start_date" header="시작 처방월" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            {{ formatPrescriptionMonth(slotProps.data.promotion_start_date) }}
          </template>
        </Column>
        <Column field="promotion_end_date" header="종료 처방월" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            {{ formatPrescriptionMonth(slotProps.data.promotion_end_date) }}
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
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">시작 처방월</label>
          <input
            type="date"
            v-model="formData.promotion_start_date"
            style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">종료 처방월</label>
          <input
            type="date"
            v-model="formData.promotion_end_date"
            style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;"
          />
        </div>
      </div>
      <template #footer>
        <Button label="취소" icon="pi pi-times" @click="closeModal" class="p-button-text" />
        <Button label="저장" icon="pi pi-check" @click="saveProduct" :loading="saving" />
      </template>
    </Dialog>

    <!-- 데이터 업데이트 진행 모달 -->
    <Dialog 
      v-model:visible="showStatisticsModal" 
      header="데이터 업데이트 진행 중" 
      :modal="true"
      :closable="false"
      :style="{ width: '550px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px;">
        <!-- 진행 상황 섹션 -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-weight: 600; font-size: 1.1em; color: #333;">진행 상황</div>
            <div style="font-weight: 600; font-size: 1.2em; color: #007bff;">
              {{ statisticsProgress }}%
            </div>
          </div>
          
          <!-- 그래픽 프로그레스 바 -->
          <div class="progress-container">
            <div class="progress-bar-wrapper">
              <div 
                class="progress-bar-fill" 
                :style="{ width: statisticsProgress + '%' }"
              >
                <div class="progress-bar-shine"></div>
              </div>
            </div>
            <div class="progress-steps">
              <div 
                v-for="step in 10" 
                :key="step"
                class="progress-step"
                :class="{ 'active': (step * 10) <= statisticsProgress }"
              ></div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 12px; color: #6c757d; font-size: 0.95em; font-weight: 500;">
            {{ statisticsCurrentIndex }} / {{ statisticsTotalCount }} 제품 처리 중
          </div>
        </div>

        <!-- 현재 처리 중인 제품 -->
        <div v-if="statisticsCurrentProduct" class="info-card product-card">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i class="pi pi-box" style="color: #007bff; font-size: 1.2em;"></i>
            <div style="font-weight: 600; color: #333;">현재 처리 중인 제품</div>
          </div>
          <div style="color: #495057; font-size: 1.05em; padding-left: 28px;">{{ statisticsCurrentProduct }}</div>
        </div>

        <!-- 상태 정보 -->
        <div v-if="statisticsStatus" class="info-card status-card">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i class="pi pi-info-circle" style="color: #17a2b8; font-size: 1.2em;"></i>
            <div style="font-weight: 600; color: #333;">상태</div>
          </div>
          <div style="color: #495057; padding-left: 28px;">{{ statisticsStatus }}</div>
        </div>

        <!-- 진행 애니메이션 -->
        <div v-if="!statisticsCompleted" class="loading-indicator">
          <div class="spinner"></div>
          <span style="margin-left: 12px; color: #6c757d;">처리 중...</span>
        </div>
      </div>
      <template #footer>
        <Button 
          v-if="statisticsCompleted" 
          label="확인" 
          icon="pi pi-check" 
          @click="closeStatisticsModal"
          class="p-button-success"
        />
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
import ProgressBar from 'primevue/progressbar';
import { supabase } from '@/supabase';

const loading = ref(false);
const saving = ref(false);
const checkingStatistics = ref(false);
const resettingStatistics = ref(false);
const promotionProducts = ref([]);
const showModal = ref(false);
const currentPageFirstIndex = ref(0);
const lastUpdateTime = ref(null);

// 통계 확인 진행 상태
const showStatisticsModal = ref(false);
const statisticsProgress = ref(0);
const statisticsCurrentIndex = ref(0);
const statisticsTotalCount = ref(0);
const statisticsCurrentProduct = ref('');
const statisticsStatus = ref('');
const statisticsCompleted = ref(false);

// 기준년월 관련
const selectedBaseMonth = ref('');
const availableBaseMonths = ref([]);

    const formData = ref({
      insurance_code: '',
      product_name: '',
      commission_rate_percent: null,
      final_commission_rate_percent: null,
      promotion_start_date: null,
      promotion_end_date: null
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
    // 기준년월이 선택되지 않으면 commission_rate_b 제거 (hospital_count 유지)
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      commission_rate_b: null,
      hospital_count: p.hospital_count !== undefined ? p.hospital_count : 0
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

    // promotionProducts에 commission_rate_b 추가 (hospital_count 유지)
    promotionProducts.value = promotionProducts.value.map(p => {
      const key = String(p.insurance_code);
      return {
        ...p,
        commission_rate_b: commissionRateMap[key] || null,
        hospital_count: p.hospital_count !== undefined ? p.hospital_count : 0
      };
    });

    console.log('업데이트된 프로모션 제품:', promotionProducts.value);
  } catch (error) {
    console.error('수수료율 B 조회 오류:', error);
    alert('수수료율 B 조회 중 오류가 발생했습니다: ' + (error.message || error));
  }
}

// 병원 실적 개수 조회 (first_performance_cso_id가 null이 아닌 것만 카운트)
async function fetchHospitalCounts() {
  if (promotionProducts.value.length === 0) return;

  try {
    const productIds = promotionProducts.value.map(p => p.id);
    
    // 각 제품별로 병원 실적 개수 조회 (first_performance_cso_id가 null이 아닌 것만)
    const { data, error } = await supabase
      .from('promotion_product_hospital_performance')
      .select('promotion_product_id')
      .in('promotion_product_id', productIds)
      .not('first_performance_cso_id', 'is', null);

    if (error) throw error;

    // 제품별 개수 계산
    const countMap = {};
    if (data) {
      data.forEach(item => {
        const productId = item.promotion_product_id;
        countMap[productId] = (countMap[productId] || 0) + 1;
      });
    }

    // promotionProducts에 hospital_count 추가
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      hospital_count: countMap[p.id] || 0
    }));
  } catch (error) {
    console.error('병원 실적 개수 조회 오류:', error);
    // 오류가 발생해도 기본값 0으로 설정
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      hospital_count: 0
    }));
  }
}

// 마지막 업데이트 시간 조회
async function fetchLastUpdateTime() {
  try {
    // 먼저 promotion_statistics_log 테이블에서 조회 시도
    const { data: logData, error: logError } = await supabase
      .from('promotion_statistics_log')
      .select('last_update_time')
      .order('last_update_time', { ascending: false })
      .limit(1)
      .single();

    if (!logError && logData && logData.last_update_time) {
      lastUpdateTime.value = new Date(logData.last_update_time);
      return;
    }

    // promotion_statistics_log 테이블이 없거나 데이터가 없으면
    // promotion_product_hospital_performance 테이블의 가장 최근 updated_at 조회
    const { data, error } = await supabase
      .from('promotion_product_hospital_performance')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 데이터가 없을 때의 에러이므로 무시
      console.error('마지막 업데이트 시간 조회 오류:', error);
      return;
    }

    if (data && data.updated_at) {
      lastUpdateTime.value = new Date(data.updated_at);
    }
  } catch (error) {
    console.error('마지막 업데이트 시간 조회 오류:', error);
  }
}

// 마지막 업데이트 시간을 DB에 저장 (로그 테이블 사용)
async function saveLastUpdateTime() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      lastUpdateTime.value = new Date();
      return;
    }

    const now = new Date().toISOString();
    
    // promotion_statistics_log 테이블에 로그 저장
    // 먼저 기존 로그가 있는지 확인
    const { data: existingLogs, error: checkError } = await supabase
      .from('promotion_statistics_log')
      .select('id')
      .limit(1);

    if (checkError) {
      // 테이블이 없거나 오류가 발생하면 promotion_product_hospital_performance의 updated_at을 사용
      // (실제로는 promotion_product_hospital_performance의 updated_at은 자동으로 업데이트되므로
      // 별도로 업데이트할 필요 없이 조회만 하면 됨)
      console.warn('promotion_statistics_log 테이블 조회 오류:', checkError);
      lastUpdateTime.value = new Date(now);
      return;
    }

    if (existingLogs && existingLogs.length > 0) {
      // 기존 로그가 있으면 UPDATE
      const { error: updateError } = await supabase
        .from('promotion_statistics_log')
        .update({
          last_update_time: now,
          updated_by: user.id
        })
        .eq('id', existingLogs[0].id);
      
      if (updateError) {
        console.error('마지막 업데이트 시간 저장 오류:', updateError);
        lastUpdateTime.value = new Date(now);
        return;
      }
    } else {
      // 기존 로그가 없으면 INSERT
      const { error: insertError } = await supabase
        .from('promotion_statistics_log')
        .insert({
          last_update_time: now,
          updated_by: user.id
        });
      
      if (insertError) {
        console.error('마지막 업데이트 시간 저장 오류:', insertError);
        lastUpdateTime.value = new Date(now);
        return;
      }
    }

    lastUpdateTime.value = new Date(now);
  } catch (error) {
    console.error('마지막 업데이트 시간 저장 오류:', error);
    // 실패해도 메모리에 저장
    lastUpdateTime.value = new Date();
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
    
    // 병원 실적 개수 조회
    await fetchHospitalCounts();
    
    // 기존 수수료율 조회 (기준년월이 있으면 조회, 없으면 null)
    if (selectedBaseMonth.value) {
      await fetchProductCommissionRateB();
    } else {
      // 기준년월이 없으면 commission_rate_b를 null로 설정
      promotionProducts.value = promotionProducts.value.map(p => ({
        ...p,
        commission_rate_b: null
      }));
    }
    
    // 마지막 업데이트 시간 조회
    await fetchLastUpdateTime();
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
    // 기준년월이 선택 해제되면 commission_rate_b 제거 (hospital_count 유지)
    promotionProducts.value = promotionProducts.value.map(p => ({
      ...p,
      commission_rate_b: null,
      hospital_count: p.hospital_count !== undefined ? p.hospital_count : 0
    }));
  }
}

// 모달 열기 (추가)
function openAddModal() {
  formData.value = {
    insurance_code: '',
    product_name: '',
    commission_rate_percent: null,
    final_commission_rate_percent: null,
    promotion_start_date: null,
    promotion_end_date: null
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
    final_commission_rate_percent: null,
    promotion_start_date: null,
    promotion_end_date: null
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
      promotion_start_date: formData.value.promotion_start_date || null,
      promotion_end_date: formData.value.promotion_end_date || null,
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

// 날짜 포맷팅 (시간 포함)
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

// 날짜만 포맷팅 (YYYY-MM-DD)
function formatDateOnly(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 처방월 형식으로 변환 (YYYY-MM)
function formatPrescriptionMonth(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// 마지막 업데이트 시간 포맷팅
function formatLastUpdateTime(date) {
  if (!date) return '-';
  const updateDate = new Date(date);
  return updateDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 통계 확인 모달 닫기
function closeStatisticsModal() {
  showStatisticsModal.value = false;
  statisticsProgress.value = 0;
  statisticsCurrentIndex.value = 0;
  statisticsTotalCount.value = 0;
  statisticsCurrentProduct.value = '';
  statisticsStatus.value = '';
  statisticsCompleted.value = false;
}

// promotion_product_hospital_performance 테이블 초기화
async function resetStatistics() {
  if (!confirm('promotion_product_hospital_performance 테이블의 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
    return;
  }

  resettingStatistics.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');

    // 모든 레코드를 배치로 삭제
    let deletedCount = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      // 먼저 일부 레코드를 조회
      const { data: records, error: fetchError } = await supabase
        .from('promotion_product_hospital_performance')
        .select('id')
        .limit(batchSize);

      if (fetchError) throw fetchError;

      if (!records || records.length === 0) {
        hasMore = false;
        break;
      }

      // 조회된 레코드 삭제
      const idsToDelete = records.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('promotion_product_hospital_performance')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      deletedCount += idsToDelete.length;

      // 배치 크기보다 적게 조회되면 더 이상 데이터가 없음
      if (records.length < batchSize) {
        hasMore = false;
      }
    }

    alert(`데이터 초기화가 완료되었습니다. (삭제된 레코드: ${deletedCount}개)`);
    
    // 병원 실적 개수도 초기화
    await fetchHospitalCounts();
  } catch (error) {
    console.error('데이터 초기화 오류:', error);
    alert('데이터 초기화 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    resettingStatistics.value = false;
  }
}

// 데이터 업데이트 및 promotion_product_hospital_performance 테이블 업데이트
async function checkStatistics() {
  if (!confirm('제품별 병원 실적을 확인하고 데이터를 업데이트하시겠습니까?')) {
    return;
  }

  checkingStatistics.value = true;
  showStatisticsModal.value = true;
  statisticsCompleted.value = false;
  statisticsProgress.value = 0;
  statisticsCurrentIndex.value = 0;
  statisticsTotalCount.value = promotionProducts.value.length;
  statisticsCurrentProduct.value = '';
  statisticsStatus.value = '초기화 중...';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // 각 프로모션 제품에 대해 처리
    for (let i = 0; i < promotionProducts.value.length; i++) {
      const promotionProduct = promotionProducts.value[i];
      statisticsCurrentIndex.value = i + 1;
      statisticsProgress.value = Math.round(((i + 1) / promotionProducts.value.length) * 100);
      statisticsCurrentProduct.value = promotionProduct.product_name;
      statisticsStatus.value = `제품 처리 중... (${i + 1}/${promotionProducts.value.length})`;
      try {
        const insuranceCode = String(promotionProduct.insurance_code);
        
        // 각 제품의 promotion_start_date를 기준일로 사용
        // 날짜 문자열이 YYYY-MM-DD 형식이면 그대로 사용, 아니면 Date 객체로 파싱
        let baseMonth = null;
        if (promotionProduct.promotion_start_date) {
          // ISO 날짜 문자열에서 직접 YYYY-MM 추출 (시간대 문제 방지)
          const dateStr = promotionProduct.promotion_start_date;
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            // YYYY-MM-DD 형식에서 YYYY-MM 추출
            baseMonth = dateStr.substring(0, 7);
          } else {
            // Date 객체로 파싱하는 경우 (로컬 시간대 사용)
            const startDate = new Date(promotionProduct.promotion_start_date);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            baseMonth = `${year}-${month}`;
          }
        }
        
        // promotion_start_date가 없으면 해당 제품 스킵
        if (!baseMonth) {
          console.log(`제품 ${promotionProduct.product_name}의 프로모션 시작일이 없어 스킵합니다.`);
          totalSkipped++;
          continue;
        }
        
        statisticsStatus.value = `제품 정보 조회 중... (기준일: ${baseMonth}) (${i + 1}/${promotionProducts.value.length})`;
        
        // 1. performance_records에서 사용된 처방월(prescription_month) 목록 조회
        // 처방월을 base_month로 하는 제품을 조회하기 위함
        let prescriptionMonthsSet = new Set();
        let prescriptionMonthFrom = 0;
        const prescriptionMonthBatchSize = 1000;

        while (true) {
          const { data: recordsForMonths, error: monthsError } = await supabase
            .from('performance_records')
            .select('prescription_month, products!inner(insurance_code, status, base_month), companies!inner(company_group, company_name), clients!inner(business_registration_number)')
            .eq('products.insurance_code', insuranceCode)
            .eq('products.status', 'active')
            .eq('companies.company_group', 'NEWCSO')
            .or('review_action.is.null,review_action.neq.삭제')
            .range(prescriptionMonthFrom, prescriptionMonthFrom + prescriptionMonthBatchSize - 1);

          if (monthsError) {
            console.error(`처방월 조회 오류 (제품 ${promotionProduct.product_name}):`, monthsError);
            totalErrors++;
            break;
          }

          if (!recordsForMonths || recordsForMonths.length === 0) {
            break;
          }

          recordsForMonths.forEach(record => {
            if (record.prescription_month) {
              prescriptionMonthsSet.add(record.prescription_month);
              // 디버깅: 특정 병원의 데이터 확인
              if (record.clients?.business_registration_number === '781-91-02196') {
                console.log(`[통계 확인] 사업자번호 781-91-02196 병원 데이터 발견:`, {
                  prescription_month: record.prescription_month,
                  product_base_month: record.products?.base_month,
                  company_group: record.companies?.company_group,
                  company_name: record.companies?.company_name
                });
              }
            }
          });

          if (recordsForMonths.length < prescriptionMonthBatchSize) {
            break;
          }

          prescriptionMonthFrom += prescriptionMonthBatchSize;
        }

        const prescriptionMonths = Array.from(prescriptionMonthsSet);

        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 조회된 처방월:`, prescriptionMonths);

        if (prescriptionMonths.length === 0) {
          console.log(`제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode})에 해당하는 실적 데이터가 없습니다.`);
          totalSkipped++;
          continue;
        }

        // 2. 각 처방월을 base_month로 하는 제품 ID 조회
        const productIdsSet = new Set();
        for (const prescriptionMonth of prescriptionMonths) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .eq('insurance_code', insuranceCode)
            .eq('base_month', prescriptionMonth)
            .eq('status', 'active');

          if (productsError) {
            console.error(`제품 조회 오류 (보험코드: ${insuranceCode}, 기준월: ${prescriptionMonth}):`, productsError);
            continue;
          }

          console.log(`[통계 확인] 보험코드 ${insuranceCode}, 기준월 ${prescriptionMonth} - 조회된 제품 수:`, products?.length || 0);

          if (products && products.length > 0) {
            products.forEach(p => productIdsSet.add(p.id));
          }
        }

        const productIds = Array.from(productIdsSet);

        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 최종 제품 ID 목록:`, productIds);

        if (productIds.length === 0) {
          console.log(`제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode})에 해당하는 제품이 없습니다.`);
          totalSkipped++;
          continue;
        }

        statisticsStatus.value = `기존 데이터 확인 중... (${i + 1}/${promotionProducts.value.length})`;

        // 2. 기존 promotion_product_hospital_performance 데이터 조회
        const { data: existingData, error: existingError } = await supabase
          .from('promotion_product_hospital_performance')
          .select('hospital_id, first_performance_month, first_performance_cso_id, total_performance_amount, before_promotion_amount, after_promotion_amount')
          .eq('promotion_product_id', promotionProduct.id);

        if (existingError) {
          console.error(`기존 데이터 조회 오류 (제품 ${promotionProduct.product_name}):`, existingError);
          totalErrors++;
          continue;
        }

        const existingHospitalIds = new Set((existingData || []).map(d => d.hospital_id));
        const existingDataMap = new Map(); // hospital_id -> { first_performance_month, first_performance_cso_id, total_performance_amount, before_promotion_amount, after_promotion_amount }
        (existingData || []).forEach(d => {
          existingDataMap.set(d.hospital_id, {
            first_performance_month: d.first_performance_month,
            first_performance_cso_id: d.first_performance_cso_id,
            total_performance_amount: d.total_performance_amount || 0,
            before_promotion_amount: d.before_promotion_amount || 0,
            after_promotion_amount: d.after_promotion_amount || 0
          });
        });

        statisticsStatus.value = `${baseMonth} 이전 데이터 조회 중... (${i + 1}/${promotionProducts.value.length})`;

        // 3. 기준일 이전 데이터 조회
        // 처방월과 base_month가 일치하는 제품만 조회
        let beforeBaseMonthRecords = [];
        let from = 0;
        const batchSize = 1000;

        // 프로모션 시작일과 종료일을 Date 객체로 변환 (비교용)
        const promotionStartDate = promotionProduct.promotion_start_date ? new Date(promotionProduct.promotion_start_date) : null;
        const promotionEndDate = promotionProduct.promotion_end_date ? new Date(promotionProduct.promotion_end_date) : null;
        
        // 종료일의 처방월 추출 (YYYY-MM 형식)
        let endMonth = null;
        if (promotionEndDate) {
          const year = promotionEndDate.getFullYear();
          const month = String(promotionEndDate.getMonth() + 1).padStart(2, '0');
          endMonth = `${year}-${month}`;
        }
        
        // 기준일 이전 처방월 목록 (문자열 비교)
        const beforePrescriptionMonths = prescriptionMonths.filter(month => month < baseMonth);
        // 기준일과 같은 처방월 목록 (날짜 비교 필요)
        const sameMonthPrescriptionMonths = prescriptionMonths.filter(month => month === baseMonth);
        
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 기준일(${baseMonth}) 이전 처방월:`, beforePrescriptionMonths);
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 기준일(${baseMonth})과 같은 처방월:`, sameMonthPrescriptionMonths);

        // 기준일 이전 처방월 데이터 조회
        for (const prescriptionMonth of beforePrescriptionMonths) {
          // 해당 처방월을 base_month로 하는 제품 ID만 조회
          const { data: monthProducts, error: monthProductsError } = await supabase
            .from('products')
            .select('id')
            .eq('insurance_code', insuranceCode)
            .eq('base_month', prescriptionMonth)
            .eq('status', 'active');

          if (monthProductsError || !monthProducts || monthProducts.length === 0) {
            continue;
          }

          const monthProductIds = monthProducts.map(p => p.id);
          from = 0;

          while (true) {
            const { data: records, error: recordsError } = await supabase
              .from('performance_records')
              .select(`
                client_id,
                company_id,
                prescription_qty,
                prescription_month,
                created_at,
                review_action,
                products!inner(price),
                companies!inner(company_group)
              `)
              .in('product_id', monthProductIds)
              .eq('prescription_month', prescriptionMonth)
              .eq('companies.company_group', 'NEWCSO')
              .or('review_action.is.null,review_action.neq.삭제')
              .order('created_at', { ascending: true })
              .range(from, from + batchSize - 1);

            if (recordsError) {
              console.error(`${prescriptionMonth} 실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
              break;
            }

            if (!records || records.length === 0) {
              break;
            }

            beforeBaseMonthRecords = beforeBaseMonthRecords.concat(records);

            if (records.length < batchSize) {
              break;
            }

            from += batchSize;
          }
        }

        // 기준일과 같은 처방월 데이터 조회 (created_at으로 날짜 비교하여 분류)
        let sameMonthRecords = [];
        for (const prescriptionMonth of sameMonthPrescriptionMonths) {
          // 해당 처방월을 base_month로 하는 제품 ID만 조회
          const { data: monthProducts, error: monthProductsError } = await supabase
            .from('products')
            .select('id')
            .eq('insurance_code', insuranceCode)
            .eq('base_month', prescriptionMonth)
            .eq('status', 'active');

          if (monthProductsError || !monthProducts || monthProducts.length === 0) {
            continue;
          }

          const monthProductIds = monthProducts.map(p => p.id);
          from = 0;

          while (true) {
            const { data: records, error: recordsError } = await supabase
              .from('performance_records')
              .select(`
                client_id,
                company_id,
                prescription_qty,
                prescription_month,
                created_at,
                review_action,
                products!inner(price),
                companies!inner(company_group)
              `)
              .in('product_id', monthProductIds)
              .eq('prescription_month', prescriptionMonth)
              .eq('companies.company_group', 'NEWCSO')
              .or('review_action.is.null,review_action.neq.삭제')
              .order('created_at', { ascending: true })
              .range(from, from + batchSize - 1);

            if (recordsError) {
              console.error(`${prescriptionMonth} 실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
              break;
            }

            if (!records || records.length === 0) {
              break;
            }

            sameMonthRecords = sameMonthRecords.concat(records);

            if (records.length < batchSize) {
              break;
            }

            from += batchSize;
          }
        }

        // 같은 처방월 데이터를 시작일 기준으로 분류
        if (promotionStartDate) {
          sameMonthRecords.forEach(record => {
            const recordDate = new Date(record.created_at);
            if (recordDate < promotionStartDate) {
              beforeBaseMonthRecords.push(record);
            } else {
              // 이후 데이터는 나중에 추가
            }
          });
        } else {
          // 시작일이 없으면 모두 이전으로 분류
          beforeBaseMonthRecords = beforeBaseMonthRecords.concat(sameMonthRecords);
        }

        statisticsStatus.value = `${baseMonth} 이후 데이터 조회 중... (${i + 1}/${promotionProducts.value.length})`;

        // 4. 기준일 이후 데이터 조회
        // 처방월과 base_month가 일치하는 제품만 조회
        let afterBaseMonthRecords = [];
        from = 0;

        // 기준일 이후 처방월 목록 (문자열 비교)
        // 종료일이 있으면 종료일 이하의 처방월만 포함
        let afterPrescriptionMonths = prescriptionMonths.filter(month => month > baseMonth);
        if (endMonth) {
          afterPrescriptionMonths = afterPrescriptionMonths.filter(month => month <= endMonth);
        }
        
        // 종료일 이후 처방월 목록 (프로모션 적용 대상 아님)
        const afterEndMonthPrescriptionMonths = endMonth 
          ? prescriptionMonths.filter(month => month > endMonth)
          : [];
        
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 기준일(${baseMonth}) 이후 프로모션 기간 내 처방월:`, afterPrescriptionMonths);
        if (endMonth) {
          console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 종료일(${endMonth}) 이후 처방월:`, afterEndMonthPrescriptionMonths);
        }

        // 기준일 이후 처방월 데이터 조회
        for (const prescriptionMonth of afterPrescriptionMonths) {
          // 해당 처방월을 base_month로 하는 제품 ID만 조회
          const { data: monthProducts, error: monthProductsError } = await supabase
            .from('products')
            .select('id')
            .eq('insurance_code', insuranceCode)
            .eq('base_month', prescriptionMonth)
            .eq('status', 'active');

          if (monthProductsError || !monthProducts || monthProducts.length === 0) {
            continue;
          }

          const monthProductIds = monthProducts.map(p => p.id);
          from = 0;

          while (true) {
            const { data: records, error: recordsError } = await supabase
              .from('performance_records')
              .select(`
                client_id,
                company_id,
                prescription_qty,
                prescription_month,
                created_at,
                review_action,
                products!inner(price),
                companies!inner(company_group)
              `)
              .in('product_id', monthProductIds)
              .eq('prescription_month', prescriptionMonth)
              .eq('companies.company_group', 'NEWCSO')
              .or('review_action.is.null,review_action.neq.삭제')
              .order('created_at', { ascending: true })
              .range(from, from + batchSize - 1);

            if (recordsError) {
              console.error(`${prescriptionMonth} 실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
              break;
            }

            if (!records || records.length === 0) {
              break;
            }

            afterBaseMonthRecords = afterBaseMonthRecords.concat(records);

            if (records.length < batchSize) {
              break;
            }

            from += batchSize;
          }
        }

        // 기준일과 같은 처방월 데이터 중 시작일 이후인 것들 추가 (종료일 이전인 것만)
        if (promotionStartDate) {
          sameMonthRecords.forEach(record => {
            const recordDate = new Date(record.created_at);
            if (recordDate >= promotionStartDate) {
              // 종료일이 있고 종료일을 지났으면 프로모션 적용 대상에서 제외
              if (promotionEndDate && recordDate > promotionEndDate) {
                // 종료일 이후 데이터는 afterBaseMonthRecords에 포함하지 않음
                // (나중에 별도로 처리)
              } else {
                afterBaseMonthRecords.push(record);
              }
            }
          });
        }
        
        // 종료일 이후 처방월 데이터 조회 (프로모션 적용 대상 아님, total에만 포함)
        let afterEndMonthRecords = [];
        for (const prescriptionMonth of afterEndMonthPrescriptionMonths) {
          // 해당 처방월을 base_month로 하는 제품 ID만 조회
          const { data: monthProducts, error: monthProductsError } = await supabase
            .from('products')
            .select('id')
            .eq('insurance_code', insuranceCode)
            .eq('base_month', prescriptionMonth)
            .eq('status', 'active');

          if (monthProductsError || !monthProducts || monthProducts.length === 0) {
            continue;
          }

          const monthProductIds = monthProducts.map(p => p.id);
          from = 0;

          while (true) {
            const { data: records, error: recordsError } = await supabase
              .from('performance_records')
              .select(`
                client_id,
                company_id,
                prescription_qty,
                prescription_month,
                created_at,
                review_action,
                products!inner(price),
                companies!inner(company_group)
              `)
              .in('product_id', monthProductIds)
              .eq('prescription_month', prescriptionMonth)
              .eq('companies.company_group', 'NEWCSO')
              .or('review_action.is.null,review_action.neq.삭제')
              .order('created_at', { ascending: true })
              .range(from, from + batchSize - 1);

            if (recordsError) {
              console.error(`${prescriptionMonth} 실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
              break;
            }

            if (!records || records.length === 0) {
              break;
            }

            afterEndMonthRecords = afterEndMonthRecords.concat(records);

            if (records.length < batchSize) {
              break;
            }

            from += batchSize;
          }
        }
        
        // 종료일과 같은 처방월 데이터 중 종료일 이후인 것들 추가
        if (promotionEndDate && endMonth) {
          const sameEndMonthPrescriptionMonths = prescriptionMonths.filter(month => month === endMonth);
          for (const prescriptionMonth of sameEndMonthPrescriptionMonths) {
            // 해당 처방월을 base_month로 하는 제품 ID만 조회
            const { data: monthProducts, error: monthProductsError } = await supabase
              .from('products')
              .select('id')
              .eq('insurance_code', insuranceCode)
              .eq('base_month', prescriptionMonth)
              .eq('status', 'active');

            if (monthProductsError || !monthProducts || monthProducts.length === 0) {
              continue;
            }

            const monthProductIds = monthProducts.map(p => p.id);
            from = 0;

            while (true) {
              const { data: records, error: recordsError } = await supabase
                .from('performance_records')
                .select(`
                  client_id,
                  company_id,
                  prescription_qty,
                  prescription_month,
                  created_at,
                  review_action,
                  products!inner(price),
                  companies!inner(company_group)
                `)
                .in('product_id', monthProductIds)
                .eq('prescription_month', prescriptionMonth)
                .eq('companies.company_group', 'NEWCSO')
                .or('review_action.is.null,review_action.neq.삭제')
                .order('created_at', { ascending: true })
                .range(from, from + batchSize - 1);

              if (recordsError) {
                console.error(`${prescriptionMonth} 실적 조회 오류 (제품 ${promotionProduct.product_name}):`, recordsError);
                break;
              }

              if (!records || records.length === 0) {
                break;
              }

              // created_at을 종료일과 비교하여 분류
              records.forEach(record => {
                const recordDate = new Date(record.created_at);
                if (recordDate > promotionEndDate) {
                  afterEndMonthRecords.push(record);
                }
              });

              if (records.length < batchSize) {
                break;
              }

              from += batchSize;
            }
          }
        }

        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 기준일(${baseMonth}) 이전 레코드:`, beforeBaseMonthRecords.length, '건');
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 기준일(${baseMonth}) 이후 프로모션 기간 내 레코드:`, afterBaseMonthRecords.length, '건');
        if (endMonth) {
          console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 종료일(${endMonth}) 이후 레코드:`, afterEndMonthRecords.length, '건');
        }

        statisticsStatus.value = `데이터 처리 중... (${i + 1}/${promotionProducts.value.length})`;

        // 5. 병원별로 데이터 정리
        const hospitalDataMap = new Map();
        
        // 기존 데이터의 프로모션 전/후 금액을 다시 계산하기 위한 맵
        const existingBeforeAmountMap = new Map(); // hospital_id -> amount
        const existingAfterAmountMap = new Map(); // hospital_id -> amount

        // 먼저 기준일 이전 데이터 처리
        // 기존 데이터 중 처방 시작일 이전 데이터가 있으면 CSO ID를 null로 처리
        // 동일 병원, 동일 CSO, 동일 제품의 처방 데이터 중 처방 시작일보다 이전 데이터가 있으면 CSO ID를 null로 처리
        for (const existingItem of existingData) {
          const hospitalId = existingItem.hospital_id;
          const existingCSOId = existingItem.first_performance_cso_id;
          
          // CSO ID가 null이 아닌 경우에만 확인
          if (existingCSOId !== null) {
            // 해당 병원의 처방 시작일 이전 데이터가 있는지 확인
            // beforeBaseMonthRecords에서 동일 병원, 동일 CSO의 데이터가 있는지 확인
            const hasBeforeStartDateData = beforeBaseMonthRecords.some(record => {
              if (!record.client_id || record.review_action === '삭제') return false;
              if (record.client_id !== hospitalId) return false;
              if (record.company_id !== existingCSOId) return false;
              
              // 처방 시작일보다 이전인지 확인
              if (promotionStartDate && record.prescription_month) {
                const prescriptionDate = new Date(record.prescription_month + '-01');
                return prescriptionDate < promotionStartDate;
              }
              // 처방 시작일이 없으면 처방월이 baseMonth보다 이전인지 확인
              if (!promotionStartDate && record.prescription_month) {
                return record.prescription_month < baseMonth;
              }
              return false;
            });
            
            // 처방 시작일 이전 데이터가 있으면 CSO ID를 null로 처리
            if (hasBeforeStartDateData) {
              const { error: updateError } = await supabase
                .from('promotion_product_hospital_performance')
                .update({ 
                  first_performance_cso_id: null,
                  updated_by: user.id
                })
                .eq('promotion_product_id', promotionProduct.id)
                .eq('hospital_id', hospitalId);
              
              if (updateError) {
                console.error(`기존 데이터 CSO ID null 처리 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
                totalErrors++;
              } else {
                totalUpdated++;
                console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 처방 시작일 이전 데이터 발견으로 CSO ID null 처리`);
                // existingDataMap도 업데이트
                const existingDataItem = existingDataMap.get(hospitalId);
                if (existingDataItem) {
                  existingDataMap.set(hospitalId, {
                    ...existingDataItem,
                    first_performance_cso_id: null
                  });
                }
              }
            }
          }
        }

        for (const record of beforeBaseMonthRecords) {
          if (!record.client_id) continue;
          // 삭제 상태인 데이터는 제외
          if (record.review_action === '삭제') continue;

          const hospitalId = record.client_id;
          
          // 기존 데이터가 있는 경우, 프로모션 전 금액 누적
          if (existingHospitalIds.has(hospitalId)) {
            const existing = existingDataMap.get(hospitalId);
            
            // 기존 데이터에 CSO ID가 있고, 처방 시작일 이전 데이터가 발견되면 CSO ID를 null로 처리
            if (existing && existing.first_performance_cso_id !== null) {
              // 처방 시작일보다 이전인지 확인
              let isBeforeStartDate = false;
              if (promotionStartDate && record.prescription_month) {
                const prescriptionDate = new Date(record.prescription_month + '-01');
                isBeforeStartDate = prescriptionDate < promotionStartDate;
              } else if (!promotionStartDate && record.prescription_month) {
                // 처방 시작일이 없으면 처방월이 baseMonth보다 이전인지 확인
                isBeforeStartDate = record.prescription_month < baseMonth;
              }
              
              // 동일 CSO인지 확인
              const isSameCSO = record.company_id === existing.first_performance_cso_id;
              
              // 처방 시작일 이전 데이터이고 동일 CSO이면 CSO ID를 null로 처리
              if (isBeforeStartDate && isSameCSO) {
                const { error: updateError } = await supabase
                  .from('promotion_product_hospital_performance')
                  .update({ 
                    first_performance_cso_id: null,
                    updated_by: user.id
                  })
                  .eq('promotion_product_id', promotionProduct.id)
                  .eq('hospital_id', hospitalId);
                
                if (updateError) {
                  console.error(`처방 시작일 이전 데이터 발견으로 CSO ID null 처리 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
                  totalErrors++;
                } else {
                  totalUpdated++;
                  console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 처방 시작일 이전 데이터 발견으로 CSO ID null 처리 (처방월: ${record.prescription_month})`);
                  // existingDataMap도 업데이트
                  existingDataMap.set(hospitalId, {
                    ...existing,
                    first_performance_cso_id: null
                  });
                }
              }
            }
            
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            
            const currentAmount = existingBeforeAmountMap.get(hospitalId) || 0;
            existingBeforeAmountMap.set(hospitalId, currentAmount + prescriptionAmount);
            continue;
          }

          if (!hospitalDataMap.has(hospitalId)) {
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;

            hospitalDataMap.set(hospitalId, {
              hospital_id: hospitalId,
              first_performance_cso_id: null, // 기준일 이전 데이터는 null
              first_performance_month: record.prescription_month || null,
              total_performance_amount: prescriptionAmount,
              before_promotion_amount: prescriptionAmount,
              after_promotion_amount: 0
            });
            console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 기준일 이전 데이터 추가:`, {
              prescription_month: record.prescription_month,
              amount: prescriptionAmount
            });
          } else {
            const existing = hospitalDataMap.get(hospitalId);
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            // 기준일 이전 데이터 중 가장 이른 처방월을 first_performance_month로 설정
            if (record.prescription_month && (!existing.first_performance_month || record.prescription_month < existing.first_performance_month)) {
              existing.first_performance_month = record.prescription_month;
            }
            existing.total_performance_amount = (existing.total_performance_amount || 0) + prescriptionAmount;
            existing.before_promotion_amount = (existing.before_promotion_amount || 0) + prescriptionAmount;
          }
        }

        // 그 다음 기준일 이후 프로모션 기간 내 데이터 처리 (덮어쓰지 않음)
        for (const record of afterBaseMonthRecords) {
          if (!record.client_id) continue;
          // 삭제 상태인 데이터는 제외
          if (record.review_action === '삭제') continue;

          const hospitalId = record.client_id;
          
          // 기존 데이터가 있는 경우, 프로모션 후 금액 누적
          if (existingHospitalIds.has(hospitalId)) {
            const existing = existingDataMap.get(hospitalId);
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            
            const currentAmount = existingAfterAmountMap.get(hospitalId) || 0;
            existingAfterAmountMap.set(hospitalId, currentAmount + prescriptionAmount);
            
            // 기준일 이후 데이터인데 first_performance_cso_id가 null이면 CSO ID로 수정 (나중에 일괄 업데이트)
            if (existing && existing.first_performance_month && existing.first_performance_month >= baseMonth) {
              if (existing.first_performance_cso_id === null) {
                existing.first_performance_cso_id = record.company_id;
              }
            }
            continue;
          }

          // 이미 기준일 이전 데이터로 입력된 경우, 기준일 이후 데이터가 와도 CSO ID는 업데이트하지 않음 (기준일 이전 데이터는 CSO가 null이어야 함)
          if (hospitalDataMap.has(hospitalId)) {
            const existing = hospitalDataMap.get(hospitalId);
            // 기준일 이전 데이터인 경우 (first_performance_month < baseMonth) CSO ID는 null로 유지
            // 기준일 이후 데이터인 경우에만 CSO ID 업데이트
            if (existing.first_performance_month && existing.first_performance_month >= baseMonth) {
              // 기준일 이후 데이터인데 first_performance_cso_id가 null이면 CSO ID 업데이트
              if (existing.first_performance_cso_id === null) {
                existing.first_performance_cso_id = record.company_id;
              }
            }
            // 총 금액은 누적
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            existing.total_performance_amount = (existing.total_performance_amount || 0) + prescriptionAmount;
            // 기준일 이후 데이터이므로 after_promotion_amount에 추가
            if (existing.first_performance_month && existing.first_performance_month >= baseMonth) {
              existing.after_promotion_amount = (existing.after_promotion_amount || 0) + prescriptionAmount;
            } else {
              // 기준일 이전 데이터가 먼저 있었는데 기준일 이후 데이터가 추가된 경우
              existing.after_promotion_amount = (existing.after_promotion_amount || 0) + prescriptionAmount;
            }
          } else {
            // 기준일 이전 데이터가 없는 경우에만 새로 추가
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;

            hospitalDataMap.set(hospitalId, {
              hospital_id: hospitalId,
              first_performance_cso_id: record.company_id,
              first_performance_month: record.prescription_month || null,
              total_performance_amount: prescriptionAmount,
              before_promotion_amount: 0,
              after_promotion_amount: prescriptionAmount
            });
            console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 기준일 이후 데이터 추가:`, {
              prescription_month: record.prescription_month,
              company_id: record.company_id,
              amount: prescriptionAmount
            });
          }
        }
        
        // 종료일 이후 데이터 처리 (프로모션 적용 대상 아님, total에만 포함)
        for (const record of afterEndMonthRecords) {
          if (!record.client_id) continue;
          // 삭제 상태인 데이터는 제외
          if (record.review_action === '삭제') continue;

          const hospitalId = record.client_id;
          
          // 기존 데이터가 있는 경우, total만 업데이트 (프로모션 금액에는 포함하지 않음)
          if (existingHospitalIds.has(hospitalId)) {
            const existing = existingDataMap.get(hospitalId);
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            
            // total_performance_amount만 업데이트 (before/after는 업데이트하지 않음)
            const existingTotal = existing?.total_performance_amount || 0;
            const newTotalAmount = existingTotal + prescriptionAmount;
            
            const updateData = {
              total_performance_amount: newTotalAmount,
              updated_by: user.id
            };
            
            const { error: updateError } = await supabase
              .from('promotion_product_hospital_performance')
              .update(updateData)
              .eq('promotion_product_id', promotionProduct.id)
              .eq('hospital_id', hospitalId);
            
            if (updateError) {
              console.error(`종료일 이후 데이터 업데이트 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
              totalErrors++;
            } else {
              totalUpdated++;
            }
            continue;
          }

          // 신규 데이터인 경우, total에만 포함
          if (hospitalDataMap.has(hospitalId)) {
            const existing = hospitalDataMap.get(hospitalId);
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;
            // total만 누적 (before/after는 업데이트하지 않음)
            existing.total_performance_amount = (existing.total_performance_amount || 0) + prescriptionAmount;
          } else {
            // 신규 병원인 경우에도 total에만 포함
            const productPrice = Number(record.products?.price) || 0;
            const prescriptionQty = Number(record.prescription_qty) || 0;
            const prescriptionAmount = prescriptionQty * productPrice;

            hospitalDataMap.set(hospitalId, {
              hospital_id: hospitalId,
              first_performance_cso_id: null, // 종료일 이후는 프로모션 적용 대상 아님
              first_performance_month: record.prescription_month || null,
              total_performance_amount: prescriptionAmount,
              before_promotion_amount: 0,
              after_promotion_amount: 0 // 종료일 이후는 프로모션 금액에 포함하지 않음
            });
            console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 종료일 이후 데이터 추가:`, {
              prescription_month: record.prescription_month,
              amount: prescriptionAmount
            });
          }
        }
        
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - hospitalDataMap 최종 크기:`, hospitalDataMap.size);
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - hospitalDataMap 내용:`, Array.from(hospitalDataMap.entries()));

        // 기존 데이터의 프로모션 전/후 금액 업데이트
        for (const [hospitalId, beforeAmount] of existingBeforeAmountMap.entries()) {
          const existing = existingDataMap.get(hospitalId);
          const afterAmount = existingAfterAmountMap.get(hospitalId) || 0;
          const existingBefore = existing?.before_promotion_amount || 0;
          const existingAfter = existing?.after_promotion_amount || 0;
          
          const newBeforeAmount = existingBefore + beforeAmount;
          const newAfterAmount = existingAfter + afterAmount;
          const newTotalAmount = newBeforeAmount + newAfterAmount;
          
          const updateData = {
            before_promotion_amount: newBeforeAmount,
            after_promotion_amount: newAfterAmount,
            total_performance_amount: newTotalAmount,
            updated_by: user.id
          };
          
          const { error: updateError } = await supabase
            .from('promotion_product_hospital_performance')
            .update(updateData)
            .eq('promotion_product_id', promotionProduct.id)
            .eq('hospital_id', hospitalId);
          
          if (updateError) {
            console.error(`기존 데이터 금액 업데이트 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
            totalErrors++;
          } else {
            totalUpdated++;
          }
        }
        
        // 기존 데이터 중 새로운 실적 데이터가 없지만 before/after가 0인 경우 재계산
        for (const hospitalId of existingHospitalIds) {
          if (!existingBeforeAmountMap.has(hospitalId) && !existingAfterAmountMap.has(hospitalId)) {
            const existing = existingDataMap.get(hospitalId);
            const existingBefore = existing?.before_promotion_amount || 0;
            const existingAfter = existing?.after_promotion_amount || 0;
            const existingTotal = existing?.total_performance_amount || 0;
            
            // 기존 before/after가 모두 0이지만 total이 있는 경우, 실제 실적 데이터를 기반으로 재계산
            if ((existingBefore === 0 && existingAfter === 0) && existingTotal > 0) {
              // 실제 실적 데이터를 기반으로 재계산
              let recalculatedBefore = 0;
              let recalculatedAfter = 0;
              
              // 기준일 이전 데이터 계산
              for (const record of beforeBaseMonthRecords) {
                if (record.client_id === hospitalId && record.review_action !== '삭제') {
                  const productPrice = Number(record.products?.price) || 0;
                  const prescriptionQty = Number(record.prescription_qty) || 0;
                  recalculatedBefore += productPrice * prescriptionQty;
                }
              }
              
              // 기준일 이후 데이터 계산
              for (const record of afterBaseMonthRecords) {
                if (record.client_id === hospitalId && record.review_action !== '삭제') {
                  const productPrice = Number(record.products?.price) || 0;
                  const prescriptionQty = Number(record.prescription_qty) || 0;
                  recalculatedAfter += productPrice * prescriptionQty;
                }
              }
              
              // 재계산된 금액으로 업데이트 (기존 total은 무시하고 실제 계산된 값 사용)
              const updateData = {
                before_promotion_amount: recalculatedBefore,
                after_promotion_amount: recalculatedAfter,
                total_performance_amount: recalculatedBefore + recalculatedAfter,
                updated_by: user.id
              };
              
              const { error: updateError } = await supabase
                .from('promotion_product_hospital_performance')
                .update(updateData)
                .eq('promotion_product_id', promotionProduct.id)
                .eq('hospital_id', hospitalId);
              
              if (updateError) {
                console.error(`기존 데이터 재계산 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
                totalErrors++;
              } else {
                totalUpdated++;
                console.log(`[통계 확인] 제품 ${promotionProduct.product_name} - 병원 ${hospitalId} 재계산 완료:`, {
                  before: recalculatedBefore,
                  after: recalculatedAfter,
                  total: recalculatedBefore + recalculatedAfter,
                  기존_total: existingTotal
                });
              }
            }
          }
        }
        
        // 기존 데이터 중 기준일 이후인데 CSO ID가 null인 경우 업데이트
        for (const [hospitalId, afterAmount] of existingAfterAmountMap.entries()) {
          const existing = existingDataMap.get(hospitalId);
          if (existing && existing.first_performance_month && existing.first_performance_month >= baseMonth) {
            if (existing.first_performance_cso_id === null) {
              // 기준일 이후 데이터 중 첫 번째 레코드의 company_id를 찾아서 업데이트
              const firstAfterRecord = afterBaseMonthRecords.find(r => r.client_id === hospitalId);
              if (firstAfterRecord && firstAfterRecord.company_id) {
                const { error: updateError } = await supabase
                  .from('promotion_product_hospital_performance')
                  .update({ 
                    first_performance_cso_id: firstAfterRecord.company_id,
                    updated_by: user.id
                  })
                  .eq('promotion_product_id', promotionProduct.id)
                  .eq('hospital_id', hospitalId);
                
                if (updateError) {
                  console.error(`기존 데이터 CSO ID 업데이트 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
                  totalErrors++;
                } else {
                  totalUpdated++;
                }
              }
            }
          }
        }

        statisticsStatus.value = `데이터 저장 중... (${i + 1}/${promotionProducts.value.length})`;

        // 6. promotion_product_hospital_performance 테이블에 데이터 삽입
        const performanceData = Array.from(hospitalDataMap.values()).map(item => ({
          promotion_product_id: promotionProduct.id,
          hospital_id: item.hospital_id,
          has_performance: true,
          first_performance_cso_id: item.first_performance_cso_id,
          first_performance_month: item.first_performance_month || null,
          total_performance_amount: item.total_performance_amount || 0,
          before_promotion_amount: item.before_promotion_amount || 0,
          after_promotion_amount: item.after_promotion_amount || 0,
          created_by: user.id,
          updated_by: user.id
        }));

        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 저장할 병원 데이터:`, performanceData.length, '건');
        console.log(`[통계 확인] 제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode}) - 병원 ID 목록:`, performanceData.map(d => d.hospital_id));

        if (performanceData.length > 0) {
          // 배치로 삽입
          const insertBatchSize = 100;
          for (let j = 0; j < performanceData.length; j += insertBatchSize) {
            const batch = performanceData.slice(j, j + insertBatchSize);
            
            const { error: insertError } = await supabase
              .from('promotion_product_hospital_performance')
              .insert(batch);

            if (insertError) {
              console.error(`데이터 삽입 오류 (제품 ${promotionProduct.product_name}, 배치 ${Math.floor(j / insertBatchSize) + 1}):`, insertError);
              totalErrors++;
            } else {
              totalUpdated += batch.length;
            }
          }
        }

        totalSkipped += existingHospitalIds.size;
        totalProcessed++;
        console.log(`제품 ${promotionProduct.product_name}: 신규 ${performanceData.length}개, 기존 ${existingHospitalIds.size}개 스킵`);
      } catch (error) {
        console.error(`제품 ${promotionProduct.product_name} 처리 오류:`, error);
        totalErrors++;
      }
    }

    statisticsProgress.value = 100;
    statisticsStatus.value = `완료! 처리된 제품: ${totalProcessed}개, 신규 입력: ${totalUpdated}개, 기존 데이터 스킵: ${totalSkipped}개, 오류: ${totalErrors}개`;
    statisticsCurrentProduct.value = '';
    statisticsCompleted.value = true;
    
    // 통계 확인 후 병원 실적 개수 다시 조회
    statisticsStatus.value = '병원 실적 개수 갱신 중...';
    await fetchHospitalCounts();
    statisticsStatus.value = `완료! 처리된 제품: ${totalProcessed}개, 신규 입력: ${totalUpdated}개, 기존 데이터 스킵: ${totalSkipped}개, 오류: ${totalErrors}개`;
    
    // 마지막 업데이트 시간을 DB에 저장
    await saveLastUpdateTime();
  } catch (error) {
    console.error('통계 확인 오류:', error);
    statisticsStatus.value = `오류 발생: ${error.message || error}`;
    statisticsCompleted.value = true;
    alert('데이터 업데이트 중 오류가 발생했습니다: ' + (error.message || error));
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
  align-items: center;
}

.last-update-time {
  color: #6c757d;
  font-size: 0.9em;
  margin-right: 16px;
  font-weight: 500;
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

/* 통계 확인 모달 그래픽 요소 */
.progress-container {
  position: relative;
  margin-bottom: 8px;
}

.progress-bar-wrapper {
  width: 100%;
  height: 28px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 50%, #004085 100%);
  border-radius: 14px;
  position: relative;
  transition: width 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
  overflow: hidden;
}

.progress-bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

.progress-bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-steps {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: space-between;
}

.progress-step {
  flex: 1;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.progress-step.active {
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
  transform: scaleY(1.5);
}

.info-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left-color: #007bff;
}

.status-card {
  background: linear-gradient(135deg, #e7f3ff 0%, #d1ecf1 100%);
  border-left-color: #17a2b8;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e9ecef;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>

