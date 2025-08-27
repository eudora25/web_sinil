// 브라우저 콘솔에서 실행할 로그인 디버깅 스크립트
console.log('=== 로그인 디버깅 시작 ===');

// 1. 현재 페이지 확인
console.log('현재 URL:', window.location.href);
console.log('페이지 제목:', document.title);

// 2. 폼 요소들 찾기
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const loginButton = document.querySelector('.login-btn');

console.log('이메일 입력 필드:', emailInput);
console.log('비밀번호 입력 필드:', passwordInput);
console.log('로그인 버튼:', loginButton);

// 3. 수동으로 로그인 시도
async function tryLogin() {
  console.log('=== 수동 로그인 시도 ===');
  
  try {
    // 이메일과 비밀번호 설정
    if (emailInput) {
      emailInput.value = 'test1@test.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ 이메일 설정: test1@test.com');
    }
    
    if (passwordInput) {
      passwordInput.value = 'asdf1234';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ 비밀번호 설정: asdf1234');
    }
    
    // 로그인 버튼 상태 확인
    if (loginButton) {
      console.log('로그인 버튼 비활성화 상태:', loginButton.disabled);
      console.log('로그인 버튼 클래스:', loginButton.className);
      
      if (!loginButton.disabled) {
        console.log('로그인 버튼 클릭 시도...');
        loginButton.click();
        
        // 3초 후 결과 확인
        setTimeout(() => {
          console.log('로그인 후 URL:', window.location.href);
          console.log('로그인 후 페이지 제목:', document.title);
          
          // 오류 메시지 확인
          const alerts = document.querySelectorAll('.alert, .error, [role="alert"]');
          if (alerts.length > 0) {
            alerts.forEach((alert, index) => {
              console.log(`오류 메시지 ${index + 1}:`, alert.textContent);
            });
          }
        }, 3000);
      } else {
        console.log('❌ 로그인 버튼이 비활성화되어 있습니다.');
      }
    }
  } catch (error) {
    console.log('❌ 로그인 시도 중 오류:', error);
  }
}

// 4. Supabase 연결 상태 확인
console.log('=== Supabase 연결 상태 확인 ===');
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase 클라이언트가 로드되었습니다.');
  console.log('Supabase URL:', supabase.supabaseUrl);
} else {
  console.log('❌ Supabase 클라이언트를 찾을 수 없습니다.');
}

// 5. 실행
console.log('수동 로그인을 시도하려면 다음 함수를 호출하세요:');
console.log('tryLogin()');

console.log('=== 로그인 디버깅 완료 ===');
