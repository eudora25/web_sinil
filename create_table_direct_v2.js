const { createClient } = require('@supabase/supabase-js');

// 새로운 Supabase 프로젝트 설정
const supabaseUrl = 'https://selklngerzfmuvagcvvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtsbmdlcnpmbXV2YWdjdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzQ5MDUsImV4cCI6MjA2ODMxMDkwNX0.cRe78UqA-HDdVClq0qrXlOXxwNpQWLB6ycFnoHzQI4U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('테이블 생성 시작...');
    
    // 먼저 테이블이 존재하는지 확인
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'absorption_rates');
    
    if (checkError) {
      console.log('테이블 존재 확인 중 오류 (무시 가능):', checkError.message);
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('테이블이 이미 존재합니다.');
      return;
    }
    
    // 테이블 생성 시도 (간접적인 방법)
    console.log('테이블 생성 시도 중...');
    
    // 임시 데이터를 삽입해서 테이블이 존재하는지 확인
    const testData = {
      performance_record_id: 1,
      settlement_month: '2025-01',
      company_id: '00000000-0000-0000-0000-000000000000',
      client_id: 1,
      product_id: '00000000-0000-0000-0000-000000000000',
      applied_absorption_rate: 1.0000
    };
    
    const { data, error } = await supabase
      .from('absorption_rates')
      .insert(testData);
    
    if (error) {
      console.log('테이블이 존재하지 않습니다. 수동으로 생성해야 합니다.');
      console.log('오류:', error.message);
      console.log('\n다음 SQL을 Supabase Dashboard에서 실행하세요:');
      console.log(`
CREATE TABLE absorption_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_record_id BIGINT NOT NULL,
  settlement_month VARCHAR(7) NOT NULL,
  company_id UUID NOT NULL,
  client_id INT NOT NULL,
  product_id UUID NOT NULL,
  applied_absorption_rate DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);`);
    } else {
      console.log('테이블이 이미 존재하고 데이터 삽입 성공!');
      // 테스트 데이터 삭제
      await supabase.from('absorption_rates').delete().eq('performance_record_id', 1);
      console.log('테스트 데이터 삭제 완료');
    }
    
  } catch (error) {
    console.error('실행 오류:', error);
  }
}

// 테이블 생성 실행
createTable();
