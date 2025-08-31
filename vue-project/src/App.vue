<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { supabase } from '@/supabase';
import router from './router';
import TopNavigationBar from './components/TopNavigationBar.vue';
import SideNavigationBar from './components/SideNavigationBar.vue';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import EmptyLayout from './layouts/EmptyLayout.vue';
import DefaultLayout from './layouts/DefaultLayout.vue';

const user = ref(null);
const userEmail = ref('');
const userType = ref(''); // 'admin', 'user', or ''
const route = useRoute();
const isSideNavExpanded = ref(false);
const toast = useToast();

console.log('[App.vue] Script setup: Initializing');

// 사용자 상태 설정 함수
const setUserState = (sessionUser) => {
  if (sessionUser) {
    user.value = sessionUser;
    userEmail.value = sessionUser.email;
    userType.value = sessionUser.user_metadata?.user_type || '';
    console.log(`[App.vue] setUserState: User set - Email: ${userEmail.value}, Type: ${userType.value}`);
  } else {
    user.value = null;
    userEmail.value = '';
    userType.value = '';
    console.log('[App.vue] setUserState: User cleared');
  }
};

// 리디렉션 처리 함수
const handleRedirect = async (currentSession) => {
  const currentPath = router.currentRoute.value.path;
  const actualPath = window.location.pathname; // 브라우저의 실제 URL 경로
  console.log(`[App.vue] handleRedirect: Router path: ${currentPath}, Actual path: ${actualPath}, UserType: ${userType.value}`);

  if (currentSession && currentSession.user) {
    // 사용자가 로그인된 상태
    const targetPath = userType.value === 'admin' ? '/admin/notices' : (userType.value === 'user' ? '/notices' : null);
    
    if (targetPath) {
      // 실제 브라우저 경로가 루트(/)나 로그인 페이지에서만 기본 페이지로 리다이렉션
      if (actualPath === '/' || actualPath === '/login') {
         console.log(`[App.vue] handleRedirect: User logged in. Redirecting from ${actualPath} to ${targetPath}`);
         try {
             await router.push(targetPath);
         } catch (e) {
             console.error(`[App.vue] handleRedirect: Failed to push to ${targetPath}`, e);
         }
      } else {
        // 다른 경로에서는 현재 경로 유지
        console.log(`[App.vue] handleRedirect: User logged in. Staying at actual path ${actualPath}.`);
      }
    } else {
        // userType이 없거나 유효하지 않은 경우 (예: 메타데이터 누락)
        console.warn(`[App.vue] handleRedirect: User logged in but userType ('${userType.value}') is invalid. Staying at ${actualPath} or redirecting to login if critical.`);
        if (actualPath !== '/login' && actualPath !== '/signup') {
             console.log(`[App.vue] handleRedirect: Invalid userType, pushing to /login from ${actualPath}`);
             await router.push('/login');
        }
    }
  } else {
    // 사용자가 로그인되지 않은 상태
    if (actualPath !== '/login' && actualPath !== '/signup' && actualPath !== '/reset-password') {
      console.log(`[App.vue] handleRedirect: User not logged in. Redirecting from ${actualPath} to /login`);
      try {
        await router.push('/login');
      } catch (e) {
        console.error('[App.vue] handleRedirect: Failed to push to /login (user not logged in)', e);
      }
    } else {
        console.log(`[App.vue] handleRedirect: User not logged in. Already at ${actualPath}. No redirect needed.`);
    }
  }
};

