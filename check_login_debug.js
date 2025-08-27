// 브라우저 콘솔에서 실행할 로그인 디버깅 스크립트
console.log('=== 로그인 디버깅 시작 ===');

// 1. 현재 페이지 정보 확인
console.log('현재 URL:', window.location.href);
console.log('페이지 제목:', document.title);

// 2. 로그인 폼 요소들 확인
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const loginButton = document.querySelector('.login-btn');

console.log('이메일 입력 필드:', emailInput);
console.log('비밀번호 입력 필드:', passwordInput);
console.log('로그인 버튼:', loginButton);

// 3. 로그인 버튼의 모든 속성 확인
if (loginButton) {
  console.log('로그인 버튼 클래스:', loginButton.className);
  console.log('로그인 버튼 텍스트:', loginButton.textContent);
  console.log('로그인 버튼 비활성화 상태:', loginButton.disabled);
  console.log('로그인 버튼 type:', loginButton.type);
}

// 4. 폼 요소들의 값 확인
if (emailInput) {
  console.log('이메일 입력 필드 값:', emailInput.value);
  console.log('이메일 입력 필드 ID:', emailInput.id);
}

if (passwordInput) {
  console.log('비밀번호 입력 필드 값:', passwordInput.value);
  console.log('비밀번호 입력 필드 ID:', passwordInput.id);
}

// 5. 모든 버튼 요소 확인
const allButtons = document.querySelectorAll('button');
console.log('페이지의 모든 버튼:', allButtons);
allButtons.forEach((btn, index) => {
  console.log(`버튼 ${index}:`, {
    text: btn.textContent,
    class: btn.className,
    type: btn.type,
    disabled: btn.disabled
  });
});

console.log('=== 로그인 디버깅 완료 ===');
