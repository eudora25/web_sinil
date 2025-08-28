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
    const { email, password, companyData } = await req.json()
    
    // Supabase 클라이언트 생성 (서비스 롤 키 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 필수 필드 검증
    if (!email || !password || !companyData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }
    
    // 사업자등록번호 형식 검증
    const businessNumber = companyData.business_registration_number.replace(/-/g, '');
    if (businessNumber.length !== 10) {
      return new Response(
        JSON.stringify({ error: 'Business registration number must be 10 digits' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!/^\d{10}$/.test(businessNumber)) {
      return new Response(
        JSON.stringify({ error: 'Business registration number must contain only numbers' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Auth 계정 생성 (서비스 롤 키로 이메일 검증 우회)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        name: companyData.company_name,
        phone: companyData.mobile_phone || null,
        user_type: 'user'
      },
      email_confirm: true // 이메일 확인 자동 완료
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user: ' + authError.message }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user?.id
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not generated' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 사업자등록번호 중복 검사 (하이픈 제거하여 검색)
    const cleanBusinessNumber = companyData.business_registration_number.replace(/-/g, '');
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('business_registration_number', cleanBusinessNumber)
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

    // 3. 회사 정보 삽입 (사업자등록번호 하이픈 제거)
    const { data: insertedCompany, error: insertError } = await supabase
      .from('companies')
      .insert([{
        ...companyData,
        business_registration_number: cleanBusinessNumber,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Company insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create company record: ' + insertError.message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
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
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
})
