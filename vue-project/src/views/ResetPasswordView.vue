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
import { supabase } from '@/supabase';

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

onMounted(async () => {
  try {
    console.log('비밀번호 재설정 페이지 초기화 시작');
    console.log('현재 URL:', window.location.href);
    
    // 라우터 가드 우회를 위한 글로벌 플래그 설정 (페이지 로드 즉시)
    window.isPasswordResetPage = true;
    console.log('비밀번호 재설정 페이지 플래그 설정 완료');
    
    // 보안 강화: 기존 로그인 세션 제거
    console.log('기존 로그인 세션 제거 중...');
    await supabase.auth.signOut();
    console.log('기존 세션 제거 완료');
    
    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('세션 확인 오류:', sessionError);
      // 세션 오류가 있어도 계속 진행 (토큰으로 세션 설정 시도)
    }
    
    console.log('현재 세션:', session ? '존재' : '없음');
    
    // 세션이 없으면 URL 파라미터에서 토큰 확인
    if (!session) {
      console.log('세션이 없음. URL 파라미터 확인 중...');
      
      // 1. URL 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      console.log('URL 파라미터 - access_token:', accessToken ? '존재' : '없음');
      console.log('URL 파라미터 - refresh_token:', refreshToken ? '존재' : '없음');
      
      if (accessToken) {
        console.log('URL 파라미터에서 토큰 발견. 세션 설정 중...');
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (setSessionError) {
          console.error('세션 설정 오류:', setSessionError);
          // 세션 설정 실패해도 계속 진행 (사용자가 수동으로 처리할 수 있도록)
        } else {
          console.log('세션 설정 성공');
        }
      } else {
        // 2. 해시 파라미터 확인
        console.log('해시 파라미터 확인 중...');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        
        console.log('해시 파라미터 - access_token:', hashAccessToken ? '존재' : '없음');
        console.log('해시 파라미터 - refresh_token:', hashRefreshToken ? '존재' : '없음');
        
        if (hashAccessToken) {
          console.log('해시 파라미터에서 토큰 발견. 세션 설정 중...');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken
          });
          
          if (setSessionError) {
            console.error('세션 설정 오류:', setSessionError);
            // 세션 설정 실패해도 계속 진행
          } else {
            console.log('세션 설정 성공');
          }
        } else {
          // 3. 전체 URL에서 토큰 패턴 찾기
          console.log('전체 URL에서 토큰 패턴 검색 중...');
          const url = window.location.href;
          const tokenMatch = url.match(/[?&]access_token=([^&]+)/);
          const refreshMatch = url.match(/[?&]refresh_token=([^&]+)/);
          
          if (tokenMatch) {
            console.log('URL 패턴에서 토큰 발견. 세션 설정 중...');
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: decodeURIComponent(tokenMatch[1]),
              refresh_token: refreshMatch ? decodeURIComponent(refreshMatch[1]) : null
            });
            
            if (setSessionError) {
              console.error('세션 설정 오류:', setSessionError);
              // 세션 설정 실패해도 계속 진행
            } else {
              console.log('세션 설정 성공');
            }
          } else {
            console.log('토큰을 찾을 수 없음 - 사용자가 수동으로 처리할 수 있도록 계속 진행');
            // 토큰이 없어도 에러를 던지지 않고 계속 진행
          }
        }
      }
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
    // 현재 세션의 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('사용자 정보를 확인할 수 없습니다. 비밀번호 재설정 링크가 유효하지 않습니다.');
    }
    
    console.log('비밀번호 변경 대상 사용자:', user.email);
    
    // 해당 사용자의 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value
    });
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    alert('비밀번호가 성공적으로 변경되었습니다.');
    
    // 로그아웃 후 로그인 페이지로 이동
    await supabase.auth.signOut();
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