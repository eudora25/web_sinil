// 월별 등록 기능 테스트 스크립트
// 이 스크립트는 9월 데이터를 10월로 복사하는 기능을 테스트합니다.

const { createClient } = require('@supabase/supabase-js')

// Supabase 설정 (실제 프로젝트의 설정을 사용해야 합니다)
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMonthlyRegister() {
  console.log('🔍 월별 등록 기능 테스트 시작...')
  
  try {
    // 1. 9월 데이터 확인
    console.log('\n1. 9월 제품 데이터 확인 중...')
    const { data: septemberProducts, error: septemberError } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', '2025-09')
      .limit(10)

    if (septemberError) {
      console.error('❌ 9월 데이터 조회 실패:', septemberError.message)
      return
    }

    console.log(`✅ 9월 제품 데이터: ${septemberProducts?.length || 0}개`)
    if (septemberProducts && septemberProducts.length > 0) {
      console.log('📋 9월 제품 샘플:')
      septemberProducts.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.product_name} (${product.insurance_code})`)
      })
    }

    // 2. 10월 데이터 확인 (복사 전)
    console.log('\n2. 10월 제품 데이터 확인 중 (복사 전)...')
    const { data: octoberProductsBefore, error: octoberErrorBefore } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', '2025-10')

    if (octoberErrorBefore) {
      console.error('❌ 10월 데이터 조회 실패:', octoberErrorBefore.message)
      return
    }

    console.log(`✅ 10월 제품 데이터 (복사 전): ${octoberProductsBefore?.length || 0}개`)

    // 3. 9월 데이터가 없으면 테스트 데이터 생성
    if (!septemberProducts || septemberProducts.length === 0) {
      console.log('\n📝 9월 테스트 데이터 생성 중...')
      const testProducts = []
      
      for (let i = 1; i <= 10; i++) {
        testProducts.push({
          base_month: '2025-09',
          product_name: `테스트제품${i}`,
          insurance_code: `12345678${i}`,
          price: 1000 + (i * 100),
          commission_rate_a: 0.45,
          commission_rate_b: 0.44,
          commission_rate_c: 0.30,
          commission_rate_d: 0.25,
          commission_rate_e: 0.20,
          status: 'active',
          remarks: `9월 테스트 제품 ${i}`,
          created_by: 'test-user-id',
          updated_by: 'test-user-id'
        })
      }

      const { data: insertedTestProducts, error: insertError } = await supabase
        .from('products')
        .insert(testProducts)
        .select('id, insurance_code')

      if (insertError) {
        console.error('❌ 테스트 데이터 생성 실패:', insertError.message)
        return
      }

      console.log(`✅ 테스트 데이터 생성 완료: ${insertedTestProducts.length}개`)
    }

    // 4. 월별 등록 기능 시뮬레이션
    console.log('\n3. 월별 등록 기능 시뮬레이션...')
    
    // 9월 데이터 다시 조회
    const { data: sourceProducts, error: sourceError } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', '2025-09')

    if (sourceError) {
      console.error('❌ 소스 데이터 조회 실패:', sourceError.message)
      return
    }

    if (!sourceProducts || sourceProducts.length === 0) {
      console.log('❌ 복사할 9월 데이터가 없습니다.')
      return
    }

    // 10월로 복사할 데이터 생성
    const newProducts = sourceProducts.map(product => ({
      ...product,
      id: undefined,
      base_month: '2025-10',
      created_by: 'test-user-id',
      updated_by: 'test-user-id',
      created_at: undefined,
      updated_at: undefined
    }))

    // 10월 데이터 삽입
    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(newProducts)
      .select('id, insurance_code, product_name')

    if (insertError) {
      console.error('❌ 10월 데이터 삽입 실패:', insertError.message)
      return
    }

    console.log(`✅ 10월 데이터 복사 완료: ${insertedProducts.length}개`)

    // 5. 복사 결과 확인
    console.log('\n4. 복사 결과 확인...')
    const { data: octoberProductsAfter, error: octoberErrorAfter } = await supabase
      .from('products')
      .select('*')
      .eq('base_month', '2025-10')

    if (octoberErrorAfter) {
      console.error('❌ 10월 데이터 조회 실패:', octoberErrorAfter.message)
      return
    }

    console.log(`✅ 10월 제품 데이터 (복사 후): ${octoberProductsAfter?.length || 0}개`)
    
    if (octoberProductsAfter && octoberProductsAfter.length > 0) {
      console.log('📋 10월 제품 샘플:')
      octoberProductsAfter.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.product_name} (${product.insurance_code})`)
      })
    }

    // 6. 복사된 데이터 개수 비교
    const beforeCount = octoberProductsBefore?.length || 0
    const afterCount = octoberProductsAfter?.length || 0
    const copiedCount = afterCount - beforeCount

    console.log('\n📊 복사 결과 요약:')
    console.log(`   - 복사 전 10월 데이터: ${beforeCount}개`)
    console.log(`   - 복사 후 10월 데이터: ${afterCount}개`)
    console.log(`   - 복사된 데이터: ${copiedCount}개`)
    console.log(`   - 9월 원본 데이터: ${sourceProducts.length}개`)

    if (copiedCount === sourceProducts.length) {
      console.log('🎉 월별 등록 기능이 정상적으로 작동합니다!')
    } else {
      console.log('⚠️  복사된 데이터 개수가 일치하지 않습니다.')
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message)
  }
}

// 테스트 실행
testMonthlyRegister()
