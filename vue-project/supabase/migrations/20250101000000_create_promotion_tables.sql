-- ============================================
-- 프로모션 관련 테이블 생성 마이그레이션
-- ============================================

-- 1. promotion_product_list 테이블 생성
-- 프로모션 제품 목록 테이블
CREATE TABLE IF NOT EXISTS promotion_product_list (
  id BIGSERIAL PRIMARY KEY,
  insurance_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  commission_rate NUMERIC(5, 4) DEFAULT 0,
  final_commission_rate NUMERIC(5, 4) DEFAULT 0,
  promotion_start_date DATE,
  promotion_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT promotion_product_list_insurance_code_key UNIQUE (insurance_code)
);

-- 제약조건: 종료일이 시작일보다 이후여야 함 (별도로 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_promotion_dates' 
    AND conrelid = 'promotion_product_list'::regclass
  ) THEN
    ALTER TABLE promotion_product_list
    ADD CONSTRAINT check_promotion_dates CHECK (
      promotion_start_date IS NULL OR 
      promotion_end_date IS NULL OR 
      promotion_end_date >= promotion_start_date
    );
  END IF;
END $$;

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_promotion_product_list_insurance_code 
  ON promotion_product_list(insurance_code);
CREATE INDEX IF NOT EXISTS idx_promotion_product_list_product_name 
  ON promotion_product_list(product_name);
CREATE INDEX IF NOT EXISTS idx_promotion_product_list_start_date 
  ON promotion_product_list(promotion_start_date);
CREATE INDEX IF NOT EXISTS idx_promotion_product_list_end_date 
  ON promotion_product_list(promotion_end_date);

-- 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE promotion_product_list IS '프로모션용 제품 리스트 테이블 - 제품별 병원 실적 확인용';
COMMENT ON COLUMN promotion_product_list.id IS '기본 키';
COMMENT ON COLUMN promotion_product_list.insurance_code IS '보험코드 (중복 불가)';
COMMENT ON COLUMN promotion_product_list.product_name IS '제품명';
COMMENT ON COLUMN promotion_product_list.commission_rate IS '수수료율 (0.0000 ~ 1.0000, 예: 0.1500 = 15%)';
COMMENT ON COLUMN promotion_product_list.final_commission_rate IS '최종수수료율 (0.0000 ~ 1.0000, 예: 0.1500 = 15%)';
COMMENT ON COLUMN promotion_product_list.promotion_start_date IS '프로모션 시작일 (처방월 기준)';
COMMENT ON COLUMN promotion_product_list.promotion_end_date IS '프로모션 종료일 (처방월 기준)';
COMMENT ON COLUMN promotion_product_list.created_at IS '생성일시';
COMMENT ON COLUMN promotion_product_list.updated_at IS '수정일시';
COMMENT ON COLUMN promotion_product_list.created_by IS '생성자 ID';
COMMENT ON COLUMN promotion_product_list.updated_by IS '수정자 ID';

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_promotion_product_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_update_promotion_product_list_updated_at
  BEFORE UPDATE ON promotion_product_list
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_product_list_updated_at();

-- RLS 정책 (관리자만 접근 가능)
ALTER TABLE promotion_product_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 조회 가능" ON promotion_product_list
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 삽입 가능" ON promotion_product_list
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 수정 가능" ON promotion_product_list
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 삭제 가능" ON promotion_product_list
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

-- ============================================
-- 2. promotion_product_hospital_performance 테이블 생성
-- 프로모션 제품별 병원 실적 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS promotion_product_hospital_performance (
  id BIGSERIAL PRIMARY KEY,
  promotion_product_id BIGINT NOT NULL REFERENCES promotion_product_list(id) ON DELETE CASCADE,
  hospital_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- 실적 정보
  has_performance BOOLEAN DEFAULT FALSE, -- 실적 존재 여부
  first_performance_cso_id UUID REFERENCES companies(id), -- 최초 실적 CSO ID (프로모션 시작일 이후인 경우)
  first_performance_month VARCHAR(7), -- 최초 실적 처방월 (YYYY-MM 형식)
  
  -- 실적 금액
  total_performance_amount NUMERIC(15, 2) DEFAULT 0, -- 총 실적 금액
  before_promotion_amount NUMERIC(15, 2) DEFAULT 0, -- 프로모션 시작일 이전 실적 금액
  after_promotion_amount NUMERIC(15, 2) DEFAULT 0, -- 프로모션 시작일 이후 실적 금액 (종료일 이전만)
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- 유니크 제약조건: 같은 제품-병원 조합은 하나만 존재
  CONSTRAINT unique_promotion_product_hospital 
    UNIQUE (promotion_product_id, hospital_id)
);

