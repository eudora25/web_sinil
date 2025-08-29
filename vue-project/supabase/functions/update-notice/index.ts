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
    const { id, title, content, isPinned, fileUrls } = await req.json()
    
    // Supabase 클라이언트 생성 (서비스 롤 키 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 필수 필드 검증
    if (!id || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: id, title, content' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // 공지사항 수정 (서비스 롤 키로 RLS 우회)
    const { data: updatedNotice, error: updateError } = await supabase
      .from('notices')
      .update({
        title: title,
        content: content,
        is_pinned: isPinned || false,
        file_url: fileUrls || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Notice update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update notice: ' + updateError.message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notice: updatedNotice 
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
