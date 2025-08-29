<template>
  <div class="signup-root">
    <div class="signup-right">
      <div class="signup-logo">신일제약 실적관리 시스템</div>
      <form class="signup-form" @submit.prevent="handleSignup">
        <div class="form-row" v-for="field in fields" :key="field.key">
          <label :for="field.key">{{ field.label }}<span v-if="field.required" class="required">*</span></label>
          <input
            v-if="field.type !== 'password' && field.type !== 'password2'"
            :id="field.key"
            :type="field.inputType"
            v-model="formData[field.key]"
            @focus="checkPasswordMatch"
            @input="formatBusinessNumber"
            @keypress="allowOnlyNumbers"
            @keydown="handleBackspace"
          />
          <div v-else-if="field.type === 'password'" style="position: relative;">
            <input
              :id="field.key"
              :type="showPassword ? 'text' : 'password'"
              v-model="formData.password"
              style="padding-right: 2.5rem;"
            />
            <i
              :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              style="position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888; font-size: 1.2rem;"
              @click="showPassword = !showPassword"
            ></i>
          </div>
          <div v-else-if="field.type === 'password2'" style="position: relative;">
            <input
              :id="field.key"
              :type="showPassword2 ? 'text' : 'password'"
              v-model="formData.confirmPassword"
              style="padding-right: 2.5rem;"
            />
            <i
              :class="showPassword2 ? 'pi pi-eye-slash' : 'pi pi-eye'"
              style="position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888; font-size: 1.2rem; z-index: 10;"
              @click.stop="showPassword2 = !showPassword2"
            ></i>
          </div>
        </div>
        <div class="button-row">
          <Button label="취소" class="cancel-btn" @click.prevent="goToLogin" />
          <Button label="회원가입" class="signup-btn" @click="handleSignup" :disabled="!isFormValid" />
        </div>
        <div class="login-link">
          <a @click.prevent="goToLogin" href="#">이미 계정이 있으신가요? 로그인</a>
        </div>
      </form>
      <div class="copyright">© 2025. 주식회사 팜플코리아 All Rights Reserved.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import { supabase } from '@/supabase';
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';

const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  businessRegistrationNumber: '',
  representativeName: '',
  businessAddress: '',
  contactPersonName: '',
  mobilePhone: '',
});
const router = useRouter();

const fields = [
  { key: 'email', label: '아이디(이메일)', inputType: 'email', required: true },
  { key: 'password', label: '비밀번호', type: 'password', required: true },
  { key: 'confirmPassword', label: '비밀번호 확인', type: 'password2', required: true },
  { key: 'companyName', label: '업체명', inputType: 'text', required: true },
  { key: 'businessRegistrationNumber', label: '사업자등록번호', inputType: 'text', required: true },
  { key: 'representativeName', label: '대표자명', inputType: 'text', required: true },
  { key: 'businessAddress', label: '사업장 소재지', inputType: 'text', required: false },
  { key: 'contactPersonName', label: '담당자명', inputType: 'text', required: false },
  { key: 'mobilePhone', label: '휴대폰번호', inputType: 'text', required: false },
];

const showPassword = ref(false);
const showPassword2 = ref(false);

// 필수 필드 검증
const isFormValid = computed(() => {
  const requiredFields = fields.filter(field => field.required);
  return requiredFields.every(field => {
    const value = formData.value[field.key];
    return value && value.trim() !== '';
  }) && formData.value.password === formData.value.confirmPassword;
});

