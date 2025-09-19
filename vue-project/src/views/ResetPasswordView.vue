<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <h2 style="text-align: left; font-size: 1.4rem; font-weight: 600; color: #333;">비밀번호 재설정</h2>

      <div v-if="loading" class="loading">
        처리 중입니다...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
        <br><br>
        <button @click="$router.push('/login')" class="btn-login">로그인 페이지로 이동</button>
      </div>
      <form v-else @submit.prevent="handleResetPassword" class="reset-form">
        <div class="form-group">
          <label for="password">새 비밀번호</label>
          <div style="position: relative;">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              required 
              minlength="6"
              placeholder="새 비밀번호를 입력하세요"
              style="padding-right:2.5rem;"
            />
            <i
              :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              style="position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888; font-size: 1.2rem;"
              @click="showPassword = !showPassword"
            ></i>
          </div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <div style="position: relative;">
            <input 
              :type="showPassword2 ? 'text' : 'password'" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              required 
              minlength="6"
              placeholder="비밀번호를 다시 입력하세요"
              style="padding-right:2.5rem;"
            />
            <i
              :class="showPassword2 ? 'pi pi-eye-slash' : 'pi pi-eye'"
              style="position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888; font-size: 1.2rem;"
              @click="showPassword2 = !showPassword2"
            ></i>
          </div>
        </div>
        <button type="submit" :disabled="!canSubmit" class="btn-submit">
          비밀번호 변경
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '@/config/supabase.js';
import appConfig from '@/config/app.js';

// 비밀번호 재설정 전용 Supabase 클라이언트 (detectSessionInUrl 활성화)
const resetSupabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // 자동 세션 감지 활성화
    flowType: 'pkce',
    emailRedirectTo: appConfig.AUTH_CALLBACK_URL,
    emailConfirm: false,
    secureEmailChange: false,
    emailValidation: false,
    emailValidationRequired: false
  }
});

const router = useRouter();
const loading = ref(true);
const error = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showPassword2 = ref(false);

const canSubmit = computed(() => {
  return password.value.length >= 6 && 
         password.value === confirmPassword.value;
});

// 즉시 실행되는 초기화 코드 (페이지 로드 시점에 즉시 실행)
console.log('=== 비밀번호 재설정 페이지 즉시 초기화 시작 ===');
console.log('현재 URL:', window.location.href);
console.log('현재 pathname:', window.location.pathname);
console.log('현재 search:', window.location.search);
console.log('현재 hash:', window.location.hash);

// 라우터 가드 우회를 위한 글로벌 플래그 설정 (즉시)
window.isPasswordResetPage = true;
console.log('비밀번호 재설정 페이지 플래그 즉시 설정 완료');

// URL이 비밀번호 재설정 페이지인지 확인
if (window.location.pathname === '/reset-password') {
  console.log('비밀번호 재설정 페이지 URL 확인됨');
  window.isPasswordResetPage = true;
  console.log('플래그 재설정 완료:', window.isPasswordResetPage);
}

// 비밀번호 재설정 페이지임을 표시
console.log('비밀번호 재설정 페이지 감지됨');

console.log('=== 즉시 초기화 완료 ===');

onMounted(async () => {
  try {
    console.log('비밀번호 재설정 페이지 초기화 시작');
    console.log('현재 URL:', window.location.href);
    
    // URL에서 토큰 확인 (먼저 토큰 유효성 검증)
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    // 토큰으로 사용자 정보 확인 (세션 설정 전에 미리 확인)
    const { data: { user }, error: userError } = await resetSupabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    console.log('재설정 링크 사용자 확인:', user.email);
    
    // 모든 기존 세션 강제 로그아웃 (보안 강화)
    console.log('보안을 위해 모든 기존 세션 로그아웃 처리 중...');
    await resetSupabase.auth.signOut();
    
    // 잠시 대기 (로그아웃 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 토큰으로 세션 설정
    console.log('토큰으로 세션 설정 중...');
    const { data: { session }, error: setSessionError } = await resetSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (setSessionError || !session) {
      throw new Error('세션 설정에 실패했습니다. 다시 시도해주세요.');
    }
    
    // 세션 설정 후 사용자 재확인
    const { data: { user: sessionUser }, error: sessionUserError } = await resetSupabase.auth.getUser();
    
    if (sessionUserError || !sessionUser) {
      throw new Error('세션 사용자 정보를 확인할 수 없습니다. 다시 시도해주세요.');
    }
    
    // 보안 검증: 세션의 사용자가 토큰의 사용자와 일치하는지 확인
    if (sessionUser.id !== user.id) {
      throw new Error('보안 오류: 사용자 정보가 일치하지 않습니다. 다시 시도해주세요.');
    }
    
    console.log('세션 설정 성공 및 사용자 확인 완료:', sessionUser.email);
    
    loading.value = false;
  } catch (err) {
    console.error('비밀번호 재설정 페이지 초기화 오류:', err);
    error.value = err.message;
    loading.value = false;
  }
});

