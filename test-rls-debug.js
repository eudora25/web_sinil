const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성 (프로덕션 환경)
const supabase = createClient(
  'https://vbmmfuraxvxlfpewqrsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'
);

async function testRLS() {
  console.log('=== RLS 정책 디버깅 시작 ===\n');

  try {
    // 1. 로그인
    console.log('1. 로그인 시도...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test1@test.com',
      password: 'asdf1234'
    });

    if (authError) {
      console.error('로그인 실패:', authError);
      return;
    }

    console.log('로그인 성공!');
    console.log('User ID:', authData.user.id);
    console.log('User Email:', authData.user.email);
    console.log('Session:', authData.session ? '있음' : '없음');
    console.log('');

    // 2. 현재 사용자 정보 확인
    console.log('2. 현재 사용자 정보 확인...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('사용자 정보 가져오기 실패:', userError);
      return;
    }

    console.log('Current User ID:', user.id);
    console.log('Current User Email:', user.email);
    console.log('');

    // 3. companies 테이블에서 사용자 정보 확인
    console.log('3. companies 테이블에서 사용자 정보 확인...');
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, user_id, email, user_type, approval_status')
      .eq('user_id', user.id)
      .single();

    if (companyError) {
      console.error('Companies 데이터 가져오기 실패:', companyError);
      return;
    }

    console.log('Company Data:', companyData);
    console.log('User Type:', companyData.user_type);
    console.log('Approval Status:', companyData.approval_status);
    console.log('');

    // 4. RLS 정책 조건 테스트
    console.log('4. RLS 정책 조건 테스트...');
    const { data: policyTest, error: policyError } = await supabase
      .from('companies')
      .select('1')
      .eq('user_id', user.id)
      .eq('user_type', 'admin')
      .single();

    console.log('Policy Test Result:', policyTest ? 'TRUE (조건 만족)' : 'FALSE (조건 불만족)');
    console.log('Policy Test Error:', policyError);
    console.log('');

    // 5. notices 테이블 권한 확인
    console.log('5. notices 테이블 읽기 테스트...');
    const { data: noticesRead, error: noticesReadError } = await supabase
      .from('notices')
      .select('id, title')
      .limit(1);

    console.log('Notices Read Result:', noticesRead);
    console.log('Notices Read Error:', noticesReadError);
    console.log('');

    // 6. notices 테이블 쓰기 테스트 (RLS 오류 발생 지점)
    console.log('6. notices 테이블 쓰기 테스트 (RLS 오류 확인)...');
    const { data: noticesInsert, error: noticesInsertError } = await supabase
      .from('notices')
      .insert([{
        title: 'RLS 디버깅 테스트',
        content: 'RLS 정책 테스트를 위한 임시 공지사항',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    console.log('Notices Insert Result:', noticesInsert);
    console.log('Notices Insert Error:', noticesInsertError);
    console.log('');

    // 7. 오류가 발생한 경우 상세 분석
    if (noticesInsertError) {
      console.log('=== 오류 상세 분석 ===');
      console.log('Error Message:', noticesInsertError.message);
      console.log('Error Code:', noticesInsertError.code);
      console.log('Error Details:', noticesInsertError.details);
      console.log('Error Hint:', noticesInsertError.hint);
    }

  } catch (error) {
    console.error('예상치 못한 오류:', error);
  }
}

// 테스트 실행
testRLS();
