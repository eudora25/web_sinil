import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  try {
    console.log('=== performance_records 테이블 데이터 확인 ===')
    
    // performance_records 테이블에서 실제 데이터 확인
    const { data: perfData, error: perfError } = await supabase
      .from('performance_records')
      .select('id, client_id, product_id, company_id, settlement_month')
      .limit(5)
    
    if (perfError) {
      console.error('performance_records 조회 오류:', perfError)
    } else {
      console.log('performance_records 데이터 개수:', perfData?.length || 0)
      if (perfData && perfData.length > 0) {
        console.log('첫 번째 데이터:', perfData[0])
        console.log('ID 타입:', typeof perfData[0].id)
        console.log('client_id 타입:', typeof perfData[0].client_id)
        console.log('product_id 타입:', typeof perfData[0].product_id)
        console.log('company_id 타입:', typeof perfData[0].company_id)
      }
    }
    
    console.log('\n=== applied_absorption_rates 테이블 데이터 확인 ===')
    
    // applied_absorption_rates 테이블에서 실제 데이터 확인
    const { data: absData, error: absError } = await supabase
      .from('applied_absorption_rates')
      .select('*')
      .limit(5)
    
    if (absError) {
      console.error('applied_absorption_rates 조회 오류:', absError)
    } else {
      console.log('applied_absorption_rates 데이터 개수:', absData?.length || 0)
      if (absData && absData.length > 0) {
        console.log('첫 번째 데이터:', absData[0])
      }
    }
    
  } catch (error) {
    console.error('전체 오류:', error)
  }
}

checkData()
