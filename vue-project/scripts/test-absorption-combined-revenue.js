/**
 * 흡수율 분석 - 합산액(반올림 도매+직거래) 로직 검증
 * node vue-project/scripts/test-absorption-combined-revenue.js
 */
function combinedRevenueDisplay(row) {
  return Math.round(row?.wholesale_revenue || 0) + Math.round(row?.direct_revenue || 0);
}

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.log('  ✗', msg);
  }
}

console.log('흡수율 분석 합산액 로직 테스트\n');

// 1) 사용자 제시 케이스: 합산액 = 도매 + 직거래 (1 차이 없음)
const case1 = { wholesale_revenue: 1606, direct_revenue: 78578 };
ok(combinedRevenueDisplay(case1) === 80184, '1606 + 78578 = 80184');

const case2 = { wholesale_revenue: 115394, direct_revenue: 1442427 };
ok(combinedRevenueDisplay(case2) === 1557821, '115394 + 1442427 = 1557821');

// 2) 소수점 반올림
ok(combinedRevenueDisplay({ wholesale_revenue: 1606.4, direct_revenue: 78577.6 }) === 80184, '소수 반올림 후 80184');
ok(combinedRevenueDisplay({ wholesale_revenue: 115393.7, direct_revenue: 1442426.4 }) === 1557820, '소수 반올림 후 1557820');

// 3) null/undefined
ok(combinedRevenueDisplay({ wholesale_revenue: 100, direct_revenue: null }) === 100, 'null은 0');
ok(combinedRevenueDisplay({}) === 0, '빈 객체는 0');

// 4) 행별 표시값 합 = 푸터 합산액
const rows = [
  { wholesale_revenue: 1606, direct_revenue: 78578 },
  { wholesale_revenue: 115394, direct_revenue: 1442427 },
];
const totalFromRows = rows.reduce(
  (sum, row) => sum + Math.round(row.wholesale_revenue || 0) + Math.round(row.direct_revenue || 0),
  0
);
ok(totalFromRows === 1638005, '행별 합계 = 80184 + 1557821 = 1638005');

console.log('\n결과:', passed, '통과,', failed, '실패');
process.exit(failed > 0 ? 1 : 0);
