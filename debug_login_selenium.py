from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def debug_login():
    """브라우저에서 로그인 디버깅"""
    print("🚀 로그인 디버깅 시작")
    
    # Chrome 옵션 설정 (헤드리스 비활성화)
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # chrome_options.add_argument("--headless")  # 헤드리스 비활성화
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 로그인 페이지로 이동
        driver.get("http://localhost:5173/login")
        time.sleep(3)
        
        print(f"현재 URL: {driver.current_url}")
        print(f"페이지 제목: {driver.title}")
        
        # 콘솔에서 디버깅 스크립트 실행
        debug_script = """
        console.log('=== 로그인 디버깅 시작 ===');
        
        // 1. 현재 페이지 확인
        console.log('현재 URL:', window.location.href);
        console.log('페이지 제목:', document.title);
        
        // 2. 폼 요소들 찾기
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        const loginButton = document.querySelector('.login-btn');
        
        console.log('이메일 입력 필드:', emailInput);
        console.log('비밀번호 입력 필드:', passwordInput);
        console.log('로그인 버튼:', loginButton);
        
        // 3. Supabase 연결 상태 확인
        console.log('=== Supabase 연결 상태 확인 ===');
        if (typeof supabase !== 'undefined') {
            console.log('✅ Supabase 클라이언트가 로드되었습니다.');
            console.log('Supabase URL:', supabase.supabaseUrl);
        } else {
            console.log('❌ Supabase 클라이언트를 찾을 수 없습니다.');
        }
        
        // 4. 수동으로 로그인 시도
        async function tryLogin() {
            console.log('=== 수동 로그인 시도 ===');
            
            try {
                // 이메일과 비밀번호 설정
                if (emailInput) {
                    emailInput.value = 'test1@test.com';
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('✅ 이메일 설정: test1@test.com');
                }
                
                if (passwordInput) {
                    passwordInput.value = 'asdf1234';
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('✅ 비밀번호 설정: asdf1234');
                }
                
                // 로그인 버튼 상태 확인
                if (loginButton) {
                    console.log('로그인 버튼 비활성화 상태:', loginButton.disabled);
                    console.log('로그인 버튼 클래스:', loginButton.className);
                    
                    if (!loginButton.disabled) {
                        console.log('로그인 버튼 클릭 시도...');
                        loginButton.click();
                        
                        // 3초 후 결과 확인
                        setTimeout(() => {
                            console.log('로그인 후 URL:', window.location.href);
                            console.log('로그인 후 페이지 제목:', document.title);
                            
                            // 오류 메시지 확인
                            const alerts = document.querySelectorAll('.alert, .error, [role="alert"]');
                            if (alerts.length > 0) {
                                alerts.forEach((alert, index) => {
                                    console.log(`오류 메시지 ${index + 1}:`, alert.textContent);
                                });
                            }
                        }, 3000);
                    } else {
                        console.log('❌ 로그인 버튼이 비활성화되어 있습니다.');
                    }
                }
            } catch (error) {
                console.log('❌ 로그인 시도 중 오류:', error);
            }
        }
        
        // 5. 자동으로 로그인 시도
        console.log('자동 로그인 시도 중...');
        tryLogin();
        
        console.log('=== 로그인 디버깅 완료 ===');
        """
        
        # 디버깅 스크립트 실행
        driver.execute_script(debug_script)
        
        # 5초 대기
        time.sleep(5)
        
        # 콘솔 로그 가져오기
        logs = driver.get_log('browser')
        for log in logs:
            print(f"브라우저 로그: {log['message']}")
        
        # 현재 URL 확인
        current_url = driver.current_url
        print(f"최종 URL: {current_url}")
        
        if "/admin" in current_url:
            print("✅ 로그인 성공!")
            return True
        else:
            print("❌ 로그인 실패")
            return False
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False
    finally:
        print("브라우저는 열어둔 상태입니다. 수동으로 확인해주세요.")
        input("엔터를 누르면 브라우저를 닫습니다...")
        driver.quit()

if __name__ == "__main__":
    debug_login()
