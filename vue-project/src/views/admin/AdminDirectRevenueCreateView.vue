<template>
  <div class="board_640">
    <div class="form-title">직거래매출 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>약국코드</label>
        <input v-model="pharmacyCode" type="text" />
      </div>
      <div class="form-group">
        <label>약국명</label>
        <input v-model="pharmacyName" type="text" />
      </div>
      <div class="form-group">
        <label>사업자등록번호<span class="required">*</span></label>
        <input 
          id="businessNumber" 
          v-model="businessNumber" 
          type="text" 
          required 
          @input="formatBusinessNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="form-group">
        <label>주소</label>
        <input v-model="address" type="text" />
      </div>
      <div class="form-group">
        <label>표준코드<span class="required">*</span></label>
        <input 
          id="standardCode" 
          v-model="standardCode" 
          type="text" 
          required 
          @keypress="allowOnlyNumbers"
        />
      </div>
      <div class="form-group">
        <label>제품명</label>
        <input v-model="productName" type="text" />
      </div>
      <div class="form-group">
        <label>매출액<span class="required">*</span></label>
        <input 
          id="salesAmount" 
          v-model="salesAmount" 
          type="text" 
          required 
          @keypress="allowOnlyNumbersAndMinus"
        />
      </div>
      <div class="form-group">
        <label>매출일자<span class="required">*</span></label>
        <input 
          id="salesDate" 
          v-model="salesDate" 
          type="date" 
          required 
        />
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
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const pharmacyCode = ref('');
const pharmacyName = ref('');
const businessNumber = ref('');
const address = ref('');
const standardCode = ref('');
const productName = ref('');
const salesAmount = ref('');
const salesDate = ref('');
const remarks = ref('');
const router = useRouter();

// 필수 필드 검증
const isFormValid = computed(() => {
  return businessNumber.value && businessNumber.value.trim() !== '' && 
         standardCode.value && standardCode.value.trim() !== '' && 
         salesAmount.value && salesAmount.value.trim() !== '' && 
         salesDate.value && salesDate.value.trim() !== '';
});

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

// 숫자와 마이너스만 입력 허용
const allowOnlyNumbersAndMinus = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  const value = event.target.value;
  
  // 마이너스는 첫 번째 위치에만 허용
  if (charCode === 45 && value.length === 0) {
    return; // 마이너스 허용
  }
  
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
  
  if (value.length > 10) {
    value = value.substring(0, 10); // 최대 10자리로 제한
  }
  
  // 형식 변환: ###-##-#####
  if (value.length >= 3) {
    value = value.substring(0, 3) + '-' + value.substring(3);
  }
  if (value.length >= 6) {
    value = value.substring(0, 6) + '-' + value.substring(6);
  }
  
  // 최대 12자리(하이픈 포함)로 제한
  if (value.length > 12) {
    value = value.substring(0, 12);
  }
  
  businessNumber.value = value;
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  if (event.key === 'Backspace') {
    const cursorPosition = event.target.selectionStart;
    const value = event.target.value;
    
    // 커서 위치에 하이픈이 있으면 한 칸 더 뒤로 이동
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      businessNumber.value = value.substring(0, newPosition) + value.substring(cursorPosition);
      
      // 커서 위치 조정
      setTimeout(() => {
        event.target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!businessNumber.value || businessNumber.value.trim() === '') {
    showWarning('사업자등록번호는 필수 입력 항목입니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  if (!standardCode.value || standardCode.value.trim() === '') {
    showWarning('표준코드는 필수 입력 항목입니다.');
    setTimeout(() => {
      const standardCodeInput = document.getElementById('standardCode');
      if (standardCodeInput) {
        standardCodeInput.focus();
        standardCodeInput.select();
      }
    }, 100);
    return;
  }

  if (!salesAmount.value || salesAmount.value.trim() === '') {
    showWarning('매출액은 필수 입력 항목입니다.');
    setTimeout(() => {
      const salesAmountInput = document.getElementById('salesAmount');
      if (salesAmountInput) {
        salesAmountInput.focus();
        salesAmountInput.select();
      }
    }, 100);
    return;
  }

  if (!salesDate.value || salesDate.value.trim() === '') {
    showWarning('매출일자는 필수 입력 항목입니다.');
    setTimeout(() => {
      const salesDateInput = document.getElementById('salesDate');
      if (salesDateInput) {
        salesDateInput.focus();
        salesDateInput.select();
      }
    }, 100);
    return;
  }

  // 사업자등록번호 형식 검증 (10자리 숫자)
  const businessNumberDigits = businessNumber.value.replace(/[^0-9]/g, '');
  if (businessNumberDigits.length !== 10) {
    showWarning('사업자등록번호는 10자리여야 합니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  // 표준코드 형식 검증 (13자리 숫자)
  if (standardCode.value.length !== 13 || !/^\d{13}$/.test(standardCode.value)) {
    showWarning('표준코드는 13자리 숫자여야 합니다.');
    setTimeout(() => {
      const standardCodeInput = document.getElementById('standardCode');
      if (standardCodeInput) {
        standardCodeInput.focus();
        standardCodeInput.select();
      }
    }, 100);
    return;
  }

  // 매출액 형식 검증 (숫자, 마이너스 허용)
  if (isNaN(Number(salesAmount.value))) {
    showWarning('매출액은 숫자여야 합니다.');
    setTimeout(() => {
      const salesAmountInput = document.getElementById('salesAmount');
      if (salesAmountInput) {
        salesAmountInput.focus();
        salesAmountInput.select();
      }
    }, 100);
    return;
  }

  // 매출일자 형식 검증 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(salesDate.value)) {
    showWarning('매출일자는 YYYY-MM-DD 형식이어야 합니다.');
    setTimeout(() => {
      const salesDateInput = document.getElementById('salesDate');
      if (salesDateInput) {
        salesDateInput.focus();
        salesDateInput.select();
      }
    }, 100);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  const dataToInsert = {
    pharmacy_code: pharmacyCode.value,
    pharmacy_name: pharmacyName.value,
    business_registration_number: businessNumber.value,
    address: address.value,
    standard_code: standardCode.value,
    product_name: productName.value,
    sales_amount: salesAmount.value === '' ? null : Number(salesAmount.value),
    sales_date: salesDate.value,
    created_by: userId,
    updated_by: null
  };
  const { error } = await supabase.from('direct_sales').insert([dataToInsert]);
  if (error) {
    showError('등록 실패: ' + error.message);
  } else {
    showSuccess('등록되었습니다.');
    router.push('/admin/direct-revenue');
  }
};

function goList() {
  router.push('/admin/direct-revenue');
}
</script>
