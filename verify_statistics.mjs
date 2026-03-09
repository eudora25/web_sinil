/**
 * 통계 검증 스크립트
 * performance_statistics 테이블에서 각 탭/필터별 집계가 일관되는지 확인
 *
 * 검증: 모든 경로(업체별/병원별/제품별 + 서브필터)에서 동일한 합계가 나오는지
 * → 동일 원천(performance_statistics)에서 GROUP BY 키만 다르게 집계하므로
 *   처방수량/처방액/매출액 합계가 모두 동일해야 함
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://selklngerzfmuvagcvvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbGtsbmdlcnpmbXV2YWdjdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzQ5MDUsImV4cCI6MjA2ODMxMDkwNX0.cRe78UqA-HDdVClq0qrXlOXxwNpQWLB6ycFnoHzQI4U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let SETTLEMENT_MONTH = null;

function fmt(n) {
  if (n == null) return 'N/A';
  return Number(n).toLocaleString('ko-KR');
}

function pct(n) {
  return (Number(n) * 100).toFixed(1) + '%';
}

function combinedRevenue(row) {
  const wholesale = Number(row.wholesale_revenue) || 0;
  const direct = Number(row.direct_revenue) || 0;
  const sum = wholesale + direct;
  if (sum > 0) return Math.round(sum);
  return Number(row.total_revenue) || 0;
}

async function fetchAllStats() {
  let all = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('performance_statistics')
      .select('*')
      .eq('settlement_month', SETTLEMENT_MONTH)
      .range(from, from + batchSize - 1)
      .order('id', { ascending: true });
    if (error) { console.error('조회 오류:', error.message); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

// 각 집계 경로를 Vue 코드와 동일한 로직으로 실행
function aggregateCompanyAll(statsRows) {
  const map = new Map();
  statsRows.forEach(item => {
    const companyId = item.company_id;
    if (!map.has(companyId)) {
      map.set(companyId, {
        company_id: companyId,
        company_name: item.company_name,
        company_group: item.company_group,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(companyId);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function aggregateCompanyHospital(statsRows) {
  const map = new Map();
  statsRows.forEach(item => {
    const key = `${item.company_id}_${item.client_id}`;
    if (!map.has(key)) {
      map.set(key, {
        company_id: item.company_id,
        company_name: item.company_name,
        hospital_id: item.client_id,
        hospital_name: item.hospital_name,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(key);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function aggregateCompanyProduct(statsRows) {
  const map = new Map();
  statsRows.forEach(item => {
    const key = `${item.company_id}_${item.product_id}`;
    if (!map.has(key)) {
      map.set(key, {
        company_id: item.company_id,
        company_name: item.company_name,
        product_id: item.product_id,
        product_name: item.product_name,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(key);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function aggregateHospitalAll(statsRows) {
  const map = new Map();
  statsRows.forEach(item => {
    const clientId = item.client_id;
    if (!map.has(clientId)) {
      map.set(clientId, {
        client_id: clientId,
        hospital_name: item.hospital_name,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(clientId);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function aggregateProductAll(statsRows) {
  const map = new Map();
  statsRows.forEach(item => {
    const productId = item.product_id;
    if (!map.has(productId)) {
      map.set(productId, {
        product_id: productId,
        product_name: item.product_name,
        insurance_code: item.insurance_code,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(productId);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function aggregateProductCompanyDrilldown(statsRows) {
  // product_id별 → company_id별 집계
  const map = new Map();
  statsRows.forEach(item => {
    const key = `${item.product_id}_${item.company_id}`;
    if (!map.has(key)) {
      map.set(key, {
        product_id: item.product_id,
        product_name: item.product_name,
        company_id: item.company_id,
        company_name: item.company_name,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        computed_revenue: 0,
      });
    }
    const c = map.get(key);
    c.prescription_qty += Number(item.prescription_qty) || 0;
    c.prescription_amount += Number(item.prescription_amount) || 0;
    c.payment_amount += Number(item.payment_amount) || 0;
    c.computed_revenue += combinedRevenue(item);
  });
  return Array.from(map.values()).map(c => {
    const absorptionRate = c.prescription_amount > 0 ? c.computed_revenue / c.prescription_amount : 0;
    return { ...c, total_revenue: c.computed_revenue, absorption_rate: absorptionRate };
  });
}

function calcTotals(rows) {
  let qty = 0, amount = 0, revenue = 0, payment = 0;
  rows.forEach(r => {
    qty += Number(r.prescription_qty) || 0;
    amount += Number(r.prescription_amount) || 0;
    revenue += Number(r.total_revenue) || 0;
    payment += Number(r.payment_amount) || 0;
  });
  const absorptionRate = amount > 0 ? revenue / amount : 0;
  return { qty, amount, revenue, payment, absorptionRate };
}

async function main() {
  console.log('🔍 통계 검증 스크립트 시작\n');

  // 최신 정산월
  const { data: latestMonth } = await supabase
    .from('performance_statistics')
    .select('settlement_month')
    .order('settlement_month', { ascending: false })
    .limit(1);

  if (!latestMonth || latestMonth.length === 0) {
    console.error('❌ performance_statistics 테이블에 데이터 없음');
    process.exit(1);
  }
  SETTLEMENT_MONTH = latestMonth[0].settlement_month;
  console.log(`📅 정산월: ${SETTLEMENT_MONTH}`);

  const statsRows = await fetchAllStats();
  console.log(`📊 performance_statistics: ${statsRows.length}건\n`);

  // 원본 레코드 합계 (performance_statistics 레벨)
  const rawTotals = calcTotals(statsRows.map(r => ({
    prescription_qty: r.prescription_qty,
    prescription_amount: r.prescription_amount,
    total_revenue: combinedRevenue(r),
    payment_amount: r.payment_amount
  })));

  console.log('='.repeat(80));
  console.log('📋 원본 데이터 (performance_statistics 레코드 단순 합계)');
  console.log('='.repeat(80));
  console.log(`  처방수량:  ${fmt(rawTotals.qty)}`);
  console.log(`  처방액:    ${fmt(rawTotals.amount)}`);
  console.log(`  매출액:    ${fmt(rawTotals.revenue)}`);
  console.log(`  지급액:    ${fmt(rawTotals.payment)}`);
  console.log(`  흡수율:    ${pct(rawTotals.absorptionRate)}`);

  // 각 집계 경로 실행
  const paths = [
    { name: '업체별 (전체)', fn: aggregateCompanyAll },
    { name: '업체별 (병의원별)', fn: aggregateCompanyHospital },
    { name: '업체별 (제품별)', fn: aggregateCompanyProduct },
    { name: '병원별 (전체)', fn: aggregateHospitalAll },
    { name: '제품별 (전체)', fn: aggregateProductAll },
    { name: '제품별→업체별 드릴다운', fn: aggregateProductCompanyDrilldown },
  ];

  console.log('\n' + '='.repeat(80));
  console.log('📊 각 탭/필터별 합계 비교 (모두 동일해야 함)');
  console.log('='.repeat(80));
  console.log('');
  console.log(`  ${'경로'.padEnd(28)} | ${'행수'.padStart(6)} | ${'처방수량'.padStart(14)} | ${'처방액'.padStart(20)} | ${'매출액'.padStart(20)} | ${'흡수율'.padStart(8)}`);
  console.log(`  ${'-'.repeat(28)}-|-${'-'.repeat(6)}-|-${'-'.repeat(14)}-|-${'-'.repeat(20)}-|-${'-'.repeat(20)}-|-${'-'.repeat(8)}`);

  const reference = rawTotals;
  let allConsistent = true;

  for (const p of paths) {
    const rows = p.fn(statsRows);
    const t = calcTotals(rows);

    const qtyMatch = t.qty === reference.qty;
    const amtMatch = Math.abs(t.amount - reference.amount) < 1;
    const revMatch = Math.abs(t.revenue - reference.revenue) < 1;
    const rateMatch = Math.abs(t.absorptionRate - reference.absorptionRate) < 0.0001;

    const isOk = qtyMatch && amtMatch && revMatch && rateMatch;
    if (!isOk) allConsistent = false;

    const status = isOk ? '✅' : '❌';
    console.log(`  ${status} ${p.name.padEnd(26)} | ${String(rows.length).padStart(6)} | ${fmt(t.qty).padStart(14)} | ${fmt(t.amount).padStart(20)} | ${fmt(t.revenue).padStart(20)} | ${pct(t.absorptionRate).padStart(8)}`);

    if (!isOk) {
      if (!qtyMatch) console.log(`     ↳ 처방수량 차이: ${t.qty - reference.qty}`);
      if (!amtMatch) console.log(`     ↳ 처방액 차이: ${(t.amount - reference.amount).toFixed(0)}`);
      if (!revMatch) console.log(`     ↳ 매출액 차이: ${(t.revenue - reference.revenue).toFixed(0)}`);
      if (!rateMatch) console.log(`     ↳ 흡수율 차이: ${((t.absorptionRate - reference.absorptionRate) * 100).toFixed(4)}%p`);
    }
  }

  // 개별 행 레벨 spot check: 상위 5개 업체 상세 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 업체별 (전체) 상위 5개 업체 상세');
  console.log('='.repeat(80));
  const companyRows = aggregateCompanyAll(statsRows)
    .sort((a, b) => b.prescription_amount - a.prescription_amount)
    .slice(0, 5);

  for (const c of companyRows) {
    console.log(`  ${(c.company_name || c.company_id).padEnd(20)} | 구분: ${(c.company_group || '-').padEnd(6)} | 수량: ${fmt(c.prescription_qty).padStart(10)} | 처방액: ${fmt(c.prescription_amount).padStart(16)} | 매출액: ${fmt(c.total_revenue).padStart(16)} | 지급액: ${fmt(c.payment_amount).padStart(16)} | 흡수율: ${pct(c.absorption_rate)}`);
  }

  // 병원별 상위 5개
  console.log('\n' + '='.repeat(80));
  console.log('📊 병원별 (전체) 상위 5개 병원 상세');
  console.log('='.repeat(80));
  const hospitalRows = aggregateHospitalAll(statsRows)
    .sort((a, b) => b.prescription_amount - a.prescription_amount)
    .slice(0, 5);

  for (const h of hospitalRows) {
    console.log(`  ${(h.hospital_name || h.client_id).padEnd(20)} | 수량: ${fmt(h.prescription_qty).padStart(10)} | 처방액: ${fmt(h.prescription_amount).padStart(16)} | 매출액: ${fmt(h.total_revenue).padStart(16)} | 흡수율: ${pct(h.absorption_rate)}`);
  }

  // 제품별 상위 5개
  console.log('\n' + '='.repeat(80));
  console.log('📊 제품별 (전체) 상위 5개 제품 상세');
  console.log('='.repeat(80));
  const productRows = aggregateProductAll(statsRows)
    .sort((a, b) => b.prescription_amount - a.prescription_amount)
    .slice(0, 5);

  for (const p of productRows) {
    console.log(`  ${(p.product_name || p.product_id).substring(0, 30).padEnd(30)} | 보험코드: ${(p.insurance_code || '-').padEnd(12)} | 수량: ${fmt(p.prescription_qty).padStart(10)} | 처방액: ${fmt(p.prescription_amount).padStart(16)} | 매출액: ${fmt(p.total_revenue).padStart(16)} | 흡수율: ${pct(p.absorption_rate)}`);
  }

  // 구분(company_group)별 통계 - UI의 필터와 동일
  console.log('\n' + '='.repeat(80));
  console.log('📊 구분(company_group)별 합계');
  console.log('='.repeat(80));
  const groupMap = new Map();
  statsRows.forEach(r => {
    const g = r.company_group || '(미지정)';
    if (!groupMap.has(g)) groupMap.set(g, { qty: 0, amount: 0, revenue: 0, payment: 0 });
    const agg = groupMap.get(g);
    agg.qty += Number(r.prescription_qty) || 0;
    agg.amount += Number(r.prescription_amount) || 0;
    agg.revenue += combinedRevenue(r);
    agg.payment += Number(r.payment_amount) || 0;
  });
  for (const [g, t] of groupMap) {
    const rate = t.amount > 0 ? t.revenue / t.amount : 0;
    console.log(`  ${g.padEnd(12)} | 수량: ${fmt(t.qty).padStart(10)} | 처방액: ${fmt(t.amount).padStart(16)} | 매출액: ${fmt(t.revenue).padStart(16)} | 지급액: ${fmt(t.payment).padStart(16)} | 흡수율: ${pct(rate)}`);
  }

  // 최종 결과
  console.log('\n' + '='.repeat(80));
  if (allConsistent) {
    console.log('🎉 모든 탭/필터에서 합계가 일관됩니다!');
    console.log(`   전체 흡수율: ${pct(reference.absorptionRate)}`);
  } else {
    console.log('⚠️  일부 경로에서 합계 불일치가 발견되었습니다.');
  }
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
