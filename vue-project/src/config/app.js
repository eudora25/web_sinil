import supabaseConfig from './supabase.js';

// 앱 설정 파일
const config = {
  // Supabase URL에서 도메인 추출
  get APP_URL() {
    try {
      const url = new URL(supabaseConfig.url);
      return `${url.protocol}//${url.hostname}`;
    } catch (error) {
      // 기본값으로 배포 URL 사용
      return 'https://web-sinil.vercel.app';
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
