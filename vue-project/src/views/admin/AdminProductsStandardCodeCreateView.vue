<template>
  <div class="board_640">
    <div class="form-title">표준코드 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid">

      <div class="form-group">
        <label>보험코드<span class="required">*</span></label>
        <input id="insuranceCode" v-model="insuranceCode" type="text" maxlength="9" required @keypress="allowOnlyNumbers" />
      </div>
      <div class="form-group">
        <label>표준코드<span class="required">*</span></label>
        <input id="standardCode" v-model="standardCode" type="text" maxlength="13" required @keypress="allowOnlyNumbers" />
      </div>
      <div class="form-group">
        <label>단위/포장형태</label>
        <input v-model="unitPackageForm" type="text" />
      </div>
      <div class="form-group">
        <label>단위수량</label>
        <input v-model="unitQuantity" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>상태</label>
        <select v-model="status">
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div class="form-group">
        <label>비고</label>
        <input v-model="remarks" type="text" />
      </div>
      <div class="button-area">
        <button class="btn-cancel" type="button" @click="goList">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">등록</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const insuranceCode = ref('');
const standardCode = ref('');
const unitPackageForm = ref('');
const unitQuantity = ref('');
const status = ref('active');
const remarks = ref('');
const router = useRouter();

// 필수 필드 검증
const isFormValid = computed(() => {
  return insuranceCode.value && insuranceCode.value.trim() !== '' &&
         standardCode.value && standardCode.value.trim() !== '';
});

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!insuranceCode.value || !standardCode.value) {
    alert('필수 항목을 모두 입력하세요.');
    return;
  }

  // 보험코드 형식 검증 (9자리 숫자)
  if (insuranceCode.value.length !== 9 || !/^\d{9}$/.test(insuranceCode.value)) {
    alert('보험코드는 9자리 숫자여야 합니다.');
    setTimeout(() => {
      const insuranceCodeInput = document.getElementById('insuranceCode');
      if (insuranceCodeInput) {
        insuranceCodeInput.focus();
        insuranceCodeInput.select();
      }
    }, 100);
    return;
  }

  // 표준코드 형식 검증 (13자리 숫자)
  if (standardCode.value.length !== 13 || !/^\d{13}$/.test(standardCode.value)) {
    alert('표준코드는 13자리 숫자여야 합니다.');
    setTimeout(() => {
      const standardCodeInput = document.getElementById('standardCode');
      if (standardCodeInput) {
        standardCodeInput.focus();
        standardCodeInput.select();
      }
    }, 100);
    return;
  }

  // 단위수량 검증 (0 이상의 숫자)
  if (unitQuantity.value && (isNaN(Number(unitQuantity.value)) || Number(unitQuantity.value) < 0)) {
    alert('단위수량은 0 이상의 숫자여야 합니다.');
    setTimeout(() => {
      const unitQuantityInput = document.querySelector('input[v-model="unitQuantity"]');
      if (unitQuantityInput) {
        unitQuantityInput.focus();
        unitQuantityInput.select();
      }
    }, 100);
    return;
  }

  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
    return;
  }

  const dataToInsert = {
    insurance_code: insuranceCode.value,
    standard_code: standardCode.value,
    unit_packaging_desc: unitPackageForm.value || '',
    unit_quantity: unitQuantity.value === '' ? 0 : Number(unitQuantity.value),
    status: status.value,
    remarks: remarks.value,
    created_by: user.id
  };
  
  const { error } = await supabase.from('products_standard_code').insert([dataToInsert]);
  if (error) {
    alert('등록 실패: ' + error.message);
  } else {
    alert('등록되었습니다.');
    router.push('/admin/products-standard-code');
  }
};

function goList() {
  router.push('/admin/products-standard-code');
}
</script> 