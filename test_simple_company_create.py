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
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys("test1@test.com")
        print("✅ 이메일 입력: test1@test.com")
        
        # 비밀번호 입력
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys("asdf1234")
        print("✅ 비밀번호 입력: asdf1234")
        
        # 로그인 버튼 찾기 (여러 방법 시도)
        login_button = None
        try:
            # 방법 1: .login-btn 클래스
            login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
            print("✅ 로그인 버튼 찾기 성공 (.login-btn)")
        except:
            try:
                # 방법 2: type='submit'
                login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                print("✅ 로그인 버튼 찾기 성공 (button[type='submit'])")
            except:
                try:
                    # 방법 3: 로그인 텍스트가 포함된 버튼
                    login_button = driver.find_element(By.XPATH, "//button[contains(text(), '로그인')]")
                    print("✅ 로그인 버튼 찾기 성공 (로그인 텍스트)")
                except Exception as e:
                    print(f"❌ 로그인 버튼을 찾을 수 없습니다: {e}")
                    return False
        
        # 로그인 버튼 클릭
        login_button.click()
        print("✅ 로그인 버튼 클릭")
        
        # 로그인 성공 확인
        time.sleep(5)
        current_url = driver.current_url
        print(f"로그인 후 URL: {current_url}")
        
        if "/admin" in current_url:
            print("✅ 관리자 로그인 성공")
            return True
        else:
            print("❌ 관리자 로그인 실패")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return False

