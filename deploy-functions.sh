#!/bin/bash

# Supabase Edge Functions 배포 스크립트
# 사용법: ./deploy-functions.sh

# 함수 목록
FUNCTIONS=(
  "admin-create-company"
  "create-missing-users"
  "create-notice"
  "execute-sql"
  "update-notice"
)

echo "=== Supabase Edge Functions 배포 시작 ==="

# 각 함수 배포
for func in "${FUNCTIONS[@]}"; do
  echo ""
  echo "배포 중: $func"
  supabase functions deploy "$func"
  
  if [ $? -eq 0 ]; then
    echo "✅ $func 배포 완료"
  else
    echo "❌ $func 배포 실패"
  fi
done

echo ""
echo "=== 배포 완료 ==="

