import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // 요청 데이터 파싱
    const { email } = await req.json()
    
    if (!email) {
      throw new Error('이메일이 필요합니다.')
    }

    // Supabase Admin 클라이언트 생성 (Service Role Key 사용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // 한글 비밀번호 재설정 이메일 보내기
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/reset-password`
      }
    })
    
    if (error) {
      console.error('비밀번호 재설정 이메일 전송 오류:', error)
      throw error
    }
    
    console.log(`비밀번호 재설정 이메일 전송 성공: ${email}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '비밀번호 재설정 이메일이 전송되었습니다.' 
      }), 
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    console.error('비밀번호 재설정 이메일 전송 실패:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || '비밀번호 재설정 이메일 전송에 실패했습니다.' 
      }), 
      {
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
}) 