-- promotion_product_list 테이블의 모든 레코드의 promotion_start_date를 2025년 10월 1일로 업데이트
UPDATE promotion_product_list
SET promotion_start_date = '2025-10-01',
    updated_at = NOW()
WHERE promotion_start_date IS NOT NULL OR promotion_start_date IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN promotion_product_list.promotion_start_date IS '프로모션 시작일 (기본값: 2025-10-01)';

