const puppeteer = require('puppeteer');

async function testSignup() {
  console.log('=== 회원가입 테스트 시작 ===');
  console.log('배포 URL: https://web-sinil.vercel.app/signup');
  console.log('');

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // 1. 회원가입 페이지 접속
    console.log('1. 회원가입 페이지 접속 중...');
    await page.goto('https://web-sinil.vercel.app/signup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 페이지 로딩 확인
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ 회원가입 페이지 로딩 완료');
    console.log('');

    // 2. 테스트 데이터 입력
    console.log('2. 테스트 데이터 입력 중...');
    
    // 회사 정보 입력
    await page.type('input[name="company_name"]', '테스트 회사');
    await page.type('input[name="business_registration_number"]', '123-45-67890');
    await page.type('input[name="representative_name"]', '홍길동');
    await page.type('input[name="business_address"]', '서울시 강남구 테스트로 123');
    await page.type('input[name="landline_phone"]', '02-1234-5678');
    await page.type('input[name="contact_person_name"]', '김담당');
    await page.type('input[name="mobile_phone"]', '010-1234-5678');
    await page.type('input[name="mobile_phone_2"]', '010-9876-5432');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="remarks"]', '테스트용 회사입니다.');
    
    console.log('✅ 회사 정보 입력 완료');
    console.log('');

    // 3. 사용자 계정 정보 입력
    console.log('3. 사용자 계정 정보 입력 중...');
    
    // 이메일과 비밀번호 입력
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', 'Test1234!');
    await page.type('input[name="confirmPassword"]', 'Test1234!');
    
    console.log('✅ 사용자 계정 정보 입력 완료');
    console.log('');

    // 4. 약관 동의
    console.log('4. 약관 동의 중...');
    
    // 약관 동의 체크박스 클릭
    const agreeCheckbox = await page.$('input[type="checkbox"]');
    if (agreeCheckbox) {
      await agreeCheckbox.click();
    }
    
    console.log('✅ 약관 동의 완료');
    console.log('');

    // 5. 회원가입 버튼 클릭
    console.log('5. 회원가입 버튼 클릭 중...');
    
    const signupButton = await page.$('button[type="submit"]');
    if (signupButton) {
      await signupButton.click();
    }
    
    console.log('✅ 회원가입 버튼 클릭 완료');
    console.log('');

    // 6. 결과 확인
    console.log('6. 회원가입 결과 확인 중...');
    
    // 성공 메시지 또는 에러 메시지 확인
    try {
      await page.waitForSelector('.success-message, .error-message, .alert', { timeout: 10000 });
      
      const message = await page.evaluate(() => {
        const successMsg = document.querySelector('.success-message');
        const errorMsg = document.querySelector('.error-message');
        const alertMsg = document.querySelector('.alert');
        
        if (successMsg) return successMsg.textContent;
        if (errorMsg) return errorMsg.textContent;
        if (alertMsg) return alertMsg.textContent;
        return '메시지를 찾을 수 없습니다.';
      });
      
      console.log('📝 결과 메시지:', message);
      
    } catch (error) {
      console.log('⚠️ 메시지 확인 실패:', error.message);
    }

    // 7. 페이지 이동 확인
    console.log('7. 페이지 이동 확인 중...');
    
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/dashboard')) {
      console.log('✅ 회원가입 성공 - 로그인 페이지 또는 대시보드로 이동');
    } else {
      console.log('⚠️ 회원가입 후 페이지 이동 확인 필요');
    }

    console.log('');
    console.log('=== 회원가입 테스트 완료 ===');
    
    // 브라우저를 열어둔 상태로 유지
    console.log('브라우저를 열어둔 상태로 유지합니다. 수동으로 확인해보세요.');
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30초 대기

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testSignup();
