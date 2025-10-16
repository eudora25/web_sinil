const { createClient } = require('@supabase/supabase-js');

// 새로운 Supabase 프로젝트 설정
const supabaseUrl = 'https://selklngerzfmuvagcvvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtsbmdlcnpmbXV2YWdjdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzQ5MDUsImV4cCI6MjA2ODMxMDkwNX0.cRe78UqA-HDdVClq0qrXlOXxwNpQWLB6ycFnoHzQI4U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('테이블 생성 시작...');
    
    // 테이블 생성 SQL
    const createTableSQL = `
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
      );
    `;
    
    // REST API를 통해 SQL 실행 시도
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('테이블 생성 성공!');
      console.log('결과:', result);
    } else {
      const error = await response.text();
      console.log('REST API 오류:', error);
      
      // 대안: 테이블 존재 여부 확인
      console.log('\n테이블 존재 여부 확인 중...');
      const { data, error: selectError } = await supabase
        .from('absorption_rates')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log('테이블이 존재하지 않습니다.');
        console.log('오류:', selectError.message);
        console.log('\n수동으로 테이블을 생성해야 합니다.');
        console.log('Supabase Dashboard → SQL Editor에서 다음 SQL을 실행하세요:');
        console.log(createTableSQL);
      } else {
        console.log('테이블이 이미 존재합니다!');
        console.log('데이터:', data);
      }
    }
    
  } catch (error) {
    console.error('실행 오류:', error);
  }
}

// 테이블 생성 실행
createTable();