-- 인덱스 생성 (조회 성능 향상)
-- 실제 DB에 존재하는 인덱스
CREATE INDEX IF NOT EXISTS idx_promotion_product_hospital_performance_cso_id 
  ON promotion_product_hospital_performance(first_performance_cso_id);

-- 추가 인덱스 (성능 최적화용, 실제 DB에는 없을 수 있음)
CREATE INDEX IF NOT EXISTS idx_promotion_hospital_perf_product_id 
  ON promotion_product_hospital_performance(promotion_product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_hospital_perf_hospital_id 
  ON promotion_product_hospital_performance(hospital_id);
CREATE INDEX IF NOT EXISTS idx_promotion_hospital_perf_has_performance 
  ON promotion_product_hospital_performance(has_performance);
CREATE INDEX IF NOT EXISTS idx_promotion_hospital_perf_month 
  ON promotion_product_hospital_performance(first_performance_month);

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
-- unique_promotion_product_hospital 인덱스가 이미 (promotion_product_id, hospital_id)를 포함하므로
-- 별도 복합 인덱스는 선택사항
CREATE INDEX IF NOT EXISTS idx_promotion_hospital_perf_hospital_cso 
  ON promotion_product_hospital_performance(hospital_id, first_performance_cso_id);

-- 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE promotion_product_hospital_performance IS '프로모션 제품별 병원 실적 테이블 - 제품별 병원의 프로모션 전/후 실적 집계';
COMMENT ON COLUMN promotion_product_hospital_performance.id IS '기본 키';
COMMENT ON COLUMN promotion_product_hospital_performance.promotion_product_id IS '프로모션 제품 ID (promotion_product_list 참조)';
COMMENT ON COLUMN promotion_product_hospital_performance.hospital_id IS '병원 ID (clients 참조)';
COMMENT ON COLUMN promotion_product_hospital_performance.has_performance IS '실적 존재 여부';
COMMENT ON COLUMN promotion_product_hospital_performance.first_performance_cso_id IS '최초 실적 CSO ID (프로모션 시작일 이후인 경우에만 설정)';
COMMENT ON COLUMN promotion_product_hospital_performance.first_performance_month IS '최초 실적 처방월 (YYYY-MM 형식)';
COMMENT ON COLUMN promotion_product_hospital_performance.total_performance_amount IS '총 실적 금액 (프로모션 전/후 모두 포함)';
COMMENT ON COLUMN promotion_product_hospital_performance.before_promotion_amount IS '프로모션 시작일 이전 실적 금액';
COMMENT ON COLUMN promotion_product_hospital_performance.after_promotion_amount IS '프로모션 시작일 이후 실적 금액 (종료일 이전만 포함)';
COMMENT ON COLUMN promotion_product_hospital_performance.created_at IS '생성일시';
COMMENT ON COLUMN promotion_product_hospital_performance.updated_at IS '수정일시';
COMMENT ON COLUMN promotion_product_hospital_performance.created_by IS '생성자 ID';
COMMENT ON COLUMN promotion_product_hospital_performance.updated_by IS '수정자 ID';

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_promotion_hospital_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_update_promotion_hospital_performance_updated_at
  BEFORE UPDATE ON promotion_product_hospital_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_hospital_performance_updated_at();

-- RLS 정책 (관리자만 접근 가능)
ALTER TABLE promotion_product_hospital_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 조회 가능" ON promotion_product_hospital_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 삽입 가능" ON promotion_product_hospital_performance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 수정 가능" ON promotion_product_hospital_performance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

CREATE POLICY "관리자만 삭제 가능" ON promotion_product_hospital_performance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.user_id = auth.uid() 
      AND companies.user_type = 'admin'
    )
  );

