-- 나머지 누락된 표준코드 매핑 추가
-- 사용되지 않은 standard_code를 사용하여 나머지 insurance_code 매핑

INSERT INTO products_standard_code (insurance_code, standard_code, created_by, updated_by)
VALUES 
    ('666666667', '8806538000930', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666668', '8806538000954', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666669', '8806538001500', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666671', '8806538001517', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666672', '8806538001524', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666673', '8806538002804', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666674', '8806538002811', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666675', '8806538003504', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376'),
    ('666666676', '8806538003511', 'f19113ee-432b-4f29-9c20-15cfe4001376', 'f19113ee-432b-4f29-9c20-15cfe4001376')
ON CONFLICT (standard_code) DO NOTHING;

-- 추가 결과 확인
SELECT '추가된 매핑 수' as info, COUNT(*) as count 
FROM products_standard_code 
WHERE created_by = 'f19113ee-432b-4f29-9c20-15cfe4001376' AND created_at >= NOW() - INTERVAL '1 minute';

-- 전체 매핑 현황 확인
SELECT '전체 매핑 수' as info, COUNT(*) as count FROM products_standard_code;

-- 누락된 매핑이 해결되었는지 확인
SELECT '여전히 누락된 insurance_code 수' as info, COUNT(DISTINCT p.insurance_code) as count 
FROM performance_records_absorption pra 
JOIN products p ON pra.product_id = p.id 
WHERE pra.settlement_month = '2025-08' 
AND p.insurance_code NOT IN (SELECT DISTINCT insurance_code FROM products_standard_code);
