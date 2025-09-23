<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <h2 style="text-align: left; font-size: 1.4rem; font-weight: 600; color: #333;">비밀번호 재설정</h2>

      <div v-if="loading" class="loading">
        처리 중입니다...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
        <div v-if="error.includes('만료') || error.includes('expired')" class="error-actions">
          <p style="margin: 1rem 0; font-size: 0.9rem; color: #666;">
            새로운 비밀번호 재설정 링크를 받으시겠습니까?
          </p>
          <button @click="requestNewLink" class="btn-new-link">새 링크 요청하기</button>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
    console.log('URL 파라미터:', window.location.search);
    
    // URL에서 토큰 확인 (먼저 토큰 유효성 검증)
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const token = urlParams.get('token');
    const code = urlParams.get('code'); // Code flow token
    const type = urlParams.get('type');
    
    // 에러 파라미터 확인
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');
    
    console.log('URL 파라미터 분석:', {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      token: !!token,
      code: !!code,
      type: type,
      error: error,
      errorCode: errorCode,
      errorDescription: errorDescription,
      fullSearch: window.location.search
    });
    
    // 에러 파라미터가 있는 경우 처리
    if (error) {
      console.log('에러 파라미터 감지됨:', { error, errorCode, errorDescription });
      
      let errorMessage = '비밀번호 재설정 링크에 문제가 있습니다.';
      
      if (errorCode === 'otp_expired') {
        errorMessage = '비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.';
      } else if (error === 'access_denied') {
        errorMessage = '비밀번호 재설정 링크에 접근할 수 없습니다. 링크가 만료되었거나 유효하지 않습니다.';
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      }
      
      console.error('비밀번호 재설정 에러:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // type=recovery 파라미터가 있는 경우 특별 처리
    if (type === 'recovery' && !token && !code && (!accessToken || !refreshToken)) {
      console.log('type=recovery 파라미터 감지됨. Supabase verify 엔드포인트에서 리다이렉트된 것으로 판단됩니다.');
      
      // 비밀번호 재설정 플래그 설정
      window.isPasswordResetPage = true;
      
      // 더 긴 대기 시간으로 Supabase가 세션을 설정할 시간을 줌
      console.log('Supabase가 세션을 설정할 때까지 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 3초 → 5초로 증가
      
      // 여러 방법으로 세션 확인
      let session = null;
      let sessionError = null;
      
      // 1. getSession() 시도
      const sessionResult = await resetSupabase.auth.getSession();
      session = sessionResult.data.session;
      sessionError = sessionResult.error;
      
      // 2. getUser() 시도 (세션이 없어도 사용자 정보가 있을 수 있음)
      if (!session) {
        console.log('getSession()에서 세션을 찾지 못했습니다. getUser()를 시도합니다...');
        const userResult = await resetSupabase.auth.getUser();
        if (userResult.data.user && !userResult.error) {
          console.log('getUser()에서 사용자 정보를 발견했습니다:', userResult.data.user.email);
          // 사용자 정보가 있으면 임시 세션 객체 생성
          session = { user: userResult.data.user };
        }
      }
      
      // 3. 추가 대기 후 재시도
      if (!session) {
        console.log('첫 번째 시도에서 세션을 찾지 못했습니다. 추가 대기 후 재시도...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 2초 → 3초로 증가
        
        const retrySessionResult = await resetSupabase.auth.getSession();
        session = retrySessionResult.data.session;
        sessionError = retrySessionResult.error;
        
        if (!session) {
          const retryUserResult = await resetSupabase.auth.getUser();
          if (retryUserResult.data.user && !retryUserResult.error) {
            console.log('재시도에서 사용자 정보를 발견했습니다:', retryUserResult.data.user.email);
            session = { user: retryUserResult.data.user };
          }
        }
      }
      
      // 4. 최종 재시도 (3차 시도)
      if (!session) {
        console.log('두 번째 시도에서도 세션을 찾지 못했습니다. 최종 재시도...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalSessionResult = await resetSupabase.auth.getSession();
        session = finalSessionResult.data.session;
        sessionError = finalSessionResult.error;
        
        if (!session) {
          const finalUserResult = await resetSupabase.auth.getUser();
          if (finalUserResult.data.user && !finalUserResult.error) {
            console.log('최종 재시도에서 사용자 정보를 발견했습니다:', finalUserResult.data.user.email);
            session = { user: finalUserResult.data.user };
          }
        }
      }
      
      if (session && session.user) {
        console.log('자동으로 설정된 세션을 발견했습니다:', session.user.email);
        console.log('Supabase verify 엔드포인트에서 리다이렉트된 것으로 확인됩니다.');
      } else {
        console.error('세션도 설정되지 않았습니다:', sessionError);
        console.log('현재 URL:', window.location.href);
        console.log('URL 파라미터:', window.location.search);
        console.log('referrer:', document.referrer);
        
        // 추가 디버깅 정보
        const allCookies = document.cookie;
        console.log('현재 쿠키:', allCookies);
        
        throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 링크가 만료되었거나 손상되었을 수 있습니다. 다시 시도해주세요.');
      }
    }
    // 기존 토큰 유효성 검증
    else if (!token && !code && (!accessToken || !refreshToken)) {
      console.error('토큰 누락:', { 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken, 
        token: !!token,
        code: !!code 
      });
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 링크가 만료되었거나 손상되었을 수 있습니다. 다시 시도해주세요.');
    }
    
    // PKCE 토큰이 있는 경우 세션을 자동으로 설정하도록 대기
    if (token && type === 'recovery') {
      console.log('PKCE 토큰 감지됨. Supabase가 자동으로 세션을 설정할 때까지 대기...');
      // 잠시 대기하여 Supabase가 자동으로 세션을 설정하도록 함
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 세션 상태 확인
      const { data: { session }, error: sessionError } = await resetSupabase.auth.getSession();
      if (session && session.user) {
        console.log('비밀번호 재설정을 위한 세션이 설정되었습니다:', session.user.email);
        // 비밀번호 재설정 플래그 설정
        window.isPasswordResetPage = true;
        
        // PKCE 토큰으로 생성된 세션은 임시 세션이므로, 
        // 비밀번호 재설정 완료 후 자동으로 로그아웃되도록 처리
        console.log('PKCE 토큰으로 생성된 임시 세션입니다. 비밀번호 재설정 완료 후 자동 로그아웃됩니다.');
      } else {
        console.error('세션 설정 실패:', sessionError);
        throw new Error('비밀번호 재설정 세션을 설정할 수 없습니다. 다시 시도해주세요.');
      }
    }
    
    // Code 플로우 토큰이 있는 경우 처리
    if (code) {
      console.log('Code 플로우 토큰 감지됨:', code);
      // 비밀번호 재설정 플래그 설정
      window.isPasswordResetPage = true;
      
      try {
        // Code를 사용하여 세션 교환 시도
        const { data, error } = await resetSupabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Code 교환 실패:', error);
          
          // code_verifier가 없는 경우 (PKCE 플로우가 아닌 경우)
          if (error.message.includes('code verifier') || error.message.includes('code_verifier')) {
            console.log('PKCE code_verifier가 없습니다. URL의 hash fragment를 확인합니다...');
            
            // URL hash에서 토큰 정보 확인 (Supabase가 hash에 토큰을 넣을 수 있음)
            const hash = window.location.hash.substring(1);
            const hashParams = new URLSearchParams(hash);
            const hashAccessToken = hashParams.get('access_token');
            const hashRefreshToken = hashParams.get('refresh_token');
            
            if (hashAccessToken && hashRefreshToken) {
              console.log('Hash에서 토큰을 발견했습니다. 세션을 설정합니다...');
              const { data: sessionData, error: sessionError } = await resetSupabase.auth.setSession({
                access_token: hashAccessToken,
                refresh_token: hashRefreshToken
              });
              
              if (sessionData.session && sessionData.user) {
                console.log('Hash 토큰으로 세션이 설정되었습니다:', sessionData.user.email);
                console.log('Code 플로우로 생성된 임시 세션입니다. 비밀번호 재설정 완료 후 자동 로그아웃됩니다.');
              } else {
                throw new Error('Hash 토큰으로 세션 설정에 실패했습니다.');
              }
            } else {
              // Hash에도 토큰이 없으면 URL에서 직접 code로 세션 설정 시도
              console.log('Hash에 토큰이 없습니다. Code로 직접 세션 설정을 시도합니다...');
              
              // 현재 URL을 Supabase가 처리할 수 있도록 설정
              const currentUrl = window.location.href;
              console.log('현재 URL을 Supabase가 처리합니다:', currentUrl);
              
              // Supabase가 자동으로 세션을 설정할 때까지 대기
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // 세션 상태 확인
              const { data: { session }, error: sessionError } = await resetSupabase.auth.getSession();
              if (session && session.user) {
                console.log('자동으로 설정된 세션을 발견했습니다:', session.user.email);
                console.log('Code 플로우로 생성된 임시 세션입니다. 비밀번호 재설정 완료 후 자동 로그아웃됩니다.');
              } else {
                throw new Error('세션 설정에 실패했습니다. 다시 시도해주세요.');
              }
            }
          } else {
            throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 링크가 만료되었거나 손상되었을 수 있습니다. 다시 시도해주세요.');
          }
        } else if (data.session && data.user) {
          console.log('Code 플로우로 세션이 설정되었습니다:', data.user.email);
          console.log('Code 플로우로 생성된 임시 세션입니다. 비밀번호 재설정 완료 후 자동 로그아웃됩니다.');
        } else {
          throw new Error('세션 설정에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (err) {
        console.error('Code 플로우 처리 오류:', err);
        throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 링크가 만료되었거나 손상되었을 수 있습니다. 다시 시도해주세요.');
      }
    }
    
    // 기존 세션 사용자 확인 (보안 검증용)
    const { data: { user: existingUser } } = await resetSupabase.auth.getUser();
    console.log('기존 세션 사용자:', existingUser?.email || '없음');
    
    // Code 플로우나 PKCE 플로우가 성공적으로 처리된 경우 기존 토큰 플로우 건너뛰기
    if (code || (token && type === 'recovery')) {
      console.log('Code/PKCE 플로우가 성공적으로 처리되었습니다. 기존 토큰 플로우를 건너뜁니다.');
    } else {
      // 기존 토큰 플로우 처리
      console.log('기존 토큰 플로우로 처리합니다.');
      
      // 토큰으로 사용자 정보 확인 (세션 설정 전에 미리 확인)
      const { data: { user }, error: userError } = await resetSupabase.auth.getUser(accessToken);
      
      if (userError || !user) {
        console.error('사용자 확인 실패:', userError);
        throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다. 다시 시도해주세요.');
      }
      
      console.log('재설정 링크 사용자 확인:', user.email);
    }
    
    // Code/PKCE 플로우가 아닌 경우에만 토큰으로 세션 설정
    if (!code && !(token && type === 'recovery')) {
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
    } else {
      console.log('Code/PKCE 플로우로 세션이 이미 설정되었습니다.');
    }
    
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
    const code = urlParams.get('code');
    
    // 현재 세션 사용자와 재설정 링크 사용자 비교 (보안 검증)
    const { data: { user: currentUser } } = await resetSupabase.auth.getUser();
    console.log('비밀번호 변경 요청 - 현재 세션 사용자:', currentUser?.email || '없음');
    
    // Code 플로우인 경우 재설정 링크의 사용자 정보 확인
    if (code) {
      // Code 플로우에서는 현재 세션이 재설정 링크와 일치하는지 확인
      if (currentUser) {
        console.log('현재 로그인된 사용자:', currentUser.email);
        console.log('Code 플로우로 비밀번호를 재설정합니다.');
        
        // 사용자에게 확인 요청
        const confirmMessage = `현재 ${currentUser.email} 계정으로 로그인되어 있습니다.\n이 계정의 비밀번호를 변경하시겠습니까?`;
        if (!confirm(confirmMessage)) {
          throw new Error('비밀번호 변경이 취소되었습니다.');
        }
      } else {
        console.log('현재 로그인된 사용자가 없습니다. Code 플로우로 진행합니다.');
      }
    }
    
    // Code 플로우이거나 세션이 자동으로 설정된 경우 현재 세션 사용
    if (code || (!accessToken && !refreshToken)) {
      console.log(code ? 'Code 플로우로 비밀번호 재설정 진행' : '자동 설정된 세션으로 비밀번호 재설정 진행');
      
      // URL에서 code 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const currentCode = urlParams.get('code');
      
      if (code && currentCode !== code) {
        throw new Error('보안 오류: 비밀번호 재설정 링크가 변경되었습니다. 다시 시도해주세요.');
      }
      
      const { data: { user }, error: userError } = await resetSupabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
      }
      
      console.log(`=== ${code ? 'Code' : '자동 설정'} 플로우 사용자 정보 ===`);
      console.log('사용자 이메일:', user.email);
      console.log('사용자 ID:', user.id);
      
      // 보안 검증: 재설정 링크의 사용자가 실제로 비밀번호 재설정을 요청한 사용자인지 확인
      if (!user.email_confirmed_at) {
        throw new Error('이메일 인증이 완료되지 않은 계정입니다.');
      }
      
      console.log(`✅ ${code ? 'Code' : '자동 설정'} 플로우 보안 검증 통과 - 비밀번호 변경 진행`);
      
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
      return;
    }
    
    // 기존 토큰 플로우 처리
    if (!accessToken) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    // 토큰으로 사용자 정보 확인
    const { data: { user }, error: userError } = await resetSupabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      throw new Error('비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요.');
    }
    
    console.log('=== 기존 토큰 플로우 사용자 정보 ===');
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

// 새 링크 요청 함수
async function requestNewLink() {
  const email = prompt('비밀번호 재설정 링크를 받을 이메일 주소를 입력해주세요:');
  if (!email) return;
  
  try {
    const { error } = await resetSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });
    
    if (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } else {
      alert('새로운 비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.');
      router.push('/login');
    }
  } catch (err) {
    console.error('새 링크 요청 오류:', err);
    alert('새 링크 요청 중 오류가 발생했습니다.');
  }
}

// 페이지 이탈 시 플래그 정리
onUnmounted(() => {
  if (window.isPasswordResetPage) {
    console.log('비밀번호 재설정 페이지 이탈 - 플래그 정리');
    window.isPasswordResetPage = false;
  }
});


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

.btn-new-link {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.btn-new-link:hover {
  background-color: #218838;
}

.error-actions {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

</style> 