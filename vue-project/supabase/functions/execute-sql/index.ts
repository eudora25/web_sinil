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
    const { sql } = await req.json()

    if (!sql) {
      return new Response(
        JSON.stringify({ error: 'SQL query is required' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // PostgreSQL 직접 실행은 Supabase JS 클라이언트로 불가능
    // 대신 각 SQL 문을 파싱해서 실행해야 함
    // 하지만 이것도 제한적이므로, Supabase 대시보드에서 직접 실행하는 것을 권장

    return new Response(
      JSON.stringify({ 
        message: 'SQL execution via Edge Function is not directly supported. Please use Supabase Dashboard SQL Editor.',
        suggestion: 'Go to https://supabase.com/dashboard/project/vbmmfuraxvxlfpewqrsm/editor and run the SQL directly'
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
})

