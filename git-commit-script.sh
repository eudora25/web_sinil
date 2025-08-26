#!/bin/bash

# Git 커밋 스크립트 - 매출 관리 엑셀 등록 기능 개선
# 실행 전: chmod +x git-commit-script.sh

echo "🚀 Git 커밋 시작 - 매출 관리 엑셀 등록 기능 개선"
echo "=================================================="

# 1. 현재 상태 확인
echo "📋 현재 Git 상태 확인..."
git status

echo ""
echo "계속하시겠습니까? (y/n)"
read -r response
if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "❌ 커밋이 취소되었습니다."
    exit 1
fi

# 2. 커밋 1: 엑셀 업로드 기능 수정
echo ""
echo "🔧 커밋 1: 엑셀 업로드 기능 수정"
echo "--------------------------------"

# Vue 컴포넌트 파일들 추가
echo "Vue 컴포넌트 파일들 추가 중..."
git add vue-project/src/views/admin/AdminDirectRevenueView.vue
git add vue-project/src/views/admin/AdminWholesaleRevenueView.vue
git add vue-project/src/views/admin/AdminPharmaciesView.vue
git add vue-project/src/views/admin/AdminProductsView.vue
git add vue-project/src/views/admin/AdminClientsView.vue
git add vue-project/src/views/admin/AdminClientsAssignCompaniesView.vue
git add vue-project/src/views/admin/AdminClientsAssignPharmaciesView.vue
git add vue-project/src/views/admin/AdminProductsStandardCodeView.vue
git add vue-project/src/views/admin/AdminClientsCommissionGradesView.vue

# 커밋
git commit -m "fix: Add XLSX import to admin views for Excel upload functionality

- Add 'import * as XLSX from xlsx' to all admin views that use Excel upload
- Fix library mismatch issue where XLSX.read() was used but XLSX not imported
- Affected views: DirectRevenue, WholesaleRevenue, Pharmacies, Products, Clients, etc.
- Resolves Excel upload functionality in revenue management pages"

echo "✅ 커밋 1 완료"

# 3. 커밋 2: 테스트 환경 구축
echo ""
echo "🧪 커밋 2: 테스트 환경 구축"
echo "--------------------------"

# 테스트 관련 파일들 추가
echo "테스트 관련 파일들 추가 중..."
git add test-data/
git add test-scripts/
git add TEST_SCENARIOS.md
git add MANUAL_TEST_GUIDE.md
git add vue-project/package.json

# 커밋
git commit -m "feat: Add comprehensive Excel upload testing environment

- Add test data files for direct/wholesale revenue testing
- Create automated test script using Playwright
- Add manual test guide with detailed scenarios
- Add test scenarios documentation
- Add npm script for running Excel upload tests
- Include error case testing and validation testing"

echo "✅ 커밋 2 완료"

# 4. 커밋 3: 데이터베이스 복원 스크립트
echo ""
echo "🗄️ 커밋 3: 데이터베이스 복원 스크립트"
echo "-----------------------------------"

# SQL 스크립트 추가
echo "SQL 스크립트 추가 중..."
git add sql-scripts/restore_missing_functions.sql

# 커밋
git commit -m "feat: Add database function restoration script

- Add SQL script to restore missing functions from backup
- Includes auth, extensions, and pgbouncer functions
- Restores 11 missing functions identified in schema comparison
- Fixes database schema inconsistencies between local and production"

echo "✅ 커밋 3 완료"

# 5. 최종 상태 확인
echo ""
echo "📊 최종 Git 상태 확인..."
git status

echo ""
echo "🎉 모든 커밋이 완료되었습니다!"
echo "=================================================="
echo "커밋된 변경사항:"
echo "- 9개 Vue 컴포넌트에 XLSX import 추가"
echo "- 테스트 환경 구축 (테스트 파일, 스크립트, 문서)"
echo "- 데이터베이스 복원 스크립트 추가"
echo ""
echo "다음 단계:"
echo "1. git push origin main (원격 저장소에 푸시)"
echo "2. 테스트 환경에서 기능 검증"
echo "3. 프로덕션 배포 준비"
