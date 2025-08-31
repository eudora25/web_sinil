#!/usr/bin/env node

console.log('🔐 비밀번호 찾기 기능 테스트 가이드');
console.log('=====================================\n');

console.log('📋 테스트 시나리오:');
console.log('');

console.log('1️⃣ 정상적인 비밀번호 찾기 테스트:');
console.log('   - http://localhost:5173/login 접속');
console.log('   - "비밀번호를 잊으셨나요?" 클릭');
console.log('   - 등록된 이메일 주소 입력 (예: test1@test.com)');
console.log('   - "비밀번호 재설정 링크 받기" 클릭');
console.log('   - 이메일 발송 완료 메시지 확인');
console.log('');

console.log('2️⃣ 비밀번호 재설정 링크 테스트:');
console.log('   - 이메일로 받은 링크 클릭');
console.log('   - /reset-password 페이지로 정상 이동 확인');
console.log('   - 새 비밀번호 입력 (예: newpassword123)');
console.log('   - "비밀번호 변경" 클릭');
console.log('   - 로그인 페이지로 자동 이동 확인');
console.log('');

console.log('3️⃣ 에러 케이스 테스트:');
console.log('   - 등록되지 않은 이메일: nonexistent@test.com');
console.log('   - 잘못된 이메일 형식: invalid-email');
console.log('   - 잘못된 재설정 링크 접속');
console.log('');

console.log('4️⃣ 새 비밀번호로 로그인 테스트:');
console.log('   - 변경된 비밀번호로 로그인 시도');
console.log('   - 정상 로그인 확인');
console.log('');

console.log('✅ 예상 결과:');
console.log('   - 비밀번호 찾기 이메일이 정상 발송됨');
console.log('   - 재설정 링크 클릭 시 로그인 페이지로 리다이렉트되지 않음');
console.log('   - 비밀번호 변경 후 로그인 페이지로 이동');
console.log('   - 새 비밀번호로 정상 로그인 가능');
console.log('');

console.log('🚨 주의사항:');
console.log('   - 실제 이메일이 발송되므로 실제 이메일 주소 사용');
console.log('   - Supabase 이메일 설정이 올바르게 되어 있어야 함');
console.log('   - 스팸 메일함도 확인해보세요');
console.log('');

console.log('🔗 테스트 URL: http://localhost:5173/login');

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://parmderiimrealgball.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcm1kZXJpaW1yZWFsZ2JhbGwiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTQ5NzI5NywiZXhwIjoyMDUxMDczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordReset() {
  console.log('=== 비밀번호 재설정 테스트 시작 ===');
  
  try {
    // 1. A 계정으로 로그인
    console.log('\n1. A 계정으로 로그인 중...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // A 계정 이메일
      password: 'password123'
    });
    
    if (loginError) {
      console.error('A 계정 로그인 실패:', loginError.message);
      return;
    }
    
    console.log('A 계정 로그인 성공:', loginData.user.email);
    
    // 2. B 계정의 비밀번호 재설정 이메일 발송
    console.log('\n2. B 계정의 비밀번호 재설정 이메일 발송 중...');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail('b@example.com', {
      redirectTo: 'https://web-sinil.vercel.app/reset-password'
    });
    
    if (resetError) {
      console.error('비밀번호 재설정 이메일 발송 실패:', resetError.message);
      return;
    }
    
    console.log('B 계정 비밀번호 재설정 이메일 발송 성공');
    
    // 3. 현재 세션 확인
    console.log('\n3. 현재 세션 확인...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('현재 로그인된 사용자:', session?.user?.email || '없음');
    
    // 4. 시뮬레이션: 비밀번호 재설정 페이지 접근
    console.log('\n4. 비밀번호 재설정 페이지 접근 시뮬레이션...');
    console.log('이 시점에서 기존 세션이 제거되어야 합니다.');
    
    // 5. 로그아웃
    console.log('\n5. 로그아웃...');
    await supabase.auth.signOut();
    console.log('로그아웃 완료');
    
    console.log('\n=== 테스트 완료 ===');
    console.log('이제 브라우저에서 비밀번호 재설정 링크를 클릭하여 테스트해보세요.');
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
testPasswordReset();
