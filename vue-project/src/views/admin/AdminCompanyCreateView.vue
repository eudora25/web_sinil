<template>
  <div class="board_640">
    <div class="form-title">신규 업체 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>아이디(이메일)<span class="required">*</span></label>
        <input v-model="email" type="email" required />
      </div>
      <div class="form-group">
        <label>비밀번호<span class="required">*</span></label>
        <div class="password-input-container">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" required />
          <i
            :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
            class="password-toggle-icon"
            @click="showPassword = !showPassword"
          ></i>
        </div>
      </div>
      <div class="form-group">
        <label>비밀번호 확인<span class="required">*</span></label>
        <div class="password-input-container">
          <input id="confirmPassword" v-model="confirmPassword" :type="showPassword2 ? 'text' : 'password'" required />
          <i
            :class="showPassword2 ? 'pi pi-eye-slash' : 'pi pi-eye'"
            class="password-toggle-icon"
            @click="showPassword2 = !showPassword2"
          ></i>
        </div>
      </div>
      <div class="form-group">
        <label>업체명<span class="required">*</span></label>
        <input id="companyName" v-model="companyName" type="text" required @focus="checkValidations" />
      </div>
      <div class="form-group">
        <label>사업자등록번호<span class="required">*</span></label>
        <input id="businessNumber" v-model="businessNumber" type="text" required @input="formatBusinessNumber" @keypress="allowOnlyNumbers" @keydown="handleBackspace" />
      </div>
      <div class="form-group">
        <label>대표자<span class="required">*</span></label>
        <input id="representative" v-model="representative" type="text" required @focus="checkValidations" />
      </div>
      <div class="form-group">
        <label>사업장 소재지</label>
        <input v-model="address" type="text" />
      </div>
      <div class="form-group">
        <label>유선 전화번호</label>
        <input id="landline" v-model="landline" type="text" @input="formatPhoneNumber" @keypress="allowOnlyNumbers" @keydown="handleBackspace" />
      </div>
      <div class="form-group">
        <label>업체 담당자</label>
        <input v-model="contactPerson" type="text" />
      </div>
      <div class="form-group">
        <label>휴대폰 번호</label>
        <input id="mobile" v-model="mobile" type="text" @input="formatPhoneNumber" @keypress="allowOnlyNumbers" @keydown="handleBackspace" />
      </div>
      <div class="form-group">
        <label>휴대폰 번호 2</label>
        <input id="mobile2" v-model="mobile2" type="text" @input="formatPhoneNumber" @keypress="allowOnlyNumbers" @keydown="handleBackspace" />
      </div>
      <div class="form-group">
        <label>수신용 이메일</label>
        <input v-model="receiveEmail" type="email" />
      </div>
      <div class="form-group">
        <label>구분</label>
        <input v-model="companyGroup" type="text" />
      </div>
      <div class="form-group">
        <label>수수료 등급</label>
        <select v-model="commissionGrade">
          <option disabled value="">등급 선택</option>
          <option v-for="item in commissionGradeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>제약사 관리자</label>
        <input v-model="manager" type="text" />
      </div>
      <div class="form-group">
        <label>승인여부</label>
        <select v-model="approvalStatus">
          <option disabled value="">승인여부 선택</option>
          <option v-for="item in approvalStatusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>비고</label>
        <input v-model="remarks" type="text" />
      </div>
      <div class="button-area">
        <Button class="btn-cancel" type="button" @click="goList" label="취소" />
        <Button class="btn-save" type="submit" label="등록" :disabled="!isFormValid" />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { supabase } from '@/supabase'
import TopNavigationBar from '@/components/TopNavigationBar.vue'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const companyName = ref('')
const businessNumber = ref('')
const representative = ref('')
const address = ref('')
const landline = ref('')
const contactPerson = ref('')
const mobile = ref('')
const mobile2 = ref('')
const receiveEmail = ref('')
const companyGroup = ref('')
const commissionGrade = ref('A')
const manager = ref('')
const remarks = ref('')
const approvalStatus = ref('미승인')
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const showPassword = ref(false)
const showPassword2 = ref(false)
const currentUser = ref(null)

const commissionGradeOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
]
const approvalStatusOptions = [
  { label: '승인', value: '승인' },
  { label: '미승인', value: '미승인' },
]

// 필수 필드 검증
const isFormValid = computed(() => {
  return email.value && email.value.trim() !== '' &&
         password.value && password.value.trim() !== '' &&
         confirmPassword.value && confirmPassword.value.trim() !== '' &&
         companyName.value && companyName.value.trim() !== '' &&
         businessNumber.value && businessNumber.value.trim() !== '' &&
         representative.value && representative.value.trim() !== '' &&
         password.value === confirmPassword.value;
});

