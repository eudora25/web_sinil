<template>
  <div class="board_640">
    <div class="form-title">제품 상세</div>
    <form class="form-grid">
      <div class="form-group">
        <label>기준월</label>
        <input :value="product.base_month || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>제품명</label>
        <input :value="product.product_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>보험코드</label>
        <input :value="product.insurance_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>약가</label>
        <input :value="product.price || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율(%)</label>
        <input :value="getCommissionRate()" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="product.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(product.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="product.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(product.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="product.updated_by_name || '-'" readonly disabled />
      </div>
      <div class="button-area">
        <button class="btn-list" type="button" @click="goList">목록</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const product = ref({});
const userCommissionGrade = ref('A'); // 사용자 등급 (기본값 A)

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

// 사용자 등급에 따른 수수료율 반환
function getCommissionRate() {
  let rate = 0;
  if (userCommissionGrade.value === 'A') {
    rate = product.value.commission_rate_a || 0;
  } else if (userCommissionGrade.value === 'B') {
    rate = product.value.commission_rate_b || 0;
  } else {
    // C 등급이나 기타 등급의 경우 기본적으로 A 등급 수수료율 표시
    rate = product.value.commission_rate_a || 0;
  }
  
  return rate ? (rate * 100).toFixed(1) : '-';
}

// 사용자 등급 정보 가져오기
const fetchUserCommissionGrade = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const { data: company, error } = await supabase
      .from('companies')
      .select('default_commission_grade')
      .eq('user_id', session.user.id)
      .single();
      
    if (!error && company) {
      userCommissionGrade.value = company.default_commission_grade || 'A';
    }
  } catch (err) {
    console.error('사용자 등급 조회 오류:', err);
    userCommissionGrade.value = 'A'; // 오류 시 기본값
  }
};

onMounted(async () => {
  await fetchUserCommissionGrade();
  
  const { data, error } = await supabase
    .from('products')
    .select('*, created_at, created_by, updated_at, updated_by')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    product.value = data;
    
    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();
        
        if (createdByCompany?.company_name) {
          product.value.created_by_name = createdByCompany.company_name;
        } else {
          product.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        product.value.created_by_name = data.created_by; // UUID 표시
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
          product.value.updated_by_name = updatedByCompany.company_name;
        } else {
          product.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        product.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
  }
});

function goList() {
  router.push('/products');
}
</script>
