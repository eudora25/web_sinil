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
    
    // Supabase 클라이언트 생성 (서비스 롤 키 사용 - RLS 우회)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 필수 필드 검증
    const requiredFields = ['email', 'password', 'company_name', 'business_registration_number']
    for (const field of requiredFields) {
      if (!companyData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        )
      }
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

    // 1단계: 관리자 권한으로 사용자 계정 생성 (로그인 불가능하도록 설정)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: companyData.email,
      password: companyData.password,
      email_confirm: true,
      user_metadata: {
        name: companyData.company_name,
        phone: companyData.mobile_phone || null,
        user_type: 'user',
        admin_created: true  // 관리자가 생성한 계정임을 표시
      }
    })

    if (userError) {
      console.error('User creation error:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user account: ' + userError.message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed: No user data returned' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 2단계: 회사 정보 삽입
    const companyRecord = {
      email: companyData.email,
      company_name: companyData.company_name,
      business_registration_number: companyData.business_registration_number,
      representative_name: companyData.representative_name,
      business_address: companyData.business_address,
      landline_phone: companyData.landline_phone,
      contact_person_name: companyData.contact_person_name,
      mobile_phone: companyData.mobile_phone,
      mobile_phone_2: companyData.mobile_phone_2,
      receive_email: companyData.receive_email,
      company_group: companyData.company_group,
      default_commission_grade: companyData.default_commission_grade,
      assigned_pharmacist_contact: companyData.assigned_pharmacist_contact,
      approval_status: companyData.approval_status === '승인' ? 'approved' : 'pending',
      remarks: companyData.remarks,
      user_id: userData.user.id,
      user_type: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: companyData.created_by || null
    }

    if (companyData.approval_status === '승인') {
      companyRecord.approved_at = new Date().toISOString()
    }

    const { data: insertedCompany, error: insertError } = await supabase
      .from('companies')
      .insert([companyRecord])
      .select()
      .single()

    if (insertError) {
      console.error('Company insert error:', insertError)
      // 사용자 계정 생성은 성공했지만 회사 정보 삽입 실패 시 사용자 계정 삭제
      await supabase.auth.admin.deleteUser(userData.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create company record: ' + insertError.message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 3단계: 사용자 계정을 비활성화하여 로그인을 막음
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { 
        user_metadata: { 
          ...userData.user.user_metadata,
          login_disabled: true,
          admin_created: true
        }
      }
    )

    if (updateError) {
      console.error('User update error:', updateError)
      // 업데이트 실패해도 계정은 생성되었으므로 경고만 기록
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
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
