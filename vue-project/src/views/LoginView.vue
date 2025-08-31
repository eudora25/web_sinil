<template>
  <div class="login-root">
    <div class="login-right">
      <div class="login-logo">신일제약 실적관리 시스템</div>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">아이디(이메일)</label>
          <input id="email" type="email" v-model="email" ref="emailInputRef" />
        </div>
        <div class="form-group" style="margin-top: 0rem; margin-bottom: 1rem;">
          <label for="password">비밀번호</label>
          <div style="position: relative;">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              style="padding-right: 2.5rem;"
            />
            <i
              :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              style="position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888; font-size: 1.2rem;"
              @click="showPassword = !showPassword"
            ></i>
          </div>
        </div>
        <Button :label="'로그인'" class="login-btn" :disabled="!canLogin" @click="handleLogin" style="margin-bottom: 0.75rem;" />
        <Button label="회원가입" class="signup-btn" @click="$router.push('/signup')" />
        <div class="login-link">
          <a href="#" @click.prevent="openPasswordResetModal">비밀번호를 잊으셨나요?</a>
        </div>
      </form>
      <div class="copyright">© 2025. 주식회사 팜플코리아 All Rights Reserved.</div>
    </div>
    
    <!-- 비밀번호 재설정 이메일 입력 모달 -->
    <teleport to="body">
      <div v-if="isPasswordResetModalOpen" class="modal-overlay" @click="closePasswordResetModal">
        <div class="modal-content modal-center" @click.stop>
          <div class="modal-header">
            <h3>비밀번호 찾기</h3>
            <button @click="closePasswordResetModal" class="btn-close-nobg">X</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1rem; font-size: 0.95rem;">비밀번호를 재설정하려면 아이디(이메일)를 입력해주세요.</p>
            <input 
              v-model="resetEmail" 
              type="email" 
              placeholder="가입 시 사용한 이메일 주소"
              class="modal-input"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closePasswordResetModal">취소</button>
            <button class="btn-primary" @click="handlePasswordReset" :disabled="loading">
              {{ loading ? '전송 중...' : '비밀번호 재설정 링크 받기' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 재설정 이메일 발송 완료 안내 모달 -->
    <teleport to="body">
       <div v-if="isConfirmationModalOpen" class="modal-overlay" @click="closeConfirmationModal">
        <div class="modal-content modal-center" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">안내</h2>
             <button @click="closeConfirmationModal" class="btn-close-nobg">X</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 1.0rem; margin-left: 0.25rem;">비밀번호 재설정 이메일을 보냈습니다.<br>받은 편지함을 확인해주세요.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="closeConfirmationModal">확인</button>
          </div>
        </div>
      </div>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import { supabase } from '@/supabase';
import { useRouter } from 'vue-router';
import config from '@/config/app.js';

const email = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const emailInputRef = ref(null);

const isPasswordResetModalOpen = ref(false);
const isConfirmationModalOpen = ref(false);
const resetEmail = ref('');
const showPassword = ref(false);

const canLogin = computed(() => email.value.trim() !== '' && password.value.trim() !== '');

const handleLogin = async () => {
  if (!canLogin.value) return;
  loading.value = true;
  try {
    // 1단계: 미등록 회원 확인 (companies 테이블에서 이메일 검색)
    const { data: companyRow, error: companyError } = await supabase
      .from('companies')
      .select('id, approval_status, user_type')
      .eq('email', email.value.trim().toLowerCase())
      .maybeSingle();
    
    if (companyError) {
      console.error('회사 정보 조회 오류:', companyError);
      alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      loading.value = false;
      return;
    }
    
    // 미등록 회원인 경우 로그인 차단
    if (!companyRow) {
      alert('미등록 회원입니다. 회원가입을 먼저 진행해주세요.');
      loading.value = false;
      return;
    }
    
    // 2단계: 승인 상태 확인
    if (companyRow.approval_status !== 'approved') {
      alert('미승인 회원입니다. 관리자에게 승인을 요청해주세요.');
      loading.value = false;
      return;
    }
    
    // 3단계: 인증 로그인 시도
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    
    if (authError) {
      console.error('Auth 오류:', authError);
      
      // 더 구체적인 오류 메시지 처리
      if (authError.message && authError.message.includes('Invalid login credentials')) {
        alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else if (authError.message && authError.message.includes('User not found')) {
        alert('등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.');
      } else if (authError.message && authError.message.includes('Email not confirmed')) {
        // 이메일 미확인 오류는 무시하고 로그인 허용
        console.log('이메일 미확인 상태이지만 로그인 허용');
        // 오류를 무시하고 계속 진행
      } else {
        alert(`로그인 오류: ${authError.message || '알 수 없는 오류가 발생했습니다.'}`);
        loading.value = false;
        return;
      }
      loading.value = false;
      return;
    }
    
    // 4단계: 로그인 성공 시 페이지 이동
    if (companyRow.user_type === 'admin') {
      router.push('/admin/notices');
    } else {
      router.push('/notices');
    }
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    loading.value = false;
  }
};

const openPasswordResetModal = () => {
  resetEmail.value = email.value; // 로그인 폼에 입력된 이메일을 기본값으로 설정
  isPasswordResetModalOpen.value = true;
};

const closePasswordResetModal = () => {
  isPasswordResetModalOpen.value = false;
  loading.value = false;
};

const closeConfirmationModal = () => {
  isConfirmationModalOpen.value = false;
};

const handlePasswordReset = async () => {
  if (!resetEmail.value) {
    alert('아이디(이메일)를 입력해주세요.');
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resetEmail.value)) {
    alert('올바른 이메일 형식으로 입력해주세요.');
    return;
  }
  
  loading.value = true;
  
  try {
    // 1단계: 해당 이메일이 실제로 등록되어 있는지 확인
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, email, approval_status')
      .eq('email', resetEmail.value.trim().toLowerCase())
      .maybeSingle();
    
    if (companyError) {
      console.error('회사 정보 조회 오류:', companyError);
      alert('이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      return;
    }
    
    // 2단계: 등록되지 않은 이메일인 경우
    if (!companyData) {
      alert('가입되지 않은 이메일입니다. 이메일 주소를 다시 확인해주세요.');
      return;
    }
    
    // 3단계: 승인되지 않은 계정인 경우
    if (companyData.approval_status !== 'approved') {
      alert('미승인 계정입니다. 관리자에게 승인을 요청해주세요.');
      return;
    }
    
          // 4단계: 비밀번호 재설정 메일 발송
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail.value, {
        redirectTo: config.RESET_PASSWORD_URL,
      });
    
    if (error) {
      if (error.message.includes('not found')) {
        alert('가입되지 않은 이메일입니다. 이메일 주소를 다시 확인해주세요.');
      } else {
        alert(`오류가 발생했습니다: ${error.message}`);
      }
    } else {
      closePasswordResetModal();
      isConfirmationModalOpen.value = true;
    }
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err);
    alert('예기치 않은 오류가 발생했습니다.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  document.body.classList.add('no-main-padding');
  if (emailInputRef.value) {
    emailInputRef.value.focus();
  }
});

onUnmounted(() => {
  document.body.classList.remove('no-main-padding');
});
</script> 