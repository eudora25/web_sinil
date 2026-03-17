-- ============================================================================
-- 프로모션 적용 대상 NEWCSO 업체로 복원
-- NEWCSO 그룹 필터를 다시 추가하여 NEWCSO 업체만 프로모션 적용
-- ============================================================================

CREATE OR REPLACE FUNCTION update_promotion_product_hospital_performance()
RETURNS TRIGGER AS $$
DECLARE
  v_insurance_code VARCHAR(50);
  v_related_insurance_code VARCHAR(50);
  v_related_promotion_product_id BIGINT;
  v_related_promotion_start_date DATE;
  v_related_effective_start DATE;
  v_related_cso_id UUID;
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
  v_related_existing RECORD;
  v_first_perf_promotion_start DATE;
BEGIN
  v_is_insert := (TG_OP = 'INSERT');

  -- review_status가 '완료'가 아니면 처리하지 않음
  IF NEW.review_status != '완료' THEN
    IF NOT v_is_insert AND OLD.review_status = '완료' THEN
      SELECT insurance_code, price INTO v_insurance_code, v_old_product_price
      FROM products WHERE id = OLD.product_id;
      IF v_insurance_code IS NOT NULL THEN
        SELECT id INTO v_promotion_product_id
        FROM promotion_product_list WHERE insurance_code = v_insurance_code;
        IF v_promotion_product_id IS NOT NULL THEN
          v_old_prescription_amount := COALESCE(OLD.prescription_qty, 0) * COALESCE(v_old_product_price, 0);
          UPDATE promotion_product_hospital_performance
          SET total_performance_amount = GREATEST(COALESCE(total_performance_amount, 0) - v_old_prescription_amount, 0),
              updated_at = NOW()
          WHERE promotion_product_id = v_promotion_product_id AND hospital_id = OLD.client_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- 삭제된 레코드는 처리하지 않음
  IF NEW.review_action = '삭제' THEN
    IF NOT v_is_insert THEN
      SELECT insurance_code, price INTO v_insurance_code, v_old_product_price
      FROM products WHERE id = OLD.product_id;
      IF v_insurance_code IS NOT NULL THEN
        SELECT id INTO v_promotion_product_id
        FROM promotion_product_list WHERE insurance_code = v_insurance_code;
        IF v_promotion_product_id IS NOT NULL THEN
          v_old_prescription_amount := COALESCE(OLD.prescription_qty, 0) * COALESCE(v_old_product_price, 0);
          UPDATE promotion_product_hospital_performance
          SET total_performance_amount = GREATEST(COALESCE(total_performance_amount, 0) - v_old_prescription_amount, 0),
              updated_at = NOW()
          WHERE promotion_product_id = v_promotion_product_id AND hospital_id = OLD.client_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- 1. 제품의 보험코드와 가격 조회
  SELECT insurance_code, price INTO v_insurance_code, v_product_price
  FROM products WHERE id = NEW.product_id;
  IF v_insurance_code IS NULL THEN RETURN NEW; END IF;

  -- 2. 업체의 company_group 조회 - NEWCSO 그룹만 프로모션 적용
  SELECT company_group INTO v_company_group
  FROM companies
  WHERE id = NEW.company_id;

  IF v_company_group IS NULL OR v_company_group != 'NEWCSO' THEN
    RETURN NEW;
  END IF;

  -- 3. 프로모션 제품 확인 (related_insurance_code 포함)
  SELECT id, promotion_start_date, promotion_end_date, related_insurance_code
  INTO v_promotion_product_id, v_promotion_start_date, v_promotion_end_date, v_related_insurance_code
  FROM promotion_product_list WHERE insurance_code = v_insurance_code;
  IF v_promotion_product_id IS NULL THEN RETURN NEW; END IF;

  -- 4. 프로모션 기간 확인
  v_is_within_promotion_period := TRUE;
  IF NEW.settlement_month IS NOT NULL THEN
    v_settlement_date := TO_DATE(NEW.settlement_month || '-01', 'YYYY-MM-DD');
    v_last_day_of_month := (DATE_TRUNC('month', v_settlement_date) + INTERVAL '1 month - 1 day')::DATE;
    IF v_promotion_start_date IS NOT NULL AND v_settlement_date < v_promotion_start_date THEN v_is_within_promotion_period := FALSE; END IF;
    IF v_promotion_end_date IS NOT NULL AND v_last_day_of_month > v_promotion_end_date THEN v_is_within_promotion_period := FALSE; END IF;
  ELSE
    IF NEW.prescription_month IS NOT NULL THEN
      v_settlement_date := TO_DATE(NEW.prescription_month || '-01', 'YYYY-MM-DD');
      v_last_day_of_month := (DATE_TRUNC('month', v_settlement_date) + INTERVAL '1 month - 1 day')::DATE;
      IF v_promotion_start_date IS NOT NULL AND v_settlement_date < v_promotion_start_date THEN v_is_within_promotion_period := FALSE; END IF;
      IF v_promotion_end_date IS NOT NULL AND v_last_day_of_month > v_promotion_end_date THEN v_is_within_promotion_period := FALSE; END IF;
    END IF;
  END IF;
  IF NOT v_is_within_promotion_period THEN RETURN NEW; END IF;

  -- 5. 실적 금액 계산
  v_prescription_amount := COALESCE(NEW.prescription_qty, 0) * COALESCE(v_product_price, 0);
  IF NOT v_is_insert THEN
    SELECT price INTO v_old_product_price FROM products WHERE id = OLD.product_id;
    v_old_prescription_amount := COALESCE(OLD.prescription_qty, 0) * COALESCE(v_old_product_price, 0);
    IF OLD.review_status = '완료' THEN v_amount_delta := v_prescription_amount - v_old_prescription_amount;
    ELSE v_amount_delta := v_prescription_amount; END IF;
  ELSE
    v_amount_delta := v_prescription_amount;
  END IF;

  -- 6. 기존 데이터 조회
  SELECT * INTO v_existing_record
  FROM promotion_product_hospital_performance
  WHERE promotion_product_id = v_promotion_product_id AND hospital_id = NEW.client_id;

  -- 7. insurance_code + related_insurance_code 기준으로 최초 실적 조회
  SELECT pr.company_id, pr.prescription_month, pr.created_at, p.insurance_code as perf_insurance_code
  INTO v_first_performance_record
  FROM performance_records pr
  JOIN products p ON p.id = pr.product_id
  WHERE pr.client_id = NEW.client_id
    AND (p.insurance_code = v_insurance_code OR (v_related_insurance_code IS NOT NULL AND p.insurance_code = v_related_insurance_code))
    AND (pr.review_action IS NULL OR pr.review_action != '삭제')
    AND pr.review_status = '완료'
  ORDER BY pr.prescription_month ASC NULLS LAST, pr.created_at ASC
  LIMIT 1;

  IF v_first_performance_record IS NOT NULL THEN
    v_first_performance_month := v_first_performance_record.prescription_month;

    -- 최초 처방이 어느 제품에서 왔는지 확인하여 해당 제품의 시작일 사용
    IF v_first_performance_record.perf_insurance_code = v_insurance_code THEN
      v_first_perf_promotion_start := v_promotion_start_date;
    ELSE
      SELECT promotion_start_date INTO v_first_perf_promotion_start
      FROM promotion_product_list WHERE insurance_code = v_first_performance_record.perf_insurance_code;
    END IF;

    -- 최초 처방월이 유효 시작일 이전이면 CSO ID를 NULL로 설정 (프로모션 미적용)
    IF v_first_perf_promotion_start IS NOT NULL AND v_first_performance_month IS NOT NULL THEN
      IF TO_DATE(v_first_performance_month || '-01', 'YYYY-MM-DD') < v_first_perf_promotion_start THEN
        v_first_performance_cso_id := NULL;
      ELSE
        v_first_performance_cso_id := v_first_performance_record.company_id;
      END IF;
    ELSE
      v_first_performance_cso_id := v_first_performance_record.company_id;
    END IF;
  ELSE
    v_first_performance_month := NEW.prescription_month;
    IF v_promotion_start_date IS NOT NULL AND NEW.prescription_month IS NOT NULL THEN
      IF TO_DATE(NEW.prescription_month || '-01', 'YYYY-MM-DD') < v_promotion_start_date THEN
        v_first_performance_cso_id := NULL;
      ELSE
        v_first_performance_cso_id := NEW.company_id;
      END IF;
    ELSE
      v_first_performance_cso_id := NEW.company_id;
    END IF;
  END IF;

  -- 8. 데이터 삽입 또는 업데이트
  IF v_existing_record IS NULL THEN
    INSERT INTO promotion_product_hospital_performance (
      promotion_product_id, hospital_id, has_performance, first_performance_cso_id, first_performance_month,
      total_performance_amount, created_by, updated_by
    ) VALUES (
      v_promotion_product_id, NEW.client_id, TRUE, v_first_performance_cso_id, v_first_performance_month,
      v_prescription_amount, COALESCE(NEW.registered_by, NEW.updated_by), COALESCE(NEW.updated_by, NEW.registered_by)
    ) ON CONFLICT (promotion_product_id, hospital_id) DO UPDATE
    SET has_performance = TRUE,
        total_performance_amount = promotion_product_hospital_performance.total_performance_amount + EXCLUDED.total_performance_amount,
        first_performance_cso_id = EXCLUDED.first_performance_cso_id,
        first_performance_month = EXCLUDED.first_performance_month,
        updated_by = EXCLUDED.updated_by, updated_at = NOW();
  ELSE
    UPDATE promotion_product_hospital_performance
    SET has_performance = TRUE,
        total_performance_amount = GREATEST(COALESCE(total_performance_amount, 0) + v_amount_delta, 0),
        first_performance_cso_id = v_first_performance_cso_id,
        first_performance_month = v_first_performance_month,
        updated_by = COALESCE(NEW.updated_by, NEW.registered_by), updated_at = NOW()
    WHERE promotion_product_id = v_promotion_product_id AND hospital_id = NEW.client_id;
  END IF;

  -- 9. 연관 제품 프로모션 실적의 first_performance 동기화
  IF v_related_insurance_code IS NOT NULL AND v_first_performance_record IS NOT NULL THEN
    SELECT id, promotion_start_date INTO v_related_promotion_product_id, v_related_promotion_start_date
    FROM promotion_product_list WHERE insurance_code = v_related_insurance_code;

    IF v_related_promotion_product_id IS NOT NULL THEN
      SELECT * INTO v_related_existing
      FROM promotion_product_hospital_performance
      WHERE promotion_product_id = v_related_promotion_product_id AND hospital_id = NEW.client_id;

      IF v_related_existing IS NOT NULL THEN
        -- 최초 처방이 어느 제품에서 왔는지에 따라 시작일 결정
        IF v_first_performance_record.perf_insurance_code = v_related_insurance_code THEN
          v_first_perf_promotion_start := v_related_promotion_start_date;
        ELSE
          v_first_perf_promotion_start := v_promotion_start_date;
        END IF;

        IF v_first_perf_promotion_start IS NOT NULL AND v_first_performance_month IS NOT NULL THEN
          IF TO_DATE(v_first_performance_month || '-01', 'YYYY-MM-DD') < v_first_perf_promotion_start THEN v_related_cso_id := NULL;
          ELSE v_related_cso_id := v_first_performance_record.company_id; END IF;
        ELSE v_related_cso_id := v_first_performance_record.company_id; END IF;

        UPDATE promotion_product_hospital_performance
        SET first_performance_month = v_first_performance_month,
            first_performance_cso_id = v_related_cso_id,
            updated_at = NOW()
        WHERE promotion_product_id = v_related_promotion_product_id AND hospital_id = NEW.client_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    v_error_context := format(
      '프로모션 제품 병원 실적 업데이트 오류 - 제품ID: %s, 병원ID: %s, 업체ID: %s, 오류: %s',
      COALESCE(NEW.product_id::TEXT, 'NULL'), COALESCE(NEW.client_id::TEXT, 'NULL'),
      COALESCE(NEW.company_id::TEXT, 'NULL'), SQLERRM
    );
    RAISE WARNING '%', v_error_context;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_promotion_performance_on_insert ON performance_records;
