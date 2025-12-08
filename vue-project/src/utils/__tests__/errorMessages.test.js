/**
 * 오류 메시지 변환 함수 테스트
 * 브라우저 콘솔에서 실행하거나 테스트 프레임워크에서 사용 가능
 */

import { translateSupabaseError, translateGeneralError } from '../errorMessages';

// 테스트 케이스 정의
const testCases = {
  // 이슈 #7: 엑셀 등록 오류
  duplicateInsuranceCode: {
    error: { 
      code: '23505', 
      message: 'duplicate key value violates unique constraint "products_insurance_code_key"' 
    },
    context: '엑셀 등록',
    expected: '중복된 보험코드가 있습니다.'
  },
  
  nullPrescriptionQty: {
    error: { 
      code: '23502', 
      message: 'null value in column "prescription_qty" of relation "performance_records" violates not-null constraint' 
    },
    context: '실적 등록',
    expected: '처방 수량은 필수 입력 항목입니다.'
  },
  
  foreignKeyViolation: {
    error: { 
      code: '23503', 
      message: 'insert or update on table "products" violates foreign key constraint' 
    },
    context: '엑셀 등록',
    expected: '연결된 데이터가 없어 등록할 수 없습니다.'
  },
  
  // 이슈 #50: 회원가입 오류
  securityRateLimit: {
    error: { 
      message: 'For security purposes, you can only request this after 52 seconds.' 
    },
    context: '회원가입',
    expected: '보안을 위해 잠시 후 다시 시도해주세요.'
  },
  
  duplicateEmail: {
    error: { 
      code: '23505', 
      message: 'duplicate key value violates unique constraint "companies_email_key"' 
    },
    context: '회원가입',
    expected: '중복된 이메일 주소입니다.'
  },
  
  invalidEmail: {
    error: { 
      message: 'Unable to validate email address: invalid format' 
    },
    context: '회원가입',
    expected: '이메일 주소 형식이 올바르지 않습니다.'
  },
  
  // 이슈 #52: 업체 등록 오류
  edgeFunctionError: {
    error: { 
      message: 'Edge Function returned a non-2xx status code' 
    },
    context: '업체 등록',
    expected: '서버 처리 중 오류가 발생했습니다.'
  },
  
  duplicateBusinessNumber: {
    error: { 
      code: '23505', 
      message: 'duplicate key value violates unique constraint "companies_business_registration_number_key"' 
    },
    context: '업체 등록',
    expected: '중복된 사업자등록번호입니다.'
  },
  
  // 이슈 #54: 실적 등록 수량 오류
  nullPrescriptionQtyInUpdate: {
    error: { 
      code: '23502', 
      message: 'null value in column "prescription_qty" of relation "performance_records" violates not-null constraint' 
    },
    context: '실적 수정',
    expected: '처방 수량은 필수 입력 항목입니다.'
  },
  
  // 일반 오류
  networkError: {
    error: { 
      message: 'Failed to fetch' 
    },
    context: '데이터 조회',
    expected: '네트워크 연결에 문제가 있습니다.'
  },
  
  timeoutError: {
    error: { 
      message: 'Request timeout' 
    },
    context: '데이터 조회',
    expected: '요청 시간이 초과되었습니다.'
  }
};

// 테스트 실행 함수
export function runErrorMessagesTests() {
  console.log('=== 오류 메시지 변환 함수 테스트 시작 ===\n');
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  Object.keys(testCases).forEach((testName, index) => {
    const testCase = testCases[testName];
    const result = translateSupabaseError(testCase.error, testCase.context);
    const success = result.includes(testCase.expected);
    
    if (success) {
      passed++;
      console.log(`✅ 테스트 ${index + 1}: ${testName} - 통과`);
    } else {
      failed++;
      failures.push({ testName, expected: testCase.expected, actual: result });
      console.error(`❌ 테스트 ${index + 1}: ${testName} - 실패`);
      console.error(`   예상: ${testCase.expected}`);
      console.error(`   결과: ${result}`);
    }
  });
  
  console.log(`\n=== 테스트 결과 ===`);
  console.log(`통과: ${passed}개`);
  console.log(`실패: ${failed}개`);
  console.log(`전체: ${passed + failed}개`);
  
  if (failures.length > 0) {
    console.error(`\n=== 실패한 테스트 ===`);
    failures.forEach((failure, index) => {
      console.error(`${index + 1}. ${failure.testName}`);
      console.error(`   예상: ${failure.expected}`);
      console.error(`   결과: ${failure.actual}`);
    });
  }
  
  return {
    passed,
    failed,
    total: passed + failed,
    successRate: ((passed / (passed + failed)) * 100).toFixed(2) + '%',
    failures
  };
}

// 브라우저 콘솔에서 직접 실행 가능하도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.testErrorMessages = runErrorMessagesTests;
  console.log('테스트 함수가 준비되었습니다. 콘솔에서 testErrorMessages()를 실행하세요.');
}

