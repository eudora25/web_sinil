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
    // Supabase 클라이언트 생성 (서비스 롤 키 사용 - RLS 우회)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 누락된 사용자 목록 조회
    const { data: missingCompanies, error: queryError } = await supabase
      .from('companies')
      .select('id, email, company_name, user_type, approval_status, user_id')
      .eq('approval_status', 'approved')
      .not('user_id', 'is', null)

    if (queryError) {
      return new Response(
        JSON.stringify({ error: 'Failed to query companies: ' + queryError.message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    if (!missingCompanies || missingCompanies.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No companies found' }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // auth.users에 존재하는지 확인
    const { data: existingUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')

    if (usersError) {
      // auth.users는 직접 쿼리할 수 없으므로, 각 사용자를 확인
      console.log('Cannot query auth.users directly, will check individually')
    }

    const results = []
    const errors = []

    // 각 회사에 대해 사용자 생성 시도
    for (const company of missingCompanies) {
      try {
        // 기존 user_id가 auth.users에 존재하는지 확인
        let userExists = false
        try {
          const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserById(company.user_id)
          if (!checkError && existingUser.user) {
            userExists = true
            results.push({
              company_id: company.id,
              email: company.email,
              status: 'exists',
              message: 'User already exists in auth.users'
            })
            continue
          }
        } catch (e) {
          // 사용자가 존재하지 않음
        }

        // 임시 비밀번호 생성 (영문 대소문자 + 숫자 + 특수문자)
        const tempPassword = generateTempPassword()

        // 사용자 생성
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: company.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: company.company_name,
            user_type: company.user_type || 'user',
            approval_status: company.approval_status,
            temp_password: true, // 임시 비밀번호임을 표시
            created_by_migration: true
          }
        })

        if (userError) {
          errors.push({
            company_id: company.id,
            email: company.email,
            error: userError.message
          })
          continue
        }

        if (!userData.user) {
          errors.push({
            company_id: company.id,
            email: company.email,
            error: 'User creation failed: No user data returned'
          })
          continue
        }

        // companies 테이블의 user_id 업데이트
        const { error: updateError } = await supabase
          .from('companies')
          .update({ user_id: userData.user.id })
          .eq('id', company.id)

        if (updateError) {
          errors.push({
            company_id: company.id,
            email: company.email,
            error: 'Failed to update company user_id: ' + updateError.message
          })
          // 사용자 계정은 생성되었지만 companies 업데이트 실패 시 사용자 삭제
          await supabase.auth.admin.deleteUser(userData.user.id)
          continue
        }

        results.push({
          company_id: company.id,
          email: company.email,
          user_id: userData.user.id,
          status: 'created',
          message: 'User created successfully',
          temp_password: tempPassword // 임시 비밀번호 반환 (보안상 실제로는 이메일로 전송해야 함)
        })

      } catch (error) {
        errors.push({
          company_id: company.id,
          email: company.email,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: missingCompanies.length,
        created: results.filter(r => r.status === 'created').length,
        exists: results.filter(r => r.status === 'exists').length,
        errors: errors.length,
        results: results,
        errors: errors
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

// 임시 비밀번호 생성 함수
function generateTempPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // 최소 1개의 대문자, 소문자, 숫자, 특수문자 포함
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // 나머지 문자 랜덤 생성
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // 비밀번호 섞기
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

