# 흡수율 0값 문제 분석 및 해결 방안 보고서

## 📋 문제 개요
[https://web-sinil.vercel.app/admin/absorption-analysis](https://web-sinil.vercel.app/admin/absorption-analysis) 페이지에서 흡수율 항목이 모두 0값으로 표시되는 문제가 발생했습니다.

## 🔍 문제 분석 결과

### 1. 현재 상황
- `performance_records_absorption` 테이블의 `wholesale_revenue`, `direct_revenue`, `total_revenue`, `absorption_rate` 컬럼이 모두 0값
- 2025-08월 정산 데이터 기준으로 분석

### 2. 원인 분석

#### 2.1 데이터 매칭 실패
- **매출 데이터**: 도매 매출 47,088건, 직거래 매출 20,381건 존재
- **실적 데이터**: 2025-05, 2025-06, 2025-07월 처방 데이터 존재
- **매칭 조건**: 약국 사업자등록번호 + 표준코드 + 월별 매칭

#### 2.2 핵심 문제점
1. **표준코드 매핑 누락**: `products_standard_code` 테이블에 일부 `insurance_code`에 대한 `standard_code` 매핑이 없음
2. **예시**: `insurance_code = '666666666'`에 대한 `standard_code` 매핑이 없어서 NULL 반환
3. **결과**: 매출 데이터와 실적 데이터 간 매칭 실패

### 3. 데이터 현황

#### 3.1 실적 데이터 샘플
```
id: 263
client_id: 34
insurance_code: 666666666
standard_code: NULL (매핑 없음)
prescription_month: 2025-07
pharmacy_brn: 642-18-01846, 670-13-02296
```

#### 3.2 매출 데이터 샘플
```
standard_code: 8800551000410, 8800551000427, 8800588003910, 8806538000114, 8806538000206
```

#### 3.3 표준코드 매핑 현황
- `products_standard_code` 테이블: 404건의 매핑 데이터 존재
- 일부 `insurance_code`에 대한 매핑 누락

## 🛠️ 해결 방안

### 1. 즉시 해결 방안

#### 1.1 누락된 표준코드 매핑 추가
```sql
-- 누락된 insurance_code에 대한 standard_code 매핑 추가
INSERT INTO products_standard_code (insurance_code, standard_code, created_by, updated_by)
VALUES 
('666666666', '8800551000410', 'system', 'system'),
-- 추가 매핑 데이터...
```

#### 1.2 매칭 조건 개선
- `insurance_code` 직접 매칭 방식으로 변경
- `standard_code`가 NULL인 경우 대체 로직 적용

### 2. 근본적 해결 방안

#### 2.1 데이터 품질 개선
- 모든 제품의 `insurance_code`에 대한 `standard_code` 매핑 보장
- 정기적인 데이터 무결성 검증

#### 2.2 흡수율 계산 로직 개선
- 매칭 실패 시 명확한 오류 메시지 제공
- 부분 매칭 시에도 계산 가능하도록 로직 수정

## 📊 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 매출 데이터 | ✅ 존재 | 도매: 47,088건, 직거래: 20,381건 |
| 실적 데이터 | ✅ 존재 | 2025-05~07월 데이터 |
| 표준코드 매핑 | ❌ 불완전 | 일부 insurance_code 매핑 누락 |
| 흡수율 계산 | ❌ 실패 | 매칭 실패로 인한 0값 |

## 🎯 권장 조치사항

### 1. 단기 조치 (즉시)
1. 누락된 `products_standard_code` 매핑 데이터 추가
2. 수정된 흡수율 계산 함수 적용
3. 계산 결과 검증

### 2. 중기 조치 (1주 내)
1. 모든 제품의 표준코드 매핑 완성
2. 데이터 무결성 검증 프로세스 구축
3. 흡수율 계산 로직 강화

### 3. 장기 조치 (1개월 내)
1. 자동화된 데이터 품질 관리 시스템 구축
2. 실시간 흡수율 계산 모니터링
3. 사용자 친화적인 오류 보고 시스템

## 🔧 기술적 세부사항

### 흡수율 계산 함수 수정 사항
- `review_action` 조건 제거 (모든 데이터 대상)
- 매칭 실패 시 명확한 로깅 추가
- 부분 매칭 지원 로직 추가

### 데이터 매칭 조건
```sql
-- 현재 조건
ON cpm.pharmacy_brn = ws.business_registration_number
AND pb.standard_code = ws.standard_code
AND pb.prescription_month = TO_CHAR(ws.sales_date, 'YYYY-MM')

-- 개선된 조건 (제안)
ON cpm.pharmacy_brn = ws.business_registration_number
AND (pb.standard_code = ws.standard_code OR pb.insurance_code = ws.insurance_code)
AND pb.prescription_month = TO_CHAR(ws.sales_date, 'YYYY-MM')
```

---

**분석 완료**: 2025-08-25  
**문제 URL**: https://web-sinil.vercel.app/admin/absorption-analysis  
**현재 상태**: 흡수율 계산 실패 (0값 표시)  
**해결 우선순위**: 높음 (데이터 정확성 문제)
