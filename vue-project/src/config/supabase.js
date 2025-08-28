// 환경별 Supabase 설정 관리
const getSupabaseConfig = () => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  // 로컬 개발 환경 (localhost:5173)
  if (isDevelopment && isLocalhost) {
    return {
      url: 'http://localhost:54321',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      environment: 'local'
    }
  }
  
  // 프로덕션 환경 (배포된 사이트)
  return {
    url: 'https://vbmmfuraxvxlfpewqrsm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc',
    environment: 'production'
  }
}

// 환경 정보 로깅
const config = getSupabaseConfig()
console.log('=== Supabase Configuration ===')
console.log('Environment:', config.environment)
console.log('URL:', config.url)
console.log('Anon Key (first 20 chars):', config.anonKey.substring(0, 20) + '...')
console.log('Current URL:', window.location.href)
console.log('================================')

export default config
