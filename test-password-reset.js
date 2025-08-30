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
