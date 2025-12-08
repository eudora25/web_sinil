/**
 * Supabase 오류 메시지를 한글로 변환하는 유틸리티
 */

/**
 * Supabase 오류 코드와 메시지를 한글 메시지로 변환
 * @param {Object} error - Supabase 오류 객체
 * @param {string} context - 오류 발생 컨텍스트 (예: '엑셀 등록', '회원가입' 등)
 * @returns {string} 한글 오류 메시지
 */
export function translateSupabaseError(error, context = '작업') {
  if (!error) {
    return `${context} 중 알 수 없는 오류가 발생했습니다.`;
  }

  // 오류 코드별 처리
  if (error.code) {
    switch (error.code) {
      // PostgreSQL 오류 코드
      case '23505': // unique_violation
        if (error.message.includes('insurance_code')) {
          return '중복된 보험코드가 있습니다. 다른 보험코드를 사용해주세요.';
        }
        if (error.message.includes('standard_code')) {
          return '중복된 표준코드가 있습니다. 다른 표준코드를 사용해주세요.';
        }
        if (error.message.includes('email')) {
          return '중복된 이메일 주소입니다. 다른 이메일을 사용해주세요.';
        }
        if (error.message.includes('business_registration_number')) {
          return '중복된 사업자등록번호입니다. 다른 사업자등록번호를 사용해주세요.';
        }
        return '중복된 데이터가 있습니다. 다른 값을 입력해주세요.';
      
      case '23503': // foreign_key_violation
        return '연결된 데이터가 없어 등록할 수 없습니다. 관련 데이터를 먼저 등록해주세요.';
      
      case '23502': // not_null_violation
        if (error.message.includes('prescription_qty')) {
          return '처방 수량은 필수 입력 항목입니다. 숫자를 입력해주세요.';
        }
        if (error.message.includes('insurance_code')) {
          return '보험코드는 필수 입력 항목입니다.';
        }
        if (error.message.includes('product_name')) {
          return '제품명은 필수 입력 항목입니다.';
        }
        return '필수 입력 항목이 누락되었습니다. 모든 필수 항목을 입력해주세요.';
      
      case '23514': // check_violation
        return '입력한 값이 제약 조건을 만족하지 않습니다. 값을 확인해주세요.';
      
      case '42P01': // undefined_table
        return '데이터베이스 테이블을 찾을 수 없습니다. 관리자에게 문의해주세요.';
      
      case '42703': // undefined_column
        return '데이터베이스 컬럼을 찾을 수 없습니다. 관리자에게 문의해주세요.';
      
      // Supabase 특정 오류 코드
      case 'PGRST116':
        return '요청한 데이터를 찾을 수 없습니다.';
      
      case 'PGRST301':
        return '권한이 없습니다. 관리자에게 문의해주세요.';
    }
  }

  // 오류 메시지 내용별 처리
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // 중복 관련
    if (message.includes('duplicate') || message.includes('already exists') || message.includes('unique')) {
      return '중복된 데이터가 있습니다. 다른 값을 입력해주세요.';
    }
    
    // NULL 값 관련
    if (message.includes('null value') || message.includes('not null')) {
      if (message.includes('prescription_qty')) {
        return '처방 수량은 필수 입력 항목입니다. 숫자를 입력해주세요.';
      }
      return '필수 입력 항목이 누락되었습니다.';
    }
    
    // 외래키 관련
    if (message.includes('foreign key') || message.includes('violates foreign key')) {
      return '연결된 데이터가 없어 등록할 수 없습니다.';
    }
    
    // 권한 관련
    if (message.includes('permission') || message.includes('policy') || message.includes('row-level security')) {
      return '권한이 없습니다. 관리자에게 문의해주세요.';
    }
    
    // 네트워크 관련
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
    }
    
    // 타임아웃 관련
    if (message.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    
    // 인증 관련
    if (message.includes('jwt') || message.includes('token') || message.includes('unauthorized')) {
      return '로그인이 필요합니다. 다시 로그인해주세요.';
    }
    
    // 보안 관련 (회원가입)
    if (message.includes('for security purposes') || message.includes('rate limit')) {
      return '보안을 위해 잠시 후 다시 시도해주세요. (약 1분 정도 기다려주세요)';
    }
    
    // Edge Function 관련
    if (message.includes('edge function') || message.includes('non-2xx')) {
      return '서버 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.';
    }
    
    // 이메일 관련
    if (message.includes('email') && (message.includes('invalid') || message.includes('validate'))) {
      return '이메일 주소 형식이 올바르지 않습니다.';
    }
    
    // 비밀번호 관련
    if (message.includes('password')) {
      return '비밀번호가 요구사항을 충족하지 않습니다. (최소 6자 이상)';
    }
  }

  // 기본 오류 메시지
  if (error.message) {
    // 영어 메시지인 경우 기본 메시지 반환
    if (/^[a-zA-Z\s.,!?;:'"()\[\]{}\-_=+*&^%$#@~`<>\/\\|]+$/.test(error.message) && 
        !error.message.includes('한글') && 
        !error.message.includes('필수') &&
        !error.message.includes('중복')) {
      return `${context} 중 오류가 발생했습니다. 관리자에게 문의해주세요.`;
    }
    return `${context} 실패: ${error.message}`;
  }

  return `${context} 중 알 수 없는 오류가 발생했습니다. 관리자에게 문의해주세요.`;
}

/**
 * 일반적인 예외 오류를 한글 메시지로 변환
 * @param {Error} error - 예외 오류 객체
 * @param {string} context - 오류 발생 컨텍스트
 * @returns {string} 한글 오류 메시지
 */
export function translateGeneralError(error, context = '작업') {
  if (!error) {
    return `${context} 중 알 수 없는 오류가 발생했습니다.`;
  }

  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
    }
    
    if (message.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    
    if (message.includes('json') || message.includes('parse')) {
      return '데이터 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
  }

  return `${context} 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
}

