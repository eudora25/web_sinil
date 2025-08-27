#!/usr/bin/env python3
import requests
import json

def create_test_accounts():
    """권한 분리 테스트를 위한 계정 생성"""
    
    print("🔧 권한 분리 테스트 계정 생성")
    print("=" * 50)
    
    # 테스트 계정 정보
    test_accounts = [
        {
            "email": "cso_test@test.com",
            "password": "asdf1234",
            "company_name": "테스트 제약사",
            "user_type": "user",
            "description": "제약사 계정 (일반 사용자)"
        },
        {
            "email": "admin_test@test.com", 
            "password": "asdf1234",
            "company_name": "테스트 관리자",
            "user_type": "admin",
            "description": "관리자 계정"
        }
    ]
    
    print("\n📋 생성할 테스트 계정:")
    for account in test_accounts:
        print(f"  - {account['email']} ({account['description']})")
        print(f"    비밀번호: {account['password']}")
        print(f"    user_type: {account['user_type']}")
        print()
    
    print("⚠️  이 스크립트는 Supabase 관리자 권한이 필요합니다.")
    print("⚠️  실제 계정 생성은 Supabase 대시보드에서 수동으로 진행해주세요.")
    print("\n📝 수동 생성 방법:")
    print("1. Supabase 대시보드 접속")
    print("2. Authentication > Users에서 새 사용자 생성")
    print("3. Database > companies 테이블에 회사 정보 추가")
    print("4. user_type 필드를 적절히 설정 (user/admin)")

if __name__ == "__main__":
    create_test_accounts()
