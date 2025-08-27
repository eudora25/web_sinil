#!/usr/bin/env python3
import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def setup_driver():
    """Chrome 드라이버 설정"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 헤드리스 모드
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

def test_login(driver, email, password, account_type):
    """로그인 테스트"""
    print(f"\n=== {account_type} 계정 로그인 테스트 ===")
    print(f"이메일: {email}")
    
    try:
        # 로그인 페이지 접속
        driver.get("http://localhost:5173/login")
        time.sleep(2)
        
        # 이메일 입력
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys(email)
        
        # 비밀번호 입력
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys(password)
        
        # 로그인 버튼 클릭
        login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
        login_button.click()
        
        # 로그인 성공 확인 (리다이렉션 대기)
        time.sleep(3)
        
        current_url = driver.current_url
        print(f"로그인 후 URL: {current_url}")
        
        if "/login" not in current_url:
            print("✅ 로그인 성공")
            return True
        else:
            print("❌ 로그인 실패")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 테스트 중 오류: {e}")
        return False

def test_admin_access(driver, account_type):
    """관리자 페이지 접근 테스트"""
    print(f"\n=== {account_type} 계정 관리자 페이지 접근 테스트 ===")
    
    admin_urls = [
        "/admin/notices",
        "/admin/companies/approved", 
        "/admin/products",
        "/admin/performance/register"
    ]
    
    for url in admin_urls:
        try:
            print(f"\n테스트 URL: {url}")
            driver.get(f"http://localhost:5173{url}")
            time.sleep(2)
            
            current_url = driver.current_url
            print(f"접근 후 URL: {current_url}")
            
            # 권한 차단 확인
            if "관리자 권한이 필요한 페이지입니다" in driver.page_source:
                print("✅ 권한 차단 정상 작동")
            elif url in current_url:
                if account_type == "관리자":
                    print("✅ 관리자 페이지 정상 접근")
                else:
                    print("❌ 일반 사용자 계정이 관리자 페이지에 접근됨")
            else:
                print(f"⚠️ 예상과 다른 결과: {current_url}")
                
        except Exception as e:
            print(f"❌ 테스트 중 오류: {e}")

def test_user_access(driver, account_type):
    """일반 사용자 페이지 접근 테스트"""
    print(f"\n=== {account_type} 계정 일반 사용자 페이지 접근 테스트 ===")
    
    user_urls = [
        "/notices",
        "/products", 
        "/clients",
        "/performance/register"
    ]
    
    for url in user_urls:
        try:
            print(f"\n테스트 URL: {url}")
            driver.get(f"http://localhost:5173{url}")
            time.sleep(2)
            
            current_url = driver.current_url
            print(f"접근 후 URL: {current_url}")
            
            if url in current_url:
                print("✅ 일반 사용자 페이지 정상 접근")
            else:
                print(f"⚠️ 예상과 다른 결과: {current_url}")
                
        except Exception as e:
            print(f"❌ 테스트 중 오류: {e}")

def main():
    """메인 테스트 함수"""
    print("🚀 권한 분리 테스트 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 일반 사용자 계정 테스트 (1@1.com)
        if test_login(driver, "1@1.com", "asdf1234", "일반 사용자"):
            test_admin_access(driver, "일반 사용자")
            test_user_access(driver, "일반 사용자")
        
        # 2. 관리자 계정 테스트 (test1@test.com)
        if test_login(driver, "test1@test.com", "asdf1234", "관리자"):
            test_admin_access(driver, "관리자")
            test_user_access(driver, "관리자")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        driver.quit()
        print("\n🏁 테스트 완료")

if __name__ == "__main__":
    main()
