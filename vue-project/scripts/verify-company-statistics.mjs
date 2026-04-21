/**
 * 업체별 통계 검증 스크립트
 * - 정산월 2025-12 기준으로 performance_records + applied_absorption_rates 로
 *   화면과 동일한 방식으로 지급액, 직거래매출, 도매매출, 매출액(처방액) 집계
 * - 실행: npm run verify:company-statistics (또는 node scripts/verify-company-statistics.mjs)
 * - .env.local 의 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 사용
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('.env.local not found at', envPath);
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*VITE_SUPABASE_(URL|ANON_KEY)\s*=\s*(.+)\s*$/);
    if (m) env['VITE_SUPABASE_' + m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// 사용법: node scripts/verify-company-statistics.mjs [정산월]  예: node scripts/verify-company-statistics.mjs 2025-07
// 정산월 생략 시: DB에 있는 정산월 중 가장 최근 월로 자동 조회
let SETTLEMENT_MONTH = process.argv[2];

async function fetchAvailableMonths() {
  const { data, error } = await supabase
    .from('performance_records')
    .select('settlement_month')
    .order('settlement_month', { ascending: false })
    .limit(5000);
  if (error) return [];
  const set = new Set((data || []).map((r) => r.settlement_month).filter(Boolean));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

async function fetchRecords(month) {
  const list = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('performance_records')
      .select(`
        id, company_id, prescription_qty, commission_rate, review_action,
        companies!inner(company_name, company_group),
        products(price)
      `)
      .eq('settlement_month', month)
      .range(from, from + batchSize - 1)
      .order('id', { ascending: true });
    if (error) {
      console.error('performance_records 조회 오류:', error);
      return [];
    }
    if (!data || data.length === 0) break;
    list.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return list;
}

async function fetchAbsorptionRates(recordIds) {
  const map = {};
  if (recordIds.length === 0) return map;
  const batchSize = 500;
  for (let i = 0; i < recordIds.length; i += batchSize) {
    const batch = recordIds.slice(i, i + batchSize);
    const { data } = await supabase
      .from('applied_absorption_rates')
      .select('performance_record_id, applied_absorption_rate')
      .in('performance_record_id', batch);
    (data || []).forEach((item) => {
      map[item.performance_record_id] = item.applied_absorption_rate;
    });
  }
  return map;
}

function aggregateByCompany(records, absorptionRates) {
  const map = new Map();
  for (const r of records) {
    if (r.review_action === '삭제') continue;
    const companyId = r.company_id;
    if (!companyId) continue;
    const qty = Number(r.prescription_qty) || 0;
    const price = Number(r.products?.price) || 0;
    const amount = qty * price;
    let appliedRate = 0;
    if (absorptionRates[r.id] !== null && absorptionRates[r.id] !== undefined) {
      const v = Number(absorptionRates[r.id]);
      if (!isNaN(v)) appliedRate = v;
    }
    const commissionRate = Number(r.commission_rate) || 0;
    const paymentAmount = Math.round(amount * appliedRate * commissionRate);
    const totalRevenue = amount; // 매핑에서 total_revenue = amount
    const wholesaleRevenue = 0;
    const directRevenue = 0;

    if (!map.has(companyId)) {
      map.set(companyId, {
        company_id: companyId,
        company_name: r.companies?.company_name || '',
        company_group: r.companies?.company_group || '',
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        total_revenue: 0,
        wholesale_revenue: 0,
        direct_revenue: 0,
      });
    }
    const item = map.get(companyId);
    item.prescription_qty += qty;
    item.prescription_amount += amount;
    item.payment_amount += paymentAmount;
    item.total_revenue += totalRevenue;
    item.wholesale_revenue += wholesaleRevenue;
    item.direct_revenue += directRevenue;
  }
  return Array.from(map.values());
}

function formatNum(n) {
  return typeof n === 'number' && !isNaN(n) ? Math.round(n).toLocaleString('ko-KR') : '0';
}

async function main() {
  if (!SETTLEMENT_MONTH) {
    const months = await fetchAvailableMonths();
    SETTLEMENT_MONTH = months[0] || '2025-12';
    console.log('정산월 미지정 → DB 기준 최근 정산월 사용:', SETTLEMENT_MONTH);
    if (months.length > 0) {
      console.log('사용 가능 정산월:', months.join(', '));
    }
    console.log('');
  }
  console.log('정산월:', SETTLEMENT_MONTH);
  console.log('데이터 소스: performance_records (삭제 제외) + applied_absorption_rates');
  console.log('');

  const rawRecords = await fetchRecords(SETTLEMENT_MONTH);
  const filtered = rawRecords.filter((r) => r.review_action !== '삭제');
  const recordIds = filtered.map((r) => r.id);
  const absorptionRates = await fetchAbsorptionRates(recordIds);

  const aggregated = aggregateByCompany(filtered, absorptionRates);

  if (aggregated.length === 0) {
    console.log(`(${SETTLEMENT_MONTH} 정산월 performance_records가 없거나 모두 삭제 처리되어 집계 결과가 없습니다.)`);
    console.log('');
  }

  let totalPayment = 0;
  let totalPrescriptionAmount = 0;
  let totalWholesale = 0;
  let totalDirect = 0;
  aggregated.forEach((c) => {
    totalPayment += c.payment_amount;
    totalPrescriptionAmount += c.prescription_amount;
    totalWholesale += c.wholesale_revenue;
    totalDirect += c.direct_revenue;
  });

  console.log('=== 업체별 합계 (전체) ===');
  console.log(
    '업체명\t구분\t처방수량\t처방액(매출액)\t지급액\t직거래매출\t도매매출'
  );
  aggregated.forEach((c) => {
    console.log(
      [c.company_name, c.company_group || '', c.prescription_qty, formatNum(c.prescription_amount), formatNum(c.payment_amount), formatNum(c.direct_revenue), formatNum(c.wholesale_revenue)].join('\t')
    );
  });

  console.log('');
  console.log('=== 전체 합계 (화면과 비교할 값) ===');
  console.log('지급액(합계):     ', formatNum(totalPayment));
  console.log('직거래매출(합계): ', formatNum(totalDirect));
  console.log('도매매출(합계):   ', formatNum(totalWholesale));
  console.log('매출액(처방액 합계):', formatNum(totalPrescriptionAmount));
  console.log('');
  console.log('※ 직거래/도매매출은 performance_records 테이블에 컬럼이 없어 0으로 집계됩니다.');
  console.log(`→ http://localhost:5173/admin/statistics/company 에서 정산월 ${SETTLEMENT_MONTH} 선택 후 테이블과 비교하세요.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
