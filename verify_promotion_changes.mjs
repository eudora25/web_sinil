/**
 * 프로모션 변경 검증 스크립트
 * NEWCSO 필터 제거 후, 모든 업체 그룹에 프로모션이 적용 가능한지 검증
 *
 * 검증 항목:
 * 1. 코드에서 NEWCSO 필터가 제거되었는지 (정적 검사)
 * 2. DB: 현재 프로모션 제품 목록 확인
 * 3. DB: 각 company_group별 프로모션 대상 실적 존재 여부
 * 4. DB: promotion_product_hospital_performance에 비-NEWCSO 데이터 존재 여부
 * 5. DB: 트리거 함수에서 NEWCSO 필터 존재 여부
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = 'https://selklngerzfmuvagcvvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtsbmdlcnpmbXV2YWdjdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzQ5MDUsImV4cCI6MjA2ODMxMDkwNX0.cRe78UqA-HDdVClq0qrXlOXxwNpQWLB6ycFnoHzQI4U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (detail) console.log(`     → ${detail}`);
    failed++;
  }
}

// ============================================================
// 테스트 1: 코드 정적 검사 - NEWCSO 필터 제거 확인
// ============================================================
async function testCodeChanges() {
  console.log('\n' + '='.repeat(70));
  console.log('테스트 1: 코드 정적 검사 - NEWCSO 필터 제거 확인');
  console.log('='.repeat(70));

  const basePath = resolve('.');

  // promotionProductPerformance.js
  const utilFile = readFileSync(
    resolve(basePath, 'vue-project/src/utils/promotionProductPerformance.js'),
    'utf-8'
  );
  test(
    'promotionProductPerformance.js: NEWCSO 필터 제거됨',
    !utilFile.includes("company_group !== 'NEWCSO'"),
    'company_group !== \'NEWCSO\' 가 아직 존재합니다'
  );

  // AdminPromotionProductsView.vue
  const promoView = readFileSync(
    resolve(basePath, 'vue-project/src/views/admin/AdminPromotionProductsView.vue'),
    'utf-8'
  );
  const promoNewcsoCount = (promoView.match(/company_group.*NEWCSO/g) || []).length;
  test(
    'AdminPromotionProductsView.vue: NEWCSO 필터 제거됨',
    promoNewcsoCount === 0,
    `아직 ${promoNewcsoCount}개의 NEWCSO 필터가 남아있습니다`
  );

  // AdminPerformanceReviewView.vue
  const reviewView = readFileSync(
    resolve(basePath, 'vue-project/src/views/admin/AdminPerformanceReviewView.vue'),
    'utf-8'
  );
  const reviewNewcsoCount = (reviewView.match(/\.eq\('companies\.company_group',\s*'NEWCSO'\)/g) || []).length;
  test(
    'AdminPerformanceReviewView.vue: NEWCSO eq 필터 제거됨',
    reviewNewcsoCount === 0,
    `아직 ${reviewNewcsoCount}개의 NEWCSO eq 필터가 남아있습니다`
  );

  // 새 마이그레이션 파일 존재 확인
  try {
    const migrationFile = readFileSync(
      resolve(basePath, 'vue-project/supabase/migrations/20260309000001_remove_newcso_filter_from_promotion_trigger.sql'),
      'utf-8'
    );
    test(
      '마이그레이션 파일 생성됨',
      migrationFile.length > 0
    );
    test(
      '마이그레이션: NEWCSO 필터 없음',
      !migrationFile.includes("v_company_group != 'NEWCSO'"),
      '트리거 함수에 NEWCSO 필터가 아직 남아있습니다'
    );
    test(
      '마이그레이션: company_group 변수 선언 제거됨',
      !migrationFile.includes('v_company_group VARCHAR'),
      'v_company_group 변수가 아직 선언되어 있습니다'
    );
  } catch (e) {
    test('마이그레이션 파일 생성됨', false, e.message);
  }

  // 백필 SQL 존재 확인
  try {
    const backfillFile = readFileSync(
      resolve(basePath, 'database/migrations/backfill_promotion_data_for_all_companies.sql'),
      'utf-8'
    );
    test('백필 SQL 파일 생성됨', backfillFile.length > 0);
    test(
      '백필 SQL: company_group != NEWCSO 조건 포함',
      backfillFile.includes("company_group != 'NEWCSO'"),
      '백필이 NEWCSO 이외 업체를 대상으로 하지 않습니다'
    );
  } catch (e) {
    test('백필 SQL 파일 생성됨', false, e.message);
  }
}

// ============================================================
// 테스트 2: DB - 프로모션 제품 목록 확인
// ============================================================
async function testPromotionProducts() {
  console.log('\n' + '='.repeat(70));
  console.log('테스트 2: DB - 프로모션 제품 목록 확인');
  console.log('='.repeat(70));

  const { data: products, error } = await supabase
    .from('promotion_product_list')
    .select('id, insurance_code, product_name, commission_rate, final_commission_rate, promotion_start_date, promotion_end_date')
    .order('id');

  if (error) {
    test('프로모션 제품 목록 조회', false, error.message);
    return;
  }

  test('프로모션 제품 목록 존재', products && products.length > 0, '등록된 프로모션 제품이 없습니다');

  if (products && products.length > 0) {
    console.log(`\n  프로모션 제품 ${products.length}개:`);
    for (const p of products) {
      console.log(`    - ${p.product_name} (${p.insurance_code}) | 기본: ${(p.commission_rate * 100).toFixed(1)}% → 프로모션: ${(p.final_commission_rate * 100).toFixed(1)}% | 기간: ${p.promotion_start_date || 'N/A'} ~ ${p.promotion_end_date || 'N/A'}`);
    }
  }
}

// ============================================================
// 테스트 3: DB - 업체 그룹별 프로모션 대상 실적 확인
// ============================================================
async function testCompanyGroupPerformance() {
  console.log('\n' + '='.repeat(70));
  console.log('테스트 3: DB - 업체 그룹별 프로모션 대상 실적 현황');
  console.log('='.repeat(70));

  // 프로모션 제품의 보험코드 목록
  const { data: promoProducts } = await supabase
    .from('promotion_product_list')
    .select('insurance_code');

  if (!promoProducts || promoProducts.length === 0) {
    console.log('  프로모션 제품이 없어 건너뜁니다.');
    return;
  }

  const insuranceCodes = promoProducts.map(p => p.insurance_code);

  // 각 company_group별로 프로모션 제품의 실적 수 확인
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, company_name, company_group');

  if (compError) {
    test('업체 목록 조회', false, compError.message);
    return;
  }

  // company_group별 집계
  const groupCounts = {};
  for (const c of companies) {
    const group = c.company_group || '(미지정)';
    if (!groupCounts[group]) groupCounts[group] = { total: 0, withPromoPerformance: 0 };
    groupCounts[group].total++;
  }

  // 프로모션 제품 실적이 있는 업체 확인 (company_group별)
  for (const insuranceCode of insuranceCodes) {
    const { data: records } = await supabase
      .from('performance_records')
      .select('company_id, companies!inner(company_group), products!inner(insurance_code)')
      .eq('products.insurance_code', insuranceCode)
      .eq('review_status', '완료')
      .or('review_action.is.null,review_action.neq.삭제')
      .limit(1000);

    if (records) {
      const seenCompanies = new Set();
      for (const r of records) {
        const group = r.companies?.company_group || '(미지정)';
        const key = `${group}_${r.company_id}`;
        if (!seenCompanies.has(key)) {
          seenCompanies.add(key);
          if (groupCounts[group]) groupCounts[group].withPromoPerformance++;
        }
      }
    }
  }

  console.log('\n  업체 그룹별 프로모션 대상 실적 현황:');
  console.log(`  ${'그룹'.padEnd(15)} | ${'전체 업체'.padStart(8)} | ${'프로모션 실적 있는 업체'.padStart(20)}`);
  console.log(`  ${'-'.repeat(15)}-|-${'-'.repeat(8)}-|-${'-'.repeat(20)}`);

  const nonNewcsoWithPerformance = [];
  for (const [group, counts] of Object.entries(groupCounts).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${group.padEnd(15)} | ${String(counts.total).padStart(8)} | ${String(counts.withPromoPerformance).padStart(20)}`);
    if (group !== 'NEWCSO' && counts.withPromoPerformance > 0) {
      nonNewcsoWithPerformance.push(group);
    }
  }

  test(
    'NEWCSO 외 업체에 프로모션 대상 실적 존재',
    nonNewcsoWithPerformance.length > 0,
    '비-NEWCSO 업체 중 프로모션 제품 실적이 있는 그룹이 없습니다'
  );

  if (nonNewcsoWithPerformance.length > 0) {
    console.log(`  → 프로모션 적용 대상 비-NEWCSO 그룹: ${nonNewcsoWithPerformance.join(', ')}`);
  }
}

// ============================================================
// 테스트 4: DB - promotion_product_hospital_performance 현황
// ============================================================
async function testPromotionHospitalPerformance() {
  console.log('\n' + '='.repeat(70));
  console.log('테스트 4: DB - promotion_product_hospital_performance 현황');
  console.log('='.repeat(70));

  // 현재 데이터 확인 (company_group별)
  const { data: pphRecords, error } = await supabase
    .from('promotion_product_hospital_performance')
    .select(`
      id,
      has_performance,
      first_performance_cso_id,
      total_performance_amount
    `)
    .eq('has_performance', true)
    .limit(1000);

  if (error) {
    test('promotion_product_hospital_performance 조회', false, error.message);
    return;
  }

  test(
    'promotion_product_hospital_performance 데이터 존재',
    pphRecords && pphRecords.length > 0,
    '프로모션 병원 실적 데이터가 없습니다'
  );

  if (pphRecords && pphRecords.length > 0) {
    console.log(`  → 총 ${pphRecords.length}건의 프로모션 병원 실적 데이터`);

    // CSO별 company_group 확인
    const csoIds = [...new Set(pphRecords.filter(r => r.first_performance_cso_id).map(r => r.first_performance_cso_id))];

    if (csoIds.length > 0) {
      // 배치로 조회 (50개씩)
      const groupMap = {};
      for (let i = 0; i < csoIds.length; i += 50) {
        const batch = csoIds.slice(i, i + 50);
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_group')
          .in('id', batch);

        if (companies) {
          for (const c of companies) {
            groupMap[c.id] = c.company_group || '(미지정)';
          }
        }
      }

      // company_group별 집계
      const groupCounts = {};
      for (const r of pphRecords) {
        if (r.first_performance_cso_id) {
          const group = groupMap[r.first_performance_cso_id] || '(미지정)';
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        }
      }

      console.log('\n  first_performance_cso의 company_group별 분포:');
      for (const [group, count] of Object.entries(groupCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${group.padEnd(15)}: ${count}건`);
      }

      const hasNonNewcso = Object.keys(groupCounts).some(g => g !== 'NEWCSO' && g !== '(미지정)');
      console.log(`\n  ℹ️  비-NEWCSO 업체 데이터 존재 여부: ${hasNonNewcso ? '있음 (백필 적용됨)' : '없음 (백필 미적용 - 마이그레이션 적용 후 확인 필요)'}`);
    }
  }
}

// ============================================================
// 테스트 5: DB - 트리거 함수 확인
// ============================================================
async function testTriggerFunction() {
  console.log('\n' + '='.repeat(70));
  console.log('테스트 5: DB - 트리거 함수 현재 상태 확인');
  console.log('='.repeat(70));

  // pg_proc에서 함수 정의 확인 (RPC 사용 불가 시 스킵)
  const { data, error } = await supabase.rpc('get_function_source', {
    func_name: 'update_promotion_product_hospital_performance'
  });

  if (error) {
    // RPC가 없으면 마이그레이션 파일로 대체 검증
    console.log('  ℹ️  RPC get_function_source 없음 - 마이그레이션 파일 기반으로 검증');
    console.log('  ℹ️  마이그레이션 적용 후 트리거 함수가 업데이트됩니다');
    console.log('  ℹ️  현재 DB의 트리거 함수에는 아직 NEWCSO 필터가 있을 수 있습니다 (마이그레이션 미적용)');
    return;
  }

  if (data) {
    const hasNewcsoFilter = String(data).includes('NEWCSO');
    test(
      'DB 트리거 함수: NEWCSO 필터 제거됨',
      !hasNewcsoFilter,
      '트리거 함수에 아직 NEWCSO 필터가 있습니다 (마이그레이션 적용 필요)'
    );
  }
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  console.log('🔍 프로모션 변경 검증 스크립트 시작');
  console.log('   목적: NEWCSO 필터 제거 → 모든 업체 그룹에 프로모션 적용');

  await testCodeChanges();
  await testPromotionProducts();
  await testCompanyGroupPerformance();
  await testPromotionHospitalPerformance();
  await testTriggerFunction();

  // 최종 결과
  console.log('\n' + '='.repeat(70));
  console.log(`🏁 검증 결과: ${passed}개 통과, ${failed}개 실패`);
  if (failed === 0) {
    console.log('🎉 모든 코드 변경이 올바르게 적용되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('  1. Supabase에 마이그레이션 적용: 20260309000001_remove_newcso_filter_from_promotion_trigger.sql');
    console.log('  2. 백필 SQL 실행: backfill_promotion_data_for_all_companies.sql');
    console.log('  3. 통계 재계산: SELECT calculate_statistics(\'2026-02\');');
    console.log('  4. 프론트엔드 배포');
  } else {
    console.log('⚠️  일부 항목에서 문제가 발견되었습니다. 위 결과를 확인해주세요.');
  }
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
