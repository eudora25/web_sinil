#!/usr/bin/env python3
import requests
import json

def check_user_type():
    """사용자 계정의 user_type 확인"""
    
    # Supabase 설정 (실제 값으로 교체 필요)
    SUPABASE_URL = "https://your-project.supabase.co"  # 실제 URL로 교체
    SUPABASE_ANON_KEY = "your-anon-key"  # 실제 키로 교체
    
    # 테스트할 이메일들
    test_emails = ["test1@test.com", "1@1.com"]
    
    print("🔍 사용자 계정 정보 확인")
    print("=" * 50)
    
    for email in test_emails:
        print(f"\n📧 이메일: {email}")
        
        # companies 테이블에서 사용자 정보 조회
        url = f"{SUPABASE_URL}/rest/v1/companies"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "email": f"eq.{email}",
            "select": "id,email,company_name,user_type,approval_status"
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                if data:
                    user = data[0]
                    print(f"  ✅ 계정 정보 발견:")
                    print(f"     - ID: {user.get('id')}")
                    print(f"     - 회사명: {user.get('company_name')}")
                    print(f"     - user_type: {user.get('user_type')}")
                    print(f"     - approval_status: {user.get('approval_status')}")
                else:
                    print(f"  ❌ 계정 정보 없음")
            else:
                print(f"  ❌ API 호출 실패: {response.status_code}")
        except Exception as e:
            print(f"  ❌ 오류: {e}")

if __name__ == "__main__":
    check_user_type()
