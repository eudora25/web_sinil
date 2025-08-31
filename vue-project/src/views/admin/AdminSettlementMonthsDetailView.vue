<template>
  <div class="board_640">
    <div class="form-title">정산월 상세</div>
    <div class="form-grid-2x">
      <div class="form-group">
        <label>정산월</label>
        <input :value="month.settlement_month || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>실적입력 시작일</label>
        <input :value="month.start_date || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>실적입력 종료일</label>
        <input :value="month.end_date || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>실적 등록 전달사항</label>
        <div class="input-readonly-detail" style="white-space: pre-wrap;">{{ month.notice || '-' }}</div>
      </div>
      <div class="form-group">
        <label>정산내역서 전달사항</label>
        <div class="input-readonly-detail" style="white-space: pre-wrap;">{{ month.notice_payment || '-' }}</div>
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="month.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>상태</label>
        <input :value="month.status === 'active' ? '활성' : (month.status === 'inactive' ? '비활성' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(month.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="month.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(month.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="month.updated_by_name || '-'" readonly disabled />
      </div>
      <div style="justify-content: flex-end; margin-top: 2rem;">
        <button class="btn-delete" @click="handleDelete" style="margin-right: 1rem;">삭제</button>
        <button class="btn-edit" @click="goEdit" style="margin-right: 1rem;">수정</button>
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
const month = ref({});

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
    .from('settlement_months')
    .select('*, created_at, created_by, updated_at, updated_by')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    month.value = data;

    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();

        if (createdByCompany?.company_name) {
          month.value.created_by_name = createdByCompany.company_name;
        } else {
          month.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        month.value.created_by_name = data.created_by; // UUID 표시
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
          month.value.updated_by_name = updatedByCompany.company_name;
        } else {
          month.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        month.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
  }
});

function goEdit() {
  router.push(`/admin/settlement-months/${route.params.id}/edit`);
}
function goList() {
  router.push('/admin/settlement-months');
}
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return;


  const { error } = await supabase.from('settlement_months').delete().eq('id', route.params.id);
  if (!error) {
    alert('삭제되었습니다.');
    router.push('/admin/settlement-months');
  } else {
    alert('삭제 실패: ' + error.message);
  }
}
</script>

