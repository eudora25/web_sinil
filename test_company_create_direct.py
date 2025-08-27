from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def test_company_create_direct():
    """직접 브라우저에서 업체 등록 테스트"""
    print("🚀 직접 업체 등록 테스트 시작")
    
    # Chrome 옵션 설정 (헤드리스 비활성화)
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # chrome_options.add_argument("--headless")  # 헤드리스 비활성화
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 1. 로그인 페이지로 이동
        driver.get("http://localhost:5174/login")
        time.sleep(3)
        
        print(f"로그인 페이지 URL: {driver.current_url}")
        
        # 2. 관리자 로그인
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys("test1@test.com")
        print("✅ 이메일 입력: test1@test.com")
        
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys("asdf1234")
        print("✅ 비밀번호 입력: asdf1234")
        
        login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
        login_button.click()
        print("✅ 로그인 버튼 클릭")
        
        # 3. 로그인 성공 확인
        time.sleep(5)
        current_url = driver.current_url
        print(f"로그인 후 URL: {current_url}")
        
        if "/admin" not in current_url:
            print("❌ 로그인 실패")
            return False
        
        print("✅ 로그인 성공")
        
        # 4. 신규 업체 등록 페이지로 이동
        driver.get("http://localhost:5174/admin/companies/create?from=approved")
        time.sleep(5)
        
        print(f"업체 등록 페이지 URL: {driver.current_url}")
        
        # 5. 폼 필드들 입력
        timestamp = int(time.time())
        test_data = {
            'email': f'test_company_{timestamp}@test.com',
            'password': 'asdf1234',
            'confirmPassword': 'asdf1234',
            'companyName': f'테스트 업체 {timestamp}',
            'businessNumber': f'123-45-{timestamp % 100000:05d}',
            'representative': '홍길동',
            'address': '서울시 강남구 테스트로 123',
            'contactPerson': '홍길동',
            'companyGroup': '테스트 그룹',
            'manager': '홍길동',
            'remarks': '테스트용'
        }
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys(test_data['email'])
        print(f"✅ 이메일 입력: {test_data['email']}")
        
        # 비밀번호 입력
        password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
        if len(password_inputs) >= 2:
            password_inputs[0].clear()
            password_inputs[0].send_keys(test_data['password'])
            driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_inputs[0])
            
            password_inputs[1].clear()
            password_inputs[1].send_keys(test_data['confirmPassword'])
            driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_inputs[1])
            print("✅ 비밀번호 입력 완료")
        
        # 업체명 입력
        company_name_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "companyName"))
        )
        company_name_input.clear()
        company_name_input.send_keys(test_data['companyName'])
        print(f"✅ 업체명 입력: {test_data['companyName']}")
        
        # 사업자등록번호 입력
        business_number_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "businessNumber"))
        )
        business_number_input.clear()
        business_number_input.send_keys(test_data['businessNumber'])
        print(f"✅ 사업자등록번호 입력: {test_data['businessNumber']}")
        
        # 대표자 입력 (JavaScript 사용)
        representative_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "representative"))
        )
        driver.execute_script("arguments[0].value = arguments[1];", representative_input, test_data['representative'])
        driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", representative_input)
        print(f"✅ 대표자 입력: {test_data['representative']}")
        
        # 주소 입력
        address_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "address"))
        )
        address_input.clear()
        address_input.send_keys(test_data['address'])
        print(f"✅ 주소 입력: {test_data['address']}")
        
        # 연락처 입력
        contact_person_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "contactPerson"))
        )
        contact_person_input.clear()
        contact_person_input.send_keys(test_data['contactPerson'])
        print(f"✅ 연락처 입력: {test_data['contactPerson']}")
        
        # 회사 그룹 입력
        company_group_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "companyGroup"))
        )
        company_group_input.clear()
        company_group_input.send_keys(test_data['companyGroup'])
        print(f"✅ 회사 그룹 입력: {test_data['companyGroup']}")
        
        # 담당자 입력
        manager_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "manager"))
        )
        manager_input.clear()
        manager_input.send_keys(test_data['manager'])
        print(f"✅ 담당자 입력: {test_data['manager']}")
        
        # 비고 입력
        remarks_input = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "remarks"))
        )
        remarks_input.clear()
        remarks_input.send_keys(test_data['remarks'])
        print(f"✅ 비고 입력: {test_data['remarks']}")
        
        # 6. 등록 버튼 클릭
        submit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        )
        
        print("등록 버튼 클릭 시도...")
        submit_button.click()
        
        # 7. 결과 확인
        time.sleep(5)
        
        # 성공 메시지 확인
        page_source = driver.page_source
        if "등록되었습니다" in page_source:
            print("✅ 업체 등록 성공!")
            return True
        else:
            print("❌ 업체 등록 실패")
            
            # 오류 메시지 확인
            alerts = driver.find_elements(By.CSS_SELECTOR, ".alert, .error, [role='alert']")
            if alerts:
                for alert in alerts:
                    print(f"오류 메시지: {alert.text}")
            
            return False
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False
    finally:
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    test_company_create_direct()
