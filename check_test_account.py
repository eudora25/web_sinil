import os
from supabase import create_client, Client

# Supabase 설정
url = "https://vbmmfuraxvxlfpewqrsm.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzA4ODAsImV4cCI6MjA3MTc0Njg4MH0.Vm_hl7IdeRMNtbm155fk7l_UUbQj6o9_BLV0NTMHbxc"

supabase: Client = create_client(url, key)

def check_test_account():
    """test1@test.com 계정 확인"""
    print("=== test1@test.com 계정 확인 ===")
    
    try:
        # companies 테이블에서 확인
        response = supabase.table('companies').select('*').eq('email', 'test1@test.com').execute()
        
        print(f"companies 테이블 조회 결과:")
        print(f"데이터 개수: {len(response.data)}")
        
        if response.data:
            company = response.data[0]
            print(f"회사 정보:")
            print(f"  ID: {company.get('id')}")
            print(f"  이메일: {company.get('email')}")
            print(f"  업체명: {company.get('company_name')}")
            print(f"  승인상태: {company.get('approval_status')}")
            print(f"  사용자타입: {company.get('user_type')}")
            print(f"  생성일: {company.get('created_at')}")
        else:
            print("❌ companies 테이블에 test1@test.com 계정이 없습니다.")
        
        # auth.users 테이블에서도 확인 (관리자 권한 필요)
        print("\n=== auth.users 테이블 확인 ===")
        print("참고: auth.users 테이블은 관리자 권한이 필요합니다.")
        print("브라우저 콘솔에서 다음 쿼리를 실행해보세요:")
        print("""
        // 브라우저 콘솔에서 실행
        const { data, error } = await supabase.auth.admin.listUsers();
        console.log('모든 사용자:', data);
        """)
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    check_test_account()
