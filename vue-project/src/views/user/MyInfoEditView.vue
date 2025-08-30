<template>
  <div class="board_640">
    <div class="form-title">내 정보 수정</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>아이디(이메일)</label>
        <input :value="email" readonly disabled class="input-readonly" />
      </div>
      <div class="form-group">
        <label>업체명<span class="required">*</span></label>
        <input 
          id="companyName" 
          v-model="companyName" 
          type="text" 
          required 
        />
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
        <label>대표자명<span class="required">*</span></label>
        <input 
          id="representative" 
          v-model="representative" 
          type="text" 
          required 
        />
      </div>
      <div class="form-group">
        <label>사업장 소재지</label>
        <input 
          id="address" 
          v-model="address" 
          type="text" 
        />
      </div>
      <div class="form-group">
        <label>담당자명</label>
        <input 
          id="contactPerson" 
          v-model="contactPerson" 
          type="text" 
        />
      </div>
      <div class="form-group">
        <label>휴대폰번호</label>
        <input 
          id="mobile" 
          v-model="mobile" 
          type="text" 
          @input="formatPhoneNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="button-area">
        <button class="btn-cancel" type="button" @click="goBack">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">수정</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

const router = useRouter()
const loading = ref(false)

const email = ref('')
const companyName = ref('')
const businessNumber = ref('')
const representative = ref('')
const address = ref('')
const contactPerson = ref('')
const mobile = ref('')
const companyId = ref(null)

// 원본 데이터 저장
const originalData = ref({
  companyName: '',
  businessNumber: '',
  representative: '',
  address: '',
  contactPerson: '',
  mobile: ''
});

// 필수 필드 검증 및 변경값 감지
const isFormValid = computed(() => {
  // 필수값 검증 (업체명, 사업자등록번호, 대표자명)
  const hasRequiredFields = companyName.value && companyName.value.trim() !== '' && 
                           businessNumber.value && businessNumber.value.trim() !== '' && 
                           representative.value && representative.value.trim() !== '';
  
  // 변경값 감지
  const hasChanges = companyName.value !== originalData.value.companyName ||
                    businessNumber.value !== originalData.value.businessNumber ||
                    representative.value !== originalData.value.representative ||
                    address.value !== originalData.value.address ||
                    contactPerson.value !== originalData.value.contactPerson ||
                    mobile.value !== originalData.value.mobile;
  
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

// 전화번호 형식 변환
const formatPhoneNumber = (event) => {
  const target = event.target;
  let value = target.value.replace(/[^0-9]/g, '');
  
  if (target.id === 'mobile') {
    // 휴대폰번호: 010-####-####
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    if (value.length >= 8) {
      value = value.substring(0, 8) + '-' + value.substring(8);
    }
    
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    mobile.value = value;
  }
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  const target = event.target;
  if ((target.id === 'businessNumber' || target.id === 'mobile') && event.key === 'Backspace') {
    const cursorPosition = target.selectionStart;
    const value = target.value;
    
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      const newValue = value.substring(0, newPosition) + value.substring(cursorPosition);
      
      if (target.id === 'businessNumber') {
        businessNumber.value = newValue;
      } else if (target.id === 'mobile') {
        mobile.value = newValue;
      }
      
      setTimeout(() => {
        target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

onMounted(async () => {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      router.push('/login')
      return
    }

    // 사용자의 회사 정보 조회
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
      
    if (error) {
      console.error('사용자 정보 조회 오류:', error)
      alert('사용자 정보를 불러올 수 없습니다.')
      return
    }
    
    if (data) {
      companyId.value = data.id
      email.value = data.email || ''
      companyName.value = data.company_name || ''
      businessNumber.value = data.business_registration_number || ''
      representative.value = data.representative_name || ''
      address.value = data.business_address || ''
      contactPerson.value = data.contact_person_name || ''
      mobile.value = data.mobile_phone || ''
      
      // 원본 데이터 저장
      originalData.value.companyName = data.company_name || '';
      originalData.value.businessNumber = data.business_registration_number || '';
      originalData.value.representative = data.representative_name || '';
      originalData.value.address = data.business_address || '';
      originalData.value.contactPerson = data.contact_person_name || '';
      originalData.value.mobile = data.mobile_phone || '';
    }
  } catch (err) {
    console.error('사용자 정보 조회 예외:', err)
    alert('사용자 정보를 불러오는 중 오류가 발생했습니다.')
  }
})

function goBack() {
  router.push('/my-info')
}

const handleSubmit = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 필수 필드 검증
    if (!companyName.value || companyName.value.trim() === '') {
      alert('업체명은 필수 입력 항목입니다.');
      setTimeout(() => {
        const companyNameInput = document.getElementById('companyName');
        if (companyNameInput) {
          companyNameInput.focus();
          companyNameInput.select();
        }
      }, 100);
      loading.value = false;
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
      loading.value = false;
      return;
    }

    if (!representative.value || representative.value.trim() === '') {
      alert('대표자명은 필수 입력 항목입니다.');
      setTimeout(() => {
        const representativeInput = document.getElementById('representative');
        if (representativeInput) {
          representativeInput.focus();
          representativeInput.select();
        }
      }, 100);
      loading.value = false;
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
      loading.value = false;
      return;
    }

    // 휴대폰번호 형식 검증 (입력된 경우에만)
    if (mobile.value && mobile.value.trim() !== '') {
      const mobileNumber = mobile.value.replace(/[^0-9]/g, '');
      if (mobileNumber.length !== 11 || !mobileNumber.startsWith('010')) {
        alert('휴대폰번호 형식이 올바르지 않습니다.');
        setTimeout(() => {
          const mobileInput = document.getElementById('mobile');
          if (mobileInput) {
            mobileInput.focus();
            mobileInput.select();
          }
        }, 100);
        loading.value = false;
        return;
      }
    }

    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      loading.value = false;
      return;
    }
    const currentUserId = currentUser.data.user.id;
    
    // 사업자등록번호에서 특수문자 제거
    const cleanBusinessNumber = businessNumber.value.replace(/[^0-9]/g, '');
    
    // 사업자등록번호 중복 검증 (자신 제외, 변경된 경우에만, 특수문자 제거된 값으로 검색)
    if (businessNumber.value !== originalData.value.businessNumber) {
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select('id')
        .eq('business_registration_number', cleanBusinessNumber)
        .neq('id', companyId.value) // 자신 제외
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없는 경우
        throw checkError;
      }
      
      if (existingCompany) {
        alert('동일한 사업자등록번호로 이미 가입된 이력이 있습니다.');
        setTimeout(() => {
          const businessNumberInput = document.getElementById('businessNumber');
          if (businessNumberInput) {
            businessNumberInput.focus();
            businessNumberInput.select();
          }
        }, 100);
        loading.value = false;
        return;
      }
    }

    const { error } = await supabase
      .from('companies')
      .update({
        company_name: companyName.value,
        business_registration_number: cleanBusinessNumber,
        representative_name: representative.value,
        business_address: address.value,
        contact_person_name: contactPerson.value,
        mobile_phone: mobile.value,
        updated_at: new Date().toISOString(),
        updated_by: currentUserId
      })
      .eq('id', companyId.value)
      
    if (error) {
      alert('수정 실패: ' + error.message)
      loading.value = false;
      return
    }
    
    alert('수정되었습니다.')
    router.push('/my-info')
    
  } catch (err) {
    console.error('수정 오류:', err)
    alert('수정 중 오류가 발생했습니다: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}
</script> 