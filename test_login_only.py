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

def test_login(driver):
    """test1@test.com 계정으로 로그인 테스트"""
    print("=== test1@test.com 로그인 테스트 ===")
    
    try:
        driver.get("http://localhost:5173/login")
        time.sleep(2)
        
        print(f"현재 URL: {driver.current_url}")
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys("test1@test.com")
        print("이메일 입력: test1@test.com")
        
        # 비밀번호 입력
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys("asdf1234")
        print("비밀번호 입력: asdf1234")
        
        # 로그인 버튼 찾기 및 클릭
        try:
            # 여러 방법으로 로그인 버튼 찾기
            login_button = None
            
            # 방법 1: class로 찾기
            try:
                login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
                print("✅ 로그인 버튼을 class로 찾았습니다.")
            except:
                pass
            
            # 방법 2: label로 찾기
            if not login_button:
                try:
                    login_button = driver.find_element(By.XPATH, "//button[contains(text(), '로그인')]")
                    print("✅ 로그인 버튼을 label로 찾았습니다.")
                except:
                    pass
            
            # 방법 3: type으로 찾기
            if not login_button:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                    print("✅ 로그인 버튼을 type으로 찾았습니다.")
                except:
                    pass
            
            # 방법 4: form 내의 첫 번째 버튼
            if not login_button:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, "form button")
                    print("✅ 로그인 버튼을 form 내 첫 번째 버튼으로 찾았습니다.")
                except:
                    pass
            
            if login_button:
                print(f"로그인 버튼 텍스트: {login_button.text}")
                print(f"로그인 버튼 클래스: {login_button.get_attribute('class')}")
                print(f"로그인 버튼 활성화 상태: {login_button.is_enabled()}")
                
                # 버튼이 활성화되어 있는지 확인
                if login_button.is_enabled():
                    login_button.click()
                    print("✅ 로그인 버튼 클릭 성공")
                else:
                    print("❌ 로그인 버튼이 비활성화되어 있습니다.")
                    return False
            else:
                print("❌ 로그인 버튼을 찾을 수 없습니다.")
                return False
                
        except Exception as e:
            print(f"❌ 로그인 버튼 클릭 중 오류: {e}")
            return False
        
        # 로그인 결과 확인
        time.sleep(5)
        current_url = driver.current_url
        page_source = driver.page_source
        
        print(f"로그인 후 URL: {current_url}")
        
        if "/admin" in current_url:
            print("✅ 관리자 로그인 성공!")
            return True
        elif "login" in current_url:
            print("❌ 로그인 실패 - 로그인 페이지에 머물러 있음")
            return False
        else:
            print(f"⚠️ 로그인 결과 불명확 - URL: {current_url}")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 테스트 중 오류: {e}")
        return False

def main():
    """메인 함수"""
    print("🚀 test1@test.com 로그인 테스트 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 로그인 테스트
        success = test_login(driver)
        
        # 결과 출력
        print(f"\n🏁 로그인 테스트 결과:")
        if success:
            print("🎉 test1@test.com 계정으로 로그인 성공!")
            print("이제 신규 업체 등록 테스트를 진행할 수 있습니다.")
        else:
            print("⚠️ test1@test.com 계정으로 로그인 실패")
            print("계정 정보를 확인해주세요.")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        # 브라우저는 열어둔 상태로 유지
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    main()
