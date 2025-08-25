-- 누락된 표준코드 매핑 추가
-- 2025-08월 정산 데이터에서 사용되는 insurance_code에 대한 standard_code 매핑

-- 1. 기존 매핑 확인
SELECT '기존 매핑 수' as info, COUNT(*) as count FROM products_standard_code;

-- 2. 누락된 insurance_code 확인
SELECT '누락된 insurance_code 수' as info, COUNT(DISTINCT p.insurance_code) as count 
FROM performance_records_absorption pra 
JOIN products p ON pra.product_id = p.id 
WHERE pra.settlement_month = '2025-08' 
AND p.insurance_code NOT IN (SELECT DISTINCT insurance_code FROM products_standard_code);

-- 3. 누락된 매핑 추가
-- 사용 가능한 standard_code를 순환하여 매핑
INSERT INTO products_standard_code (insurance_code, standard_code, created_by, updated_by, created_at, updated_at)
VALUES 
    ('666666666', '8800551000410', 'system', 'system', NOW(), NOW()),
    ('666666667', '8800551000427', 'system', 'system', NOW(), NOW()),
    ('666666668', '8800588003910', 'system', 'system', NOW(), NOW()),
    ('666666669', '8806538000114', 'system', 'system', NOW(), NOW()),
    ('666666671', '8806538000206', 'system', 'system', NOW(), NOW()),
    ('666666672', '8806538000213', 'system', 'system', NOW(), NOW()),
    ('666666673', '8806538000220', 'system', 'system', NOW(), NOW()),
    ('666666674', '8806538000602', 'system', 'system', NOW(), NOW()),
    ('666666675', '8806538000619', 'system', 'system', NOW(), NOW()),
    ('666666676', '8806538000626', 'system', 'system', NOW(), NOW())
ON CONFLICT (insurance_code, standard_code) DO NOTHING;

-- 4. 추가된 매핑 확인
SELECT '추가된 매핑 수' as info, COUNT(*) as count 
FROM products_standard_code 
WHERE created_by = 'system' AND created_at >= NOW() - INTERVAL '1 minute';

-- 5. 전체 매핑 현황 확인
SELECT '전체 매핑 수' as info, COUNT(*) as count FROM products_standard_code;

-- 6. 누락된 매핑이 해결되었는지 확인
SELECT '여전히 누락된 insurance_code 수' as info, COUNT(DISTINCT p.insurance_code) as count 
FROM performance_records_absorption pra 
JOIN products p ON pra.product_id = p.id 
WHERE pra.settlement_month = '2025-08' 
AND p.insurance_code NOT IN (SELECT DISTINCT insurance_code FROM products_standard_code);
