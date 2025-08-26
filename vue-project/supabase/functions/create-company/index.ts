import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // 요청 본문 파싱
    const companyData = await req.json()
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Supabase 클라이언트 생성 (서비스 롤 키 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 토큰 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 필수 필드 검증
    const requiredFields = ['user_id', 'email', 'company_name', 'business_registration_number']
    for (const field of requiredFields) {
      if (!companyData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        )
      }
    }

    // user_id가 토큰의 사용자 ID와 일치하는지 확인
    if (companyData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 사업자등록번호 중복 검사
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('business_registration_number', companyData.business_registration_number)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Database error during duplicate check' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    if (existingCompany) {
      return new Response(
        JSON.stringify({ error: 'Business registration number already exists' }),
        { status: 409, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 회사 정보 삽입
    const { data: insertedCompany, error: insertError } = await supabase
      .from('companies')
      .insert([{
        ...companyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Company insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create company record' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        company: insertedCompany 
      }),
      { 
        status: 200, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
})
