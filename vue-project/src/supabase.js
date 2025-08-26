import { createClient } from '@supabase/supabase-js'

// 환경별 데이터베이스 연결 정보 로깅
console.log('=== Supabase Connection Info ===');
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
console.log('Current URL:', window.location.href);
console.log('================================');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 이메일 검증 완화 옵션
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    // 이메일 검증 완화 설정
    emailConfirm: false, // 이메일 확인 비활성화
    secureEmailChange: false // 이메일 변경 시 보안 검증 비활성화
  }
})