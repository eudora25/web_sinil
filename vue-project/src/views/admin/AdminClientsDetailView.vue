<template>
  <div class="board_640">
    <div class="form-title">병의원 상세</div>
    <div class="form-grid">
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
        <input :value="client.business_registration_number || '-'" readonly disabled />
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
        <label>상태</label>
        <input :value="client.status === 'active' ? '활성' : (client.status === 'inactive' ? '비활성' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="client.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>정산용 비고</label>
        <input :value="client.remarks_settlement || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatDateTime(client.created_at)" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="client.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatDateTime(client.updated_at)" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="client.updated_by_name || '-'" readonly disabled />
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
const client = ref({});

// 날짜/시간 포맷팅 함수
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return new Date(dateTime).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

onMounted(async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', route.params.id)
    .single();
  
  if (!error && data) {
    // 등록자와 수정자의 회사명 가져오기
    const userIds = [...new Set([
      data.created_by,
      data.updated_by
    ].filter(Boolean))];
    
    let companyMap = {};
    if (userIds.length > 0) {
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', userIds);
      
      if (!companyError && companies) {
        companyMap = companies.reduce((acc, company) => {
          acc[company.user_id] = company.company_name;
          return acc;
        }, {});
      }
    }
    
    client.value = {
      ...data,
      created_by_name: data.created_by ? (companyMap[data.created_by] || '관리자') : '-',
      updated_by_name: data.updated_by ? (companyMap[data.updated_by] || '관리자') : '-'
    };
  }
});

function goEdit() {
  // from 쿼리 파라미터가 있으면 함께 전달
  const from = route.query.from;
  if (from) {
    router.push(`/admin/clients/${route.params.id}/edit?from=${from}`);
  } else {
    router.push(`/admin/clients/${route.params.id}/edit`);
  }
}
function goList() {
  // 이전 화면이 관리자 실적 등록인지 확인
  if (route.query.from === 'admin-performance-register') {
    router.push('/admin/performance/register');
  } else if (route.query.from === 'admin-clients-assign-companies') {
    router.push('/admin/clients/assign-companies');
  } else if (route.query.from === 'admin-clients-commission-grades') {
    router.push('/admin/clients/commission-grades');
  } else if (route.query.from === 'admin-clients-assign-pharmacies') {
    router.push('/admin/clients/assign-pharmacies');
  } else {
    router.push('/admin/clients');
  }
}
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('clients').delete().eq('id', route.params.id);
  if (!error) {
    alert('삭제되었습니다.');
    router.push('/admin/clients');
  } else {
    alert('삭제 실패: ' + error.message);
  }
}
</script>