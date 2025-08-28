const puppeteer = require('puppeteer');

async function inspectSignupPage() {
  console.log('=== 회원가입 페이지 구조 확인 ===');
  console.log('배포 URL: https://web-sinil.vercel.app/signup');
  console.log('');

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // 회원가입 페이지 접속
    console.log('회원가입 페이지 접속 중...');
    await page.goto('https://web-sinil.vercel.app/signup', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 페이지 로딩 확인
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ 회원가입 페이지 로딩 완료');
    console.log('');

    // 페이지 구조 분석
    console.log('=== 페이지 구조 분석 ===');
    
    // 모든 input 필드 확인
    const inputs = await page.evaluate(() => {
      const inputElements = document.querySelectorAll('input');
      return Array.from(inputElements).map(input => ({
        name: input.name,
        id: input.id,
        type: input.type,
        placeholder: input.placeholder,
        value: input.value
      }));
    });
    
    console.log('📝 Input 필드들:');
    inputs.forEach((input, index) => {
      console.log(`${index + 1}. name="${input.name}", id="${input.id}", type="${input.type}", placeholder="${input.placeholder}"`);
    });
    console.log('');

    // 모든 label 확인
    const labels = await page.evaluate(() => {
      const labelElements = document.querySelectorAll('label');
      return Array.from(labelElements).map(label => ({
        text: label.textContent.trim(),
        for: label.getAttribute('for')
      }));
    });
    
    console.log('📝 Label들:');
    labels.forEach((label, index) => {
      console.log(`${index + 1}. text="${label.text}", for="${label.for}"`);
    });
    console.log('');

    // 버튼 확인
    const buttons = await page.evaluate(() => {
      const buttonElements = document.querySelectorAll('button');
      return Array.from(buttonElements).map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        class: button.className
      }));
    });
    
    console.log('📝 Button들:');
    buttons.forEach((button, index) => {
      console.log(`${index + 1}. text="${button.text}", type="${button.type}", class="${button.class}"`);
    });
    console.log('');

    // 체크박스 확인
    const checkboxes = await page.evaluate(() => {
      const checkboxElements = document.querySelectorAll('input[type="checkbox"]');
      return Array.from(checkboxElements).map(checkbox => ({
        name: checkbox.name,
        id: checkbox.id,
        checked: checkbox.checked
      }));
    });
    
    console.log('📝 Checkbox들:');
    checkboxes.forEach((checkbox, index) => {
      console.log(`${index + 1}. name="${checkbox.name}", id="${checkbox.id}", checked="${checkbox.checked}"`);
    });
    console.log('');

    // 페이지 HTML 구조 일부 확인
    const pageStructure = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        return form.outerHTML.substring(0, 1000) + '...';
      }
      return 'Form not found';
    });
    
    console.log('📝 Form 구조 (일부):');
    console.log(pageStructure);
    console.log('');

    console.log('=== 구조 분석 완료 ===');
    console.log('브라우저를 열어둔 상태로 유지합니다. 수동으로 확인해보세요.');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1분 대기

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 분석 실행
inspectSignupPage();