async function handleResetPassword() {
  if (!canSubmit.value) return;
  
  loading.value = true;
  
  try {
    console.log('=== 비밀번호 변경 시작 ===');
    console.log('현재 URL:', window.location.href);
    
    // 현재 활성 세션 확인 (디버깅용)
    const { data: { user: currentActiveUser } } = await resetSupabase.auth.getUser();
    console.log('현재 활성 세션 사용자:', currentActiveUser?.email, currentActiveUser?.id);
    
    // URL에서 직접 토큰 추출하여 사용자 확인
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (!accessToken) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    // 토큰으로 사용자 정보 확인
    const { data: { user }, error: userError } = await resetSupabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    console.log('=== 토큰 사용자 정보 ===');
    console.log('토큰 사용자 이메일:', user.email);
    console.log('토큰 사용자 ID:', user.id);
    console.log('현재 활성 사용자와 비교:', currentActiveUser?.id === user.id ? '동일' : '다름');
    
    // 보안 검증: 재설정 링크의 사용자가 실제로 비밀번호 재설정을 요청한 사용자인지 확인
    if (!user.email_confirmed_at) {
      throw new Error('이메일 인증이 완료되지 않은 계정입니다.');
    }
    
    // 토큰으로 세션 설정
    const { data: { session }, error: sessionError } = await resetSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (sessionError || !session) {
      throw new Error('세션 설정에 실패했습니다. 다시 시도해주세요.');
    }
    
    // 세션 설정 후 잠시 대기 (세션 적용 보장)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 현재 세션의 사용자 재확인
    const { data: { user: currentUser }, error: currentUserError } = await resetSupabase.auth.getUser();
    
    if (currentUserError || !currentUser) {
      throw new Error('사용자 정보를 확인할 수 없습니다. 다시 시도해주세요.');
    }
    
    // 보안 검증: 세션의 사용자가 URL 토큰의 사용자와 일치하는지 확인
    console.log('=== 최종 보안 검증 ===');
    console.log('세션 사용자 ID:', currentUser.id);
    console.log('토큰 사용자 ID:', user.id);
    console.log('사용자 일치 여부:', currentUser.id === user.id ? '✅ 일치' : '❌ 불일치');
    
    if (currentUser.id !== user.id) {
      throw new Error('보안 오류: 사용자 정보가 일치하지 않습니다. 다시 시도해주세요.');
    }
    
    console.log('✅ 보안 검증 통과 - 비밀번호 변경 진행');
    
    // 해당 사용자의 비밀번호 변경
    const { error: updateError } = await resetSupabase.auth.updateUser({
      password: password.value
    });
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    console.log('비밀번호 변경 성공. 즉시 로그아웃 처리 중...');
    
    // 비밀번호 변경 성공 후 즉시 로그아웃 (자동 로그인 방지)
    await resetSupabase.auth.signOut();
    console.log('로그아웃 완료');
    
    // 글로벌 플래그 제거
    window.isPasswordResetPage = false;
    
    alert('비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 로그인해주세요.');
    
    // 로그인 페이지로 이동
    router.push('/login');
    
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    
    // 에러 메시지를 한글로 변환
    let errorMessage = err.message;
    if (errorMessage.includes('New password should be different from the old password')) {
      errorMessage = '새 비밀번호는 기존 비밀번호와 달라야 합니다.';
    } else if (errorMessage.includes('사용자 정보를 확인할 수 없습니다')) {
      errorMessage = '비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.';
    }
    
    alert('비밀번호 변경 실패: ' + errorMessage);
    loading.value = false;
  }
}


</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.reset-password-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.reset-password-card h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  text-align: center;
  color: #e74c3c;
  padding: 1rem;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-submit {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  height: 36px;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.btn-submit:disabled {
  background-color: var(--primary-color-light);
  cursor: not-allowed;
}

.btn-login {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-login:hover {
  background-color: #545b62;
}

</style> 