def test_simple_company_create(driver):
    """간단한 필수 필드만 입력하는 업체 등록 테스트"""
    print("\n=== 간단한 업체 등록 테스트 ===")
    
    try:
        # 신규 업체 등록 페이지 접속
        driver.get("http://localhost:5173/admin/companies/create?from=pending")
        time.sleep(5)  # 페이지 로딩 대기 시간 증가
        
        print(f"현재 URL: {driver.current_url}")
        
        # 페이지 소스 확인
        page_source = driver.page_source
        if "신규 업체 등록" not in page_source and "업체 등록" not in page_source:
            print("❌ 업체 등록 페이지가 제대로 로드되지 않았습니다.")
            return False
        
        # 고정된 테스트 데이터 사용
        business_number = "123-45-67890"
        random_email = "test_company_123@test.com"
        random_company_name = "테스트 업체 123"
        
        print(f"생성된 테스트 데이터:")
        print(f"  사업자등록번호: {business_number}")
        print(f"  이메일: {random_email}")
        print(f"  업체명: {random_company_name}")
        
        # 필수 필드만 입력 (ID가 있는 필드들)
        
        # 1. 이메일 입력
        try:
            email_input = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))
            )
            email_input.clear()
            email_input.send_keys(random_email)
            print(f"✅ 이메일 입력: {random_email}")
        except Exception as e:
            print(f"❌ 이메일 입력 실패: {e}")
            return False
        
        # 2. 비밀번호 입력
        try:
            password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
            if len(password_inputs) >= 2:
                # 첫 번째 비밀번호 필드
                password_inputs[0].clear()
                password_inputs[0].send_keys("asdf1234")
                print("✅ 비밀번호 입력: asdf1234")
                
                # 두 번째 비밀번호 확인 필드
                password_inputs[1].clear()
                password_inputs[1].send_keys("asdf1234")
                print("✅ 비밀번호 확인 입력: asdf1234")
                
                # Vue.js 반응성을 위해 이벤트 발생
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_inputs[0])
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_inputs[1])
                
                print("✅ 비밀번호 입력 완료")
            else:
                print(f"❌ 비밀번호 입력 필드를 찾을 수 없습니다. (찾은 필드 수: {len(password_inputs)})")
                return False
        except Exception as e:
            print(f"❌ 비밀번호 입력 실패: {e}")
            return False
        
        # 3. 업체명 입력
        try:
            company_name_input = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "companyName"))
            )
            company_name_input.clear()
            company_name_input.send_keys(random_company_name)
            print(f"✅ 업체명 입력: {random_company_name}")
        except Exception as e:
            print(f"❌ 업체명 입력 실패: {e}")
            return False
        
        # 4. 사업자등록번호 입력
        try:
            business_number_input = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "businessNumber"))
            )
            business_number_input.clear()
            business_number_input.send_keys(business_number)
            print(f"✅ 사업자등록번호 입력: {business_number}")
        except Exception as e:
            print(f"❌ 사업자등록번호 입력 실패: {e}")
            return False
        
        # 5. 대표자 입력 (JavaScript 사용)
        try:
            representative_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "representative"))
            )
            # JavaScript로 값 설정
            driver.execute_script("arguments[0].value = '홍길동';", representative_input)
            # Vue.js 반응성을 위해 이벤트 발생
            driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", representative_input)
            print("✅ 대표자 입력: 홍길동 (JavaScript)")
        except Exception as e:
            print(f"❌ 대표자 입력 실패: {e}")
            return False
        
        # 등록 버튼 찾기 및 클릭
        try:
            # 여러 방법으로 등록 버튼 찾기
            submit_button = None
            
            # 방법 1: type='submit'으로 찾기
            try:
                submit_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
                )
                print("✅ 등록 버튼을 type='submit'으로 찾았습니다.")
            except:
                pass
            
            # 방법 2: 텍스트로 찾기
            if not submit_button:
                try:
                    submit_button = driver.find_element(By.XPATH, "//button[contains(text(), '등록')]")
                    print("✅ 등록 버튼을 텍스트로 찾았습니다.")
                except:
                    pass
            
            # 방법 3: class로 찾기
            if not submit_button:
                try:
                    submit_button = driver.find_element(By.CSS_SELECTOR, ".btn-save")
                    print("✅ 등록 버튼을 class로 찾았습니다.")
                except:
                    pass
            
            # 방법 4: form 내의 버튼들 중에서 찾기
            if not submit_button:
                try:
                    buttons = driver.find_elements(By.CSS_SELECTOR, "form button")
                    for button in buttons:
                        if "등록" in button.text or button.get_attribute("type") == "submit":
                            submit_button = button
                            print("✅ 등록 버튼을 form 내에서 찾았습니다.")
                            break
                except:
                    pass
            
            if submit_button:
                print(f"등록 버튼 텍스트: {submit_button.text}")
                print(f"등록 버튼 클래스: {submit_button.get_attribute('class')}")
                print(f"등록 버튼 활성화 상태: {submit_button.is_enabled()}")
                
                # 버튼이 활성화되어 있는지 확인
                if submit_button.is_enabled():
                    # JavaScript로 클릭
                    driver.execute_script("arguments[0].click();", submit_button)
                    print("✅ 등록 버튼 클릭 성공 (JavaScript)")
                else:
                    print("❌ 등록 버튼이 비활성화되어 있습니다.")
                    return False
            else:
                print("❌ 등록 버튼을 찾을 수 없습니다.")
                return False
        except Exception as e:
            print(f"❌ 등록 버튼 클릭 실패: {e}")
            return False
        
        # 결과 확인
        time.sleep(5)
        current_url = driver.current_url
        page_source = driver.page_source
        
        print(f"등록 후 URL: {current_url}")
        
        # 페이지 소스에서 결과 확인
        if "등록되었습니다" in page_source:
            print("✅ 신규 업체 등록 성공! (등록되었습니다 메시지 발견)")
            return True
        elif "/admin/companies/pending" in current_url:
            print("✅ 신규 업체 등록 성공! (pending 페이지로 이동)")
            return True
        elif "실패" in page_source:
            print("❌ 신규 업체 등록 실패 (실패 메시지 발견)")
            return False
        elif "오류" in page_source:
            print("❌ 신규 업체 등록 실패 (오류 메시지 발견)")
            return False
        elif "이미 등록된" in page_source:
            print("❌ 신규 업체 등록 실패 (이미 등록된 메시지 발견)")
            return False
        else:
            print("⚠️ 등록 결과 불명확")
            print("페이지 소스 일부:")
            print(page_source[:500] + "..." if len(page_source) > 500 else page_source)
            return False
            
    except Exception as e:
        print(f"❌ 업체 등록 테스트 중 오류: {e}")
        return False

def main():
    """메인 테스트 함수"""
    print("🚀 간단한 업체 등록 테스트 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 관리자 로그인
        if not login_admin(driver):
            print("❌ 관리자 로그인 실패로 테스트 중단")
            return
        
        # 2. 간단한 업체 등록 테스트
        success = test_simple_company_create(driver)
        
        # 3. 결과 출력
        print(f"\n🏁 테스트 결과:")
        if success:
            print("🎉 신규 업체 등록이 정상적으로 작동합니다!")
        else:
            print("⚠️ 신규 업체 등록에 문제가 있습니다.")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        # 브라우저는 열어둔 상태로 유지
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    main()
