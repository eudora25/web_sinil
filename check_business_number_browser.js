// 브라우저 콘솔에서 실행할 사업자등록번호 확인 스크립트
console.log('=== 사업자등록번호 확인 시작 ===');

// 테스트할 사업자등록번호들
const testNumbers = [
  '984-35-13234',
  '123-45-67890',
  '987-65-43210'
];

async function checkBusinessNumbers() {
  for (const businessNumber of testNumbers) {
    console.log(`\n--- ${businessNumber} 확인 중 ---`);
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, business_registration_number, company_name, email')
        .eq('business_registration_number', businessNumber);
      
      if (error) {
        console.log(`❌ 오류: ${error.message}`);
      } else {
        console.log(`✅ 조회 결과: ${data.length}개`);
        if (data.length > 0) {
          data.forEach((company, index) => {
            console.log(`  ${index + 1}. ID: ${company.id}, 업체명: ${company.company_name}, 이메일: ${company.email}`);
          });
        } else {
          console.log(`  📝 ${businessNumber}는 등록되지 않은 사업자등록번호입니다.`);
        }
      }
    } catch (err) {
      console.log(`❌ 예외 발생: ${err.message}`);
    }
  }
}

// 실행
checkBusinessNumbers();

console.log('=== 사업자등록번호 확인 완료 ===');