CREATE TRIGGER trigger_update_promotion_performance_on_insert
AFTER INSERT ON performance_records
FOR EACH ROW
EXECUTE FUNCTION update_promotion_product_hospital_performance();

DROP TRIGGER IF EXISTS trigger_update_promotion_performance_on_update ON performance_records;
CREATE TRIGGER trigger_update_promotion_performance_on_update
AFTER UPDATE ON performance_records
FOR EACH ROW
WHEN (OLD.review_status IS DISTINCT FROM NEW.review_status OR
      OLD.review_action IS DISTINCT FROM NEW.review_action OR
      OLD.product_id IS DISTINCT FROM NEW.product_id OR
      OLD.client_id IS DISTINCT FROM NEW.client_id OR
      OLD.company_id IS DISTINCT FROM NEW.company_id OR
      OLD.prescription_qty IS DISTINCT FROM NEW.prescription_qty OR
      OLD.settlement_month IS DISTINCT FROM NEW.settlement_month)
EXECUTE FUNCTION update_promotion_product_hospital_performance();

COMMENT ON FUNCTION update_promotion_product_hospital_performance() IS
'performance_records INSERT/UPDATE 시 promotion_product_hospital_performance 자동 업데이트 트리거 함수
- NEWCSO 업체 그룹만 대상, review_status = ''완료''일 때만 작동
- related_insurance_code로 구↔신 제품 연계 확인
- 최초 처방이 연관 제품에서 온 경우 해당 제품의 시작일 기준으로 배정 판정';
