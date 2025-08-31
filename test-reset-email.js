#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://parmderiimrealgball.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcm1kZXJpaW1yZWFsZ2JhbGwiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTQ5NzI5NywiZXhwIjoyMDUxMDczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendResetEmail() {
  console.log('=== 비밀번호 재설정 이메일 발송 테스트 ===');
  
  try {
    // 테스트용 이메일 주소 (실제 등록된 이메일로 변경하세요)
    const testEmail = 'test@example.com'; // 실제 등록된 이메일로 변경 필요
    
    console.log(`\n1. ${testEmail}로 비밀번호 재설정 이메일 발송 중...`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/reset-password'
    });
    
    if (error) {
      console.error('❌ 이메일 발송 실패:', error.message);
      
      if (error.message.includes('21 seconds')) {
        console.log('💡 21초 대기 시간 오류입니다. 잠시 후 다시 시도해주세요.');
      } else if (error.message.includes('not found')) {
        console.log('💡 등록되지 않은 이메일입니다. 실제 등록된 이메일을 사용해주세요.');
      }
      return;
    }
    
    console.log('✅ 비밀번호 재설정 이메일 발송 성공!');
    console.log('\n📧 이제 이메일을 확인하여 링크를 클릭해보세요.');
    console.log('🔗 예상 링크: http://localhost:5173/reset-password?access_token=...');
    console.log('\n⚠️  테스트 시 주의사항:');
    console.log('   - 실제 등록된 이메일 주소를 사용하세요');
    console.log('   - 스팸 메일함도 확인해보세요');
    console.log('   - 링크 클릭 후 자동 로그인이 되지 않는지 확인하세요');
    
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 사용법 안내
console.log('🔐 비밀번호 재설정 이메일 발송 테스트');
console.log('=====================================');
console.log('');
console.log('📋 사용법:');
console.log('1. 아래 testEmail 변수를 실제 등록된 이메일로 변경하세요');
console.log('2. 이 스크립트를 실행하세요: node test-reset-email.js');
console.log('3. 이메일로 받은 링크를 클릭하여 테스트하세요');
console.log('');
console.log('💡 테스트 포인트:');
console.log('   - 링크 클릭 시 자동 로그인이 되지 않는지 확인');
console.log('   - 비밀번호 변경 후 새 비밀번호로 로그인해야 하는지 확인');
console.log('');

// 테스트 실행
sendResetEmail();
