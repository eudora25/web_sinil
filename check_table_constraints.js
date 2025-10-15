import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableConstraints() {
  try {
    console.log('=== applied_absorption_rates 테이블 제약조건 확인 ===')
    
    // 테이블에 데이터 삽입 테스트
    const testData = {
      performance_record_id: 7342, // 실제 존재하는 ID
      settlement_month: '2025-01',
      company_id: '05872c6a-28db-4452-a544-d146d07465c5',
      client_id: '2803', // INT를 문자열로 변환
      product_id: 'bd351b59-4140-4fbb-b9e5-317be96eabb7',
      applied_absorption_rate: 0.85,
      updated_by: null
    }
    
    console.log('테스트 데이터:', testData)
    
    // 직접 insert 시도
    const { data: insertData, error: insertError } = await supabase
      .from('applied_absorption_rates')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('INSERT 오류:', insertError)
    } else {
      console.log('INSERT 성공:', insertData)
    }
    
    // upsert 시도
    const { data: upsertData, error: upsertError } = await supabase
      .from('applied_absorption_rates')
      .upsert(testData, {
        onConflict: 'performance_record_id'
      })
      .select()
    
    if (upsertError) {
      console.error('UPSERT 오류:', upsertError)
    } else {
      console.log('UPSERT 성공:', upsertData)
    }
    
  } catch (error) {
    console.error('전체 오류:', error)
  }
}

checkTableConstraints()
