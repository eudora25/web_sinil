// 환경별 Supabase 설정 관리
const getSupabaseConfig = () => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  // 로컬 개발 환경 (localhost:5173, localhost:5174 등)
  if (isDevelopment && isLocalhost) {
    const localUrl = import.meta.env.VITE_SUPABASE_URL_LOCAL
    const localKey = import.meta.env.VITE_SUPABASE_ANON_KEY_LOCAL
    
    // 로컬 환경 변수가 없으면 프로덕션 환경 변수 사용
    if (!localUrl || !localKey) {
      console.warn('로컬 환경 변수가 설정되지 않았습니다. 프로덕션 환경 변수를 사용합니다.')
      return {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        environment: 'production (fallback)'
      }
    }
    
    return {
      url: localUrl,
      anonKey: localKey,
      environment: 'local'
    }
  }
  
  // 프로덕션 환경 (배포된 사이트)
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    environment: 'production'
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
