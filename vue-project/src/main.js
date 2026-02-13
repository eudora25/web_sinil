// import '@primevue/themes/aura/theme.css';
import 'primeicons/primeicons.css';

// 기타 전역 CSS
import '@/assets/buttons.css';
import './assets/main.css';

function showLoadError(err) {
  console.error('[App] 초기화 실패:', err);
  const el = document.getElementById('app');
  if (el) {
    const msg = err?.message || String(err);
    el.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; max-width: 600px; margin: 2rem auto;">
        <h1 style="color: #c00;">앱 로드 실패</h1>
        <p style="color: #333;">${msg}</p>
        <p style="color: #666; font-size: 0.9rem;">Vercel 배포 시 Environment Variables에 <strong>VITE_SUPABASE_URL</strong>, <strong>VITE_SUPABASE_ANON_KEY</strong>를 설정한 뒤 재배포해주세요.</p>
      </div>
    `;
  }
}

async function bootstrap() {
  const { createApp } = await import('vue');
  const { default: App } = await import('./App.vue');
  const { default: router } = await import('./router');
  const PrimeVue = (await import('primevue/config')).default;
  const Aura = (await import('@primevue/themes/aura')).default;
  const ConfirmationService = (await import('primevue/confirmationservice')).default;
  const ToastService = (await import('primevue/toastservice')).default;

  const app = createApp(App);
  app.use(router);
  app.use(PrimeVue, {
    theme: Aura,
    ripple: true,
    inputStyle: 'filled',
  });
  app.use(ConfirmationService);
  app.use(ToastService);
  app.mount('#app');
}

bootstrap().catch(showLoadError);