// 필드 검증 (focus 이벤트용)
const checkPasswordMatch = (event) => {
  // 업체명 필드로 포커스할 때 비밀번호 일치 여부 확인
  if (event.target.id === 'companyName') {
    if (formData.value.confirmPassword && formData.value.password !== formData.value.confirmPassword) {
      // 업체명 필드에서 포커스 제거
      event.target.blur();
      alert('비밀번호가 일치하지 않습니다.');
      // 팝업 확인 후 비밀번호 확인 입력창으로 포커스
      setTimeout(() => {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
          confirmPasswordInput.focus();
          confirmPasswordInput.select();
        }
      }, 100);
    }
  }
  
  // 대표자명 필드로 포커스할 때 사업자등록번호 형식 확인
  if (event.target.id === 'representativeName') {
    const businessNumber = formData.value.businessRegistrationNumber.replace(/[^0-9]/g, '');
    if (businessNumber.length !== 10) {
      // 대표자명 필드에서 포커스 제거
      event.target.blur();
      alert('사업자등록번호는 10자리여야 합니다.');
      // 팝업 확인 후 사업자등록번호 입력창으로 포커스
      setTimeout(() => {
        const businessNumberInput = document.getElementById('businessRegistrationNumber');
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
  if (target.id === 'businessRegistrationNumber' || target.id === 'mobilePhone') {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  const target = event.target;
  if (target.id === 'businessRegistrationNumber') {
    let value = target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
    
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
    
    formData.value.businessRegistrationNumber = value;
  }
  
  // 휴대폰번호 형식 변환
  if (target.id === 'mobilePhone') {
    let value = target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
    
    if (value.length > 11) {
      value = value.substring(0, 11); // 최대 11자리로 제한
    }
    
    // 형식 변환: 010-####-####
    if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    if (value.length >= 8) {
      value = value.substring(0, 8) + '-' + value.substring(8);
    }
    
    // 최대 13자리(하이픈 포함)로 제한
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    formData.value.mobilePhone = value;
  }
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  const target = event.target;
  if ((target.id === 'businessRegistrationNumber' || target.id === 'mobilePhone') && event.key === 'Backspace') {
    const cursorPosition = target.selectionStart;
    const value = target.value;
    
    // 커서 위치에 하이픈이 있으면 한 칸 더 뒤로 이동
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      if (target.id === 'businessRegistrationNumber') {
        formData.value.businessRegistrationNumber = value.substring(0, newPosition) + value.substring(cursorPosition);
      } else if (target.id === 'mobilePhone') {
        formData.value.mobilePhone = value.substring(0, newPosition) + value.substring(cursorPosition);
      }
      
      // 커서 위치 조정
      setTimeout(() => {
        target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

const handleSignup = async () => {
  // 필수 필드 검증
  const requiredFields = fields.filter(field => field.required);
  for (const field of requiredFields) {
    const value = formData.value[field.key];
    if (!value || value.trim() === '') {
      alert(`${field.label}은(는) 필수 입력 항목입니다.`);
      return;
    }
  }
  
  if (formData.value.password !== formData.value.confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  
  // 사업자등록번호 형식 검증
  const businessNumber = formData.value.businessRegistrationNumber.replace(/-/g, '');
  if (businessNumber.length !== 10) {
    alert('사업자등록번호는 10자리 숫자여야 합니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessRegistrationNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }
  
  if (!/^\d{10}$/.test(businessNumber)) {
    alert('사업자등록번호는 숫자만 입력 가능합니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessRegistrationNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }
  
  // 이메일 형식 검증 (간단한 형식만 체크)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.value.email)) {
    alert('이메일 형식이 올바르지 않습니다. (예: user@example.com)');
    setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.focus();
        emailInput.select();
      }
    }, 100);
    return;
  }
  
  // 휴대폰번호 형식 검증 (입력된 경우에만)
  if (formData.value.mobilePhone && formData.value.mobilePhone.trim() !== '') {
    const phoneNumber = formData.value.mobilePhone.replace(/[^0-9]/g, '');
    if (phoneNumber.length !== 11 || !phoneNumber.startsWith('010')) {
      alert('휴대폰번호 형식이 올바르지 않습니다.');
      // 팝업 확인 후 휴대폰번호 입력창으로 포커스
      setTimeout(() => {
        const mobilePhoneInput = document.getElementById('mobilePhone');
        if (mobilePhoneInput) {
          mobilePhoneInput.focus();
          mobilePhoneInput.select();
        }
      }, 100);
      return;
    }
  }
  try {
    // 1단계: Supabase Auth로 직접 사용자 계정 생성 (자동 로그인 비활성화)
    const { data, error } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
      options: {
        data: {
          name: formData.value.companyName,
          phone: formData.value.mobilePhone || null,
          user_type: 'user'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        emailConfirm: false
      }
    });

    // 회원가입 후 자동 로그인 방지 - 세션 강제 제거
    if (data.session) {
      await supabase.auth.signOut();
    }
    
    // 추가로 현재 세션 상태 확인 및 제거
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      await supabase.auth.signOut();
    }

    if (error) {
      console.error('Supabase Auth 오류:', error);
      
      // 이메일 검증 오류인 경우 대안 제시
      if (error.message && (error.message.includes('invalid') || 
          error.message.includes('Email address') ||
          error.message.includes('Unable to validate email') ||
          error.message.includes('유효하지 않'))) {
        
        const useTestEmail = confirm(
          '이메일 주소가 유효하지 않습니다.\n\n' +
          '테스트를 위해 다음 중 하나를 선택하세요:\n' +
          '1. "확인" - test@example.com으로 가입\n' +
          '2. "취소" - 다른 이메일 주소 사용'
        );
        
        if (useTestEmail) {
          // 테스트 이메일로 재시도
          const { data: testData, error: testError } = await supabase.auth.signUp({
            email: 'test@example.com',
            password: formData.value.password,
            options: {
              data: {
                name: formData.value.companyName,
                phone: formData.value.mobilePhone || null,
                user_type: 'user'
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              emailConfirm: false
            }
          });
          
          if (testError) {
            console.error('테스트 이메일 가입 실패:', testError);
            alert('테스트 이메일 가입에도 실패했습니다. 관리자에게 문의해주세요.');
            return;
          }
          
          if (!testData.user) {
            alert('사용자 ID를 가져올 수 없습니다. 관리자에게 문의해주세요.');
            return;
          }
          
          // 테스트 이메일로 회사 정보 등록
          const companyData = {
            user_id: testData.user.id,
            email: 'test@example.com',
            company_name: formData.value.companyName,
            business_registration_number: formData.value.businessRegistrationNumber,
            representative_name: formData.value.representativeName,
            business_address: formData.value.businessAddress,
            contact_person_name: formData.value.contactPersonName,
            mobile_phone: formData.value.mobilePhone,
            user_type: 'user',
            approval_status: 'pending',
            created_by: testData.user.id,
          };

          // 테스트 이메일 회원가입 후 자동 로그인 방지 - 세션 강제 제거
          if (testData.session) {
            await supabase.auth.signOut();
          }
          
          // 추가로 현재 세션 상태 확인 및 제거
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            await supabase.auth.signOut();
          }
          
          const { error: companyInsertError } = await supabase
            .from('companies')
            .insert([companyData]);
          
          if (companyInsertError) {
            console.error('테스트 회사 정보 삽입 실패:', companyInsertError);
            alert('회사 정보 등록에 실패했습니다. 관리자에게 문의해주세요.');
            return;
          }
          
          alert('테스트 이메일(test@example.com)로 가입이 완료되었습니다.');
          router.push('/login');
          return;
        } else {
          alert('다른 이메일 주소를 사용해주세요.');
          return;
        }
      }
      
      throw error;
    }

    // 2단계: 사업자등록번호 중복 검증 (인증 후)
    if (data.user) {
      try {
        // 사업자등록번호에서 하이픈 제거하여 검색
        const cleanBusinessNumber = formData.value.businessRegistrationNumber.replace(/-/g, '');
        
        const { data: existingCompany, error: checkError } = await supabase
          .from('companies')
          .select('id')
          .eq('business_registration_number', cleanBusinessNumber)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없는 경우
          console.error('사업자등록번호 중복 검사 실패:', checkError);
          alert('사업자등록번호 중복 검사 중 오류가 발생했습니다. 다시 시도해주세요.');
          return;
        } else if (existingCompany) {
          alert('동일한 사업자등록번호로 이미 가입된 이력이 있습니다.');
          setTimeout(() => {
            const businessNumberInput = document.getElementById('businessRegistrationNumber');
            if (businessNumberInput) {
              businessNumberInput.focus();
              businessNumberInput.select();
            }
          }, 100);
          return;
        }
      } catch (duplicateCheckError) {
        console.error('사업자등록번호 중복 검사 중 오류 발생:', duplicateCheckError);
        alert('사업자등록번호 중복 검사 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
      
      // 3단계: 회사 정보 등록
      const companyData = {
        user_id: data.user.id,
        email: formData.value.email,
        company_name: formData.value.companyName,
        business_registration_number: formData.value.businessRegistrationNumber.replace(/-/g, ''),
        representative_name: formData.value.representativeName,
        business_address: formData.value.businessAddress,
        contact_person_name: formData.value.contactPersonName,
        mobile_phone: formData.value.mobilePhone,
        user_type: 'user',
        approval_status: 'pending',
        created_by: data.user.id,
      };
      
      const { error: companyInsertError } = await supabase
        .from('companies')
        .insert([companyData]);
      
      if (companyInsertError) {
        console.error('회사 정보 삽입 실패:', companyInsertError);
        
        let errorMessage = '회사 정보 등록에 실패했습니다.';
        
        // 구체적인 오류 메시지 처리
        if (companyInsertError.message.includes('row-level security policy')) {
          errorMessage = '보안 정책으로 인해 회사 정보 등록이 제한되었습니다. 관리자에게 문의해주세요.';
        } else if (companyInsertError.message.includes('duplicate key')) {
          errorMessage = '이미 등록된 사업자등록번호입니다. 다른 사업자등록번호를 사용해주세요.';
        } else if (companyInsertError.message.includes('foreign key')) {
          errorMessage = '사용자 정보와 연결할 수 없습니다. 다시 시도해주세요.';
        } else if (companyInsertError.message.includes('not null')) {
          errorMessage = '필수 정보가 누락되었습니다. 모든 필수 항목을 입력해주세요.';
        } else if (companyInsertError.message.includes('unique')) {
          errorMessage = '중복된 정보가 있습니다. 다른 정보를 입력해주세요.';
        } else if (companyInsertError.code) {
          errorMessage = `회사 정보 등록 실패 (오류 코드: ${companyInsertError.code})`;
        } else if (companyInsertError.message) {
          errorMessage = `회사 정보 등록 실패: ${companyInsertError.message}`;
        }
        
        alert(errorMessage);
        console.error('상세 오류 정보:', {
          message: companyInsertError.message,
          code: companyInsertError.code,
          details: companyInsertError.details,
          hint: companyInsertError.hint
        });
        return;
      }
      
      console.log('회사 정보 등록 성공');
    }
    
    // 회원가입 완료 - 최종 세션 확인 및 제거
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    if (finalSession) {
      await supabase.auth.signOut();
    }
    
    alert('회원가입이 완료되었습니다. 로그인 페이지에서 로그인해주세요.');
    router.push('/login');
    
  } catch (error) {
    console.error('Signup error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    
    let errorMessage = '회원가입에 실패했습니다.';
    
    if (error.message === 'User already registered') {
      errorMessage = '이미 등록된 아이디입니다.';
    } else if (error.message === 'Unable to validate email address: invalid format') {
      errorMessage = '아이디를 이메일 형식으로 입력해주세요. (예: user@example.com)';
    } else if (error.message && error.message.includes('invalid')) {
      errorMessage = '입력한 이메일 주소가 유효하지 않습니다. 올바른 이메일 주소를 입력해주세요.';
    } else if (error.message && error.message.includes('Email address')) {
      errorMessage = '이메일 주소가 유효하지 않습니다. 실제 존재하는 이메일 주소를 사용하거나, 관리자에게 문의하세요.';
    } else if (error.message && error.message.includes('password')) {
      errorMessage = '비밀번호가 요구사항을 충족하지 않습니다. (최소 6자 이상)';
    } else if (error.message && error.message.includes('network')) {
      errorMessage = '네트워크 연결을 확인해주세요.';
    } else if (error.error_description) {
      errorMessage = error.error_description;
    } else if (error.message) {
      errorMessage = `회원가입 실패: ${error.message}`;
    }
    
    alert(errorMessage);
  }
};

const goToLogin = () => {
  router.push('/login');
};

onMounted(() => {
  document.body.classList.add('no-main-padding');
});

onUnmounted(() => {
  document.body.classList.remove('no-main-padding');
});
</script>

<style scoped>
.required {
  color: #e74c3c;
  margin-left: 4px;
}

.signup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


</style>
