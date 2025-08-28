#!/usr/bin/env python3
"""
프로덕션 Supabase companies 테이블 RLS 정책 목록 확인
"""

import requests
import json

# Supabase 설정
SUPABASE_URL = "https://vbmmfuraxvxlfpewqrsm.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc"

def list_companies_rls_policies():
    print("🔍 프로덕션 Supabase companies 테이블 RLS 정책 목록 확인 중...")
    print("=" * 60)
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        # 1. companies 테이블의 모든 정책 확인
        print("📊 companies 테이블 RLS 정책 확인...")
        
        # SQL 쿼리를 통해 정책 정보 가져오기 시도
        # (REST API로는 직접 정책 목록을 가져올 수 없으므로 간접적으로 확인)
        
        # 2. INSERT 권한 테스트
        print("\n📊 INSERT 권한 테스트...")
        test_data = {
            "email": "test@example.com",
            "company_name": "테스트회사",
            "business_registration_number": "1234567890",
            "representative_name": "테스트대표",
            "user_type": "user",
            "approval_status": "pending",
            "user_id": "00000000-0000-0000-0000-000000000000"
        }
        
        insert_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/companies",
            headers=headers,
            json=test_data
        )
        
        print(f"📊 INSERT HTTP 상태 코드: {insert_response.status_code}")
        
        if insert_response.status_code == 201:
            print("✅ INSERT 성공 - RLS 정책이 허용함")
        elif insert_response.status_code == 403:
            print("❌ INSERT 실패 - RLS 정책에 의해 차단됨")
            error_text = insert_response.text
            print(f"📄 오류 내용: {error_text}")
            
            # 오류 메시지에서 정책 정보 추출 시도
            if "policy" in error_text.lower():
                print("\n🔍 오류 메시지에서 정책 정보 발견:")
                print(error_text)
        elif insert_response.status_code == 401:
            print("❌ INSERT 실패 - 인증 실패")
        else:
            print(f"❌ INSERT 실패 - 기타 오류: {insert_response.status_code}")
            print(f"📄 응답 내용: {insert_response.text}")
            
        # 3. SELECT 권한 테스트
        print("\n📊 SELECT 권한 테스트...")
        select_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/companies?select=id&limit=1",
            headers=headers
        )
        
        print(f"📊 SELECT HTTP 상태 코드: {select_response.status_code}")
        
        if select_response.status_code == 200:
            print("✅ SELECT 성공 - RLS 정책이 허용함")
        elif select_response.status_code == 403:
            print("❌ SELECT 실패 - RLS 정책에 의해 차단됨")
        else:
            print(f"❌ SELECT 실패 - 기타 오류: {select_response.status_code}")
            
    except Exception as e:
        print(f"💥 오류 발생: {e}")

def provide_rls_policy_guidance():
    print("\n🔧 RLS 정책 수정 가이드:")
    print("=" * 60)
    print("프로덕션 Supabase 대시보드에서 다음을 확인하세요:")
    print()
    print("1. 📍 Supabase 대시보드 접속")
    print("   https://supabase.com/dashboard/project/vbmmfuraxvxlfpewqrsm")
    print()
    print("2. 📊 Database → Tables → companies 테이블 선택")
    print()
    print("3. 🔒 RLS (Row Level Security) 탭 클릭")
    print()
    print("4. 📋 현재 있는 정책들을 확인하고 다음을 찾아 삭제하세요:")
    print()
    print("   🗑️ 삭제 대상 정책들:")
    print("   - 'Enable insert for authenticated users'")
    print("   - 'Enable insert for authenticated users only'")
    print("   - 'Enable insert for users'")
    print("   - 'Users can insert their own company'")
    print("   - 'Allow users to insert their own company data upon signup'")
    print("   - 'Allow admin to insert company data via user_metadata'")
    print("   - 'Enable insert access for authenticated users'")
    print("   - 'Allow authenticated users to insert company data'")
    print()
    print("5. ➕ 새 정책 생성:")
    print("   정책명: 'Allow signup company data insertion'")
    print("   대상: authenticated")
    print("   작업: INSERT")
    print("   조건: (auth.uid() = user_id) OR (user_id IS NOT NULL AND user_id = auth.uid())")
    print()
    print("6. 💾 저장 후 테스트")

if __name__ == "__main__":
    list_companies_rls_policies()
    provide_rls_policy_guidance()
