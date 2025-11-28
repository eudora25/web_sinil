import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  console.log('=== 통계 갱신 시작 ===')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { settlement_month } = await req.json()

    if (!settlement_month) {
      return new Response(
        JSON.stringify({ error: 'settlement_month is required' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`정산월: ${settlement_month}`)

    // 기존 통계 삭제 (해당 정산월의 모든 통계 삭제)
    console.log('기존 통계 삭제 시작...')
    const { error: deleteError, count: deleteCount } = await supabase
      .from('performance_statistics')
      .delete()
      .eq('settlement_month', settlement_month)
      .select('*', { count: 'exact', head: true })

    if (deleteError) {
      console.error('기존 통계 삭제 오류:', deleteError)
    } else {
      console.log(`기존 통계 삭제 완료: ${deleteCount || 0}건`)
    }

    // 실적 데이터 조회 (실적 검수 방식과 동일)
    // 조건: review_status='완료' AND (review_action IS NULL OR review_action != '삭제')
    let query = supabase
      .from('performance_records')
      .select(`
        id,
        company_id,
        client_id,
        product_id,
        prescription_qty,
        commission_rate,
        review_action,
        review_status,
        created_at,
        companies(id, company_name, company_group, business_registration_number, representative_name),
        products(id, product_name, price, insurance_code),
        clients(id, name, business_registration_number, address)
      `)
      .eq('settlement_month', settlement_month)
      .eq('review_status', '완료')
      .or('review_action.is.null,review_action.neq.삭제')

    // 전체 데이터 조회 (배치 처리)
    let allDataRaw: any[] = []
    let from = 0
    const batchSize = 1000
    let batchCount = 0

    console.log(`=== performance_records 조회 시작 ===`)
    console.log(`정산월: ${settlement_month}`)
    console.log(`조건: review_status='완료' AND (review_action IS NULL OR review_action != '삭제')`)

    while (true) {
      batchCount++
      const { data, error } = await query
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(`배치 ${batchCount} 조회 오류:`, error)
        throw new Error(`데이터 조회 오류: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.log(`배치 ${batchCount}: 데이터 없음, 조회 종료`)
        break
      }

      allDataRaw = allDataRaw.concat(data)
      console.log(`배치 ${batchCount}: ${data.length}개 조회 (누적: ${allDataRaw.length}개)`)

      if (data.length < batchSize) {
        console.log(`마지막 배치 (${data.length}개 < ${batchSize}개), 조회 종료`)
        break
      }
      from += batchSize
    }

    console.log(`=== performance_records 조회 완료 ===`)
    console.log(`총 조회된 데이터: ${allDataRaw.length}개`)

    // 필터링: review_action이 '삭제'가 아닌 것만 포함
    const allData = allDataRaw.filter(record => {
      return record.review_action === null || record.review_action !== '삭제'
    })

    console.log(`필터링 후 데이터: ${allData.length}개`)

    if (allData.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No data found', count: 0 }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 흡수율 조회
    const absorptionRates: Record<number, number> = {}
    const recordIds = allData.map(r => r.id)
    const absorptionBatchSize = 500
    for (let i = 0; i < recordIds.length; i += absorptionBatchSize) {
      const batch = recordIds.slice(i, i + absorptionBatchSize)
      const { data: absorptionData } = await supabase
        .from('applied_absorption_rates')
        .select('performance_record_id, applied_absorption_rate')
        .in('performance_record_id', batch)

      if (absorptionData) {
        absorptionData.forEach(item => {
          absorptionRates[item.performance_record_id] = item.applied_absorption_rate || 1.0
        })
      }
    }
    console.log(`흡수율 데이터: ${Object.keys(absorptionRates).length}개`)

    // 통계 계산: (company_id, client_id, product_id) 조합별로 집계
    console.log(`\n=== 통계 계산 시작 ===`)
    console.log(`집계 기준: settlement_month, company_id, client_id, product_id`)
    
    const statisticsMap = new Map<string, any>()

    allData.forEach(record => {
      // 조합 키 생성
      const key = `${record.company_id}_${record.client_id}_${record.product_id}`
      
      const qty = parseFloat(String(record.prescription_qty)) || 0
      const price = parseFloat(String(record.products?.price)) || 0
      const amount = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price)
      const commissionRate = parseFloat(String(record.commission_rate)) || 0
      const absorptionRate = absorptionRates[record.id] || 1.0
      const paymentAmount = Math.round(amount * absorptionRate * (isNaN(commissionRate) ? 0 : commissionRate))

      if (!statisticsMap.has(key)) {
        // 새로운 조합이면 초기화
        statisticsMap.set(key, {
          settlement_month,
          company_id: record.company_id,
          client_id: record.client_id,
          product_id: record.product_id,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0,
          total_absorption_rate: 0,
          total_prescription_amount: 0,
          // 참조 정보
          company_name: record.companies?.company_name || '',
          company_group: record.companies?.company_group || null,
          business_registration_number: record.companies?.business_registration_number || '',
          representative_name: record.companies?.representative_name || '',
          hospital_name: record.clients?.name || '',
          hospital_business_registration_number: record.clients?.business_registration_number || '',
          address: record.clients?.address || '',
          product_name: record.products?.product_name || '',
          insurance_code: record.products?.insurance_code || '',
          price: isNaN(price) ? 0 : price
        })
      }

      const item = statisticsMap.get(key)!
      item.prescription_qty += (isNaN(qty) ? 0 : qty)
      item.prescription_amount += amount
      item.payment_amount += paymentAmount
      item.total_absorption_rate += amount * absorptionRate
      item.total_prescription_amount += amount
    })

    // Map을 배열로 변환하고 평균 흡수율 계산
    const statistics = Array.from(statisticsMap.values()).map(item => {
      const absorptionRate = item.total_prescription_amount > 0
        ? item.total_absorption_rate / item.total_prescription_amount
        : 0
      
      const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
      
      return {
        ...cleanItem,
        prescription_qty: Math.round(cleanItem.prescription_qty),
        absorption_rate: absorptionRate
      }
    })

    console.log(`통계 집계 완료: ${statistics.length}개 조합`)

    // 통계 데이터 저장
    console.log(`\n=== 통계 데이터 저장 시작 ===`)
    console.log(`저장할 통계 데이터: ${statistics.length}개`)
    
    if (statistics.length > 0) {
      const batchSize = 1000
      let totalInserted = 0
      let totalErrors = 0
      
      for (let i = 0; i < statistics.length; i += batchSize) {
        const batch = statistics.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1

        console.log(`배치 ${batchNumber} 삽입 시도: ${batch.length}개 (${i + 1}~${Math.min(i + batchSize, statistics.length)})`)
        
        const { data: insertData, error: insertError } = await supabase
          .from('performance_statistics')
          .insert(batch)
          .select()

        if (insertError) {
          console.error(`❌ 배치 ${batchNumber} 삽입 오류:`, insertError)
          console.error(`오류 상세:`, JSON.stringify(insertError, null, 2))
          totalErrors++
          throw new Error(`통계 저장 오류 (배치 ${batchNumber}): ${insertError.message}`)
        } else {
          const insertedCount = insertData?.length || 0
          totalInserted += insertedCount
          console.log(`✅ 배치 ${batchNumber} 삽입 완료: ${insertedCount}개`)
        }
      }

      console.log(`총 삽입 완료: ${totalInserted}개 / ${statistics.length}개`)
      if (totalErrors > 0) {
        console.error(`⚠️ 경고: ${totalErrors}개 배치에서 오류 발생`)
      }
    }

    // 최종 응답
    console.log(`\n=== 최종 통계 데이터 요약 ===`)
    console.log(`생성된 통계: ${statistics.length}개`)
    console.log(`정산월: ${settlement_month}`)
    
    const responseData: any = {
      message: 'Statistics calculated successfully',
      count: statistics.length,
      settlement_month,
      inserted: statistics.length
    }
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== 통계 계산 오류 ===')
    console.error('오류:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        type: error.constructor.name
      }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
})
