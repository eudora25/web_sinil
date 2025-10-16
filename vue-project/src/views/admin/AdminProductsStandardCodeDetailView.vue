<template>
  <div class="board_640">
    <div class="form-title">표준코드 상세</div>
    <div class="form-grid">
      <div class="form-group">
        <label>제품명</label>
        <input :value="standardCode.product_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>보험코드</label>
        <input :value="standardCode.insurance_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>표준코드</label>
        <input :value="standardCode.standard_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>단위/포장형태</label>
        <input :value="standardCode.unit_packaging_desc || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>단위수량</label>
        <input :value="standardCode.unit_quantity || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>상태</label>
        <input :value="standardCode.status === 'active' ? '활성' : (standardCode.status === 'inactive' ? '비활성' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="standardCode.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(standardCode.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="standardCode.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(standardCode.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="standardCode.updated_by_name || '-'" readonly disabled />
      </div>
      <div class="button-area">
        <button class="btn-delete" @click="handleDelete">삭제</button>
        <button class="btn-edit" @click="goEdit">수정</button>
        <button class="btn-list" @click="goList">목록</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const standardCode = ref({});

// KST 날짜 포맷 함수
function formatKST(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  // UTC 시간에 9시간을 더해서 KST 계산
  const kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  
  const yyyy = kstTime.getUTCFullYear();
  const mm = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstTime.getUTCDate()).padStart(2, '0');
  const hh = kstTime.getUTCHours();
  const min = String(kstTime.getUTCMinutes()).padStart(2, '0');
  const sec = String(kstTime.getUTCSeconds()).padStart(2, '0');
  
  // 오전/오후 구분
  const ampm = hh >= 12 ? '오후' : '오전';
  const displayHour = hh >= 12 ? hh - 12 : hh;
  const displayHourStr = displayHour === 0 ? '12' : String(displayHour).padStart(2, '0');
  
  return `${yyyy}. ${mm}. ${dd}. ${ampm} ${displayHourStr}:${min}:${sec}`;
}

onMounted(async () => {
  // console.log('🔍 표준코드 상세 로드 시작 - ID:', route.params.id);
  
  const { data, error } = await supabase
    .from('products_standard_code')
    .select(`
      *,
      created_at, created_by, updated_at, updated_by
    `)
    .eq('id', route.params.id)
    .single();
    
  if (error) {
    console.error('❌ 표준코드 데이터 로드 실패:', error);
    alert('데이터를 불러오는데 실패했습니다.');
    return;
  }
  
  if (!data) {
    console.error('❌ 표준코드 데이터가 없습니다.');
    alert('해당 표준코드를 찾을 수 없습니다.');
    return;
  }
  
  // console.log('✅ 표준코드 데이터 로드 성공:', data);
  
  // 표준코드 데이터 설정
  standardCode.value = {
    ...data,
    product_name: '조회 중...' // 임시 설정
  };
  
  // insurance_code를 이용해서 products 테이블에서 제품명 조회
  if (data.insurance_code) {
    // console.log('🔍 제품명 조회 시작 - insurance_code:', data.insurance_code);
    try {
      const { data: productsData, error: productError } = await supabase
        .from('products')
        .select('product_name, created_at')
        .eq('insurance_code', data.insurance_code)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // console.log('🔍 제품명 조회 결과:', { productsData, productError });
      
      if (productError) {
        console.error('제품명 조회 에러:', productError);
        standardCode.value.product_name = '제품명 조회 실패';
      } else if (productsData && productsData.length > 0) {
        const productData = productsData[0]; // 첫 번째 제품 사용
        standardCode.value.product_name = productData.product_name;
        // console.log('✅ 제품명 조회 성공:', productData.product_name);
        if (productsData.length > 1) {
          // console.log(`⚠️ 보험코드 ${data.insurance_code}에 ${productsData.length}개의 제품이 있습니다. 첫 번째 제품을 사용합니다.`);
        }
      } else {
        standardCode.value.product_name = '제품 목록 등록 필요';
        // console.log('⚠️ 제품명 없음 - insurance_code:', data.insurance_code);
      }
    } catch (err) {
      console.error('제품명 조회 실패:', err);
      standardCode.value.product_name = '제품명 조회 실패';
    }
  }
    
  // 등록자 정보 - companies 테이블에서 company_name 조회
  if (data.created_by) {
    try {
      const { data: createdByCompany } = await supabase
        .from('companies')
        .select('company_name')
        .eq('user_id', data.created_by)
        .single();
      
      if (createdByCompany?.company_name) {
        standardCode.value.created_by_name = createdByCompany.company_name;
      } else {
        standardCode.value.created_by_name = data.created_by; // UUID 표시
      }
    } catch (err) {
      console.error('등록자 정보 조회 실패:', err);
      standardCode.value.created_by_name = data.created_by; // UUID 표시
    }
  }
  
  // 수정자 정보 - companies 테이블에서 company_name 조회
  if (data.updated_by) {
    try {
      const { data: updatedByCompany } = await supabase
        .from('companies')
        .select('company_name')
        .eq('user_id', data.updated_by)
        .single();
      
      if (updatedByCompany?.company_name) {
        standardCode.value.updated_by_name = updatedByCompany.company_name;
      } else {
        standardCode.value.updated_by_name = data.updated_by; // UUID 표시
      }
    } catch (err) {
      console.error('수정자 정보 조회 실패:', err);
      standardCode.value.updated_by_name = data.updated_by; // UUID 표시
    }
  }
});

function goEdit() {
  router.push(`/admin/products-standard-code/${route.params.id}/edit`);
}

function goList() {
  router.push('/admin/products-standard-code');
}

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('products_standard_code').delete().eq('id', route.params.id);
  if (!error) {
    alert('삭제되었습니다.');
    router.push('/admin/products-standard-code');
  } else {
    alert('삭제 실패: ' + error.message);
  }
}
</script> 