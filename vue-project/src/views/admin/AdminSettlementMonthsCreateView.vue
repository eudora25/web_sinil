<template>
  <div class="board_640">
    <div class="form-title">정산월 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid-2x">
      <div class="form-group">
        <label>정산월<span class="required">*</span></label>
        <input v-model="settlementMonth" type="month" required />
      </div>
      <div class="form-group">
        <label>실적입력 시작일<span class="required">*</span></label>
        <input v-model="startDate" type="date" required />
      </div>
      <div class="form-group">
        <label>실적입력 종료일<span class="required">*</span></label>
        <input v-model="endDate" type="date" required />
      </div>
      <div class="form-group">
        <label>실적 등록 전달사항</label>
        <textarea v-model="notice" ref="noticeArea" rows="6" style="resize:vertical; min-height:80px; height:120px; white-space: pre-wrap;" @input="adjustTextareaHeight"></textarea>
      </div>
      <div class="form-group">
        <label>정산내역서 전달사항</label>
        <textarea v-model="noticePayment" ref="noticePaymentArea" rows="6" style="resize:vertical; min-height:80px; height:120px; white-space: pre-wrap;" @input="adjustNoticePaymentTextareaHeight"></textarea>
      </div>
      <div class="form-group">
        <label>비고</label>
        <input v-model="remarks" type="text" />
      </div>
      <div class="form-group">
        <label>상태</label>
        <select v-model="status">
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div style="justify-content: flex-end; margin-top: 2rem;">
        <button class="btn-cancel" type="button" @click="goList" style="margin-right: 1rem;">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">등록</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const settlementMonth = ref('');
const startDate = ref('');
const endDate = ref('');
const notice = ref('');
const noticePayment = ref('');
const status = ref('active');
const remarks = ref('');
const router = useRouter();
const noticeArea = ref(null);
const noticePaymentArea = ref(null);

// 필수값 검증
const isFormValid = computed(() => {
  return settlementMonth.value && settlementMonth.value.trim() !== '' &&
         startDate.value && startDate.value.trim() !== '' &&
         endDate.value && endDate.value.trim() !== '';
});

const adjustTextareaHeight = () => {
  if (noticeArea.value) {
    noticeArea.value.style.height = 'auto';
    noticeArea.value.style.height = `${noticeArea.value.scrollHeight}px`;
  }
};

const adjustNoticePaymentTextareaHeight = () => {
  if (noticePaymentArea.value) {
    noticePaymentArea.value.style.height = 'auto';
    noticePaymentArea.value.style.height = `${noticePaymentArea.value.scrollHeight}px`;
  }
};

import { watch } from 'vue';
watch(notice, () => {
  nextTick(adjustTextareaHeight);
});

watch(noticePayment, () => {
  nextTick(adjustNoticePaymentTextareaHeight);
});

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showWarning('필수 항목을 모두 입력하세요.');
    return;
  }

  // 1. 정산월 중복 검증
  const { data: existingMonth, error: checkError } = await supabase
    .from('settlement_months')
    .select('id')
    .eq('settlement_month', settlementMonth.value)
    .single();

  if (existingMonth) {
    showWarning('이미 등록된 정산월이 있습니다.');
    return;
  }

  // 2. 날짜 검증
  if (new Date(endDate.value) <= new Date(startDate.value)) {
    showWarning('실적입력 종료일이 실적입력 시작일보다 이전 날짜입니다.');
    return;
  }

  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showError('로그인 정보가 없습니다. 다시 로그인해주세요.');
    return;
  }

  const { error } = await supabase.from('settlement_months').insert([{
    settlement_month: settlementMonth.value,
    start_date: startDate.value,
    end_date: endDate.value,
    notice: notice.value,
    notice_payment: noticePayment.value,
    status: status.value,
    remarks: remarks.value,
    created_by: user.id
  }]);

  if (error) {
    showError('등록 실패: ' + error.message);
  } else {
    showSuccess('등록되었습니다.');
    router.push('/admin/settlement-months');
  }
};

function goList() {
  router.push('/admin/settlement-months');
}
</script> 