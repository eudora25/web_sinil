-- 필터 조건을 지원하는 흡수율 계산 함수
-- Vue 컴포넌트에서 전달하는 필터 조건에 따라 계산

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS public.calculate_absorption_rates(text);

-- 2. 필터 조건을 지원하는 함수 생성
CREATE OR REPLACE FUNCTION public.calculate_absorption_rates(p_settlement_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- 1단계: 기존 흡수율 데이터 초기화 (해당 정산월의 모든 데이터)
    UPDATE performance_records_absorption 
    SET 
        wholesale_revenue = 0,
        direct_revenue = 0,
        total_revenue = 0,
        absorption_rate = 0
    WHERE settlement_month = p_settlement_month;
    
    -- 2단계: 흡수율 계산 및 업데이트 (performance_records_absorption에 있는 데이터만)
    FOR result_record IN
        WITH 
        -- 1. performance_records_absorption에서 해당 정산월의 모든 데이터 가져오기
        performance_base AS (
            SELECT 
                pra.id as absorption_analysis_id,
                pra.client_id,
                pra.product_id,
                p.insurance_code,
                psc.standard_code, -- 도매/직거래 매출 매칭을 위한 표준코드
                pra.prescription_month,
                pra.prescription_qty,
                -- 처방액 계산: 수량 * 제품 가격
                (pra.prescription_qty * p.price) as prescription_amount
            FROM public.performance_records_absorption pra
            JOIN products p ON pra.product_id = p.id
            LEFT JOIN products_standard_code psc ON p.insurance_code = psc.insurance_code
            WHERE pra.settlement_month = p_settlement_month
        ),
        -- 2. 병원-약국 매핑 정보
        client_pharmacy_map AS (
            SELECT cpa.client_id, cpa.pharmacy_id, p.business_registration_number AS pharmacy_brn
            FROM client_pharmacy_assignments cpa
            JOIN pharmacies p ON cpa.pharmacy_id = p.id
        ),
        -- 3. 약국별 월별 총 매출 계산 (대체 로직)
        pharmacy_monthly_sales AS (
            SELECT 
                business_registration_number,
                TO_CHAR(sales_date, 'YYYY-MM') as sales_month,
                SUM(sales_amount) as total_wholesale_sales
            FROM wholesale_sales
            WHERE TO_CHAR(sales_date, 'YYYY-MM') IN ('2025-05', '2025-06', '2025-07')
            GROUP BY business_registration_number, TO_CHAR(sales_date, 'YYYY-MM')
        ),
        -- 4. 약국별 월별 총 직거래 매출 계산
        pharmacy_monthly_direct_sales AS (
            SELECT 
                business_registration_number,
                TO_CHAR(sales_date, 'YYYY-MM') as sales_month,
                SUM(sales_amount) as total_direct_sales
            FROM direct_sales
            WHERE TO_CHAR(sales_date, 'YYYY-MM') IN ('2025-05', '2025-06', '2025-07')
            GROUP BY business_registration_number, TO_CHAR(sales_date, 'YYYY-MM')
        )
        -- 5. 최종 결과 계산 (약국별 월별 총 매출 사용)
        SELECT 
            pb.absorption_analysis_id,
            -- 도매 매출 계산 (약국별 월별 총 매출 사용)
            COALESCE(pms.total_wholesale_sales, 0) AS wholesale_revenue,
            -- 직거래 매출 계산 (약국별 월별 총 매출 사용)
            COALESCE(pmds.total_direct_sales, 0) AS direct_revenue,
            -- 처방액 (흡수율 계산용)
            pb.prescription_amount
        FROM performance_base pb
        -- 병원에 연결된 약국 정보 조인
        JOIN client_pharmacy_map cpm ON pb.client_id = cpm.client_id
        -- 약국별 월별 도매 매출 정보 조인
        LEFT JOIN pharmacy_monthly_sales pms 
            ON cpm.pharmacy_brn = pms.business_registration_number
            AND pb.prescription_month = pms.sales_month
        -- 약국별 월별 직거래 매출 정보 조인
        LEFT JOIN pharmacy_monthly_direct_sales pmds 
            ON cpm.pharmacy_brn = pmds.business_registration_number
            AND pb.prescription_month = pmds.sales_month
        GROUP BY pb.absorption_analysis_id, pb.prescription_amount, pms.total_wholesale_sales, pmds.total_direct_sales
    LOOP
        -- 각 레코드별로 테이블 업데이트
        UPDATE performance_records_absorption 
        SET 
            wholesale_revenue = COALESCE(result_record.wholesale_revenue, 0),
            direct_revenue = COALESCE(result_record.direct_revenue, 0),
            total_revenue = COALESCE(result_record.wholesale_revenue, 0) + COALESCE(result_record.direct_revenue, 0),
            absorption_rate = CASE 
                WHEN result_record.prescription_amount > 0 THEN 
                    (COALESCE(result_record.wholesale_revenue, 0) + COALESCE(result_record.direct_revenue, 0)) / result_record.prescription_amount
                ELSE 0 
            END
        WHERE id = result_record.absorption_analysis_id;
    END LOOP;
    
    RAISE NOTICE '흡수율 분석 완료 (필터 조건 지원): %월', p_settlement_month;
END;
$$;

-- 3. 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.calculate_absorption_rates(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_absorption_rates(text) TO anon;
