<template>
  <div class="admin-promotion-product-hospital-performance-view page-container">
    <div class="page-header-title-area">
      <div>
        <div class="product-name-display">{{ productName || '제품명 로딩 중...' }}</div>
        <div class="header-title">병원 실적</div>
      </div>
      <button class="btn-back" @click="goBack">← 목록으로</button>
    </div>

    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ hospitalPerformanceList.length }} 건
        </div>
      </div>

      <DataTable
        :value="hospitalPerformanceList"
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
          <div v-if="!loading">등록된 병원 실적이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: '5%' }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '25%' }" :sortable="true"></Column>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            {{ slotProps.data.business_registration_number || '-' }}
          </template>
        </Column>
        <Column field="first_performance_month" header="최초 실적 처방월" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
          <template #body="slotProps">
            {{ slotProps.data.first_performance_month || '-' }}
          </template>
        </Column>
        <Column field="cso_name" header="적용 업체" :headerStyle="{ width: '15%' }" :sortable="true">
          <template #body="slotProps">
            {{ slotProps.data.cso_name || '-' }}
          </template>
        </Column>
        <Column field="after_promotion_amount" header="프로모션 실적 금액" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
          <template #body="slotProps">
            {{ slotProps.data.cso_name ? formatNumber(slotProps.data.after_promotion_amount) : '-' }}
          </template>
        </Column>
        <Column header="생성 일시" :headerStyle="{ width: '13%' }" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>

        <ColumnGroup type="footer">
          <Row>
            <Column footer="합계" :colspan="5" footerClass="footer-cell" footerStyle="text-align:center !important;" />
            <Column :footer="formatNumber(totalPromotionAmount)" footerClass="footer-cell" footerStyle="text-align:right !important; font-weight: bold; color: #007bff;" />
            <Column footer="" footerClass="footer-cell" />
          </Row>
        </ColumnGroup>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const hospitalPerformanceList = ref([]);
const productName = ref('');
const currentPageFirstIndex = ref(0);

// 합계 계산 (프로모션 실적 금액 - 적용 업체가 있는 경우만)
const totalPromotionAmount = computed(() => {
  return hospitalPerformanceList.value.reduce((sum, item) => {
    // 적용 업체가 있는 경우만 합계에 포함
    if (item.cso_name) {
      return sum + (Number(item.after_promotion_amount) || 0);
    }
    return sum;
  }, 0);
});

// 병원 실적 데이터 조회
async function fetchHospitalPerformance() {
  loading.value = true;
  try {
    const promotionProductId = route.params.id;

    // 먼저 제품 정보 조회
    const { data: productData, error: productError } = await supabase
      .from('promotion_product_list')
      .select('product_name')
      .eq('id', promotionProductId)
      .single();

    if (productError) throw productError;
    if (productData) {
      productName.value = productData.product_name;
    }

    // 병원 실적 데이터 조회
    const { data, error } = await supabase
      .from('promotion_product_hospital_performance')
      .select(`
        id,
        hospital_id,
        has_performance,
        first_performance_cso_id,
        first_performance_month,
        total_performance_amount,
        before_promotion_amount,
        after_promotion_amount,
        created_at,
        updated_at,
        clients:hospital_id (
          id,
          name,
          business_registration_number
        ),
        companies:first_performance_cso_id (
          id,
          company_name
        )
      `)
      .eq('promotion_product_id', promotionProductId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 데이터 변환 (관계 데이터를 평탄화)
    hospitalPerformanceList.value = (data || []).map(item => ({
      id: item.id,
      hospital_id: item.hospital_id,
      hospital_name: item.clients?.name || '-',
      business_registration_number: item.clients?.business_registration_number || null,
      has_performance: item.has_performance || false,
      first_performance_cso_id: item.first_performance_cso_id,
      first_performance_month: item.first_performance_month || null,
      total_performance_amount: item.total_performance_amount || 0,
      before_promotion_amount: item.before_promotion_amount || 0,
      after_promotion_amount: item.after_promotion_amount || 0,
      cso_name: item.companies?.company_name || null,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('병원 실적 조회 오류:', error);
    alert('병원 실적 조회 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    loading.value = false;
  }
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

// 숫자 포맷팅 (금액)
function formatNumber(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
}

// 목록으로 돌아가기
function goBack() {
  router.push('/admin/products/promotion');
}

onMounted(() => {
  fetchHospitalPerformance();
});
</script>

<style scoped>
.admin-promotion-product-hospital-performance-view {
  padding: 20px;
}

.page-header-title-area {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-name-display {
  font-size: 20px;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 8px;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.btn-back {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background-color: #5a6268;
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

:deep(.footer-cell) {
  font-weight: bold;
  background-color: #f8f9fa;
  border-top: 2px solid #dee2e6;
}
</style>

