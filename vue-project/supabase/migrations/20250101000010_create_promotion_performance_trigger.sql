-- performance_records INSERT/UPDATE 시 promotion_product_hospital_performance 자동 업데이트 트리거
-- 
-- 이 트리거는 performance_records 테이블에 데이터가 INSERT되거나 UPDATE될 때
-- promotion_product_hospital_performance 테이블을 자동으로 업데이트합니다.

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_promotion_product_hospital_performance()
RETURNS TRIGGER AS $$
DECLARE
  v_insurance_code VARCHAR(50);
  v_product_price NUMERIC;
  v_old_product_price NUMERIC;
  v_company_group VARCHAR(50);
  v_promotion_product_id BIGINT;
  v_promotion_start_date DATE;
  v_promotion_end_date DATE;
  v_settlement_date DATE;
  v_last_day_of_month DATE;
  v_is_within_promotion_period BOOLEAN;
  v_prescription_amount NUMERIC;
  v_old_prescription_amount NUMERIC;
  v_amount_delta NUMERIC;
  v_existing_record RECORD;
  v_first_performance_record RECORD;
  v_first_performance_cso_id UUID;
  v_first_performance_month VARCHAR(7);
  v_is_insert BOOLEAN;
  v_error_context TEXT;
BEGIN
  -- 트리거 타입 확인 (INSERT인지 UPDATE인지)
  v_is_insert := (TG_OP = 'INSERT');
  
  -- 삭제된 레코드는 처리하지 않음
  IF NEW.review_action = '삭제' THEN
    -- UPDATE인 경우 기존 실적에서 제거해야 함
    IF NOT v_is_insert THEN
      -- OLD 값으로 기존 실적 정보 조회
      SELECT insurance_code, price INTO v_insurance_code, v_old_product_price
      FROM products
      WHERE id = OLD.product_id;
      
      IF v_insurance_code IS NOT NULL THEN
        SELECT id INTO v_promotion_product_id
        FROM promotion_product_list
        WHERE insurance_code = v_insurance_code;
        
        IF v_promotion_product_id IS NOT NULL THEN
          -- 기존 실적 금액 계산
          v_old_prescription_amount := COALESCE(OLD.prescription_qty, 0) * COALESCE(v_old_product_price, 0);
          
          -- 기존 실적에서 금액 차감
          UPDATE promotion_product_hospital_performance
          SET 
            total_performance_amount = GREATEST(COALESCE(total_performance_amount, 0) - v_old_prescription_amount, 0),
            updated_at = NOW()
          WHERE promotion_product_id = v_promotion_product_id
            AND hospital_id = OLD.client_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- 1. 제품의 보험코드와 가격 조회
  SELECT insurance_code, price INTO v_insurance_code, v_product_price
  FROM products
  WHERE id = NEW.product_id;

  -- 보험코드가 없으면 처리하지 않음
  IF v_insurance_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. 업체의 company_group 조회
  SELECT company_group INTO v_company_group
  FROM companies
  WHERE id = NEW.company_id;

  -- NEWCSO 그룹이 아니면 처리하지 않음
  IF v_company_group != 'NEWCSO' THEN
    RETURN NEW;
  END IF;

  -- 3. 프로모션 제품 확인
  SELECT id, promotion_start_date, promotion_end_date
  INTO v_promotion_product_id, v_promotion_start_date, v_promotion_end_date
  FROM promotion_product_list
  WHERE insurance_code = v_insurance_code;

  -- 프로모션 제품이 아니면 처리하지 않음
  IF v_promotion_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 4. 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
  v_is_within_promotion_period := TRUE;
  
  IF NEW.settlement_month IS NOT NULL THEN
    v_settlement_date := TO_DATE(NEW.settlement_month || '-01', 'YYYY-MM-DD');
    v_last_day_of_month := (DATE_TRUNC('month', v_settlement_date) + INTERVAL '1 month - 1 day')::DATE;
    
    IF v_promotion_start_date IS NOT NULL THEN
      -- 정산월의 첫 날이 시작일 이후 또는 같아야 함
      IF v_settlement_date < v_promotion_start_date THEN
        v_is_within_promotion_period := FALSE;
      END IF;
    END IF;
    
    IF v_promotion_end_date IS NOT NULL THEN
      -- 정산월의 마지막 날이 종료일 이전 또는 같아야 함
      IF v_last_day_of_month > v_promotion_end_date THEN
        v_is_within_promotion_period := FALSE;
      END IF;
    END IF;
  END IF;

  -- 프로모션 기간이 아니면 처리하지 않음
  IF NOT v_is_within_promotion_period THEN
    RETURN NEW;
  END IF;

  -- 5. 실적 금액 계산
  v_prescription_amount := COALESCE(NEW.prescription_qty, 0) * COALESCE(v_product_price, 0);
  
  -- UPDATE인 경우 기존 금액과의 차이 계산
  IF NOT v_is_insert THEN
    -- OLD 제품 가격 조회 (제품이 변경된 경우 대비)
    SELECT price INTO v_old_product_price
    FROM products
    WHERE id = OLD.product_id;
    
    v_old_prescription_amount := COALESCE(OLD.prescription_qty, 0) * COALESCE(v_old_product_price, 0);
    v_amount_delta := v_prescription_amount - v_old_prescription_amount;
  ELSE
    v_amount_delta := v_prescription_amount;
  END IF;

  -- 6. 기존 데이터 조회
  SELECT * INTO v_existing_record
  FROM promotion_product_hospital_performance
  WHERE promotion_product_id = v_promotion_product_id
    AND hospital_id = NEW.client_id;

  -- 7. 최초 실적 CSO와 월 확인을 위한 기존 실적 데이터 조회
  -- prescription_month와 created_at을 함께 고려하여 정확한 최초 실적 CSO 결정
  SELECT company_id, prescription_month, created_at
  INTO v_first_performance_record
  FROM performance_records
  WHERE client_id = NEW.client_id
    AND product_id = NEW.product_id
    AND review_action != '삭제'
  ORDER BY prescription_month ASC NULLS LAST, created_at ASC
  LIMIT 1;

  IF v_first_performance_record IS NOT NULL THEN
    v_first_performance_cso_id := v_first_performance_record.company_id;
    v_first_performance_month := v_first_performance_record.prescription_month;
  ELSE
    v_first_performance_cso_id := NEW.company_id;
    v_first_performance_month := NEW.prescription_month;
  END IF;

  -- 8. 데이터 삽입 또는 업데이트
  IF v_existing_record IS NULL THEN
    -- 기존 데이터가 없으면 INSERT
    INSERT INTO promotion_product_hospital_performance (
      promotion_product_id,
      hospital_id,
      has_performance,
      first_performance_cso_id,
      first_performance_month,
      total_performance_amount,
      created_by,
      updated_by
    ) VALUES (
      v_promotion_product_id,
      NEW.client_id,
      TRUE,
      v_first_performance_cso_id,
      v_first_performance_month,
      v_prescription_amount,
      COALESCE(NEW.registered_by, NEW.updated_by),
      COALESCE(NEW.updated_by, NEW.registered_by)
    )
    ON CONFLICT (promotion_product_id, hospital_id) DO UPDATE
    SET 
      has_performance = TRUE,
      total_performance_amount = promotion_product_hospital_performance.total_performance_amount + v_prescription_amount,
      first_performance_cso_id = COALESCE(
        NULLIF(promotion_product_hospital_performance.first_performance_cso_id, NULL),
        EXCLUDED.first_performance_cso_id
      ),
      first_performance_month = COALESCE(
        NULLIF(promotion_product_hospital_performance.first_performance_month, NULL),
        EXCLUDED.first_performance_month
      ),
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW();
  ELSE
    -- 기존 데이터가 있으면 UPDATE
    -- UPDATE인 경우 금액 차이만 반영, INSERT인 경우 전체 금액 사용
    UPDATE promotion_product_hospital_performance
    SET 
      has_performance = TRUE,
      total_performance_amount = GREATEST(
        COALESCE(total_performance_amount, 0) + v_amount_delta,
        0
      ),
      first_performance_cso_id = COALESCE(
        NULLIF(first_performance_cso_id, NULL),
        v_first_performance_cso_id
      ),
      first_performance_month = COALESCE(
        NULLIF(first_performance_month, NULL),
        v_first_performance_month
      ),
      updated_by = COALESCE(NEW.updated_by, NEW.registered_by),
      updated_at = NOW()
    WHERE promotion_product_id = v_promotion_product_id
      AND hospital_id = NEW.client_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 상세 로그 기록
    v_error_context := format(
      '프로모션 제품 병원 실적 업데이트 오류 - 제품ID: %s, 병원ID: %s, 업체ID: %s, 오류: %s',
      COALESCE(NEW.product_id::TEXT, 'NULL'),
      COALESCE(NEW.client_id::TEXT, 'NULL'),
      COALESCE(NEW.company_id::TEXT, 'NULL'),
      SQLERRM
    );
    RAISE WARNING '%', v_error_context;
    -- 에러가 발생해도 원본 트랜잭션은 계속 진행
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (INSERT 후)
CREATE TRIGGER trigger_update_promotion_performance_on_insert
AFTER INSERT ON performance_records
FOR EACH ROW
EXECUTE FUNCTION update_promotion_product_hospital_performance();

