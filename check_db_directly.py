#!/usr/bin/env python3
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def setup_driver():
    """Chrome 드라이버 설정"""
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # 헤드리스 모드 비활성화
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Chrome 드라이버 설정 실패: {e}")
        return None

def login_admin(driver):
    """관리자 로그인"""
    print("=== 관리자 로그인 ===")
    
    try:
        driver.get("http://localhost:5173/login")
        time.sleep(2)
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys("test1@test.com")
        
        # 비밀번호 입력
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys("asdf1234")
        
        # 로그인 버튼 클릭
        login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
        login_button.click()
        
        # 로그인 성공 확인
        time.sleep(3)
        current_url = driver.current_url
        
        if "/admin" in current_url:
            print("✅ 관리자 로그인 성공")
            return True
        else:
            print("❌ 관리자 로그인 실패")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return False

def check_database(driver):
    """데이터베이스 확인"""
    print("\n=== 데이터베이스 확인 ===")
    
    try:
        # 신규 업체 등록 페이지 접속
        driver.get("http://localhost:5173/admin/companies/create?from=pending")
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        
        # 브라우저 콘솔에서 스크립트 실행
        check_script = """
        async function checkDatabase() {
            console.log('🔍 데이터베이스 확인 시작...');
            
            try {
                // 전체 업체 수 확인
                const { data: allCompanies, error: allError } = await supabase
                    .from('companies')
                    .select('business_registration_number, company_name, created_at');
                
                if (allError) {
                    console.error('❌ 전체 조회 오류:', allError);
                    return;
                }
                
                console.log(`📊 총 ${allCompanies.length}개의 업체가 등록되어 있습니다.`);
                
                // 사업자등록번호 목록 출력
                console.log('📋 등록된 사업자등록번호 목록:');
                allCompanies.forEach((company, index) => {
                    console.log(`${index + 1}. ${company.business_registration_number} - ${company.company_name}`);
                });
                
                // 테스트용 번호들 확인
                const testNumbers = ['111-11-11111', '222-22-22222', '333-33-33333', '444-44-44444', '555-55-55555'];
                
                console.log('🔎 테스트용 번호 확인:');
                for (const number of testNumbers) {
                    const { data: found } = await supabase
                        .from('companies')
                        .select('id, company_name')
                        .eq('business_registration_number', number);
                    
                    if (found && found.length > 0) {
                        console.log(`❌ ${number} - 이미 사용됨 (${found.length}개)`);
                        found.forEach(company => {
                            console.log(`   - ${company.company_name} (ID: ${company.id})`);
                        });
                    } else {
                        console.log(`✅ ${number} - 사용 가능`);
                    }
                }
                
                // 사용 가능한 번호 찾기
                console.log('💡 사용 가능한 번호 찾기:');
                for (let i = 1; i <= 20; i++) {
                    const testNumber = `${String(i).zfill(3)}-${String(i).zfill(2)}-${String(i).zfill(5)}`;
                    const { data: found } = await supabase
                        .from('companies')
                        .select('id')
                        .eq('business_registration_number', testNumber);
                    
                    if (!found || found.length === 0) {
                        console.log(`✅ ${testNumber} - 사용 가능`);
                        break;
                    }
                }
                
            } catch (error) {
                console.error('❌ 스크립트 실행 오류:', error);
            }
        }
        
        checkDatabase();
        """
        
        # 콘솔에서 스크립트 실행
        driver.execute_script(check_script)
        
        # 결과 확인을 위해 잠시 대기
        time.sleep(5)
        
        # 콘솔 로그 가져오기
        logs = driver.get_log('browser')
        for log in logs:
            if 'console' in log['message']:
                print(log['message'])
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터베이스 확인 중 오류: {e}")
        return False

def main():
    """메인 함수"""
    print("🚀 데이터베이스 직접 확인 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 관리자 로그인
        if not login_admin(driver):
            print("❌ 관리자 로그인 실패로 중단")
            return
        
        # 2. 데이터베이스 확인
        success = check_database(driver)
        
        # 3. 결과 출력
        print(f"\n🏁 확인 완료:")
        if success:
            print("✅ 데이터베이스 확인이 완료되었습니다.")
            print("브라우저 콘솔에서 결과를 확인해주세요.")
        else:
            print("⚠️ 데이터베이스 확인에 문제가 있습니다.")
            
    except Exception as e:
        print(f"❌ 확인 중 오류: {e}")
    finally:
        # 브라우저는 열어둔 상태로 유지
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    main()
