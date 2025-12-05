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

    // 기존 통계 삭제는 하지 않음 (upsert 방식 사용)

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
        prescription_month,
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

    // 전체 데이터 조회 (배치 처리, 메모리 최적화)
    let allData: any[] = []
    let from = 0
    const batchSize = 500 // 메모리 사용량 감소를 위해 배치 크기 축소

    while (true) {
      const { data, error } = await query
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('데이터 조회 오류:', error)
        throw new Error(`데이터 조회 오류: ${error.message}`)
      }

      if (!data || data.length === 0) {
        break
      }

      // 필터링과 동시에 배열에 추가 (중간 배열 생성 최소화)
      const filtered = data.filter(record => {
        return record.review_action === null || record.review_action !== '삭제'
      })
      allData = allData.concat(filtered)

      if (data.length < batchSize) {
        break
      }
      from += batchSize
    }

    if (allData.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No data found', count: 0 }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 흡수율 조회 (배치 처리 최적화)
    const absorptionRates: Record<string, number> = {}
    const recordIds = allData.map(r => String(r.id)) // 문자열로 변환하여 일관성 유지
    const absorptionBatchSize = 500
    for (let i = 0; i < recordIds.length; i += absorptionBatchSize) {
      const batch = recordIds.slice(i, i + absorptionBatchSize).map(id => parseInt(id))
      const { data: absorptionData } = await supabase
        .from('applied_absorption_rates')
        .select('performance_record_id, applied_absorption_rate')
        .in('performance_record_id', batch)

      if (absorptionData) {
        absorptionData.forEach(item => {
          absorptionRates[String(item.performance_record_id)] = item.applied_absorption_rate || 1.0
        })
      }
    }

    // 매출액 조회 (performance_records_absorption 테이블에서)
    // settlement_month로 필터링하여 조회
    // 두 가지 매핑 방식 사용: 1) id로 매핑, 2) company_id+client_id+product_id+prescription_month로 매핑
    const revenueDataById: Record<string, { wholesale: number; direct: number; total: number }> = {}
    const revenueDataByKey: Record<string, { wholesale: number; direct: number; total: number }> = {}
    
    // settlement_month로 먼저 필터링하여 조회 (더 효율적)
    const { data: revenueRecords, error: revenueError } = await supabase
      .from('performance_records_absorption')
      .select('id, company_id, client_id, product_id, prescription_month, wholesale_revenue, direct_revenue, total_revenue')
      .eq('settlement_month', settlement_month)

    if (revenueError) {
      console.error('매출액 조회 오류:', revenueError)
    } else if (revenueRecords) {
      // 1) id를 키로 하는 맵 생성 (주요 매핑 방식)
      // JavaScript 객체 키는 문자열이므로 String()으로 변환
      revenueRecords.forEach(item => {
        const id = String(item.id) // 문자열로 변환하여 키로 사용
        const revenue = {
          wholesale: parseFloat(String(item.wholesale_revenue)) || 0,
          direct: parseFloat(String(item.direct_revenue)) || 0,
          total: parseFloat(String(item.total_revenue)) || 0
        }
        revenueDataById[id] = revenue
        
        // 2) company_id+client_id+product_id+prescription_month를 키로 하는 맵 생성 (백업 매핑 방식)
        if (item.company_id && item.client_id && item.product_id && item.prescription_month) {
          const key = `${item.company_id}_${item.client_id}_${item.product_id}_${item.prescription_month}`
          revenueDataByKey[key] = revenue
        }
      })
      // 로깅 최소화 (메모리 절약)
      const revenueCount = Object.keys(revenueDataById).length
      console.log(`매출액 데이터 조회 완료: ${revenueCount}개 레코드 매핑됨`)
    } else {
      console.warn('매출액 데이터가 없습니다. performance_records_absorption 테이블에 해당 정산월 데이터가 없을 수 있습니다.')
    }

    // 통계 계산: (company_id, client_id, product_id) 조합별로 집계
    const statisticsMap = new Map<string, any>()

    allData.forEach(record => {
      // 조합 키 생성
      const key = `${record.company_id}_${record.client_id}_${record.product_id}`
      
      const qty = parseFloat(String(record.prescription_qty)) || 0
      const price = parseFloat(String(record.products?.price)) || 0
      const amount = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price)
      const commissionRate = parseFloat(String(record.commission_rate)) || 0
      const absorptionRate = absorptionRates[String(record.id)] || 1.0
      const paymentAmount = Math.round(amount * absorptionRate * (isNaN(commissionRate) ? 0 : commissionRate))

      // 매출액 가져오기 (두 가지 방식 시도)
      // 1) id로 매핑 시도 (문자열로 변환)
      let revenue = revenueDataById[String(record.id)] || null
      
      // 2) id 매핑이 실패하면 키로 매핑 시도
      if (!revenue && record.company_id && record.client_id && record.product_id && record.prescription_month) {
        const key = `${record.company_id}_${record.client_id}_${record.product_id}_${record.prescription_month}`
        revenue = revenueDataByKey[key] || null
      }
      
      // 매핑 실패 시 0으로 설정
      if (!revenue) {
        revenue = { wholesale: 0, direct: 0, total: 0 }
      }

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
          wholesale_revenue: 0,
          direct_revenue: 0,
          total_revenue: 0,
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
      // NUMERIC(15, 2) 범위 내에서 안전하게 누적 (최대값: 9999999999999.99)
      const maxValue = 9999999999999.99
      item.wholesale_revenue = Math.min(Number((item.wholesale_revenue + revenue.wholesale).toFixed(2)), maxValue)
      item.direct_revenue = Math.min(Number((item.direct_revenue + revenue.direct).toFixed(2)), maxValue)
      item.total_revenue = Math.min(Number((item.total_revenue + revenue.total).toFixed(2)), maxValue)
      item.total_absorption_rate += amount * absorptionRate
      item.total_prescription_amount += amount
    })

    // Map을 배열로 변환하고 평균 흡수율 계산
    const statistics = Array.from(statisticsMap.values()).map(item => {
      // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
      // 만약 매출액이 없으면 기존 방식 사용 (가중 평균)
      let absorptionRate = 0
      if (item.total_revenue > 0 && item.prescription_amount > 0) {
        // 매출액 기반 흡수율 계산
        absorptionRate = item.total_revenue / item.prescription_amount
      } else if (item.total_prescription_amount > 0) {
        // 매출액이 없으면 가중 평균 방식 사용
        absorptionRate = item.total_absorption_rate / item.total_prescription_amount
      }
      
      const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
      
      // NUMERIC(15, 2) 범위 검증 및 변환
      const maxNumeric15_2 = 9999999999999.99
      const wholesale = Math.min(Math.max(Number(cleanItem.wholesale_revenue.toFixed(2)), 0), maxNumeric15_2)
      const direct = Math.min(Math.max(Number(cleanItem.direct_revenue.toFixed(2)), 0), maxNumeric15_2)
      const total = Math.min(Math.max(Number(cleanItem.total_revenue.toFixed(2)), 0), maxNumeric15_2)
      const absRate = Math.min(Math.max(Number(absorptionRate.toFixed(4)), 0), 9.9999) // NUMERIC(5, 4) 최대값
      
      return {
        ...cleanItem,
        prescription_qty: Math.round(cleanItem.prescription_qty),
        wholesale_revenue: wholesale,
        direct_revenue: direct,
        total_revenue: total,
        absorption_rate: absRate
      }
    })
    
    // 통계 요약 (최소한의 로깅만)
    const revenueCount = statistics.filter(item => (item.total_revenue || 0) > 0).length
    console.log(`통계 계산 완료: ${statistics.length}개 항목, 매출액 포함: ${revenueCount}개`)

    // 통계 데이터 저장 (upsert 방식: 있으면 update, 없으면 insert)
    if (statistics.length > 0) {
      const batchSize = 500 // 메모리 사용량 감소를 위해 배치 크기 축소
      let processedCount = 0
      
      for (let i = 0; i < statistics.length; i += batchSize) {
        const batch = statistics.slice(i, i + batchSize)
        
        // upsert: settlement_month, company_id, client_id, product_id를 키로 사용
        const { error: upsertError } = await supabase
          .from('performance_statistics')
          .upsert(batch, {
            onConflict: 'settlement_month,company_id,client_id,product_id',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error('통계 저장 오류:', upsertError)
          throw new Error(`통계 저장 오류: ${upsertError.message}`)
        }
        
        processedCount += batch.length
        
        // 진행 상황 로깅 (10% 단위로만)
        if (i % (batchSize * 10) === 0 || i + batchSize >= statistics.length) {
          console.log(`저장 진행: ${processedCount}/${statistics.length} (${Math.round((processedCount / statistics.length) * 100)}%)`)
        }
      }
      
      console.log(`통계 저장 완료: ${statistics.length}개 항목`)
    }

    // 최종 응답
    const responseData: any = {
      message: 'Statistics calculated successfully',
      count: statistics.length,
      settlement_month,
      inserted: statistics.length,
      updated: statistics.length // upsert이므로 inserted와 updated 모두 포함
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
