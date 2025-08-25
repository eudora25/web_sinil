-- 누락된 표준코드 매핑 추가 (수정된 버전)
-- 2025-08월 정산 데이터에서 사용되는 insurance_code에 대한 standard_code 매핑

-- 1. 기존 매핑 확인
SELECT '기존 매핑 수' as info, COUNT(*) as count FROM products_standard_code;

-- 2. 누락된 insurance_code 확인
SELECT '누락된 insurance_code 수' as info, COUNT(DISTINCT p.insurance_code) as count 
FROM performance_records_absorption pra 
JOIN products p ON pra.product_id = p.id 
WHERE pra.settlement_month = '2025-08' 
AND p.insurance_code NOT IN (SELECT DISTINCT insurance_code FROM products_standard_code);

-- 3. 누락된 매핑 추가 (올바른 UUID 사용)
INSERT INTO products_standard_code (insurance_code, standard_code, created_by, updated_by)
VALUES 
    ('666666666', '8800551000410', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666667', '8800551000427', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666668', '8800588003910', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666669', '8806538000114', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666671', '8806538000206', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666672', '8806538000213', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666673', '8806538000220', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666674', '8806538000602', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666675', '8806538000619', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666676', '8806538000626', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376')
ON CONFLICT (insurance_code, standard_code) DO NOTHING;

-- 4. 추가된 매핑 확인
SELECT '추가된 매핑 수' as info, COUNT(*) as count 
FROM products_standard_code 
WHERE created_by = 'f19113ee-432b-4f29-9c20-15cfe4001376' AND created_at >= NOW() - INTERVAL '1 minute';

-- 5. 전체 매핑 현황 확인
SELECT '전체 매핑 수' as info, COUNT(*) as count FROM products_standard_code;

-- 6. 누락된 매핑이 해결되었는지 확인
SELECT '여전히 누락된 insurance_code 수' as info, COUNT(DISTINCT p.insurance_code) as count 
FROM performance_records_absorption pra 
JOIN products p ON pra.product_id = p.id 
WHERE pra.settlement_month = '2025-08' 
AND p.insurance_code NOT IN (SELECT DISTINCT insurance_code FROM products_standard_code);
