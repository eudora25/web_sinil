/**
 * 로깅 유틸리티
 * 개발 환경에서만 콘솔에 출력하고, 프로덕션에서는 에러만 로깅 서비스로 전송
 */

const isDevelopment = import.meta.env.DEV;

/**
 * 일반 로그 (개발 환경에서만 출력)
 */
export function log(...args) {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * 경고 로그 (개발 환경에서만 출력)
 */
export function warn(...args) {
  if (isDevelopment) {
    console.warn(...args);
  }
}

/**
 * 에러 로그
 * - 개발 환경: 콘솔에 출력
 * - 프로덕션: 에러 로깅 서비스로 전송 (향후 구현)
 */
export function error(...args) {
  if (isDevelopment) {
    console.error(...args);
  } else {
    // 프로덕션에서는 에러 로깅 서비스로 전송
    // TODO: Sentry, LogRocket 등의 에러 로깅 서비스 연동
    // 예: logErrorToService(...args);
  }
}

/**
 * 그룹 로그 (개발 환경에서만 출력)
 */
export function group(...args) {
  if (isDevelopment) {
    console.group(...args);
  }
}

/**
 * 그룹 종료 (개발 환경에서만 출력)
 */
export function groupEnd() {
  if (isDevelopment) {
    console.groupEnd();
  }
}

/**
 * 테이블 로그 (개발 환경에서만 출력)
 */
export function table(...args) {
  if (isDevelopment) {
    console.table(...args);
  }
}

/**
 * 디버그 로그 (개발 환경에서만 출력)
 */
export function debug(...args) {
  if (isDevelopment) {
    console.debug(...args);
  }
}

// 기본 export로 logger 객체 제공
export default {
  log,
  warn,
  error,
  group,
  groupEnd,
  table,
  debug
};

