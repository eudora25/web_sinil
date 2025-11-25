-- promotion_product_hospital_performance 테이블 초기화 (모든 데이터 삭제)
TRUNCATE TABLE promotion_product_hospital_performance RESTART IDENTITY CASCADE;

-- 코멘트 추가
COMMENT ON TABLE promotion_product_hospital_performance IS '프로모션용 제품별 병원 실적 확인 테이블 (초기화 완료)';

