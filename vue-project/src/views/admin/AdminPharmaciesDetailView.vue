<template>
  <div class="board_640">
    <div class="form-title">문전약국 상세</div>
    <div class="form-grid">
      <div class="form-group">
        <label>약국코드</label>
        <input :value="pharmacy.pharmacy_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>약국명</label>
        <input :value="pharmacy.name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업자등록번호</label>
        <input :value="pharmacy.business_registration_number || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>주소</label>
        <input :value="pharmacy.address || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>상태</label>
        <input :value="pharmacy.status === 'active' ? '활성' : (pharmacy.status === 'inactive' ? '비활성' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="pharmacy.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(pharmacy.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="pharmacy.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(pharmacy.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="pharmacy.updated_by_name || '-'" readonly disabled />
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
const pharmacy = ref({});

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
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, created_at, created_by, updated_at, updated_by')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    pharmacy.value = data;
    
    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();
        
        if (createdByCompany?.company_name) {
          pharmacy.value.created_by_name = createdByCompany.company_name;
        } else {
          pharmacy.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        pharmacy.value.created_by_name = data.created_by; // UUID 표시
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
          pharmacy.value.updated_by_name = updatedByCompany.company_name;
        } else {
          pharmacy.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        pharmacy.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
  }
});

function goEdit() {
  // from 쿼리 파라미터가 있으면 함께 전달
  const from = route.query.from;
  if (from) {
    router.push(`/admin/pharmacies/${route.params.id}/edit?from=${from}`);
  } else {
    router.push(`/admin/pharmacies/${route.params.id}/edit`);
  }
}
function goList() {
  // 이전 화면이 문전약국 지정인지 확인
  if (route.query.from === 'admin-clients-assign-pharmacies') {
    router.push('/admin/clients/assign-pharmacies');
  } else {
    router.push('/admin/pharmacies');
  }
}
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('pharmacies').delete().eq('id', route.params.id);
  if (!error) {
    alert('삭제되었습니다.');
    router.push('/admin/pharmacies');
  } else {
    alert('삭제 실패: ' + error.message);
  }
}
</script>
