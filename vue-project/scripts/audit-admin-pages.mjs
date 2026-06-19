// 관리자 메뉴 전체 페이지 UI 기능 감사
// 실행: cd vue-project && node scripts/audit-admin-pages.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const EMAIL = 'test1@test.com';
const PASSWORD = 'asdf1234';

const PAGES = [
  { section: '1. 공지사항 관리', name: '공지사항 목록', path: '/admin/notices' },
  { section: '2. 업체 관리', name: '승인 업체', path: '/admin/companies/approved' },
  { section: '2. 업체 관리', name: '미승인 업체', path: '/admin/companies/pending' },
  { section: '3. 제품 관리', name: '제품 목록', path: '/admin/products' },
  { section: '3. 제품 관리', name: '표준코드 목록', path: '/admin/products-standard-code' },
  { section: '4. 병의원 관리', name: '병의원 목록', path: '/admin/clients' },
  { section: '4. 병의원 관리', name: '담당업체 지정', path: '/admin/clients/assign-companies' },
  { section: '4. 병의원 관리', name: '수수료 등급 설정', path: '/admin/clients/commission-grades' },
  { section: '4. 병의원 관리', name: '문전약국 지정', path: '/admin/clients/assign-pharmacies' },
  { section: '5. 문전약국 관리', name: '문전약국 목록', path: '/admin/pharmacies' },
  { section: '6. 매출 관리', name: '도매 업체 관리', path: '/admin/distributors' },
  { section: '6. 매출 관리', name: '도매매출 목록', path: '/admin/wholesale-revenue' },
  { section: '6. 매출 관리', name: '직거래매출 목록', path: '/admin/direct-revenue' },
  { section: '7. 실적 관리', name: '정산월 관리', path: '/admin/settlement-months' },
  { section: '7. 실적 관리', name: '실적 등록', path: '/admin/performance/register' },
  { section: '7. 실적 관리', name: '업체별 등록 현황', path: '/admin/performance/companies' },
  { section: '7. 실적 관리', name: '전체 등록 현황', path: '/admin/performance/whole' },
  { section: '7. 실적 관리', name: '실적 상세 현황', path: '/admin/performance/detail' },
  { section: '8. 정산 관리', name: '프로모션 관리', path: '/admin/products/promotion' },
  { section: '8. 정산 관리', name: '실적 검수', path: '/admin/performance/review' },
  { section: '8. 정산 관리', name: '흡수율 분석', path: '/admin/absorption-analysis' },
  { section: '8. 정산 관리', name: '정산내역서 공유', path: '/admin/settlement-share' },
  { section: '9. 실적 통계', name: '업체별 통계', path: '/admin/statistics/company' },
  { section: '9. 실적 통계', name: '병원별 통계', path: '/admin/statistics/hospital' },
  { section: '9. 실적 통계', name: '제품별 통계', path: '/admin/statistics/product' },
];

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

async function scrapePage(page) {
  return page.evaluate(() => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const title = document.querySelector('.header-title')?.innerText?.trim()
      || document.querySelector('.page-header-title-area .header-title')?.innerText?.trim()
      || document.title;

    const breadcrumb = Array.from(document.querySelectorAll('.breadcrumb span, .page-header-title-area + banner span, banner span'))
      .map((el) => el.innerText?.trim()).filter(Boolean);

    const filters = [];
    document.querySelectorAll('.filter-card label, .filter-row label').forEach((lb) => {
      const t = lb.innerText?.trim();
      if (t) filters.push(t);
    });
    document.querySelectorAll('.filter-card select, .filter-row select').forEach((sel) => {
      const label = sel.previousElementSibling?.innerText?.trim() || sel.closest('div')?.querySelector('label')?.innerText?.trim();
      const opts = Array.from(sel.options).slice(0, 8).map((o) => o.textContent.trim()).filter(Boolean);
      if (label || opts.length) filters.push(`${label || 'select'}: [${opts.join(', ')}${sel.options.length > 8 ? '...' : ''}]`);
    });
    document.querySelectorAll('.filter-card input[placeholder], .filter-row input[placeholder], .search-input').forEach((inp) => {
      if (inp.placeholder) filters.push(`검색: "${inp.placeholder}"`);
    });

    const buttons = uniq(Array.from(document.querySelectorAll('button, .btn-save, .btn-excell-download, .btn-excell-upload, a.btn-save'))
      .map((b) => b.innerText?.trim().replace(/\s+/g, ' '))
      .filter((t) => t && t.length < 30 && !['로그아웃', '×', 'X', 'First Page', 'Previous Page', 'Next Page', 'Last Page'].includes(t)));

    const columns = uniq(Array.from(document.querySelectorAll('.p-datatable thead th, table thead th, .p-column-header-content'))
      .map((th) => th.innerText?.trim().replace(/\s+/g, ' '))
      .filter((t) => t && t.length < 40 && !['', 'All items unselected'].includes(t)));

    const totalCount = document.querySelector('.total-count-display')?.innerText?.trim() || '';

    const emptyMsg = document.querySelector('.p-datatable-emptymessage, .p-datatable tbody td[colspan]')?.innerText?.trim() || '';

    const extra = [];
    if (document.querySelector('.registration-status-badge')) extra.push('등록기간/상태 배지 표시');
    if (document.querySelector('.p-dialog')) extra.push('모달 UI 존재');
    if (document.querySelector('.p-paginator')) extra.push('페이지네이션');

    return { title, breadcrumb: uniq(breadcrumb), filters: uniq(filters), buttons: buttons.slice(0, 20), columns: columns.slice(0, 30), totalCount, emptyMsg, extra };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(25000);

await page.goto(`${BASE}/login`);
await page.fill('#email', EMAIL);
await page.fill('#password', PASSWORD);
await page.getByRole('button', { name: '로그인' }).click();
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });

const results = [];
for (const p of PAGES) {
  try {
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const data = await scrapePage(page);
    results.push({ ...p, ok: true, ...data });
    console.log(`✅ ${p.name} (${p.path})`);
  } catch (e) {
    results.push({ ...p, ok: false, error: e.message });
    console.log(`❌ ${p.name}: ${e.message}`);
  }
}

const outPath = '/tmp/admin-pages-audit.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\n저장: ${outPath} (${results.length}페이지)`);
await browser.close();
