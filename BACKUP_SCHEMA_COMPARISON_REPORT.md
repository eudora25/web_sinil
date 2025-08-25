
# 백업 파일 스키마 비교 분석 보고서

## 📋 개요
`db_cluster-24-08-2025@15-17-32.backup`와 `db_cluster-24-08-2025@15-23-22.backup` 두 백업 파일의 스키마 구조를 비교 분석한 결과입니다.

## 📊 백업 파일 정보

| 항목 | 백업 파일 1 | 백업 파일 2 | 현재 DB |
|------|-------------|-------------|---------|
| 파일명 | db_cluster-24-08-2025@15-17-32.backup | db_cluster-24-08-2025@15-23-22.backup | - |
| 파일 크기 | 28.8MB | 16.1MB | - |
| 백업 시간 | 15:17:32 | 15:23:22 | - |
| 시간 차이 | - | +5분 50초 | - |

## 🗂️ 테이블 구조 비교

### 공통 테이블 (19개)
두 백업 파일 모두 동일한 19개의 public 테이블을 포함:

1. `client_company_assignments`
2. `client_pharmacy_assignments`
3. `clients`
4. `companies`
5. `direct_sales`
6. `notice_views`
7. `notices`
8. `performance_evidence_files`
9. `performance_records`
10. `performance_records_absorption`
11. `pharmacies`
12. `product_company_not_assignments`
13. `products`
14. `products_standard_code`
15. `settlement_months`
16. `settlement_share`
17. `user_preferences`
18. `wholesale_sales`

### 누락된 테이블 (현재 DB에만 존재)
현재 데이터베이스에는 있지만 두 백업 파일 모두에 없는 테이블:

1. **`product_company_assignments`** - 제품-업체 할당 테이블
2. **`product_insurance_code_company_assignments`** - 보험코드-업체 할당 테이블

## 🔧 함수 비교 분석

### 백업 파일 1의 함수 (30개)
```
calculate_absorption_rates
calculate_absorption_rates_for_month
calculate_and_save_absorption
calculate_sales_sum
check_for_updates
check_performance_changes
check_reanalysis_needed
create_settlement_summary
debug_absorption_calculation
debug_absorption_rates
debug_distribution_ratios
debug_filtered_sales
debug_filtered_sales_v2
export_performance_records_to_csv
get_absorption_analysis_details (2개 오버로드)
get_all_changes
get_clients_for_review_filters
get_companies_for_review_filters
get_distinct_wholesale_sales
get_settlement_share_summary (2개 오버로드)
get_settlement_summary_by_company
move_new_records_to_review
prevent_updated_fields_on_review_status_change
reset_updated_info_for_approved_companies
set_audit_fields_direct_sales
set_audit_fields_performance_records
set_audit_fields_wholesale_sales
set_updated_at
set_updated_at_null_on_insert
sync_commission_grade
test_simple_update
update_companies_updated_at_column
update_company_approval_status
update_notices_updated_at_column
update_pending_companies_approved_at
update_pharmacies_updated_at_column
update_product_company_not_assignments_updated_at
update_products_standard_code_updated_fields
update_products_updated_at_column
update_settlement_months_updated_at_column
update_updated_at_column
```

### 백업 파일 2의 추가 함수 (25개)
백업 파일 2에는 다음 함수들이 추가로 포함:

```
get_insurance_code_company_assignments
get_product_company_assignments
set_products_standard_code_updated_at_null_on_insert
trg_audit_performance_records
unified_performance_records_trigger
update_insurance_code_assignments_updated_at
update_insurance_code_company_assignments
update_performance_records_updated_at
update_product_company_assignments
update_product_company_assignments_updated_at
update_products_standard_code_updated_at
update_review_completion
```

### 현재 DB의 함수 (55개)
현재 데이터베이스에는 모든 함수가 포함되어 있으며, 백업 파일 2의 모든 함수를 포함합니다.

## 🔄 트리거 비교 분석

### 백업 파일 1의 트리거
- 기본적인 audit 및 updated_at 관련 트리거들
- 성능 기록, 도매 판매, 직접 판매에 대한 audit 트리거

### 백업 파일 2의 추가 트리거
- `tr_performance_records_review_status` - 성능 기록 리뷰 상태 업데이트
- `trigger_set_products_standard_code_updated_at_null_on_insert` - 제품 표준 코드 삽입 시 updated_at null 설정
- `trigger_update_product_company_assignments_updated_at` - 제품-업체 할당 업데이트 시간 트리거

### 현재 DB의 트리거 (24개)
모든 트리거가 포함되어 있으며, 백업 파일 2의 모든 트리거를 포함합니다.

## 👁️ 뷰 비교 분석

### 공통 뷰
두 백업 파일 모두 동일한 뷰를 포함:
- `public.reanalysis_status`

### 현재 DB의 뷰 (3개)
- `public.reanalysis_status`
- `public.admin_products_with_company_status`
- `public.user_products`

## 📈 주요 차이점 요약

### 1. 파일 크기 차이
- 백업 파일 1: 28.8MB
- 백업 파일 2: 16.1MB
- **차이**: 백업 파일 2가 12.7MB 작음 (44% 감소)

### 2. 함수 개수
- 백업 파일 1: 30개
- 백업 파일 2: 42개 (+12개)
- **증가**: 제품 할당 및 보험코드 관련 함수들 추가

### 3. 트리거 개수
- 백업 파일 1: 기본 트리거들
- 백업 파일 2: 추가 트리거들 포함
- **증가**: 제품 할당 및 리뷰 상태 관련 트리거 추가

### 4. 누락된 테이블
두 백업 파일 모두 현재 DB에 있는 다음 테이블들이 누락:
- `product_company_assignments`
- `product_insurance_code_company_assignments`

## 🎯 결론 및 권장사항

### 1. 백업 파일 2가 더 완전함
- 백업 파일 2는 백업 파일 1보다 더 많은 함수와 트리거를 포함
- 제품 할당 및 보험코드 관련 기능이 추가됨
- 파일 크기가 작은 것은 데이터가 적거나 압축 효율이 높기 때문일 수 있음

### 2. 현재 DB가 가장 완전함
- 현재 데이터베이스는 두 백업 파일의 모든 기능을 포함
- 추가로 `product_company_assignments`와 `product_insurance_code_company_assignments` 테이블 포함
- 55개의 함수, 24개의 트리거, 3개의 뷰로 구성

### 3. 권장사항
1. **백업 파일 2 사용 권장**: 더 완전한 스키마를 포함
2. **누락된 테이블 복원**: `product_company_assignments`와 `product_insurance_code_company_assignments` 테이블 생성 필요
3. **현재 DB 유지**: 가장 완전한 상태이므로 현재 구조 유지 권장

### 4. 데이터 마이그레이션 계획
- 백업 파일 2에서 데이터 추출
- 누락된 테이블 구조 생성
- 데이터 무결성 검증 후 마이그레이션

---

**분석 완료**: 2025-08-25
**백업 파일**: db_cluster-24-08-2025@15-17-32.backup, db_cluster-24-08-2025@15-23-22.backup
**현재 DB**: localhost Supabase PostgreSQL 17.4
