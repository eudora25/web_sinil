const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabaseUrl = 'https://vaeolqywqckiwwtspxfp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZW9scXl3cWNraXd3dHNweGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDg0MTIsImV4cCI6MjA2MjYyNDQxMn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinessNumbers() {
  try {
    console.log('🔍 데이터베이스에서 사업자등록번호 확인 중...');
    
    // 모든 companies 데이터 조회
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, company_name, business_registration_number, email, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 데이터 조회 오류:', error);
      return;
    }
    
    console.log(`\n📊 총 ${companies.length}개의 업체가 등록되어 있습니다.\n`);
    
    if (companies.length > 0) {
      console.log('📋 등록된 업체 목록:');
      console.log('='.repeat(80));
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.company_name}`);
        console.log(`   사업자등록번호: ${company.business_registration_number}`);
        console.log(`   이메일: ${company.email}`);
        console.log(`   등록일: ${new Date(company.created_at).toLocaleString()}`);
        console.log(`   ID: ${company.id}`);
        console.log('-'.repeat(40));
      });
    }
    
    // 특정 사업자등록번호 검색
    const testNumbers = ['123-45-67890', '987-65-43210'];
    
    console.log('\n🔎 테스트용 사업자등록번호 검색:');
    console.log('='.repeat(50));
    
    for (const testNumber of testNumbers) {
      const { data: found, error: searchError } = await supabase
        .from('companies')
        .select('id, company_name, business_registration_number')
        .eq('business_registration_number', testNumber);
      
      if (searchError) {
        console.error(`❌ ${testNumber} 검색 오류:`, searchError);
      } else if (found && found.length > 0) {
        console.log(`✅ ${testNumber} - 이미 등록됨 (${found.length}개)`);
        found.forEach(company => {
          console.log(`   - ${company.company_name} (ID: ${company.id})`);
        });
      } else {
        console.log(`❌ ${testNumber} - 등록되지 않음`);
      }
    }
    
    // 사용 가능한 새로운 사업자등록번호 제안
    console.log('\n💡 사용 가능한 새로운 사업자등록번호 제안:');
    console.log('='.repeat(50));
    const suggestions = [
      '111-11-11111',
      '222-22-22222', 
      '333-33-33333',
      '444-44-44444',
      '555-55-55555'
    ];
    
    for (const suggestion of suggestions) {
      const { data: found } = await supabase
        .from('companies')
        .select('id')
        .eq('business_registration_number', suggestion);
      
      if (!found || found.length === 0) {
        console.log(`✅ ${suggestion} - 사용 가능`);
      } else {
        console.log(`❌ ${suggestion} - 이미 사용됨`);
      }
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

// 스크립트 실행
checkBusinessNumbers();
