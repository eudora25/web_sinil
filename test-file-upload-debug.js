const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 생성 (프로덕션 환경)
const supabase = createClient(
  'https://vbmmfuraxvxlfpewqrsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'
);

async function testFileUpload() {
  console.log('=== 파일 업로드 RLS 디버깅 시작 ===\n');

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
    console.log('');

    // 2. 테스트 파일 생성
    console.log('2. 테스트 파일 생성...');
    const testFileName = `test-file-${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    const testContent = 'This is a test file for RLS debugging';
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('테스트 파일 생성됨:', testFileName);
    console.log('');

    // 3. 파일 업로드 테스트
    console.log('3. 파일 업로드 테스트...');
    const fileBuffer = fs.readFileSync(testFilePath);
    const safeName = testFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `attachments/${Date.now()}_${safeName}`;
    
    console.log('업로드 경로:', filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('notices')
      .upload(filePath, fileBuffer, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError);
      console.log('Error Message:', uploadError.message);
      console.log('Error Code:', uploadError.code);
      console.log('Error Details:', uploadError.details);
      console.log('Error Hint:', uploadError.hint);
    } else {
      console.log('파일 업로드 성공!');
      console.log('Upload Data:', uploadData);
      
      // 4. 파일 URL 생성
      const { data: urlData } = supabase.storage
        .from('notices')
        .getPublicUrl(uploadData.path);
      
      const fileUrl = urlData.publicUrl;
      console.log('파일 URL:', fileUrl);
      console.log('');

      // 5. 공지사항 생성 (파일 URL 포함)
      console.log('5. 공지사항 생성 (파일 URL 포함)...');
      const { data: noticeData, error: noticeError } = await supabase
        .from('notices')
        .insert([{
          title: '파일 업로드 테스트 공지사항',
          content: '파일 업로드와 함께 생성되는 공지사항',
          file_url: [fileUrl],
          created_by: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (noticeError) {
        console.error('공지사항 생성 실패:', noticeError);
        console.log('Error Message:', noticeError.message);
        console.log('Error Code:', noticeError.code);
        console.log('Error Details:', noticeError.details);
        console.log('Error Hint:', noticeError.hint);
      } else {
        console.log('공지사항 생성 성공!');
        console.log('Notice Data:', noticeData);
      }
    }

    // 6. 테스트 파일 정리
    console.log('\n6. 테스트 파일 정리...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('테스트 파일 삭제됨');
    }

  } catch (error) {
    console.error('예상치 못한 오류:', error);
  }
}

// 테스트 실행
testFileUpload();