-- 3. 트리거 생성 (UPDATE 후)
CREATE TRIGGER trigger_update_promotion_performance_on_update
AFTER UPDATE ON performance_records
FOR EACH ROW
WHEN (OLD.review_action IS DISTINCT FROM NEW.review_action OR
      OLD.product_id IS DISTINCT FROM NEW.product_id OR
      OLD.client_id IS DISTINCT FROM NEW.client_id OR
      OLD.company_id IS DISTINCT FROM NEW.company_id OR
      OLD.prescription_qty IS DISTINCT FROM NEW.prescription_qty OR
      OLD.settlement_month IS DISTINCT FROM NEW.settlement_month)
EXECUTE FUNCTION update_promotion_product_hospital_performance();

-- 트리거 및 함수에 대한 주석 추가
COMMENT ON FUNCTION update_promotion_product_hospital_performance() IS 
'performance_records INSERT/UPDATE 시 promotion_product_hospital_performance 자동 업데이트 트리거 함수';

COMMENT ON TRIGGER trigger_update_promotion_performance_on_insert ON performance_records IS 
'performance_records INSERT 시 promotion_product_hospital_performance 자동 업데이트';

COMMENT ON TRIGGER trigger_update_promotion_performance_on_update ON performance_records IS 
'performance_records UPDATE 시 promotion_product_hospital_performance 자동 업데이트';

