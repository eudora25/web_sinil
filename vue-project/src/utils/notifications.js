/**
 * 알림 유틸리티
 * alert/confirm을 PrimeVue Toast/Dialog로 대체
 * 
 * 사용법:
 * import { showSuccess, showError, showWarning, showInfo, showConfirm } from '@/utils/notifications';
 * 
 * // Toast 사용
 * showSuccess('저장되었습니다.');
 * showError('오류가 발생했습니다.');
 * 
 * // Confirm 사용 (Promise 반환)
 * const confirmed = await showConfirm('정말 삭제하시겠습니까?');
 * if (confirmed) { ... }
 */

import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Toast 인스턴스는 각 컴포넌트에서 생성해야 하므로,
// 함수를 반환하는 팩토리 패턴 사용
let toastInstance = null;
let confirmInstance = null;

/**
 * Toast 인스턴스 설정 (컴포넌트에서 호출)
 */
export function setToastInstance(toast) {
  toastInstance = toast;
}

/**
 * Confirm 인스턴스 설정 (컴포넌트에서 호출)
 */
export function setConfirmInstance(confirm) {
  confirmInstance = confirm;
}

/**
 * 성공 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} life - 표시 시간 (ms, 기본 3000)
 */
export function showSuccess(message, life = 3000) {
  if (!toastInstance) {
    console.warn('Toast 인스턴스가 설정되지 않았습니다. useToast()를 먼저 호출하세요.');
    // 폴백: 기본 alert 사용
    alert(message);
    return;
  }
  toastInstance.add({
    severity: 'success',
    summary: '성공',
    detail: message,
    life: life
  });
}

/**
 * 에러 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} life - 표시 시간 (ms, 기본 5000)
 */
export function showError(message, life = 5000) {
  if (!toastInstance) {
    console.warn('Toast 인스턴스가 설정되지 않았습니다. useToast()를 먼저 호출하세요.');
    // 폴백: 기본 alert 사용
    alert(message);
    return;
  }
  toastInstance.add({
    severity: 'error',
    summary: '오류',
    detail: message,
    life: life
  });
}

/**
 * 경고 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} life - 표시 시간 (ms, 기본 4000)
 */
export function showWarning(message, life = 4000) {
  if (!toastInstance) {
    console.warn('Toast 인스턴스가 설정되지 않았습니다. useToast()를 먼저 호출하세요.');
    // 폴백: 기본 alert 사용
    alert(message);
    return;
  }
  toastInstance.add({
    severity: 'warn',
    summary: '경고',
    detail: message,
    life: life
  });
}

/**
 * 정보 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} life - 표시 시간 (ms, 기본 3000)
 */
export function showInfo(message, life = 3000) {
  if (!toastInstance) {
    console.warn('Toast 인스턴스가 설정되지 않았습니다. useToast()를 먼저 호출하세요.');
    // 폴백: 기본 alert 사용
    alert(message);
    return;
  }
  toastInstance.add({
    severity: 'info',
    summary: '알림',
    detail: message,
    life: life
  });
}

/**
 * 확인 다이얼로그 표시 (Promise 반환)
 * @param {string} message - 확인 메시지
 * @param {string} header - 다이얼로그 제목 (기본: '확인')
 * @param {string} acceptLabel - 확인 버튼 텍스트 (기본: '확인')
 * @param {string} rejectLabel - 취소 버튼 텍스트 (기본: '취소')
 * @returns {Promise<boolean>} 확인 시 true, 취소 시 false
 */
export function showConfirm(message, header = '확인', acceptLabel = '확인', rejectLabel = '취소') {
  return new Promise((resolve) => {
    if (!confirmInstance) {
      console.warn('Confirm 인스턴스가 설정되지 않았습니다. useConfirm()를 먼저 호출하세요.');
      // 폴백: 기본 confirm 사용
      const result = confirm(message);
      resolve(result);
      return;
    }
    
    confirmInstance.require({
      message: message,
      header: header,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: acceptLabel,
      rejectLabel: rejectLabel,
      accept: () => {
        resolve(true);
      },
      reject: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 컴포넌트에서 사용하기 위한 Composable 함수
 * setup() 함수 내에서 호출하여 사용
 * 
 * @example
 * const { showSuccess, showError, showConfirm } = useNotifications();
 */
export function useNotifications() {
  const toast = useToast();
  const confirm = useConfirm();
  
  // 인스턴스 설정
  setToastInstance(toast);
  setConfirmInstance(confirm);
  
  // 래퍼 함수들 (인스턴스가 설정된 후 호출)
  const showSuccessWrapper = (message, life) => {
    toast.add({
      severity: 'success',
      summary: '성공',
      detail: message,
      life: life || 3000
    });
  };
  
  const showErrorWrapper = (message, life) => {
    toast.add({
      severity: 'error',
      summary: '오류',
      detail: message,
      life: life || 5000
    });
  };
  
  const showWarningWrapper = (message, life) => {
    toast.add({
      severity: 'warn',
      summary: '경고',
      detail: message,
      life: life || 4000
    });
  };
  
  const showInfoWrapper = (message, life) => {
    toast.add({
      severity: 'info',
      summary: '알림',
      detail: message,
      life: life || 3000
    });
  };
  
  const showConfirmWrapper = (message, header = '확인', acceptLabel = '확인', rejectLabel = '취소') => {
    return new Promise((resolve) => {
      confirm.require({
        message: message,
        header: header,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: acceptLabel,
        rejectLabel: rejectLabel,
        accept: () => {
          resolve(true);
        },
        reject: () => {
          resolve(false);
        }
      });
    });
  };
  
  return {
    showSuccess: showSuccessWrapper,
    showError: showErrorWrapper,
    showWarning: showWarningWrapper,
    showInfo: showInfoWrapper,
    showConfirm: showConfirmWrapper
  };
}

