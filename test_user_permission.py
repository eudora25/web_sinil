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

def login_user(driver, email, password):
    """사용자 로그인"""
    print(f"\n=== 로그인: {email} ===")
    
    try:
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
        
        # 로그인 성공 확인
        time.sleep(3)
        current_url = driver.current_url
        
        if "/login" not in current_url:
            print(f"✅ 로그인 성공 - 리다이렉션: {current_url}")
            return True
        else:
            print("❌ 로그인 실패")
            return False
            
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return False

def test_admin_access_denied(driver):
    """관리자 페이지 접근 차단 테스트"""
    print(f"\n=== 관리자 페이지 접근 차단 테스트 ===")
    
    admin_urls = [
        "/admin/notices",
        "/admin/companies/approved", 
        "/admin/products",
        "/admin/performance/register"
    ]
    
    access_denied_count = 0
    total_tests = len(admin_urls)
    
    for url in admin_urls:
        try:
            print(f"\n테스트 URL: {url}")
            driver.get(f"http://localhost:5173{url}")
            time.sleep(2)
            
            current_url = driver.current_url
            page_source = driver.page_source
            
            print(f"접근 후 URL: {current_url}")
            
            # 권한 차단 확인
            if "관리자 권한이 필요한 페이지입니다" in page_source:
                print("✅ 권한 차단 정상 작동")
                access_denied_count += 1
            elif url in current_url:
                print("❌ 관리자 페이지에 접근됨 (권한 차단 실패)")
            else:
                print(f"⚠️ 예상과 다른 결과: {current_url}")
                
        except Exception as e:
            print(f"❌ 테스트 중 오류: {e}")
    
    print(f"\n📊 관리자 페이지 접근 차단 결과:")
    print(f"  - 성공: {access_denied_count}/{total_tests}")
    print(f"  - 실패: {total_tests - access_denied_count}/{total_tests}")
    
    return access_denied_count == total_tests

def test_user_access_allowed(driver):
    """일반 사용자 페이지 접근 허용 테스트"""
    print(f"\n=== 일반 사용자 페이지 접근 허용 테스트 ===")
    
    user_urls = [
        "/notices",
        "/products", 
        "/clients",
        "/performance/register"
    ]
    
    access_allowed_count = 0
    total_tests = len(user_urls)
    
    for url in user_urls:
        try:
            print(f"\n테스트 URL: {url}")
            driver.get(f"http://localhost:5173{url}")
            time.sleep(2)
            
            current_url = driver.current_url
            print(f"접근 후 URL: {current_url}")
            
            if url in current_url:
                print("✅ 일반 사용자 페이지 정상 접근")
                access_allowed_count += 1
            else:
                print(f"❌ 페이지 접근 실패: {current_url}")
                
        except Exception as e:
            print(f"❌ 테스트 중 오류: {e}")
    
    print(f"\n📊 일반 사용자 페이지 접근 결과:")
    print(f"  - 성공: {access_allowed_count}/{total_tests}")
    print(f"  - 실패: {total_tests - access_allowed_count}/{total_tests}")
    
    return access_allowed_count == total_tests

def main():
    """메인 테스트 함수"""
    print("🚀 1@1.com 계정 권한 분리 테스트 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 로그인
        if not login_user(driver, "1@1.com", "asdf1234"):
            print("❌ 로그인 실패로 테스트 중단")
            return
        
        # 2. 관리자 페이지 접근 차단 테스트
        admin_test_passed = test_admin_access_denied(driver)
        
        # 3. 일반 사용자 페이지 접근 허용 테스트
        user_test_passed = test_user_access_allowed(driver)
        
        # 4. 최종 결과
        print(f"\n🏁 최종 테스트 결과:")
        print(f"  - 관리자 페이지 접근 차단: {'✅ 성공' if admin_test_passed else '❌ 실패'}")
        print(f"  - 일반 사용자 페이지 접근 허용: {'✅ 성공' if user_test_passed else '❌ 실패'}")
        
        if admin_test_passed and user_test_passed:
            print("🎉 권한 분리가 정상적으로 작동합니다!")
        else:
            print("⚠️ 권한 분리에 문제가 있습니다.")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
