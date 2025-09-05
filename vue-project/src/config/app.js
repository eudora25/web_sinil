import supabaseConfig from './supabase.js';

// 앱 설정 파일
const config = {
  // 실제 배포된 웹사이트 URL 사용
  get APP_URL() {
    // 개발 환경인지 확인
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    // 브라우저 환경에서만 hostname 확인
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevelopment && isLocalhost) {
      return 'http://localhost:5173';
    } else {
      return 'https://edi-sh-new.vercel.app';
    }
  },
  
  // 비밀번호 재설정 URL
  get RESET_PASSWORD_URL() {
    return `${this.APP_URL}/reset-password`;
  },
  
  // 인증 콜백 URL
  get AUTH_CALLBACK_URL() {
    return `${this.APP_URL}/auth/callback`;
  }
};

export default config;
