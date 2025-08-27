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
    # chrome_options.add_argument("--headless")
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
    """로그인 테스트"""
    print("=== 로그인 테스트 ===")
    
    try:
        driver.get("http://localhost:5173/login")
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        
        # 페이지 소스 확인
        page_source = driver.page_source
        if "로그인" not in page_source:
            print("❌ 로그인 페이지가 제대로 로드되지 않았습니다.")
            return False
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys("1@1.com")
        print("이메일 입력: 1@1.com")
        
        # 비밀번호 입력
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys("asdf1234")
        print("비밀번호 입력: asdf1234")
        
        # 로그인 버튼 찾기 및 클릭
        try:
            login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
            print(f"로그인 버튼 텍스트: {login_button.text}")
            print(f"로그인 버튼 활성화 상태: {login_button.is_enabled()}")
            
            if login_button.is_enabled():
                login_button.click()
                print("✅ 로그인 버튼 클릭 성공")
            else:
                print("❌ 로그인 버튼이 비활성화되어 있습니다.")
                return False
        except Exception as e:
            print(f"❌ 로그인 버튼 클릭 실패: {e}")
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
    print("🚀 빠른 로그인 테스트 시작")
    
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
            print("🎉 로그인 성공!")
        else:
            print("⚠️ 로그인 실패")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        # 브라우저는 열어둔 상태로 유지
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    main()
