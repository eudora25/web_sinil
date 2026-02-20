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
        <div class="action-buttons-group">
          <!-- <button class="btn-exclude" @click="openExcludedHospitalsModal">
            제외 병원 관리
          </button> -->
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
        :rowClass="getRowClass"
      >
        <template #empty>
          <div v-if="!loading">등록된 병원 실적이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: '5%' }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '25%' }" :sortable="true">
          <template #body="slotProps">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>{{ slotProps.data.hospital_name }}</span>
              <span v-if="slotProps.data.isExcluded" class="excluded-badge" title="프로모션 제외 병원">
                제외
              </span>
            </div>
          </template>
        </Column>
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

    <!-- 제외 병원 관리 모달 -->
    <Dialog 
      v-model:visible="showExcludedHospitalsModal" 
      header="제외 병원 관리" 
      :modal="true"
      :style="{ width: '800px', height: '650px' }"
      @hide="closeExcludedHospitalsModal"
      class="excluded-hospitals-management-modal"
    >
      <div class="excluded-hospitals-modal-content">
        <!-- 헤더 섹션 -->
        <div class="management-header">
          <div class="management-header-info">
            <div class="management-header-icon">
              <i class="pi pi-ban"></i>
            </div>
            <div class="management-header-text">
              <h3 class="management-title">제외 병원 목록</h3>
              <p class="management-subtitle">프로모션에서 제외된 병원을 관리합니다</p>
            </div>
          </div>
          <div class="product-info-badge">
            <i class="pi pi-box"></i>
            <span class="product-name-text">{{ productName }}</span>
            <span class="product-code-text">({{ insuranceCode }})</span>
          </div>
          <div class="management-count-badge">
            <span class="count-number">{{ excludedHospitalsList.length }}</span>
            <span class="count-label">건</span>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="management-actions">
          <button class="btn-add-exclude-enhanced" @click="openAddExcludedHospitalModal">
            <i class="pi pi-plus-circle"></i>
            <span>제외 병원 추가</span>
          </button>
        </div>

        <!-- 제외 병원 목록 -->
        <div class="excluded-hospitals-list-container">
          <DataTable
            :value="excludedHospitalsList"
            :loading="loadingExcluded"
            paginator
            :rows="10"
            scrollable
            scrollHeight="400px"
            class="excluded-hospitals-table"
            :rowClass="getExcludedRowClass"
          >
            <template #empty>
              <div class="empty-excluded-list">
                <div class="empty-icon">
                  <i class="pi pi-inbox"></i>
                </div>
                <div class="empty-text">제외된 병원이 없습니다</div>
                <div class="empty-hint">위의 "제외 병원 추가" 버튼을 클릭하여 병원을 추가하세요</div>
              </div>
            </template>
            <Column header="No" :headerStyle="{ width: '8%', textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                <span class="row-number">{{ slotProps.index + 1 }}</span>
              </template>
            </Column>
            <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '45%' }">
              <template #body="slotProps">
                <div class="hospital-name-cell">
                  <i class="pi pi-building"></i>
                  <span>{{ slotProps.data.hospital_name }}</span>
                </div>
              </template>
            </Column>
            <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '30%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                <span class="business-number">{{ slotProps.data.business_registration_number || '-' }}</span>
              </template>
            </Column>
            <Column header="작업" :headerStyle="{ width: '17%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                <div style="display: flex; justify-content: center; align-items: center;">
                  <button 
                    class="btn-delete-exclude-enhanced" 
                    @click="removeExcludedHospital(slotProps.data.hospital_id)"
                    :disabled="removingExcluded"
                  >
                    <i class="pi pi-trash"></i>
                    <span>삭제</span>
                  </button>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </Dialog>

    <!-- 제외 병원 추가 모달 -->
    <Dialog 
      v-model:visible="showAddExcludedHospitalModal" 
      header="제외 병원 추가" 
      :modal="true"
      :style="{ width: '800px', height: '700px' }"
      @hide="closeAddExcludedHospitalModal"
      class="excluded-hospital-modal"
    >
      <div class="excluded-hospital-modal-content">
        <!-- 검색 섹션 -->
        <div class="search-section">
          <div class="search-header">
            <div class="search-header-icon">
              <i class="pi pi-search"></i>
            </div>
            <div class="search-header-text">
              <h3 class="search-title">병의원 검색</h3>
              <p class="search-subtitle">병의원명 또는 사업자등록번호로 검색하세요</p>
            </div>
          </div>
          <div class="search-input-wrapper">
            <i class="pi pi-search search-input-icon"></i>
            <InputText 
              v-model="hospitalSearchText" 
              placeholder="예: 서울대학교병원 또는 123-45-67890"
              class="search-input-enhanced"
              @input="searchHospitals"
            />
            <div v-if="hospitalSearchText" class="search-clear" @click="hospitalSearchText = ''; searchResults = []">
              <i class="pi pi-times"></i>
            </div>
          </div>
          <div v-if="searchingHospitals" class="search-loading-enhanced">
            <div class="loading-spinner"></div>
            <span>검색 중...</span>
          </div>
          
          <!-- 전체 제품 적용 체크박스 -->
          <div class="apply-all-products-section">
            <label class="apply-all-checkbox-label">
              <input 
                type="checkbox" 
                v-model="applyToAllProducts"
                class="apply-all-checkbox"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                <i class="pi pi-globe"></i>
                전체 제품 적용
              </span>
            </label>
            <div v-if="applyToAllProducts" class="apply-all-hint">
              선택한 병원이 모든 프로모션 제품에 제외 병원으로 추가됩니다
            </div>
          </div>
        </div>
        
        <!-- 검색 결과 -->
        <div v-if="searchResults.length > 0" class="search-results-enhanced">
          <div class="search-results-header-enhanced">
            <div class="results-count">
              <i class="pi pi-list"></i>
              <span>검색 결과 <strong>{{ searchResults.length }}</strong>건</span>
            </div>
          </div>
          <div class="search-results-list-enhanced">
            <div 
              v-for="(hospital, index) in searchResults" 
              :key="hospital.id"
              class="hospital-card"
              :style="{ animationDelay: `${index * 0.05}s` }"
              @click="addExcludedHospital(hospital.id)"
            >
              <div class="hospital-card-content">
                <div class="hospital-card-icon">
                  <i class="pi pi-building"></i>
                </div>
                <div class="hospital-card-info">
                  <div class="hospital-card-name">{{ hospital.name }}</div>
                  <div class="hospital-card-details">
                    <div class="detail-item">
                      <i class="pi pi-id-card"></i>
                      <span class="detail-label">사업자등록번호</span>
                      <span class="detail-value">{{ hospital.business_registration_number || '미등록' }}</span>
                    </div>
                    <div class="detail-item" v-if="hospital.address">
                      <i class="pi pi-map-marker"></i>
                      <span class="detail-label">주소</span>
                      <span class="detail-value address-value">{{ hospital.address }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="hospital-card-action">
                <div class="action-button">
                  <i class="pi pi-plus"></i>
                  <span>추가</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 검색 결과 없음 -->
        <div v-else-if="hospitalSearchText && !searchingHospitals" class="empty-state no-results">
          <div class="empty-state-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <h3 class="empty-state-title">검색 결과가 없습니다</h3>
          <p class="empty-state-description">다른 검색어로 다시 시도해보세요</p>
          <button class="empty-state-button" @click="hospitalSearchText = ''; searchResults = []">
            검색 초기화
          </button>
        </div>
        
        <!-- 검색 전 안내 -->
        <div v-else-if="!hospitalSearchText" class="empty-state search-hint">
          <div class="empty-state-icon hint-icon">
            <i class="pi pi-search"></i>
          </div>
          <h3 class="empty-state-title">병의원을 검색해주세요</h3>
          <p class="empty-state-description">병의원명 또는 사업자등록번호를 입력하여 검색하세요</p>
          <div class="search-examples">
            <div class="example-item">
              <i class="pi pi-check-circle"></i>
              <span>병의원명: "서울대학교병원"</span>
            </div>
            <div class="example-item">
              <i class="pi pi-check-circle"></i>
              <span>사업자등록번호: "123-45-67890"</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { supabase } from '@/supabase';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotifications();

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const hospitalPerformanceList = ref([]);
const productName = ref('');
const currentPageFirstIndex = ref(0);
const insuranceCode = ref(''); // 표시용으로만 사용
const promotionProductId = ref(null);
const excludedHospitalIds = ref(new Set());

// 제외 병원 관리 관련
const showExcludedHospitalsModal = ref(false);
const showAddExcludedHospitalModal = ref(false);
const excludedHospitalsList = ref([]);
const loadingExcluded = ref(false);
const removingExcluded = ref(false);
const hospitalSearchText = ref('');
const searchResults = ref([]);
const searchingHospitals = ref(false);
const applyToAllProducts = ref(false);

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
    const productIdFromRoute = route.params.id;

    // 먼저 제품 정보 조회
    const { data: productData, error: productError } = await supabase
      .from('promotion_product_list')
      .select('product_name, insurance_code')
      .eq('id', productIdFromRoute)
      .single();

    if (productError) throw productError;
    if (productData) {
      productName.value = productData.product_name;
      insuranceCode.value = productData.insurance_code; // 표시용
      promotionProductId.value = Number(productIdFromRoute);
    }

    // 제외 병원 목록 조회 (데이터가 없어도 에러가 나지 않도록 처리)
    if (promotionProductId.value) {
      try {
        const { data: excludedData, error: excludedError } = await supabase
          .from('promotion_product_excluded_hospitals')
          .select('hospital_id')
          .eq('promotion_product_id', promotionProductId.value);
        
        if (excludedError) {
          // 컬럼이 없거나 다른 에러가 발생해도 빈 Set으로 초기화하여 계속 진행
          console.warn('제외 병원 조회 오류 (무시):', excludedError);
          excludedHospitalIds.value = new Set();
        } else {
          excludedHospitalIds.value = new Set((excludedData || []).map(eh => eh.hospital_id));
        }
      } catch (err) {
        // 예외가 발생해도 빈 Set으로 초기화하여 계속 진행
        console.warn('제외 병원 조회 예외 (무시):', err);
        excludedHospitalIds.value = new Set();
      }
    } else {
      excludedHospitalIds.value = new Set();
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
        clients!hospital_id (
          id,
          name,
          business_registration_number
        ),
        companies!first_performance_cso_id (
          id,
          company_name
        )
      `)
      .eq('promotion_product_id', promotionProductId.value)
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
      updated_at: item.updated_at,
      isExcluded: excludedHospitalIds.value.has(item.hospital_id)
    }));
  } catch (error) {
    console.error('병원 실적 조회 오류:', error);
    showError('병원 실적 조회 중 오류가 발생했습니다: ' + (error.message || error));
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

// Row 클래스 적용 (제외된 병원 구분)
function getRowClass(data) {
  return data.isExcluded ? 'excluded-row' : '';
}

// 제외 병원 관리 테이블 Row 클래스
function getExcludedRowClass() {
  return 'excluded-hospital-row';
}

// 제외 병원 관리 모달 열기
async function openExcludedHospitalsModal() {
  showExcludedHospitalsModal.value = true;
  await fetchExcludedHospitals();
}

// 제외 병원 관리 모달 닫기
function closeExcludedHospitalsModal() {
  showExcludedHospitalsModal.value = false;
  excludedHospitalsList.value = [];
}

// 제외 병원 목록 조회
async function fetchExcludedHospitals() {
  if (!promotionProductId.value) {
    excludedHospitalsList.value = [];
    return;
  }
  
  loadingExcluded.value = true;
  try {
    const { data, error } = await supabase
      .from('promotion_product_excluded_hospitals')
      .select(`
        hospital_id,
        clients!hospital_id (
          id,
          name,
          business_registration_number
        )
      `)
      .eq('promotion_product_id', promotionProductId.value);
    
    if (error) {
      console.error('제외 병원 조회 오류:', error);
      // 에러가 발생해도 빈 배열로 설정하여 계속 진행
      excludedHospitalsList.value = [];
      return;
    }
    
    excludedHospitalsList.value = (data || []).map(item => ({
      hospital_id: item.hospital_id,
      hospital_name: item.clients?.name || '-',
      business_registration_number: item.clients?.business_registration_number || null
    }));
  } catch (error) {
    console.error('제외 병원 조회 오류:', error);
    // 에러가 발생해도 빈 배열로 설정
    excludedHospitalsList.value = [];
  } finally {
    loadingExcluded.value = false;
  }
}

// 제외 병원 추가 모달 열기
function openAddExcludedHospitalModal() {
  showAddExcludedHospitalModal.value = true;
  hospitalSearchText.value = '';
  searchResults.value = [];
}

// 제외 병원 추가 모달 닫기
function closeAddExcludedHospitalModal() {
  showAddExcludedHospitalModal.value = false;
  hospitalSearchText.value = '';
  searchResults.value = [];
  applyToAllProducts.value = false;
}

// 병원 검색
async function searchHospitals() {
  const searchText = hospitalSearchText.value.trim();
  if (!searchText || searchText.length < 2) {
    searchResults.value = [];
    return;
  }
  
  searchingHospitals.value = true;
  try {
    // 병의원명 또는 사업자등록번호로 검색
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, business_registration_number, address')
      .or(`name.ilike.%${searchText}%,business_registration_number.ilike.%${searchText}%`)
      .eq('status', 'active')
      .limit(20);
    
    if (error) throw error;
    
    // 이미 제외된 병원은 제외
    const excludedHospitalIds = new Set(excludedHospitalsList.value.map(eh => eh.hospital_id));
    searchResults.value = (data || []).filter(h => !excludedHospitalIds.has(h.id));
  } catch (error) {
    console.error('병원 검색 오류:', error);
    showError('병원 검색 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    searchingHospitals.value = false;
  }
}

// 제외 병원 추가
async function addExcludedHospital(hospitalId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');
    
    if (applyToAllProducts.value) {
      // 전체 제품에 적용
      // 모든 프로모션 제품의 ID 조회
      const { data: allProducts, error: productsError } = await supabase
        .from('promotion_product_list')
        .select('id');
      
      if (productsError) throw productsError;
      
      if (!allProducts || allProducts.length === 0) {
        showWarning('프로모션 제품이 없습니다.');
        return;
      }
      
      // 모든 제품 ID에 대해 제외 병원 추가
      const productIds = allProducts
        .map(p => p.id)
        .filter(id => id);
      
      const insertData = productIds.map(productId => ({
        promotion_product_id: productId,
        hospital_id: hospitalId,
        created_by: user.id,
        updated_by: user.id
      }));
      
      const { error } = await supabase
        .from('promotion_product_excluded_hospitals')
        .insert(insertData);
      
      if (error) {
        // 일부는 이미 존재할 수 있으므로 무시하고 계속 진행
        if (error.code !== '23505') {
          throw error;
        }
      }
      
      showSuccess(`제외 병원이 전체 ${productIds.length}개 제품에 추가되었습니다.`);
    } else {
      // 현재 제품에만 적용
      if (!promotionProductId.value) {
        showWarning('제품 정보가 없습니다.');
        return;
      }
      
      const { error } = await supabase
        .from('promotion_product_excluded_hospitals')
        .insert({
          promotion_product_id: promotionProductId.value,
          hospital_id: hospitalId,
          created_by: user.id,
          updated_by: user.id
        });
      
      if (error) throw error;
      
      showSuccess('제외 병원이 추가되었습니다.');
      excludedHospitalIds.value.add(hospitalId);
    }
    
    await fetchExcludedHospitals();
    // 병원 실적 목록도 다시 조회하여 isExcluded 플래그 업데이트
    await fetchHospitalPerformance();
    closeAddExcludedHospitalModal();
  } catch (error) {
    console.error('제외 병원 추가 오류:', error);
    if (error.code === '23505') {
      showWarning('이미 제외된 병원입니다.');
    } else {
      showError('제외 병원 추가 중 오류가 발생했습니다: ' + (error.message || error));
    }
  }
}

// 제외 병원 삭제
async function removeExcludedHospital(hospitalId) {
  const confirmed = await showConfirm('이 병원을 제외 목록에서 제거하시겠습니까?', '제외 병원 제거 확인');
  if (!confirmed) {
    return;
  }
  
  if (!promotionProductId.value) {
    showWarning('제품 정보가 없습니다.');
    return;
  }
  
  removingExcluded.value = true;
  try {
    const { error } = await supabase
      .from('promotion_product_excluded_hospitals')
      .delete()
      .eq('promotion_product_id', promotionProductId.value)
      .eq('hospital_id', hospitalId);
    
    if (error) throw error;
    
    showSuccess('제외 병원이 제거되었습니다.');
    excludedHospitalIds.value.delete(hospitalId);
    await fetchExcludedHospitals();
    // 병원 실적 목록도 다시 조회하여 isExcluded 플래그 업데이트
    await fetchHospitalPerformance();
  } catch (error) {
    console.error('제외 병원 삭제 오류:', error);
    showError('제외 병원 삭제 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    removingExcluded.value = false;
  }
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

.action-buttons-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-exclude {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-exclude:hover {
  background-color: #c82333;
}

.btn-add-exclude {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add-exclude:hover {
  background-color: #218838;
}

.btn-delete-exclude {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete-exclude:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-delete-exclude:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}


/* 제외된 병원 row 스타일 */
:deep(.excluded-row) {
  background-color: #fff3cd !important;
}

:deep(.excluded-row:hover) {
  background-color: #ffeaa7 !important;
}

.excluded-badge {
  display: inline-block;
  background-color: #dc3545;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1.2;
}

/* 제외 병원 추가 모달 스타일 */
.excluded-hospital-modal :deep(.p-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.excluded-hospital-modal :deep(.p-dialog-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.excluded-hospital-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%);
  color: white;
  padding: 24px 28px;
  border-bottom: none;
  position: relative;
}

.excluded-hospital-modal :deep(.p-dialog-header)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
}

.excluded-hospital-modal :deep(.p-dialog-header .p-dialog-title) {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.excluded-hospital-modal :deep(.p-dialog-header-icon) {
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.excluded-hospital-modal :deep(.p-dialog-header-icon:hover) {
  background-color: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.excluded-hospital-modal-content {
  padding: 0;
  background: #f8f9fa;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 검색 섹션 */
.search-section {
  background: white;
  padding: 28px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.search-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.search-header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  flex-shrink: 0;
}

.search-header-text {
  flex: 1;
}

.search-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #212529;
  letter-spacing: -0.3px;
}

.search-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.5;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-icon {
  position: absolute;
  left: 16px;
  color: #6c757d;
  font-size: 16px;
  z-index: 1;
  pointer-events: none;
}

.search-input-enhanced {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.search-input-enhanced:focus {
  outline: none;
  border-color: #dc3545;
  background: white;
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e9ecef;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;
}

.search-clear:hover {
  background: #dc3545;
  color: white;
  transform: rotate(90deg);
}

.search-loading-enhanced {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #007bff;
  font-size: 14px;
  font-weight: 500;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e3f2fd;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 검색 결과 */
.search-results-enhanced {
  padding: 24px 28px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.search-results-header-enhanced {
  margin-bottom: 16px;
}

.results-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  font-weight: 600;
}

.results-count i {
  color: #dc3545;
  font-size: 16px;
}

.results-count strong {
  color: #dc3545;
  font-size: 16px;
}

.search-results-list-enhanced {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  min-height: 0;
}

.search-results-list-enhanced::-webkit-scrollbar {
  width: 10px;
}

.search-results-list-enhanced::-webkit-scrollbar-track {
  background: #f1f3f5;
  border-radius: 5px;
}

.search-results-list-enhanced::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 5px;
}

.search-results-list-enhanced::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

.hospital-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slideIn 0.3s ease-out backwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hospital-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #dc3545 0%, #c82333 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.hospital-card:hover {
  border-color: #dc3545;
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(220, 53, 69, 0.15);
}

.hospital-card:hover::before {
  transform: scaleY(1);
}

.hospital-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.hospital-card-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  font-size: 24px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.hospital-card:hover .hospital-card-icon {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #dc3545;
  transform: scale(1.1);
}

.hospital-card-info {
  flex: 1;
  min-width: 0;
}

.hospital-card-name {
  font-size: 16px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 8px;
  line-height: 1.4;
  letter-spacing: -0.3px;
}

.hospital-card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.detail-item i {
  color: #6c757d;
  font-size: 12px;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  color: #495057;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.detail-value.address-value {
  font-family: inherit;
  color: #6c757d;
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.hospital-card-action {
  margin-left: 16px;
  flex-shrink: 0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.hospital-card:hover .action-button {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.action-button i {
  font-size: 14px;
}

/* 빈 상태 */
.empty-state {
  padding: 60px 28px;
  text-align: center;
  background: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 36px;
}

.hint-icon {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  color: #dc3545;
}

.empty-state-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: #212529;
}

.empty-state-description {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
}

.empty-state-button {
  padding: 10px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-state-button:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.search-examples {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
  color: #495057;
  text-align: left;
}

.example-item i {
  color: #28a745;
  font-size: 16px;
  flex-shrink: 0;
}

/* 제외 병원 관리 모달 스타일 */
.excluded-hospitals-management-modal :deep(.p-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.excluded-hospitals-management-modal :deep(.p-dialog-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.excluded-hospitals-management-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%);
  color: white;
  padding: 24px 28px;
  border-bottom: none;
  position: relative;
}

.excluded-hospitals-management-modal :deep(.p-dialog-header)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
}

.excluded-hospitals-management-modal :deep(.p-dialog-header .p-dialog-title) {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.excluded-hospitals-management-modal :deep(.p-dialog-header-icon) {
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.excluded-hospitals-management-modal :deep(.p-dialog-header-icon:hover) {
  background-color: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.excluded-hospitals-modal-content {
  padding: 0;
  background: #f8f9fa;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.management-header {
  background: white;
  padding: 24px 28px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 20px;
}

.management-header-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.management-header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  flex-shrink: 0;
}

.management-header-text {
  flex: 1;
}

.management-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #212529;
  letter-spacing: -0.3px;
}

.management-subtitle {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.5;
}

.product-info-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  font-size: 12px;
  flex: 1;
  white-space: nowrap;
}

.product-info-badge i {
  color: #1976d2;
  font-size: 14px;
}

.product-name-text {
  font-weight: 700;
  color: #1976d2;
}

.product-code-text {
  color: #6c757d;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.management-count-badge {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
  flex-shrink: 0;
}

.count-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.count-label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
}

.management-actions {
  padding: 20px 28px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.btn-add-exclude-enhanced {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.btn-add-exclude-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-add-exclude-enhanced i {
  font-size: 16px;
}

.excluded-hospitals-list-container {
  flex: 1;
  padding: 20px 28px;
  overflow: hidden;
  min-height: 0;
}

.excluded-hospitals-table :deep(.p-datatable-wrapper) {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e9ecef;
  background: white;
}

.excluded-hospitals-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  border-bottom: 2px solid #dee2e6;
}

.excluded-hospitals-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.excluded-hospitals-table :deep(.p-datatable-tbody > tr:hover) {
  background: #fff5f5;
}

.excluded-hospitals-table :deep(.excluded-hospital-row) {
  border-left: 3px solid transparent;
}

.excluded-hospitals-table :deep(.excluded-hospital-row:hover) {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.row-number {
  display: inline-block;
  width: 28px;
  height: 28px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #6c757d;
  font-size: 13px;
}

.hospital-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #212529;
}

.hospital-name-cell i {
  color: #dc3545;
  font-size: 16px;
}

.business-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #495057;
  font-size: 13px;
}

.btn-delete-exclude-enhanced {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(220, 53, 69, 0.2);
}

.btn-delete-exclude-enhanced:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
}

.btn-delete-exclude-enhanced:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-delete-exclude-enhanced i {
  font-size: 14px;
}

.empty-excluded-list {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 36px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.6;
}

/* 전체 제품 적용 체크박스 스타일 */
.apply-all-products-section {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-radius: 10px;
  border: 2px solid #ffcdd2;
}

.apply-all-checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.apply-all-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid #dc3545;
  border-radius: 6px;
  background: white;
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.apply-all-checkbox:checked + .checkbox-custom {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border-color: #dc3545;
}

.apply-all-checkbox:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #dc3545;
}

.checkbox-text i {
  font-size: 16px;
}

.apply-all-hint {
  margin-top: 10px;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.5;
  border-left: 3px solid #dc3545;
}
</style>

