// Supabase 설정 관리 (단일 환경)
const getSupabaseConfig = () => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  // 모든 환경에서 동일한 데이터베이스 사용
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    environment: isDevelopment && isLocalhost ? 'development' : 'production'
  }
}

// 환경 정보 로깅
const config = getSupabaseConfig()
console.log('=== Supabase Configuration ===')
console.log('Environment:', config.environment)
console.log('URL:', config.url)
console.log('Anon Key (first 20 chars):', config.anonKey?.substring(0, 20) + '...')
console.log('Current URL:', window.location.href)
console.log('================================')

export default config
