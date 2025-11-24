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

  console.log('=== Edge Function 시작 ===')
  console.log('요청 메서드:', req.method)
  console.log('요청 URL:', req.url)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { settlement_month, statistics_type, company_statistics_filter, company_group, prescription_month } = await req.json()

    if (!settlement_month) {
      return new Response(
        JSON.stringify({ error: 'settlement_month is required' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`통계 계산 시작: ${settlement_month}, 타입: ${statistics_type || 'all'}`)

    // 기존 통계 삭제 (같은 조건의 통계)
    const deleteQuery: any = {
      settlement_month,
    }
    
    if (statistics_type) {
      deleteQuery.statistics_type = statistics_type
    }
    if (company_statistics_filter) {
      deleteQuery.company_statistics_filter = company_statistics_filter
    }
    if (company_group) {
      deleteQuery.company_group = company_group
    }
    if (prescription_month) {
      deleteQuery.prescription_month = prescription_month
    }

    // 기존 통계 삭제 (statistics_type이 지정된 경우 해당 타입만 삭제)
    const deleteQueryFinal: any = { ...deleteQuery }
    if (statistics_type) {
      deleteQueryFinal.statistics_type = statistics_type
    }
    
    const { error: deleteError } = await supabase
      .from('performance_statistics')
      .delete()
      .match(deleteQueryFinal)

    if (deleteError) {
      console.error('기존 통계 삭제 오류:', deleteError)
    }

    // 실적 데이터 조회
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
        companies!inner(id, company_name, company_group, business_registration_number, representative_name),
        products!inner(id, product_name, price),
        clients!inner(id, name)
      `)
      .eq('settlement_month', settlement_month)
      .neq('review_action', '삭제')

    if (prescription_month) {
      query = query.eq('prescription_month', prescription_month)
    }

    if (company_group) {
      query = query.eq('companies.company_group', company_group)
    }

    // 전체 데이터 가져오기
    let allData = []
    let from = 0
    const batchSize = 1000

    while (true) {
      try {
        const { data, error } = await query
          .range(from, from + batchSize - 1)
          .order('created_at', { ascending: false })

        if (error) {
          console.error(`배치 ${Math.floor(from / batchSize) + 1} 조회 오류:`, error)
          throw new Error(`데이터 조회 오류: ${error.message || JSON.stringify(error)}`)
        }

        if (!data || data.length === 0) break

        allData = allData.concat(data)
        console.log(`배치 ${Math.floor(from / batchSize) + 1}: ${data.length}개 조회됨`)

        if (data.length < batchSize) break

        from += batchSize
      } catch (batchError) {
        console.error('배치 조회 중 예외:', batchError)
        throw batchError
      }
    }

    console.log(`조회된 데이터: ${allData.length}개`)

    if (allData.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No data found', count: 0 }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // statistics_type이 없으면 기본값 'company'로 설정
    const effectiveStatisticsType = statistics_type || 'company'
    const effectiveCompanyStatisticsFilter = company_statistics_filter || 'all'

    console.log(`통계 타입: ${effectiveStatisticsType}, 필터: ${effectiveCompanyStatisticsFilter}`)

    // 흡수율 조회
    const recordIds = allData.map(r => r.id)
    const absorptionRates: Record<number, number> = {}

    if (effectiveStatisticsType === 'company' && (!effectiveCompanyStatisticsFilter || effectiveCompanyStatisticsFilter === 'all')) {
      const batchSize = 500
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize)
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
    }

    // 통계 계산
    const statistics: any[] = []

    if (effectiveStatisticsType === 'company') {
      if (effectiveCompanyStatisticsFilter === 'hospital') {
        // 업체 + 병의원별 통계
        const map = new Map<string, any>()
        
        allData.forEach(record => {
          const key = `${record.company_id}_${record.client_id}`
          const qty = Number(record.prescription_qty) || 0
          const price = Number(record.products?.price) || 0
          const amount = qty * price
          const commissionRate = Number(record.commission_rate) || 0
          const absorptionRate = absorptionRates[record.id] || 1.0
          const paymentAmount = Math.round(amount * absorptionRate * commissionRate)

          if (!map.has(key)) {
            map.set(key, {
              settlement_month,
              statistics_type: 'company',
              company_statistics_filter: 'hospital',
              company_group: company_group || null,
              company_id: record.company_id,
              hospital_id: record.client_id,
              company_name: record.companies?.company_name || '',
              company_group_value: record.companies?.company_group || '',
              business_registration_number: record.companies?.business_registration_number || '',
              representative_name: record.companies?.representative_name || '',
              hospital_name: record.clients?.name || '',
              prescription_qty: 0,
              prescription_amount: 0,
              payment_amount: 0,
              total_absorption_rate: 0,
              total_prescription_amount: 0,
              prescription_month: prescription_month || null
            })
          }

          const item = map.get(key)!
          item.prescription_qty += qty
          item.prescription_amount += amount
          item.payment_amount += paymentAmount
          item.total_absorption_rate += amount * absorptionRate
          item.total_prescription_amount += amount
        })

        map.forEach(item => {
          const absorptionRate = item.total_prescription_amount > 0
            ? item.total_absorption_rate / item.total_prescription_amount
            : 0
          // 중간 계산 필드 제거 후 삽입
          const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
          statistics.push({
            ...cleanItem,
            absorption_rate: absorptionRate
          })
        })
      } else if (effectiveCompanyStatisticsFilter === 'product') {
        // 업체 + 제품별 통계
        const map = new Map<string, any>()
        
        allData.forEach(record => {
          const key = `${record.company_id}_${record.product_id}`
          const qty = Number(record.prescription_qty) || 0
          const price = Number(record.products?.price) || 0
          const amount = qty * price
          const commissionRate = Number(record.commission_rate) || 0
          const absorptionRate = absorptionRates[record.id] || 1.0
          const paymentAmount = Math.round(amount * absorptionRate * commissionRate)

          if (!map.has(key)) {
            map.set(key, {
              settlement_month,
              statistics_type: 'company',
              company_statistics_filter: 'product',
              company_group: company_group || null,
              company_id: record.company_id,
              product_id: record.product_id,
              company_name: record.companies?.company_name || '',
              company_group_value: record.companies?.company_group || '',
              business_registration_number: record.companies?.business_registration_number || '',
              representative_name: record.companies?.representative_name || '',
              product_name: record.products?.product_name || '',
              prescription_qty: 0,
              prescription_amount: 0,
              payment_amount: 0,
              total_absorption_rate: 0,
              total_prescription_amount: 0,
              prescription_month: prescription_month || null
            })
          }

          const item = map.get(key)!
          item.prescription_qty += qty
          item.prescription_amount += amount
          item.payment_amount += paymentAmount
          item.total_absorption_rate += amount * absorptionRate
          item.total_prescription_amount += amount
        })

        map.forEach(item => {
          const absorptionRate = item.total_prescription_amount > 0
            ? item.total_absorption_rate / item.total_prescription_amount
            : 0
          // 중간 계산 필드 제거 후 삽입
          const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
          statistics.push({
            ...cleanItem,
            absorption_rate: absorptionRate
          })
        })
      } else {
        // 업체별 통계 (전체) - 실적이 있는 업체만 집계
        const map = new Map<string, any>()
        
        allData.forEach(record => {
          const key = String(record.company_id)
          const qty = Number(record.prescription_qty) || 0
          const price = Number(record.products?.price) || 0
          const amount = qty * price
          const commissionRate = Number(record.commission_rate) || 0
          const absorptionRate = absorptionRates[record.id] || 1.0
          const paymentAmount = Math.round(amount * absorptionRate * commissionRate)

          if (!map.has(key)) {
            map.set(key, {
              settlement_month,
              statistics_type: 'company',
              company_statistics_filter: 'all',
              company_group: company_group || record.companies?.company_group || null,
              company_id: record.company_id,
              company_name: record.companies?.company_name || '',
              company_group_value: record.companies?.company_group || '',
              business_registration_number: record.companies?.business_registration_number || '',
              representative_name: record.companies?.representative_name || '',
              prescription_qty: 0,
              prescription_amount: 0,
              payment_amount: 0,
              total_absorption_rate: 0,
              total_prescription_amount: 0,
              prescription_month: prescription_month || null
            })
          }

          const item = map.get(key)!
          item.prescription_qty += qty
          item.prescription_amount += amount
          item.payment_amount += paymentAmount
          item.total_absorption_rate += amount * absorptionRate
          item.total_prescription_amount += amount
        })

        map.forEach(item => {
          const absorptionRate = item.total_prescription_amount > 0
            ? item.total_absorption_rate / item.total_prescription_amount
            : 0
          // 중간 계산 필드 제거 후 삽입
          const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
          statistics.push({
            ...cleanItem,
            absorption_rate: absorptionRate
          })
        })
        
        console.log(`업체별 통계 (전체) 집계 완료: ${statistics.length}개 업체`)
      }
    } else if (effectiveStatisticsType === 'hospital') {
      // 병의원별 통계
      const map = new Map<string, any>()
      
      allData.forEach(record => {
        if (record.review_action === '삭제') return
        
        const key = String(record.client_id)
        const qty = Number(record.prescription_qty) || 0
        const price = Number(record.products?.price) || 0
        const amount = qty * price

        if (!map.has(key)) {
          map.set(key, {
            settlement_month,
            statistics_type: 'hospital',
            hospital_id: record.client_id,
            hospital_name: record.clients?.name || '',
            prescription_qty: 0,
            prescription_amount: 0,
            payment_amount: 0,
            total_absorption_rate: 0,
            total_prescription_amount: 0,
            prescription_month: prescription_month || null
          })
        }

        const item = map.get(key)!
        item.prescription_qty += qty
        item.prescription_amount += amount
        // 병의원별 통계는 지급액 계산이 복잡하므로 일단 처방액만 저장
        item.total_prescription_amount += amount
      })

      map.forEach(item => {
        // 병의원별 통계는 흡수율 계산이 복잡하므로 일단 0으로 설정
        const absorptionRate = 0
        const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
        statistics.push({
          ...cleanItem,
          absorption_rate: absorptionRate
        })
      })
      
      console.log(`병의원별 통계 집계 완료: ${statistics.length}개 병의원`)
    } else if (effectiveStatisticsType === 'product') {
      // 제품별 통계
      const map = new Map<string, any>()
      
      allData.forEach(record => {
        if (record.review_action === '삭제') return
        
        const key = String(record.product_id)
        const qty = Number(record.prescription_qty) || 0
        const price = Number(record.products?.price) || 0
        const amount = qty * price

        if (!map.has(key)) {
          map.set(key, {
            settlement_month,
            statistics_type: 'product',
            product_id: record.product_id,
            product_name: record.products?.product_name || '',
            prescription_qty: 0,
            prescription_amount: 0,
            payment_amount: 0,
            total_absorption_rate: 0,
            total_prescription_amount: 0,
            prescription_month: prescription_month || null
          })
        }

        const item = map.get(key)!
        item.prescription_qty += qty
        item.prescription_amount += amount
        // 제품별 통계는 지급액 계산이 복잡하므로 일단 처방액만 저장
        item.total_prescription_amount += amount
      })

      map.forEach(item => {
        // 제품별 통계는 흡수율 계산이 복잡하므로 일단 0으로 설정
        const absorptionRate = 0
        const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item
        statistics.push({
          ...cleanItem,
          absorption_rate: absorptionRate
        })
      })
      
      console.log(`제품별 통계 집계 완료: ${statistics.length}개 제품`)
    }

    // 통계 데이터 저장 (배치 삽입)
    console.log(`저장할 통계 데이터 개수: ${statistics.length}`)
    console.log(`집계된 고유 업체 수: ${new Set(statistics.map(s => s.company_id)).size}개`)
    
    if (statistics.length > 0) {
      const batchSize = 1000
      let totalInserted = 0
      let totalErrors = 0
      const errorDetails: any[] = []
      
      for (let i = 0; i < statistics.length; i += batchSize) {
        const batch = statistics.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        console.log(`배치 ${batchNumber} 삽입 시도: ${batch.length}개`)
        console.log(`첫 번째 항목 샘플:`, JSON.stringify(batch[0], null, 2))
        
        const { data: insertData, error: insertError } = await supabase
          .from('performance_statistics')
          .insert(batch)
          .select()

        if (insertError) {
          console.error(`배치 ${batchNumber} 삽입 오류:`, insertError)
          console.error(`오류 상세:`, JSON.stringify(insertError, null, 2))
          console.error(`오류 메시지:`, insertError.message)
          console.error(`오류 코드:`, insertError.code)
          console.error(`오류 상세:`, insertError.details)
          console.error(`오류 힌트:`, insertError.hint)
          totalErrors++
          errorDetails.push({
            batch: batchNumber,
            error: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            sampleData: batch[0]
          })
        } else {
          console.log(`배치 ${batchNumber} 삽입 성공: ${insertData?.length || 0}개`)
          totalInserted += insertData?.length || batch.length
        }
      }
      
      console.log(`총 삽입 완료: ${totalInserted}개, 오류: ${totalErrors}개`)
      
      if (totalErrors > 0) {
        const errorMessage = `${totalErrors}개 배치에서 삽입 오류가 발생했습니다.`
        console.error('삽입 오류 상세:', JSON.stringify(errorDetails, null, 2))
        const detailedError = new Error(errorMessage)
        ;(detailedError as any).details = errorDetails
        throw detailedError
      }
    } else {
      console.warn('저장할 통계 데이터가 없습니다.')
    }

    return new Response(
      JSON.stringify({ 
        message: 'Statistics calculated successfully',
        count: statistics.length,
        settlement_month,
        inserted: statistics.length
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== 통계 계산 오류 발생 ===')
    console.error('에러 타입:', error.constructor.name)
    console.error('에러 메시지:', error.message)
    console.error('에러 스택:', error.stack)
    
    try {
      console.error('에러 상세:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    } catch (jsonError) {
      console.error('에러를 JSON으로 변환할 수 없음:', jsonError)
      console.error('에러 문자열:', error.toString())
    }
    
    const errorMessage = error.message || error.toString() || 'Unknown error'
    const errorDetails: any = {
      error: errorMessage,
      type: error.constructor.name,
      ...(error.stack && { stack: error.stack })
    }
    
    // 삽입 오류의 상세 정보가 있으면 포함
    if ((error as any).details) {
      errorDetails.insertionErrors = (error as any).details
    }
    
    return new Response(
      JSON.stringify(errorDetails),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
})


