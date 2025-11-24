import { supabase } from '@/supabase';

/**
 * 실적 저장 시 promotion_product_hospital_performance 테이블 자동 업데이트
 * @param {Object} performanceRecord - 저장된 performance_records 레코드
 * @param {Object} productInfo - 제품 정보 (insurance_code, price 등)
 * @param {Object} companyInfo - 업체 정보 (id, company_group 등)
 */
export async function updatePromotionProductHospitalPerformance(performanceRecord, productInfo, companyInfo) {
  try {
    // 1. 업체가 NEWCSO 그룹인지 확인
    if (companyInfo.company_group !== 'NEWCSO') {
      return; // NEWCSO 그룹이 아니면 처리하지 않음
    }

    // 2. 제품이 promotion_product_list에 있는지 확인 (보험코드로)
    const insuranceCode = String(productInfo.insurance_code || '');
    if (!insuranceCode) return;

    const { data: promotionProduct, error: promotionError } = await supabase
      .from('promotion_product_list')
      .select('id, promotion_start_date, promotion_end_date')
      .eq('insurance_code', insuranceCode)
      .single();

    if (promotionError || !promotionProduct) {
      // 프로모션 제품이 아니면 처리하지 않음
      return;
    }

    // 3. 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
    const settlementMonth = performanceRecord.settlement_month; // YYYY-MM 형식
    if (settlementMonth) {
      let isWithinPromotionPeriod = true;

      const settlementDate = new Date(settlementMonth + '-01'); // 정산월의 첫 날
      const lastDayOfSettlementMonth = new Date(settlementDate.getFullYear(), settlementDate.getMonth() + 1, 0); // 정산월의 마지막 날

      if (promotionProduct.promotion_start_date) {
        const startDate = new Date(promotionProduct.promotion_start_date);
        // 정산월의 첫 날이 시작일 이후 또는 같아야 함
        if (settlementDate < startDate) {
          isWithinPromotionPeriod = false;
        }
      }

      if (promotionProduct.promotion_end_date) {
        const endDate = new Date(promotionProduct.promotion_end_date);
        // 정산월의 마지막 날이 종료일 이전 또는 같아야 함
        if (lastDayOfSettlementMonth > endDate) {
          isWithinPromotionPeriod = false;
        }
      }

      if (!isWithinPromotionPeriod) {
        // 프로모션 기간이 아니면 처리하지 않음
        return;
      }
    }

    // 4. 해당 병원-제품 조합의 기존 데이터 조회
    const hospitalId = performanceRecord.client_id;
    const { data: existingData, error: existingError } = await supabase
      .from('promotion_product_hospital_performance')
      .select('*')
      .eq('promotion_product_id', promotionProduct.id)
      .eq('hospital_id', hospitalId)
      .single();

    // 5. 실적 금액 계산
    const productPrice = Number(productInfo.price) || 0;
    const prescriptionQty = Number(performanceRecord.prescription_qty) || 0;
    const prescriptionAmount = productPrice * prescriptionQty;

    // 6. 데이터 준비
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (existingError && existingError.code === 'PGRST116') {
      // 기존 데이터가 없으면 INSERT
      const { error: insertError } = await supabase
        .from('promotion_product_hospital_performance')
        .insert({
          promotion_product_id: promotionProduct.id,
          hospital_id: hospitalId,
          has_performance: true,
          first_performance_cso_id: performanceRecord.company_id,
          first_performance_month: performanceRecord.prescription_month || null,
          total_performance_amount: prescriptionAmount,
          created_by: userId,
          updated_by: userId
        });

      if (insertError) {
        console.error('프로모션 제품 병원 실적 INSERT 오류:', insertError);
      }
    } else if (existingData) {
      // 기존 데이터가 있으면 UPDATE
      // 최초 실적 CSO와 월 확인을 위해 기존 실적 데이터 조회
      const { data: existingPerformanceRecords } = await supabase
        .from('performance_records')
        .select('company_id, prescription_qty, prescription_month, created_at')
        .eq('client_id', hospitalId)
        .eq('product_id', performanceRecord.product_id)
        .neq('review_action', '삭제')
        .order('prescription_month', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);

      let firstPerformanceCSOId = existingData.first_performance_cso_id;
      let firstPerformanceMonth = existingData.first_performance_month;

      // 최초 실적 CSO와 월 찾기 (처방수량이 0보다 큰 첫 번째 CSO)
      if (existingPerformanceRecords && existingPerformanceRecords.length > 0) {
        const firstRecord = existingPerformanceRecords[0];
        if (firstRecord.prescription_qty > 0) {
          firstPerformanceCSOId = firstRecord.company_id;
          firstPerformanceMonth = firstRecord.prescription_month || null;
        } else if (!firstPerformanceMonth && firstRecord.prescription_month) {
          firstPerformanceMonth = firstRecord.prescription_month;
        }
      }

      const updateData = {
        has_performance: true,
        total_performance_amount: (existingData.total_performance_amount || 0) + prescriptionAmount,
        first_performance_cso_id: firstPerformanceCSOId,
        first_performance_month: firstPerformanceMonth,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('promotion_product_hospital_performance')
        .update(updateData)
        .eq('id', existingData.id);

      if (updateError) {
        console.error('프로모션 제품 병원 실적 UPDATE 오류:', updateError);
      }
    }
  } catch (error) {
    console.error('프로모션 제품 병원 실적 업데이트 오류:', error);
    // 에러가 발생해도 실적 저장은 계속 진행되도록 함
  }
}

