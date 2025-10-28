import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    console.log('=== performance_records 테이블 구조 확인 ===')
    
    // performance_records 테이블의 컬럼 타입 확인
    const { data: perfColumns, error: perfError } = await supabase
      .rpc('get_table_columns', { table_name: 'performance_records' })
    
    if (perfError) {
      console.error('performance_records 테이블 조회 오류:', perfError)
      
      // 대안: 직접 쿼리로 확인
      const { data: perfData, error: perfDataError } = await supabase
        .from('performance_records')
        .select('id, client_id, product_id, company_id')
        .limit(1)
      
      if (perfDataError) {
        console.error('performance_records 데이터 조회 오류:', perfDataError)
      } else {
        console.log('performance_records 샘플 데이터:', perfData)
      }
    } else {
      console.log('performance_records 컬럼 정보:', perfColumns)
    }
    
    console.log('\n=== applied_absorption_rates 테이블 구조 확인 ===')
    
    // applied_absorption_rates 테이블의 컬럼 타입 확인
    const { data: absColumns, error: absError } = await supabase
      .rpc('get_table_columns', { table_name: 'applied_absorption_rates' })
    
    if (absError) {
      console.error('applied_absorption_rates 테이블 조회 오류:', absError)
      
      // 대안: 직접 쿼리로 확인
      const { data: absData, error: absDataError } = await supabase
        .from('applied_absorption_rates')
        .select('*')
        .limit(1)
      
      if (absDataError) {
        console.error('applied_absorption_rates 데이터 조회 오류:', absDataError)
      } else {
        console.log('applied_absorption_rates 샘플 데이터:', absData)
      }
    } else {
      console.log('applied_absorption_rates 컬럼 정보:', absColumns)
    }
    
  } catch (error) {
    console.error('전체 오류:', error)
  }
}

checkTableStructure()
