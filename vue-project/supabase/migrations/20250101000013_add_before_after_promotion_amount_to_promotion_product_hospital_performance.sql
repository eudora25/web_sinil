-- 프로모션 전/후 실적 금액 컬럼 추가
ALTER TABLE promotion_product_hospital_performance
ADD COLUMN IF NOT EXISTS before_promotion_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_promotion_amount NUMERIC(15, 2) DEFAULT 0;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN promotion_product_hospital_performance.before_promotion_amount IS '프로모션 시작일 이전 실적 금액';
COMMENT ON COLUMN promotion_product_hospital_performance.after_promotion_amount IS '프로모션 시작일 이후 실적 금액';

