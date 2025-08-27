#!/usr/bin/env python3
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def setup_driver():
    """Chrome 드라이버 설정 (헤드리스 모드 해제)"""
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # 헤드리스 모드 해제
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

def debug_login(driver, email, password):
    """로그인 디버깅"""
    print(f"\n=== 로그인 디버깅: {email} ===")
    
    try:
        # 로그인 페이지 접속
        driver.get("http://localhost:5173/login")
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        print(f"페이지 제목: {driver.title}")
        
        # 이메일 입력 필드 확인
        try:
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
            )
            print("✅ 이메일 입력 필드 발견")
            email_input.clear()
            email_input.send_keys(email)
            print(f"이메일 입력 완료: {email}")
        except Exception as e:
            print(f"❌ 이메일 입력 필드 오류: {e}")
            return False
        
        # 비밀번호 입력 필드 확인
        try:
            password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            print("✅ 비밀번호 입력 필드 발견")
            password_input.clear()
            password_input.send_keys(password)
            print("비밀번호 입력 완료")
        except Exception as e:
            print(f"❌ 비밀번호 입력 필드 오류: {e}")
            return False
        
        # 로그인 버튼 확인
        try:
            login_button = driver.find_element(By.CSS_SELECTOR, ".login-btn")
            print("✅ 로그인 버튼 발견")
            print(f"로그인 버튼 텍스트: {login_button.text}")
            print(f"로그인 버튼 활성화 상태: {login_button.is_enabled()}")
            
            # 로그인 버튼 클릭
            login_button.click()
            print("로그인 버튼 클릭 완료")
            
        except Exception as e:
            print(f"❌ 로그인 버튼 오류: {e}")
            return False
        
        # 로그인 결과 확인
        time.sleep(5)
        current_url = driver.current_url
        print(f"로그인 후 URL: {current_url}")
        
        # 페이지 소스에서 오류 메시지 확인
        page_source = driver.page_source
        if "아이디(이메일) 정보가 없습니다" in page_source:
            print("❌ 오류: 아이디(이메일) 정보가 없습니다")
        elif "비밀번호가 일치하지 않습니다" in page_source:
            print("❌ 오류: 비밀번호가 일치하지 않습니다")
        elif "미승인 회원입니다" in page_source:
            print("❌ 오류: 미승인 회원입니다")
        elif "/login" not in current_url:
            print("✅ 로그인 성공")
            return True
        else:
            print("⚠️ 알 수 없는 로그인 상태")
            
        return False
            
    except Exception as e:
        print(f"❌ 로그인 디버깅 중 오류: {e}")
        return False

def main():
    """메인 디버깅 함수"""
    print("🔍 로그인 디버깅 시작")
    
    driver = setup_driver()
    if not driver:
        print("❌ 브라우저 드라이버 설정 실패")
        return
    
    try:
        # 1. 일반 사용자 계정 디버깅
        debug_login(driver, "1@1.com", "asdf1234")
        
        # 잠시 대기
        input("계속하려면 Enter를 누르세요...")
        
        # 2. 관리자 계정 디버깅
        debug_login(driver, "test1@test.com", "asdf1234")
        
        input("종료하려면 Enter를 누르세요...")
            
    except Exception as e:
        print(f"❌ 디버깅 중 오류: {e}")
    finally:
        driver.quit()
        print("\n🏁 디버깅 완료")

if __name__ == "__main__":
    main()
