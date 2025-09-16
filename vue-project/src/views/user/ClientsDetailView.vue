<template>
  <div class="board_640">
    <div class="form-title">병의원 상세</div>
    <form class="form-grid">
      <div class="form-group">
        <label>병의원코드</label>
        <input :value="client.client_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>병의원명</label>
        <input :value="client.name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업자등록번호</label>
        <input :value="formatBusinessNumber(client.business_registration_number)" readonly disabled />
      </div>
      <div class="form-group">
        <label>원장명</label>
        <input :value="client.owner_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>주소</label>
        <input :value="client.address || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="client.remarks || '-'" readonly disabled />
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
const client = ref({});

onMounted(async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    client.value = data;
  }
});

function goList() {
  // 이전 화면이 실적 등록인지 확인
  if (route.query?.from === 'performance-register') {
    router.push('/performance/register');
  } else {
    router.push('/clients');
  }
}

// 사업자번호 형식 변환 함수
function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '-';
  
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 10자리가 아니면 원본 반환
  if (numbers.length !== 10) return businessNumber;
  
  // 형식 변환: ###-##-#####
  return numbers.substring(0, 3) + '-' + numbers.substring(3, 5) + '-' + numbers.substring(5);
}
</script>