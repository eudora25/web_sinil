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
      CREATE TABLE IF NOT EXISTS absorption_rates (
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
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('테이블 생성 오류:', error);
      return;
    }
    
    console.log('테이블 생성 성공!');
    console.log('생성된 테이블:', data);
    
  } catch (error) {
    console.error('실행 오류:', error);
  }
}

// 테이블 생성 실행
createTable();
