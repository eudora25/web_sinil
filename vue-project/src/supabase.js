import { createClient } from '@supabase/supabase-js'
import supabaseConfig from './config/supabase.js'
import appConfig from './config/app.js'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 이메일 검증 완화 옵션
    emailRedirectTo: appConfig.AUTH_CALLBACK_URL,
    // 이메일 검증 완화 설정
    emailConfirm: false, // 이메일 확인 비활성화
    secureEmailChange: false, // 이메일 변경 시 보안 검증 비활성화
    // 추가 이메일 검증 완화 옵션
    emailValidation: false, // 이메일 검증 비활성화
    emailValidationRequired: false // 이메일 검증 필수 비활성화
  }
})