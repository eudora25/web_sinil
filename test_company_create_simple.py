#!/usr/bin/env python3
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

def setup_driver():
    """Chrome 드라이버 설정"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
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

def test_company_create_with_random_number(driver):
    """랜덤 사업자등록번호로 업체 등록 테스트"""
    print("\n=== 랜덤 사업자등록번호로 업체 등록 테스트 ===")
    
    try:
        # 신규 업체 등록 페이지 접속
        driver.get("http://localhost:5173/admin/companies/create?from=pending")
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        
        # 랜덤 사업자등록번호 생성
        random_num = random.randint(1000000000, 9999999999)
        business_number = f"{random_num//10000000:03d}-{random_num//100000%100:02d}-{random_num%100000:05d}"
        
        # 랜덤 이메일 생성
        random_email = f"test_company_{int(time.time())}_{random.randint(1000, 9999)}@test.com"
        
        # 랜덤 업체명 생성
        random_company_name = f"테스트 업체 {int(time.time())}"
        
        print(f"생성된 테스트 데이터:")
        print(f"  사업자등록번호: {business_number}")
        print(f"  이메일: {random_email}")
        print(f"  업체명: {random_company_name}")
        
        # 필수 필드 입력
        test_data = {
            "email": random_email,
            "password": "asdf1234",
            "confirmPassword": "asdf1234",
            "companyName": random_company_name,
            "businessNumber": business_number,
            "representative": "홍길동",
            "address": "서울시 강남구",
            "landline": "02-1234-5678",
            "contactPerson": "김담당",
            "mobile": "010-1234-5678",
            "mobile2": "010-9876-5432",
            "receiveEmail": "receive@test.com",
            "companyGroup": "제약사",
            "commissionGrade": "A",
            "manager": "관리자",
            "approvalStatus": "승인",
            "remarks": "테스트 업체입니다."
        }
        
        # 이메일 입력
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        email_input.clear()
        email_input.send_keys(test_data["email"])
        print(f"이메일 입력: {test_data['email']}")
        
        # 비밀번호 입력
        password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
        if len(password_inputs) >= 2:
            password_inputs[0].clear()
            password_inputs[0].send_keys(test_data["password"])
            password_inputs[1].clear()
            password_inputs[1].send_keys(test_data["confirmPassword"])
            print("비밀번호 입력 완료")
        
        # 업체명 입력
        company_name_input = driver.find_element(By.ID, "companyName")
        company_name_input.clear()
        company_name_input.send_keys(test_data["companyName"])
        print(f"업체명 입력: {test_data['companyName']}")
        
        # 사업자등록번호 입력
        business_number_input = driver.find_element(By.ID, "businessNumber")
        business_number_input.clear()
        business_number_input.send_keys(test_data["businessNumber"])
        print(f"사업자등록번호 입력: {test_data['businessNumber']}")
        
        # 대표자 입력
        representative_input = driver.find_element(By.ID, "representative")
        representative_input.clear()
        representative_input.send_keys(test_data["representative"])
        print(f"대표자 입력: {test_data['representative']}")
        
        # 주소 입력 (사업장 소재지)
        address_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
        for input_elem in address_inputs:
            if input_elem.get_attribute("id") == "" and input_elem.get_attribute("placeholder") == "":
                address_input = input_elem
                break
        else:
            print("주소 입력 필드를 찾을 수 없어 건너뜀")
            address_input = None
            
        if address_input:
            address_input.clear()
            address_input.send_keys(test_data["address"])
            print(f"주소 입력: {test_data['address']}")
        
        # 유선전화 입력
        landline_input = driver.find_element(By.ID, "landline")
        landline_input.clear()
        landline_input.send_keys(test_data["landline"])
        print(f"유선전화 입력: {test_data['landline']}")
        
        # 담당자 입력 (업체 담당자)
        contact_person_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
        for input_elem in contact_person_inputs:
            if input_elem.get_attribute("id") == "" and input_elem.get_attribute("placeholder") == "":
                contact_person_input = input_elem
                break
        else:
            print("담당자 입력 필드를 찾을 수 없어 건너뜀")
            contact_person_input = None
            
        if contact_person_input:
            contact_person_input.clear()
            contact_person_input.send_keys(test_data["contactPerson"])
            print(f"담당자 입력: {test_data['contactPerson']}")
        
        # 휴대폰 입력
        mobile_input = driver.find_element(By.ID, "mobile")
        mobile_input.clear()
        mobile_input.send_keys(test_data["mobile"])
        print(f"휴대폰 입력: {test_data['mobile']}")
        
        # 휴대폰2 입력
        mobile2_input = driver.find_element(By.ID, "mobile2")
        mobile2_input.clear()
        mobile2_input.send_keys(test_data["mobile2"])
        print(f"휴대폰2 입력: {test_data['mobile2']}")
        
        # 수신용 이메일 입력
        receive_email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        receive_email_input.clear()
        receive_email_input.send_keys(test_data["receiveEmail"])
        print(f"수신용 이메일 입력: {test_data['receiveEmail']}")
        
        # 구분 입력
        company_group_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
        for input_elem in company_group_inputs:
            if input_elem.get_attribute("id") == "" and input_elem.get_attribute("placeholder") == "":
                company_group_input = input_elem
                break
        else:
            print("구분 입력 필드를 찾을 수 없어 건너뜀")
            company_group_input = None
            
        if company_group_input:
            company_group_input.clear()
            company_group_input.send_keys(test_data["companyGroup"])
            print(f"구분 입력: {test_data['companyGroup']}")
        
        # 수수료 등급 선택
        try:
            commission_grade_select = driver.find_element(By.CSS_SELECTOR, "select")
            select = Select(commission_grade_select)
            select.select_by_value(test_data["commissionGrade"])
            print(f"수수료 등급 선택: {test_data['commissionGrade']}")
        except:
            print("수수료 등급 선택 실패 (건너뜀)")
        
        # 관리자 입력 (제약사 관리자)
        manager_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
        for input_elem in manager_inputs:
            if input_elem.get_attribute("id") == "" and input_elem.get_attribute("placeholder") == "":
                manager_input = input_elem
                break
        else:
            print("관리자 입력 필드를 찾을 수 없어 건너뜀")
            manager_input = None
            
        if manager_input:
            manager_input.clear()
            manager_input.send_keys(test_data["manager"])
            print(f"관리자 입력: {test_data['manager']}")
        
        # 승인여부 선택
        try:
            approval_status_select = driver.find_elements(By.CSS_SELECTOR, "select")[1]
            select = Select(approval_status_select)
            select.select_by_visible_text(test_data["approvalStatus"])
            print(f"승인여부 선택: {test_data['approvalStatus']}")
        except:
            print("승인여부 선택 실패 (건너뜀)")
        
        # 비고 입력
        remarks_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
        for input_elem in remarks_inputs:
            if input_elem.get_attribute("id") == "" and input_elem.get_attribute("placeholder") == "":
                remarks_input = input_elem
                break
        else:
            print("비고 입력 필드를 찾을 수 없어 건너뜀")
            remarks_input = None
            
        if remarks_input:
            remarks_input.clear()
            remarks_input.send_keys(test_data["remarks"])
            print(f"비고 입력: {test_data['remarks']}")
        
        # 등록 버튼 클릭
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        print("등록 버튼 클릭")
        
        # 결과 확인
        time.sleep(5)
        current_url = driver.current_url
        page_source = driver.page_source
        
        print(f"등록 후 URL: {current_url}")
        
        if "등록되었습니다" in page_source or "/admin/companies/pending" in current_url:
            print("✅ 신규 업체 등록 성공!")
            return True
        elif "실패" in page_source or "오류" in page_source or "이미 등록된" in page_source:
            print("❌ 신규 업체 등록 실패")
            return False
        else:
            print("⚠️ 등록 결과 불명확")
            return False
            
    except Exception as e:
        print(f"❌ 업체 등록 테스트 중 오류: {e}")
        return False

def main():
    """메인 테스트 함수"""
    print("🚀 랜덤 사업자등록번호로 업체 등록 테스트 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 관리자 로그인
        if not login_admin(driver):
            print("❌ 관리자 로그인 실패로 테스트 중단")
            return
        
        # 2. 랜덤 사업자등록번호로 업체 등록 테스트
        success = test_company_create_with_random_number(driver)
        
        # 3. 결과 출력
        print(f"\n🏁 테스트 결과:")
        if success:
            print("🎉 신규 업체 등록이 정상적으로 작동합니다!")
        else:
            print("⚠️ 신규 업체 등록에 문제가 있습니다.")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