// 대메뉴/중메뉴 구조(TopNavigationBar용, SideNavigationBar와 동일하게 유지)
const adminMenuTree = [
  { label: '공지사항 관리', children: [ 
    { label: '공지사항 목록', path: '/admin/notices' },
    { label: '공지사항 상세', path: '/admin/notices/:id' },
    { label: '공지사항 수정', path: '/admin/notices/:id/edit' }
  ] },
  { label: '업체 관리', children: [ 
    { label: '승인 업체', path: '/admin/companies/approved' },
    { label: '미승인 업체', path: '/admin/companies/pending' }
  ] },
  { label: '제품 관리', children: [ { label: '제품 목록', path: '/admin/products' } ] },
  { label: '병의원 관리', children: [ 
    { label: '병의원 목록', path: '/admin/clients' },
    { label: '병의원 등록', path: '/admin/clients/create' },
    { label: '담당업체 지정', path: '/admin/clients/assign-companies' },
    { label: '문전약국 지정', path: '/admin/clients/assign-pharmacies' }
  ] },
  { label: '문전약국 관리', children: [ { label: '문전약국 목록', path: '/admin/pharmacies' } ] },
  { label: '매출 관리', children: [ { label: '도매매출 목록', path: '/admin/wholesale-revenue' }, { label: '직거래매출 목록', path: '/admin/direct-revenue' } ] },
  { label: '실적 관리', children: [ 
    { label: '정산월 관리', path: '/admin/settlement-months' },
    { label: '실적 등록', path: '/admin/performance/register' },
    { label: '업체별 등록 현황', path: '/admin/performance/companies' },
    { label: '전체 등록 현황', path: '/admin/performance/whole' }
  ] },
  { label: '정산 관리', children: [ 
    { label: '흡수율 분석', path: '/admin/absorption-analysis' }, 
    { label: '정산내역서 공유', path: '/admin/settlement-statements' } 
  ] }
];
const userMenuTree = [
  { label: '공지사항 조회', children: [ { label: '공지사항 목록', path: '/notices' } ] },
  { label: '제품 조회', children: [ { label: '제품 목록', path: '/products' } ] },
  { label: '병의원 조회', children: [ { label: '병의원 목록', path: '/clients' } ] },
  { label: '실적 관리', children: [ { label: '실적 등록', path: '/performance/register' }, { label: '등록 현황', path: '/performance/list' } ] },
  { label: '정산내역서 조회', children: [ { label: '월별 정산 목록', path: '/settlements' } ] },
  { label: '내 정보', children: [ { label: '내 정보', path: '/my-info' } ] }
];
const menuTree = computed(() => userType.value === 'admin' ? adminMenuTree : userMenuTree);

const breadcrumbMenu = computed(() => {
  const currentPath = route.path;
  if (/^\/admin\/notices(\/|$)/.test(currentPath)) return '공지사항 관리';
  if (/^\/admin\/companies(\/|$)/.test(currentPath)) return '업체 관리';
  if (/^\/admin\/products(\/|$)/.test(currentPath)) return '제품 관리';
  if (/^\/admin\/clients(\/|$)/.test(currentPath)) return '병의원 관리';
  if (/^\/admin\/pharmacies(\/|$)/.test(currentPath)) return '문전약국 관리';
  if (/^\/admin\/wholesale-revenue(\/|$)/.test(currentPath)) return '도매매출 관리';
  if (/^\/admin\/direct-revenue(\/|$)/.test(currentPath)) return '직거래매출 관리';
  if (/^\/admin\/settlement-months(\/|$)/.test(currentPath)) return '정산월 관리';
  return '';
});

