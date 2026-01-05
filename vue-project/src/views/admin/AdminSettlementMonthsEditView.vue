<template>
  <div class="board_640">
    <div class="form-title">정산월 수정</div>
    <form @submit.prevent="handleSubmit" class="form-grid-2x">
      <div class="form-group">
        <label>정산월<span class="required">*</span></label>
        <input v-model="settlementMonth" type="month" required readonly />
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
        <button class="btn-cancel" type="button" @click="goDetail" style="margin-right: 1rem;">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">저장</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const route = useRoute();
const router = useRouter();
const settlementMonth = ref('');
const startDate = ref('');
const endDate = ref('');
const notice = ref('');
const noticePayment = ref('');
const status = ref('active');
const remarks = ref('');
const noticeArea = ref(null);
const noticePaymentArea = ref(null);

// 원본 데이터 저장
const originalData = ref(null);

// 필수값 검증 및 변경사항 감지
const isFormValid = computed(() => {
  // 필수값 검증
  const hasRequiredFields = settlementMonth.value && settlementMonth.value.trim() !== '' &&
                           startDate.value && startDate.value.trim() !== '' &&
                           endDate.value && endDate.value.trim() !== '';
  
  // 변경사항 감지 (정산월 제외)
  const hasChanges = originalData.value && (
    startDate.value !== originalData.value.start_date ||
    endDate.value !== originalData.value.end_date ||
    notice.value !== originalData.value.notice ||
    noticePayment.value !== originalData.value.notice_payment ||
    status.value !== originalData.value.status ||
    remarks.value !== originalData.value.remarks
  );
  
  return hasRequiredFields && hasChanges;
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

watch(notice, () => {
  nextTick(adjustTextareaHeight);
});

watch(noticePayment, () => {
  nextTick(adjustNoticePaymentTextareaHeight);
});

onMounted(async () => {
  const { data, error } = await supabase
    .from('settlement_months')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    settlementMonth.value = data.settlement_month;
    startDate.value = data.start_date;
    endDate.value = data.end_date;
    notice.value = data.notice;
    noticePayment.value = data.notice_payment;
    status.value = data.status;
    remarks.value = data.remarks;
    
    // 원본 데이터 저장
    originalData.value = {
      settlement_month: data.settlement_month,
      start_date: data.start_date,
      end_date: data.end_date,
      notice: data.notice,
      notice_payment: data.notice_payment,
      status: data.status,
      remarks: data.remarks
    };
    
    nextTick(adjustTextareaHeight);
  }
});

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showWarning('필수 항목을 모두 입력하고 변경사항이 있어야 합니다.');
    return;
  }

  // 날짜 검증
  if (new Date(endDate.value) <= new Date(startDate.value)) {
    showWarning('실적입력 종료일이 실적입력 시작일보다 이전 날짜입니다.');
    return;
  }

  const { error } = await supabase
    .from('settlement_months')
    .update({
      settlement_month: settlementMonth.value,
      start_date: startDate.value,
      end_date: endDate.value,
      notice: notice.value,
      notice_payment: noticePayment.value,
      status: status.value,
      remarks: remarks.value
    })
    .eq('id', route.params.id);

  if (error) {
    showError('수정 실패: ' + error.message);
  } else {
    showSuccess('수정되었습니다.');
    router.push('/admin/settlement-months');
  }
};

function goDetail() {
  router.push(`/admin/settlement-months/${route.params.id}`);
}
</script> 