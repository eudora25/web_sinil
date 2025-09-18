<template>
  <div class="board_640">
    <div class="form-title">문전약국 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>약국코드</label>
        <input v-model="pharmacyCode" type="text" />
      </div>
      <div class="form-group">
        <label>약국명<span class="required">*</span></label>
        <input id="name" v-model="name" type="text" required />
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

const pharmacyCode = ref('');
const name = ref('');
const businessNumber = ref('');
const address = ref('');
const status = ref('active');
const remarks = ref('');
const router = useRouter();

// 필수 필드 검증
const isFormValid = computed(() => {
  return name.value && name.value.trim() !== '' && 
         businessNumber.value && businessNumber.value.trim() !== '';
});

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
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
  if (!name.value || name.value.trim() === '') {
    alert('약국명은 필수 입력 항목입니다.');
    setTimeout(() => {
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 100);
    return;
  }

  if (!businessNumber.value || businessNumber.value.trim() === '') {
    alert('사업자등록번호는 필수 입력 항목입니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  // 사업자등록번호 형식 검증 (10자리 숫자)
  const businessNumberDigits = businessNumber.value.replace(/[^0-9]/g, '');
  if (businessNumberDigits.length !== 10) {
    alert('사업자등록번호는 10자리여야 합니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  // 사업자등록번호 중복 확인 (정규화된 값으로 검색)
  const { data: existingPharmacy, error: checkError } = await supabase
    .from('pharmacies')
    .select('id, name')
    .eq('business_registration_number', businessNumberDigits)
    .maybeSingle();

  if (checkError) {
    console.error('사업자등록번호 중복 검사 실패:', checkError);
    alert(`사업자등록번호 중복 검사 중 오류가 발생했습니다.\n\n오류 코드: ${checkError.code}\n오류 메시지: ${checkError.message}\n\n관리자에게 문의해주세요.`);
    return;
  }

  if (existingPharmacy) {
    alert(`이미 등록된 사업자등록번호입니다.\n등록된 약국: ${existingPharmacy.name}`);
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
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
    pharmacy_code: pharmacyCode.value,
    name: name.value,
    business_registration_number: businessNumberDigits,
    address: address.value,
    status: status.value,
    remarks: remarks.value,
    created_by: user.id
  };
  const { error } = await supabase.from('pharmacies').insert([dataToInsert]);
  if (error) {
    alert('등록 실패: ' + error.message);
  } else {
    alert('등록되었습니다.');
    router.push('/admin/pharmacies');
  }
};

function goList() {
  router.push('/admin/pharmacies');
}
</script>