const breadcrumbSubMenu = computed(() => {
  const currentPath = route.path;
  // 공지사항
  if (/^\/admin\/notices\/[\w-]+\/edit(?:\?.*)?$/.test(currentPath)) return '공지사항 수정';
  if (/^\/admin\/notices\/create(?:\?.*)?$/.test(currentPath)) return '공지사항 등록';
  if (/^\/admin\/notices\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '공지사항 상세';
  // 업체
  if (/^\/admin\/companies\/create(?:\?.*)?$/.test(currentPath)) return '신규 업체 등록';
  if (/^\/admin\/companies\/[\w-]+\/edit(?:\?.*)?$/.test(currentPath)) return '업체 수정';
  if (/^\/admin\/companies\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '업체 상세';
  // 제품
  if (/^\/admin\/products\/create(?:\?.*)?$/.test(currentPath)) return '제품 등록';
  if (/^\/admin\/products\/[\w-]+\/edit(?:\?.*)?$/.test(currentPath)) return '제품 수정';
  if (/^\/admin\/products\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '제품 상세';
  // 병의원
  if (/^\/admin\/clients\/[\w-]+\/edit(?:\?.*)?$/.test(currentPath)) return '병의원 수정';
  if (/^\/admin\/clients\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '병의원 상세';
  // 문전약국
  if (/^\/admin\/pharmacies\/create(?:\?.*)?$/.test(currentPath)) return '문전약국 등록';
  if (/^\/admin\/pharmacies\/[\w-]+\/edit(?:\?.*)?$/.test(currentPath)) return '문전약국 수정';
  if (/^\/admin\/pharmacies\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '문전약국 상세';
  // 도매매출/직거래매출
  if (/^\/admin\/wholesale-revenue\/create(?:\?.*)?$/.test(currentPath)) return '도매매출 등록';
  if (/^\/admin\/direct-revenue\/create(?:\?.*)?$/.test(currentPath)) return '직거래매출 등록';
  // 정산월
  if (/^\/admin\/settlement-months\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '정산월 상세';
  // 이용자
  if (/^\/products\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '제품 상세';
  if (/^\/clients\/[\w-]+(?:\?.*)?$/.test(currentPath)) return '병의원 상세';
  return '';
});

onMounted(async () => {
  console.log('[App.vue] onMounted: Component mounted. Registering onAuthStateChange.');
  
  // 초기 세션 로드 및 상태 설정
  // onAuthStateChange가 INITIAL_SESSION 이벤트를 통해 초기 상태를 처리하므로,
  // onMounted에서는 getSession()을 호출하여 즉시 상태를 반영하려고 시도할 수 있지만,
  // onAuthStateChange 리스너가 등록된 후 INITIAL_SESSION 이벤트가 발생하므로 중복될 수 있습니다.
  // INITIAL_SESSION을 주로 사용하고, getSession은 보조적으로 사용하거나 로그 확인용으로만 남겨둘 수 있습니다.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[App.vue] onMounted: getSession() completed.', { session });
    if (session && session.user) {
        // 이미 INITIAL_SESSION에서 처리될 가능성이 높지만, 만약을 대비해 한번 더 사용자 상태 설정
        // setUserState(session.user); 
        // INITIAL_SESSION 이벤트에서 주도적으로 처리하도록 이 부분은 주석 처리하거나 제거 가능.
    } else if (!session && router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/signup') {
        // console.log('[App.vue] onMounted: No session from getSession(), redirecting to /login if not already there.');
        // await router.push('/login'); // INITIAL_SESSION에서 처리.
    }
  } catch (error) {
      console.error('[App.vue] onMounted: Error in getSession()', error);
  }

    
  supabase.auth.onAuthStateChange(async (event, session) => {
    setUserState(session?.user); // 이벤트 발생 시마다 사용자 상태 업데이트

    if (event === 'INITIAL_SESSION') {
      console.log('[App.vue] Event: INITIAL_SESSION');
      await handleRedirect(session);
    } else if (event === 'SIGNED_IN') {
      console.log('[App.vue] Event: SIGNED_IN');
      await handleRedirect(session); // 로그인 시 리디렉션
    } else if (event === 'SIGNED_OUT') {
      console.log('[App.vue] Event: SIGNED_OUT');
      await handleRedirect(null); // 로그아웃 시 리디렉션 (세션 없음)
    } else if (event === 'USER_UPDATED') {
      console.log('[App.vue] Event: USER_UPDATED. User metadata might have changed.');
      // 필요하다면 handleRedirect(session) 호출
    } else if (event === 'PASSWORD_RECOVERY') {
      console.log('[App.vue] Event: PASSWORD_RECOVERY. User may need to be redirected to a password reset page.');
      // 필요한 경우 비밀번호 재설정 페이지로 리디렉션
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('[App.vue] Event: TOKEN_REFRESHED. Session token has been refreshed.');
      // 특별한 조치 불필요
    }
  });
});

const handleLogout = async () => {
  console.log('[App.vue] handleLogout: Attempting logout');
  try {
    // 모든 Supabase 관련 스토리지 항목 삭제
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // sessionStorage도 정리
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('sb-')) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Supabase 로그아웃 시도 (에러 무시)
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.warn('[App.vue] handleLogout: Supabase signOut failed, but continuing with local cleanup:', signOutError);
    }
    
    // 로컬 상태 정리
    setUserState(null);
    router.push('/login');
    
  } catch (error) {
    console.error('[App.vue] handleLogout: Exception during logout', error);
    // 예외가 발생해도 로컬 상태는 정리
    setUserState(null);
    router.push('/login');
  }
};

// 처리 성공 시
toast.add({ severity: 'success', summary: '성공', detail: '업체 상태가 성공적으로 변경되었습니다.', life: 3000 });

// 처리 실패 시
toast.add({ severity: 'error', summary: '실패', detail: '오류가 발생했습니다.', life: 3000 });
</script>

<template>
  <EmptyLayout v-if="route.meta.layout === 'empty'">
    <router-view />
  </EmptyLayout>
  <DefaultLayout v-else>
    <SideNavigationBar v-if="user" :userRole="userType" :userEmail="userEmail" @logout="handleLogout" />
    <TopNavigationBar v-if="user" @logout="handleLogout" />
    <div class="main-content">
      <RouterView />
    </div>
    <Toast />
    <!-- Dialog(승인 취소 모달) 완전 삭제 -->
  </DefaultLayout>
</template>
