-- 개선된 흡수율 계산 함수
-- standard_code 매칭과 insurance_code 직접 매칭을 모두 지원

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS public.calculate_absorption_rates(text);

-- 2. 개선된 함수 생성
CREATE OR REPLACE FUNCTION public.calculate_absorption_rates(p_settlement_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- 1단계: 기존 흡수율 데이터 초기화
    UPDATE performance_records_absorption 
    SET 
        wholesale_revenue = 0,
        direct_revenue = 0,
        total_revenue = 0,
        absorption_rate = 0
    WHERE settlement_month = p_settlement_month;
    
    -- 2단계: 흡수율 계산 및 업데이트
    FOR result_record IN
        WITH 
        -- 1. 선택된 정산월에 해당하는 모든 실적 데이터를 performance_records_absorption에서 가져옴
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
        -- 3. 약국별로 연결된 병원 수 계산
        pharmacy_hospital_count AS (
            SELECT pharmacy_id as id, COUNT(client_id) AS hospital_count
            FROM client_pharmacy_map
            GROUP BY pharmacy_id
        ),
        -- 4. 약국-제품-월별 총 처방수량 계산
        distribution_base AS (
            SELECT
                cpm.pharmacy_brn,
                pb.standard_code,
                pb.prescription_month,
                SUM(pb.prescription_qty) AS total_qty_for_distribution
            FROM performance_base pb
            JOIN client_pharmacy_map cpm ON pb.client_id = cpm.client_id
            WHERE pb.standard_code IS NOT NULL
            GROUP BY cpm.pharmacy_brn, pb.standard_code, pb.prescription_month
        )
        -- 5. 최종 결과 계산 (개선된 매칭 조건)
        SELECT 
            pb.absorption_analysis_id,
            -- 도매 매출 계산 (standard_code 또는 insurance_code 매칭)
            SUM(
                COALESCE(ws.sales_amount, 0) * 
                (CASE 
                    WHEN phc.hospital_count > 1 THEN (pb.prescription_qty::numeric / NULLIF(tdb.total_qty_for_distribution, 0))
                    ELSE 1 
                END)
            ) AS wholesale_revenue,
            -- 직거래 매출 계산 (standard_code 또는 insurance_code 매칭)
            SUM(
                COALESCE(ds.sales_amount, 0) *
                (CASE 
                    WHEN phc.hospital_count > 1 THEN (pb.prescription_qty::numeric / NULLIF(tdb.total_qty_for_distribution, 0))
                    ELSE 1 
                END)
            ) AS direct_revenue,
            -- 처방액 (흡수율 계산용)
            pb.prescription_amount
        FROM performance_base pb
        -- 병원에 연결된 약국 정보 조인
        JOIN client_pharmacy_map cpm ON pb.client_id = cpm.client_id
        -- 약국의 병원 연결 수 정보 조인
        JOIN pharmacy_hospital_count phc ON cpm.pharmacy_id = phc.id
        -- 도매 매출 정보 조인 (개선된 매칭 조건)
        LEFT JOIN wholesale_sales ws 
            ON cpm.pharmacy_brn = ws.business_registration_number
            AND (
                (pb.standard_code IS NOT NULL AND pb.standard_code = ws.standard_code) OR
                (pb.standard_code IS NULL AND pb.insurance_code = ws.insurance_code)
            )
            AND pb.prescription_month = TO_CHAR(ws.sales_date, 'YYYY-MM')
        -- 직거래 매출 정보 조인 (개선된 매칭 조건)
        LEFT JOIN direct_sales ds 
            ON cpm.pharmacy_brn = ds.business_registration_number
            AND (
                (pb.standard_code IS NOT NULL AND pb.standard_code = ds.standard_code) OR
                (pb.standard_code IS NULL AND pb.insurance_code = ds.insurance_code)
            )
            AND pb.prescription_month = TO_CHAR(ds.sales_date, 'YYYY-MM')
        -- 매출 분배 기준(총 수량) 조인
        LEFT JOIN distribution_base tdb
            ON cpm.pharmacy_brn = tdb.pharmacy_brn
            AND pb.standard_code = tdb.standard_code
            AND pb.prescription_month = tdb.prescription_month
        GROUP BY pb.absorption_analysis_id, pb.prescription_amount
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
    
    RAISE NOTICE '흡수율 분석 완료 (개선된 매칭 조건): %월', p_settlement_month;
END;
$$;

-- 3. 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.calculate_absorption_rates(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_absorption_rates(text) TO anon;
