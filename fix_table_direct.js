import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixTableDirect() {
  try {
    console.log('=== applied_absorption_rates 테이블 수정 시작 ===')
    
    // 1. 외래키 제약조건 제거
    console.log('1. 외래키 제약조건 제거 중...')
    const { error: dropFkError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates DROP CONSTRAINT IF EXISTS applied_absorption_rates_performance_record_id_fkey;'
    })
    
    if (dropFkError) {
      console.log('외래키 제약조건 제거 오류 (무시 가능):', dropFkError.message)
    } else {
      console.log('외래키 제약조건 제거 완료')
    }
    
    // 2. UNIQUE 제약조건 제거
    console.log('2. UNIQUE 제약조건 제거 중...')
    const { error: dropUniqueError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates DROP CONSTRAINT IF EXISTS applied_absorption_rates_performance_record_id_unique;'
    })
    
    if (dropUniqueError) {
      console.log('UNIQUE 제약조건 제거 오류 (무시 가능):', dropUniqueError.message)
    } else {
      console.log('UNIQUE 제약조건 제거 완료')
    }
    
    // 3. 컬럼 타입 변경
    console.log('3. 컬럼 타입 변경 중...')
    
    // performance_record_id를 BIGINT로 변경
    const { error: perfIdError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates ALTER COLUMN performance_record_id TYPE BIGINT USING performance_record_id::BIGINT;'
    })
    
    if (perfIdError) {
      console.log('performance_record_id 타입 변경 오류:', perfIdError.message)
    } else {
      console.log('performance_record_id 타입 변경 완료 (BIGINT)')
    }
    
    // client_id를 INT로 변경
    const { error: clientIdError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates ALTER COLUMN client_id TYPE INT USING client_id::INT;'
    })
    
    if (clientIdError) {
      console.log('client_id 타입 변경 오류:', clientIdError.message)
    } else {
      console.log('client_id 타입 변경 완료 (INT)')
    }
    
    // product_id를 UUID로 변경
    const { error: productIdError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates ALTER COLUMN product_id TYPE UUID USING product_id::UUID;'
    })
    
    if (productIdError) {
      console.log('product_id 타입 변경 오류:', productIdError.message)
    } else {
      console.log('product_id 타입 변경 완료 (UUID)')
    }
    
    // 4. 외래키 제약조건 재생성
    console.log('4. 외래키 제약조건 재생성 중...')
    const { error: addFkError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates ADD CONSTRAINT applied_absorption_rates_performance_record_id_fkey FOREIGN KEY (performance_record_id) REFERENCES performance_records_absorption(id) ON DELETE CASCADE;'
    })
    
    if (addFkError) {
      console.log('외래키 제약조건 재생성 오류:', addFkError.message)
    } else {
      console.log('외래키 제약조건 재생성 완료')
    }
    
    // 5. UNIQUE 제약조건 재생성
    console.log('5. UNIQUE 제약조건 재생성 중...')
    const { error: addUniqueError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE applied_absorption_rates ADD CONSTRAINT applied_absorption_rates_performance_record_id_unique UNIQUE(performance_record_id);'
    })
    
    if (addUniqueError) {
      console.log('UNIQUE 제약조건 재생성 오류:', addUniqueError.message)
    } else {
      console.log('UNIQUE 제약조건 재생성 완료')
    }
    
    console.log('\n=== 테이블 수정 완료 ===')
    
    // 수정된 테이블 구조 확인
    console.log('\n=== 수정된 테이블 구조 확인 ===')
    const { data: testData, error: testError } = await supabase
      .from('applied_absorption_rates')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('테이블 조회 오류:', testError.message)
    } else {
      console.log('테이블 조회 성공, 데이터 개수:', testData?.length || 0)
    }
    
  } catch (error) {
    console.error('전체 오류:', error)
  }
}

fixTableDirect()
