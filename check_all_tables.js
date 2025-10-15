import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllTables() {
  try {
    console.log('=== 모든 테이블 확인 ===')
    
    // companies 테이블 확인
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(3)
    
    if (companiesError) {
      console.error('companies 조회 오류:', companiesError)
    } else {
      console.log('companies 데이터 개수:', companiesData?.length || 0)
      if (companiesData && companiesData.length > 0) {
        console.log('companies 첫 번째 데이터:', companiesData[0])
        console.log('companies ID 타입:', typeof companiesData[0].id)
      }
    }
    
    // clients 테이블 확인
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(3)
    
    if (clientsError) {
      console.error('clients 조회 오류:', clientsError)
    } else {
      console.log('clients 데이터 개수:', clientsData?.length || 0)
      if (clientsData && clientsData.length > 0) {
        console.log('clients 첫 번째 데이터:', clientsData[0])
        console.log('clients ID 타입:', typeof clientsData[0].id)
      }
    }
    
    // products 테이블 확인
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, product_name')
      .limit(3)
    
    if (productsError) {
      console.error('products 조회 오류:', productsError)
    } else {
      console.log('products 데이터 개수:', productsData?.length || 0)
      if (productsData && productsData.length > 0) {
        console.log('products 첫 번째 데이터:', productsData[0])
        console.log('products ID 타입:', typeof productsData[0].id)
      }
    }
    
    // performance_records_absorption 테이블 확인
    const { data: absData, error: absError } = await supabase
      .from('performance_records_absorption')
      .select('id, client_id, product_id, company_id')
      .limit(3)
    
    if (absError) {
      console.error('performance_records_absorption 조회 오류:', absError)
    } else {
      console.log('performance_records_absorption 데이터 개수:', absData?.length || 0)
      if (absData && absData.length > 0) {
        console.log('performance_records_absorption 첫 번째 데이터:', absData[0])
        console.log('performance_records_absorption ID 타입:', typeof absData[0].id)
        console.log('performance_records_absorption client_id 타입:', typeof absData[0].client_id)
        console.log('performance_records_absorption product_id 타입:', typeof absData[0].product_id)
        console.log('performance_records_absorption company_id 타입:', typeof absData[0].company_id)
      }
    }
    
  } catch (error) {
    console.error('전체 오류:', error)
  }
}

checkAllTables()