// 현재 로그인된 사용자 정보 가져오기
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (user) {
    currentUser.value = user
  }
}

// 컴포넌트 마운트 시 현재 사용자 정보 가져오기
getCurrentUser()

// 필드 검증 (focus 이벤트용)
const checkValidations = (event) => {
  // 업체명 필드로 포커스할 때 비밀번호 일치 여부 확인
  if (event.target.id === 'companyName') {
    if (confirmPassword.value && password.value !== confirmPassword.value) {
      event.target.blur();
      alert('비밀번호가 일치하지 않습니다.');
      setTimeout(() => {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
          confirmPasswordInput.focus();
          confirmPasswordInput.select();
        }
      }, 100);
    }
  }
  
  // 대표자 필드로 포커스할 때 사업자등록번호 형식 확인
  if (event.target.id === 'representative') {
    const businessNumberDigits = businessNumber.value.replace(/[^0-9]/g, '');
    if (businessNumberDigits.length !== 10) {
      event.target.blur();
      alert('사업자등록번호는 10자리여야 합니다.');
      setTimeout(() => {
        const businessNumberInput = document.getElementById('businessNumber');
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
    }
  }
};

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const target = event.target;
  if (target.id === 'businessNumber' || target.id === 'mobile' || target.id === 'mobile2' || target.id === 'landline') {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  const target = event.target;
  if (target.id === 'businessNumber') {
    let value = target.value.replace(/[^0-9]/g, '');
    
    if (value.length > 10) {
      value = value.substring(0, 10);
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
  }
};

// 전화번호 형식 변환
const formatPhoneNumber = (event) => {
  const target = event.target;
  let value = target.value.replace(/[^0-9]/g, '');
  
  if (target.id === 'mobile' || target.id === 'mobile2') {
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
    
    if (target.id === 'mobile') {
      mobile.value = value;
    } else {
      mobile2.value = value;
    }
  } else if (target.id === 'landline') {
    // 유선전화: 서울(02)은 02-####-####, 나머지는 0##-####-####
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    if (value.startsWith('02')) {
      // 서울: 02-####-####
      if (value.length >= 2) {
        value = value.substring(0, 2) + '-' + value.substring(2);
      }
      if (value.length >= 7) {
        value = value.substring(0, 7) + '-' + value.substring(7);
      }
    } else {
      // 나머지 지역: 0##-####-####
      if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
      }
      if (value.length >= 8) {
        value = value.substring(0, 8) + '-' + value.substring(8);
      }
    }
    
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    landline.value = value;
  }
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  const target = event.target;
  if ((target.id === 'businessNumber' || target.id === 'mobile' || target.id === 'mobile2' || target.id === 'landline') && event.key === 'Backspace') {
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
      } else if (target.id === 'mobile2') {
        mobile2.value = newValue;
      } else if (target.id === 'landline') {
        landline.value = newValue;
      }
      
      setTimeout(() => {
        target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

const breadcrumbSubMenu = computed(() => {
  if (route.query.from === 'pending') return '미승인 업체'
  return '승인 업체'
})

function getListPath() {
  // 쿼리 또는 라우트에서 listType(approved/pending) 확인
  const type = route.query.from
  if (type === 'pending') return '/admin/companies/pending'
  return '/admin/companies/approved'
}

function goList() {
  const from = route.query.from === 'pending' ? 'pending' : 'approved';
  router.push(`/admin/companies/${from}`);
}

const handleSubmit = async () => {
  if (loading.value) return;

  // 필수 입력값 체크
  if (
    !email.value ||
    !password.value ||
    !confirmPassword.value ||
    !companyName.value ||
    !businessNumber.value ||
    !representative.value
  ) {
    alert('필수 항목을 모두 입력해 주세요.');
    return;
  }

  if (password.value !== confirmPassword.value) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  // 사업자등록번호 형식 검증
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
      return;
    }
  }

  // 휴대폰번호2 형식 검증 (입력된 경우에만)
  if (mobile2.value && mobile2.value.trim() !== '') {
    const mobile2Number = mobile2.value.replace(/[^0-9]/g, '');
    if (mobile2Number.length !== 11 || !mobile2Number.startsWith('010')) {
      alert('휴대폰번호2 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const mobile2Input = document.getElementById('mobile2');
        if (mobile2Input) {
          mobile2Input.focus();
          mobile2Input.select();
        }
      }, 100);
      return;
    }
  }

  // 유선전화 형식 검증 (입력된 경우에만)
  if (landline.value && landline.value.trim() !== '') {
    const landlineNumber = landline.value.replace(/[^0-9]/g, '');
    if (!landlineNumber.startsWith('0')) {
      alert('유선전화 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const landlineInput = document.getElementById('landline');
        if (landlineInput) {
          landlineInput.focus();
          landlineInput.select();
        }
      }, 100);
      return;
    }
    
    // 서울(02)은 10자리, 나머지는 11자리
    if (landlineNumber.startsWith('02')) {
      if (landlineNumber.length !== 10) {
        alert('유선전화 번호 형식이 올바르지 않습니다.');
        setTimeout(() => {
          const landlineInput = document.getElementById('landline');
          if (landlineInput) {
            landlineInput.focus();
            landlineInput.select();
          }
        }, 100);
        return;
      }
    } else {
      if (landlineNumber.length !== 11) {
        alert('유선전화 번호 형식이 올바르지 않습니다.');
        setTimeout(() => {
          const landlineInput = document.getElementById('landline');
          if (landlineInput) {
            landlineInput.focus();
            landlineInput.select();
          }
        }, 100);
        return;
      }
    }
  }

  // 수신용 이메일 형식 검증 (입력된 경우에만)
  if (receiveEmail.value && receiveEmail.value.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiveEmail.value)) {
      alert('수신용 이메일 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const receiveEmailInput = document.getElementById('receiveEmail');
        if (receiveEmailInput) {
          receiveEmailInput.focus();
          receiveEmailInput.select();
        }
      }, 100);
      return;
    }
  }

  loading.value = true;
  try {
    // 사업자등록번호 중복 검증
    const { data: existingCompanies, error: checkError } = await supabase
      .from('companies')
      .select('id, business_registration_number')
      .eq('business_registration_number', businessNumber.value);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingCompanies && existingCompanies.length > 0) {
      alert('동일한 사업자등록번호로 이미 가입된 이력이 있습니다.');
      setTimeout(() => {
        const businessNumberInput = document.getElementById('businessNumber');
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

                        // 1. Edge Function을 통해 관리자 권한으로 사용자 계정과 회사 정보 생성
            const { data, error } = await supabase.functions.invoke('admin-create-company', {
              body: {
                 email: email.value,
                 password: password.value,
                 company_name: companyName.value,
                 business_registration_number: businessNumber.value,
                 representative_name: representative.value,
                 business_address: address.value,
                 landline_phone: landline.value,
                 contact_person_name: contactPerson.value,
                 mobile_phone: mobile.value,
                 mobile_phone_2: mobile2.value,
                 receive_email: receiveEmail.value,
                 company_group: companyGroup.value,
                 default_commission_grade: commissionGrade.value,
                 assigned_pharmacist_contact: manager.value,
                 approval_status: approvalStatus.value,
                 remarks: remarks.value,
                 created_by: currentUser.value?.id || null
               }
             });
            
            if (error) {
              let errorMessage = '사용자 계정 생성에 실패했습니다.';
              
              if (error.message.includes('already been registered')) {
                errorMessage = '이미 등록된 이메일 주소입니다.';
              } else if (error.message.includes('invalid')) {
                errorMessage = '이메일 주소 형식이 올바르지 않습니다.';
              } else if (error.message) {
                errorMessage = `사용자 계정 생성 실패: ${error.message}`;
              }
              
              alert(errorMessage);
              return;
            }
            
            if (!data.user || !data.company) {
              alert('사용자 계정 또는 회사 정보 생성에 실패했습니다.');
              return;
            }
            
            console.log('✅ 사용자 계정 생성됨:', data.user.id);
            console.log('✅ 회사 정보 생성됨:', data.company.id);
    
    alert('등록되었습니다.');
    const from = route.query.from === 'pending' ? 'pending' : 'approved';
    router.push(`/admin/companies/${from}`);
  } catch (err) {
    let errorMessage = '업체 등록 중 오류가 발생했습니다.';
    
    // 구체적인 오류 메시지 처리
    if (err.message && err.message.includes('fetch')) {
      errorMessage = '서버 연결에 실패했습니다. 네트워크 연결을 확인해주세요.';
    } else if (err.message && err.message.includes('JSON')) {
      errorMessage = '서버 응답을 처리할 수 없습니다. 다시 시도해주세요.';
    } else if (err.message && err.message.includes('timeout')) {
      errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    } else if (err.message) {
      errorMessage = `업체 등록 실패: ${err.message}`;
    }
    
    alert(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>
