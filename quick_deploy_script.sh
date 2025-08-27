#!/bin/bash

# 🚀 프로덕션 배포 스크립트
# 신일제약 실적관리 시스템

set -e  # 오류 발생 시 스크립트 중단

echo "=========================================="
echo "🚀 프로덕션 배포 시작"
echo "=========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
if [ -z "$PRODUCTION_PROJECT_REF" ]; then
    log_error "PRODUCTION_PROJECT_REF 환경 변수가 설정되지 않았습니다."
    echo "사용법: PRODUCTION_PROJECT_REF=your_project_ref ./quick_deploy_script.sh"
    exit 1
fi

if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    log_error "PRODUCTION_DATABASE_URL 환경 변수가 설정되지 않았습니다."
    echo "사용법: PRODUCTION_DATABASE_URL=your_db_url ./quick_deploy_script.sh"
    exit 1
fi

# 1. 백업 생성
log_info "1. 프로덕션 데이터베이스 백업 생성 중..."
BACKUP_FILE="production_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$PRODUCTION_DATABASE_URL" > "$BACKUP_FILE"
log_success "백업 파일 생성 완료: $BACKUP_FILE"

# 2. Supabase 프로젝트 연결
log_info "2. 프로덕션 Supabase 프로젝트 연결 중..."
supabase link --project-ref "$PRODUCTION_PROJECT_REF"
log_success "프로젝트 연결 완료"

# 3. 서버리스 함수 배포
log_info "3. 서버리스 함수 배포 중..."

# signup-user 함수 배포
log_info "   - signup-user 함수 배포..."
cd vue-project
npx supabase functions deploy signup-user
log_success "   signup-user 함수 배포 완료"

# create-company 함수 배포
log_info "   - create-company 함수 배포..."
npx supabase functions deploy create-company
log_success "   create-company 함수 배포 완료"

cd ..

# 4. 데이터베이스 변경사항 적용
log_info "4. 데이터베이스 변경사항 적용 중..."
psql "$PRODUCTION_DATABASE_URL" -f apply_production_changes.sql
log_success "데이터베이스 변경사항 적용 완료"

# 5. 배포 확인
log_info "5. 배포 확인 중..."

# 함수 목록 확인
log_info "   - 서버리스 함수 목록 확인..."
npx supabase functions list

# RLS 정책 확인
log_info "   - RLS 정책 확인..."
psql "$PRODUCTION_DATABASE_URL" -c "
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;
"

log_success "배포 확인 완료"

echo "=========================================="
echo "🎉 프로덕션 배포 완료!"
echo "=========================================="
echo ""
echo "📋 적용된 변경사항:"
echo "   ✅ Companies 테이블 RLS 정책 수정"
echo "   ✅ signup-user 서버리스 함수 배포"
echo "   ✅ create-company 서버리스 함수 배포"
echo "   ✅ 이메일 검증 완화 설정"
echo ""
echo "🔍 테스트 방법:"
echo "   1. 프로덕션 환경에서 회원가입 시도"
echo "   2. user0125@example.com 이메일로 테스트"
echo "   3. 이메일 검증 오류 시 test@example.com 자동 대체 확인"
echo ""
echo "📁 백업 파일: $BACKUP_FILE"
echo ""
echo "⚠️  문제 발생 시 백업 파일을 사용하여 롤백할 수 있습니다."
echo "=========================================="
