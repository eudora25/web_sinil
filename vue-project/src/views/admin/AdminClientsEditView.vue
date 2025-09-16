<template>
  <div class="board_640">
    <div class="form-title">병의원 수정</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>병의원코드</label>
        <input v-model="clientCode" type="text" />
      </div>
      <div class="form-group">
        <label>병의원명<span class="required">*</span></label>
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
        <label>원장명</label>
        <input v-model="ownerName" type="text" />
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
      <div class="form-group">
        <label>정산용 비고</label>
        <input v-model="remarksSettlement" type="text" />
      </div>
      <div class="button-area">
        <button class="btn-cancel" type="button" @click="goDetail">취소</button>
        <button class="btn-add" type="submit" :disabled="!isFormValid">수정</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const clientCode = ref('');
const name = ref('');
const businessNumber = ref('');
const ownerName = ref('');
const address = ref('');
const status = ref('active');
const remarks = ref('');
const remarksSettlement = ref(''); // 정산용 비고 필드

// 원본 데이터 저장
const originalData = ref({
  clientCode: '',
  name: '',
  businessNumber: '',
  ownerName: '',
  address: '',
  status: '',
  remarks: '',
  remarksSettlement: '' // 정산용 비고 필드 추가
});

// 필수 필드 검증 및 변경값 감지
const isFormValid = computed(() => {
  // 필수값 검증
  const hasRequiredFields = name.value && name.value.trim() !== '' && 
                           businessNumber.value && businessNumber.value.trim() !== '';
  
  // 변경값 감지
  const hasChanges = clientCode.value !== originalData.value.clientCode ||
                    name.value !== originalData.value.name ||
                    businessNumber.value !== originalData.value.businessNumber ||
                    ownerName.value !== originalData.value.ownerName ||
                    address.value !== originalData.value.address ||
                    status.value !== originalData.value.status ||
                    remarks.value !== originalData.value.remarks ||
                    remarksSettlement.value !== originalData.value.remarksSettlement; // 정산용 비고 필드 추가
  
  return hasRequiredFields && hasChanges;
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

onMounted(async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    clientCode.value = data.client_code;
    name.value = data.name;
    businessNumber.value = data.business_registration_number;
    ownerName.value = data.owner_name;
    address.value = data.address;
    status.value = data.status;
    remarks.value = data.remarks;
    remarksSettlement.value = data.remarks_settlement; // 정산용 비고 필드 추가
    
    // 원본 데이터 저장
    originalData.value.clientCode = data.client_code;
    originalData.value.name = data.name;
    originalData.value.businessNumber = data.business_registration_number;
    originalData.value.ownerName = data.owner_name;
    originalData.value.address = data.address;
    originalData.value.status = data.status;
    originalData.value.remarks = data.remarks;
    originalData.value.remarksSettlement = data.remarks_settlement; // 정산용 비고 필드 추가
  }
});

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!name.value || name.value.trim() === '') {
    alert('병의원명은 필수 입력 항목입니다.');
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

  // 현재 로그인한 사용자 정보 가져오기
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  const { error } = await supabase
    .from('clients')
    .update({
      client_code: clientCode.value,
      name: name.value,
      business_registration_number: businessNumber.value,
      owner_name: ownerName.value,
      address: address.value,
      status: status.value,
      remarks: remarks.value,
      remarks_settlement: remarksSettlement.value, // 정산용 비고 필드 추가
      updated_by: currentUserId,
      updated_at: new Date().toISOString() // 명시적으로 수정 시간 설정
    })
    .eq('id', route.params.id);
  if (error) {
    alert('수정 실패: ' + error.message);
  } else {
    alert('수정되었습니다.');
    goDetail();
  }
};

function goDetail() {
  // from 쿼리 파라미터가 있으면 함께 전달
  const from = route.query?.from;
  if (from) {
    router.push(`/admin/clients/${route.params.id}?from=${from}`);
  } else {
    router.push(`/admin/clients/${route.params.id}`);
  }
}
</script>
