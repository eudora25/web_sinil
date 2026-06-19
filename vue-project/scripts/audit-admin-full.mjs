// 관리자 메뉴 + 서브화면 + 모달 전체 UI 감사 (+ 스크린샷)
// 실행: cd vue-project && node scripts/audit-admin-full.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://127.0.0.1:5173';
const EMAIL = 'test1@test.com';
const PASSWORD = 'asdf1234';
const SKIP_SCREENSHOTS = process.env.SKIP_SCREENSHOTS === '1';
const SCREENSHOT_DIR = fileURLToPath(new URL('../public/manual-images/admin', import.meta.url));

if (!SKIP_SCREENSHOTS) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function makeScreenshotSlug(entry) {
  const sec = (entry.section.match(/^(\d+)/) || ['', '0'])[1].padStart(2, '0');
  if (entry.path?.startsWith('/') && !entry.path.startsWith('modal')) {
    const route = entry.path.split('?')[0]
      .replace(/^\/admin\/?/, '')
      .replace(/\/[0-9a-f-]{36}/gi, '_id')
      .replace(/\/\d+/g, '_id')
      .replace(/\//g, '-')
      || 'root';
    return `${sec}-${route}`.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 72);
  }
  const parent = (entry.parentPath || '').replace(/^\/admin\/?/, '').replace(/\//g, '-').slice(0, 30);
  const modal = entry.name.replace(/\s+/g, '-').slice(0, 36);
  return `${sec}-modal-${parent}-${modal}`.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80);
}

/** 전체 화면·테이블·폼 로딩 오버레이가 사라질 때까지 대기 (v-if 제거까지) */
async function waitForPageReady(page, { timeout = 90000 } = {}) {
  if (await page.locator('.loading-overlay').count()) {
    await page.locator('.loading-overlay').waitFor({ state: 'detached', timeout });
  }
  await page.locator('.p-datatable-loading-overlay').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  await page.locator('.form-loading-overlay').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function waitForModalReady(page) {
  await page.waitForFunction(() => {
    const modal = document.querySelector('.p-dialog-mask:not([style*="display: none"]) .p-dialog, .modal-overlay .modal-content');
    if (!modal) return false;
    const root = modal.closest('.p-dialog') || modal.closest('.modal-overlay') || modal;
    for (const el of root.querySelectorAll('.form-loading-overlay, .loading-overlay')) {
      if (el.offsetParent !== null) return false;
    }
    return true;
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function attachScreenshot(page, result) {
  if (SKIP_SCREENSHOTS || !result.ok) return result;
  try {
    let slug = makeScreenshotSlug(result);
    let file = `${slug}.png`;
    let fullPath = path.join(SCREENSHOT_DIR, file);
    let n = 1;
    while (fs.existsSync(fullPath)) {
      file = `${slug}_${n}.png`;
      fullPath = path.join(SCREENSHOT_DIR, file);
      n += 1;
    }
    if (result.type === 'modal') {
      await waitForModalReady(page);
      const modal = page.locator('.p-dialog:visible, .modal-overlay:visible .modal-content').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modal.screenshot({ path: fullPath });
      } else {
        await page.screenshot({ path: fullPath, fullPage: false });
      }
    } else {
      await waitForPageReady(page);
      const container = page.locator('.page-container').first();
      if (await container.isVisible({ timeout: 2000 }).catch(() => false)) {
        await container.screenshot({ path: fullPath });
      } else {
        await page.screenshot({ path: fullPath, fullPage: true });
      }
    }
    result.screenshot = `/manual-images/admin/${file}`;
  } catch (e) {
    result.screenshotError = e.message;
  }
  return result;
}

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

async function scrapeUI(page) {
  return page.evaluate(() => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const title = document.querySelector('.header-title')?.innerText?.trim()
      || document.querySelector('.page-header-title-area .header-title')?.innerText?.trim()
      || document.title;

    const filters = [];
    document.querySelectorAll('.filter-card label, .filter-row label, .filter-section label').forEach((lb) => {
      const t = lb.innerText?.trim();
      if (t) filters.push(t);
    });
    document.querySelectorAll('.filter-card select, .filter-row select, .filter-section select').forEach((sel) => {
      const label = sel.previousElementSibling?.innerText?.trim()
        || sel.closest('div')?.querySelector('label')?.innerText?.trim();
      const opts = Array.from(sel.options).slice(0, 8).map((o) => o.textContent.trim()).filter(Boolean);
      if (label || opts.length) filters.push(`${label || 'select'}: [${opts.join(', ')}${sel.options.length > 8 ? '...' : ''}]`);
    });
    document.querySelectorAll('input[placeholder], .search-input').forEach((inp) => {
      if (inp.placeholder && inp.offsetParent !== null) filters.push(`검색: "${inp.placeholder}"`);
    });

    const buttons = uniq(Array.from(document.querySelectorAll('button, .btn-save, .btn-excell-download, .btn-excell-upload, a.btn-save'))
      .filter((b) => b.offsetParent !== null || b.closest('.p-dialog'))
      .map((b) => b.innerText?.trim().replace(/\s+/g, ' '))
      .filter((t) => t && t.length < 40 && !['로그아웃', '×', 'X', 'First Page', 'Previous Page', 'Next Page', 'Last Page', 'All items unselected'].includes(t)));

    const columns = uniq(Array.from(document.querySelectorAll('.p-datatable thead th, table thead th, .p-column-header-content'))
      .map((th) => th.innerText?.trim().replace(/\s+/g, ' '))
      .filter((t) => t && t.length < 40 && t !== 'All items unselected'));

    const formFields = uniq(Array.from(document.querySelectorAll('label, .field-label, .form-label'))
      .map((lb) => lb.innerText?.trim().replace(/\s+/g, ' '))
      .filter((t) => t && t.length < 50 && !t.includes('\n')));

    const dialog = document.querySelector('.p-dialog:not([style*="display: none"])')
      || document.querySelector('.p-dialog-mask:not([style*="display: none"]) .p-dialog');
    const customModal = document.querySelector('.modal-overlay:not([style*="display: none"]) .modal-content')
      || document.querySelector('.modal-overlay .modal-content');
    let modalHeader = '';
    let modalButtons = [];
    let modalColumns = [];
    let modalFields = [];
    const modalRoot = dialog || customModal;
    if (modalRoot) {
      modalHeader = modalRoot.querySelector('.p-dialog-title, .p-dialog-header, .modal-header h2, .modal-header')?.innerText?.trim().replace(/\s+/g, ' ') || '';
      modalButtons = uniq(Array.from((modalRoot.closest('.p-dialog') || modalRoot).querySelectorAll('button'))
        .map((b) => b.innerText?.trim().replace(/\s+/g, ' '))
        .filter(Boolean));
      modalColumns = uniq(Array.from(modalRoot.querySelectorAll('thead th'))
        .map((th) => th.innerText?.trim())
        .filter(Boolean));
      modalFields = uniq(Array.from(modalRoot.querySelectorAll('label, .form-group label'))
        .map((lb) => lb.innerText?.trim())
        .filter(Boolean));
    }

    const totalCount = document.querySelector('.total-count-display')?.innerText?.trim() || '';
    const emptyMsg = document.querySelector('.p-datatable-emptymessage, .p-datatable tbody td[colspan]')?.innerText?.trim() || '';
    const extra = [];
    if (document.querySelector('.registration-status-badge')) extra.push('등록기간/상태 배지');
    if (document.querySelector('.p-paginator')) extra.push('페이지네이션');
    if (document.querySelector('.breadcrumb')) extra.push('브레드크럼');

    return {
      title, filters: uniq(filters), buttons: buttons.slice(0, 25), columns: columns.slice(0, 30),
      formFields: formFields.slice(0, 30), totalCount, emptyMsg, extra,
      modalHeader, modalButtons: modalButtons.slice(0, 15), modalColumns: modalColumns.slice(0, 20),
      modalFields: modalFields.slice(0, 25),
    };
  });
}

function entry(base, overrides) {
  return { ok: true, type: 'list', ...base, ...overrides };
}

async function gotoAndScrape(page, meta) {
  await page.goto(`${BASE}${meta.path}`, { waitUntil: 'networkidle', timeout: 120000 });
  await waitForPageReady(page);
  const data = await scrapeUI(page);
  return attachScreenshot(page, entry(meta, { ...data, path: meta.path }));
}

async function clickAndScrapeModal(page, parent, triggerText, modalName, { cellClick = false, rowSelectFirst = false, skipGoto = false, setup = null } = {}) {
  if (!skipGoto) {
    await page.goto(`${BASE}${parent.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
  }
  if (setup) await modalSetup(page, setup);

  if (rowSelectFirst) {
    const cb = page.locator('.p-datatable tbody .p-checkbox-box, .p-datatable tbody input[type=checkbox]').first();
    if (await cb.isVisible({ timeout: 2000 }).catch(() => false)) await cb.click();
    await page.waitForTimeout(500);
  }

  if (cellClick) {
    const cell = page.locator('.p-datatable tbody .text-link').filter({ hasText: /^\d+$/ }).first();
    if (!(await cell.isVisible({ timeout: 3000 }).catch(() => false))) {
      return entry({ ...parent, name: modalName, type: 'modal', trigger: `${triggerText} 클릭`, parentPath: parent.path }, { ok: false, error: '클릭 대상 없음' });
    }
    await cell.click();
  } else {
    const btn = page.getByRole('button', { name: triggerText, exact: false }).first();
    if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) {
      return entry({ ...parent, name: modalName, type: 'modal', trigger: triggerText, parentPath: parent.path }, { ok: false, error: `버튼 "${triggerText}" 없음` });
    }
    if (!(await btn.isEnabled().catch(() => true))) {
      return entry({ ...parent, name: modalName, type: 'modal', trigger: triggerText, parentPath: parent.path }, { ok: false, error: `버튼 "${triggerText}" 비활성(선행 조건 필요)` });
    }
    await btn.click();
  }
  await page.waitForTimeout(1200);
  const data = await scrapeUI(page);
  const path = `modal (${data.modalHeader || modalName})`;
  const result = entry({
    section: parent.section,
    name: modalName,
    path,
    type: 'modal',
    trigger: cellClick ? `${triggerText} 클릭` : triggerText,
    parentPath: parent.path,
    parentName: parent.name,
  }, {
    ...data,
    title: data.modalHeader || modalName,
    buttons: data.modalButtons.length ? data.modalButtons : data.buttons,
    columns: data.modalColumns.length ? data.modalColumns : data.columns,
    formFields: data.modalFields.length ? data.modalFields : data.formFields,
  });
  await attachScreenshot(page, result);
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('.modal-close-btn, .p-dialog-header-close').first().click().catch(() => {});
  await page.waitForTimeout(400);
  return result;
}

async function clickTextLink(page, urlPattern, { rejectPaths = [] } = {}) {
  const link = page.locator('.p-datatable tbody a.text-link, .p-datatable tbody .text-link').first();
  if (!(await link.count())) return null;
  const before = page.url().replace(BASE, '');
  await link.click();
  await page.waitForTimeout(1200);
  if (urlPattern) {
    await page.waitForURL(urlPattern, { timeout: 8000 }).catch(() => {});
  }
  let path = page.url().replace(BASE, '');
  if (path === before || rejectPaths.some((r) => path.includes(r))) {
    await page.waitForTimeout(2000);
    path = page.url().replace(BASE, '');
  }
  if (path === before || rejectPaths.some((r) => path.includes(r))) return null;
  return path;
}

async function navToSubpage(page, parent, triggerFn, subName) {
  await page.goto(`${BASE}${parent.path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const href = await triggerFn(page);
  if (!href) {
    return entry({ section: parent.section, name: subName, type: 'subpage', parentPath: parent.path, parentName: parent.name, trigger: '(목록 링크/버튼)' }, { ok: false, error: '진입 링크 없음' });
  }
  const current = page.url().replace(BASE, '');
  if (href.startsWith('http')) {
    await page.goto(href, { waitUntil: 'networkidle', timeout: 120000 });
  } else if (current.split('?')[0] !== href.split('?')[0]) {
    await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 120000 });
  }
  await waitForPageReady(page);
  const data = await scrapeUI(page);
  const path = page.url().replace(BASE, '');
  return attachScreenshot(page, entry({
    section: parent.section,
    name: subName,
    path,
    type: 'subpage',
    parentPath: parent.path,
    parentName: parent.name,
  }, data));
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
await login(page);

const results = [];

// 1) 메인 목록 25개
for (const p of PAGES) {
  try {
    const r = await gotoAndScrape(page, { ...p, type: 'list' });
    results.push(r);
    console.log(`✅ [목록] ${p.name}`);
  } catch (e) {
    results.push({ ...p, type: 'list', ok: false, error: e.message });
    console.log(`❌ [목록] ${p.name}: ${e.message}`);
  }
}

const parent = (name) => PAGES.find((p) => p.name === name);

// 2) 서브화면 — create / detail / edit
const subpageJobs = [
  { parent: '공지사항 목록', sub: '공지사항 등록', fn: async (pg) => { await pg.getByRole('button', { name: '신규 등록' }).click(); await pg.waitForURL('**/admin/notices/create'); return pg.url().replace(BASE, ''); } },
  { parent: '공지사항 목록', sub: '공지사항 상세', fn: async (pg) => clickTextLink(pg, (u) => /\/admin\/notices\/[0-9a-f-]+/.test(u.pathname)) },
  { parent: '승인 업체', sub: '업체 등록', fn: async (pg) => { await pg.getByRole('button', { name: '업체 등록' }).click(); await pg.waitForURL('**/admin/companies/create**'); return pg.url().replace(BASE, ''); } },
  { parent: '승인 업체', sub: '업체 상세', fn: async (pg) => clickTextLink(pg, (u) => /\/admin\/companies\/[0-9a-f-]{36}/.test(u.pathname), { rejectPaths: ['/approved', '/pending', '/create'] }) },
  { parent: '제품 목록', sub: '제품 등록', fn: async (pg) => { await pg.getByRole('button', { name: '개별 등록' }).click(); await pg.waitForURL('**/admin/products/create'); return pg.url().replace(BASE, ''); } },
  { parent: '표준코드 목록', sub: '표준코드 등록', fn: async (pg) => { await pg.getByRole('button', { name: '개별 등록' }).click(); await pg.waitForURL('**/products-standard-code/create'); return pg.url().replace(BASE, ''); } },
  { parent: '표준코드 목록', sub: '표준코드 상세', fn: async (pg) => clickTextLink(pg, '**/products-standard-code/*') },
  { parent: '병의원 목록', sub: '병의원 상세', fn: async (pg) => clickTextLink(pg, '**/admin/clients/*') },
  { parent: '문전약국 목록', sub: '문전약국 상세', fn: async (pg) => clickTextLink(pg, '**/admin/pharmacies/*') },
  { parent: '도매매출 목록', sub: '도매매출 등록', fn: async (pg) => { await pg.goto(`${BASE}/admin/wholesale-revenue/create`); return '/admin/wholesale-revenue/create'; } },
  { parent: '직거래매출 목록', sub: '직거래매출 등록', fn: async (pg) => { await pg.goto(`${BASE}/admin/direct-revenue/create`); return '/admin/direct-revenue/create'; } },
  { parent: '정산월 관리', sub: '정산월 등록', fn: async (pg) => { await pg.getByRole('button', { name: '신규 등록' }).click(); await pg.waitForURL('**/settlement-months/create'); return pg.url().replace(BASE, ''); } },
  { parent: '정산월 관리', sub: '정산월 상세', fn: async (pg) => clickTextLink(pg, '**/admin/settlement-months/*') },
  { parent: '프로모션 관리', sub: '프로모션 병원 실적', fn: async (pg) => { const a = pg.locator('a[href*="/admin/products/promotion/"]').first(); if (!(await a.count())) return null; return await a.getAttribute('href'); } },
  { parent: '정산내역서 공유', sub: '정산내역서 상세', fn: async (pg) => {
    await pg.goto(`${BASE}/admin/settlement-share`);
    await pg.waitForTimeout(1200);
    const sel = pg.locator('select').first();
    if (await sel.isVisible().catch(() => false)) await sel.selectOption({ index: 1 }).catch(() => {});
    await pg.waitForTimeout(1500);
    const b = pg.getByRole('button', { name: '상세' }).first();
    if (!(await b.isVisible().catch(() => false))) return null;
    await b.click();
    await pg.waitForURL('**/settlement-share/detail**', { timeout: 8000 }).catch(() => {});
    return pg.url().replace(BASE, '');
  } },
];

for (const job of subpageJobs) {
  const p = parent(job.parent);
  if (!p) continue;
  try {
    const r = await navToSubpage(page, p, job.fn, job.sub);
    results.push(r);
    console.log(`${r.ok ? '✅' : '⚠️'} [서브] ${job.sub} → ${r.path || r.error}`);
    // 상세에서 수정 화면
    if (r.ok && job.sub.includes('상세') && !job.sub.includes('정산내역서')) {
      const editBtn = page.getByRole('button', { name: '수정' });
      if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1200);
        const editData = await scrapeUI(page);
        const editPath = page.url().replace(BASE, '');
        const editEntry = await attachScreenshot(page, entry({
          section: p.section,
          name: job.sub.replace('상세', '수정'),
          path: editPath,
          type: 'subpage',
          parentPath: r.path,
          parentName: job.sub,
          trigger: '수정',
        }, editData));
        results.push(editEntry);
        console.log(`✅ [서브] ${job.sub.replace('상세', '수정')} → ${editPath}`);
      }
    }
  } catch (e) {
    results.push({ section: p.section, name: job.sub, type: 'subpage', parentPath: p.path, ok: false, error: e.message });
    console.log(`❌ [서브] ${job.sub}: ${e.message}`);
  }
}

// 실적 등록 편집 (업체 선택 후)
try {
  const p = parent('실적 등록');
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const companyInput = page.locator('input[placeholder*="업체"]').first();
  if (await companyInput.isVisible().catch(() => false)) {
    await companyInput.click();
    await page.waitForTimeout(500);
    const opt = page.locator('.p-autocomplete-panel .p-autocomplete-item, .company-dropdown-item').first();
    if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await opt.click();
      await page.waitForTimeout(2000);
    }
  }
  const regBtn = page.getByRole('button', { name: '등록' }).first();
  if (await regBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await regBtn.click();
    await page.waitForTimeout(2000);
    const data = await scrapeUI(page);
    const perfEntry = await attachScreenshot(page, entry({
      section: p.section,
      name: '실적 입력(편집)',
      path: page.url().replace(BASE, ''),
      type: 'subpage',
      parentPath: p.path,
      parentName: p.name,
      trigger: '등록',
    }, data));
    results.push(perfEntry);
    console.log(`✅ [서브] 실적 입력(편집) → ${page.url().replace(BASE, '')}`);
  }
} catch (e) {
  console.log(`⚠️ [서브] 실적 입력: ${e.message}`);
}

// 3) 모달
const modalJobs = [
  { parent: '승인 업체', modal: '담당 병의원 목록', trigger: '병의원', cellClick: true },
  { parent: '미승인 업체', modal: '담당 병의원 목록', trigger: '병의원', cellClick: true },
  { parent: '제품 목록', modal: '월별 제품 등록', trigger: '월별 등록' },
  { parent: '병의원 목록', modal: '병의원 등록', trigger: '개별 등록' },
  { parent: '담당업체 지정', modal: '업체 지정', trigger: '추가' },
  { parent: '문전약국 지정', modal: '약국 지정', trigger: '추가' },
  { parent: '문전약국 목록', modal: '문전약국 등록', trigger: '개별 등록' },
  { parent: '도매 업체 관리', modal: '도매 업체 등록', trigger: '신규 등록' },
  { parent: '실적 등록', modal: '실적 조회', trigger: '조회', setup: 'performanceRegister' },
  { parent: '업체별 등록 현황', modal: '증빙 파일 목록', trigger: '보기', cellClick: true },
  { parent: '프로모션 관리', modal: '제외 병원 추가(전체)', trigger: '제외 병원 추가' },
  { parent: '실적 검수', modal: '검수 상태 변경', trigger: '검수 상태 변경', rowSelectFirst: true },
  { parent: '흡수율 분석', modal: '반영 흡수율 수정', trigger: '✎', setup: 'absorptionEdit' },
  { parent: '정산내역서 공유', modal: '개별 전달사항', trigger: '전달사항', setup: 'settlementShare' },
  { parent: '정산내역서 공유', modal: '구간 수수료율', trigger: '입력하기', setup: 'settlementShare' },
  { parent: '실적 상세 현황', modal: '통계 갱신 확인', trigger: '통계 갱신' },
];

async function modalSetup(page, name) {
  if (name === 'performanceRegister') {
    const companyInput = page.locator('input[placeholder*="업체"]').first();
    if (await companyInput.isVisible().catch(() => false)) {
      await companyInput.click();
      await page.waitForTimeout(400);
      const opt = page.locator('.p-autocomplete-panel .p-autocomplete-item, .company-dropdown-item').first();
      if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(2000);
      }
    }
  }
  if (name === 'settlementShare') {
    const sel = page.locator('select').first();
    if (await sel.isVisible().catch(() => false)) await sel.selectOption({ index: 1 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
  if (name === 'absorptionEdit') {
    const sel = page.locator('select').first();
    if (await sel.isVisible().catch(() => false)) await sel.selectOption({ index: 1 }).catch(() => {});
    await page.waitForTimeout(800);
    const analyze = page.getByRole('button', { name: '흡수율 분석' });
    if (await analyze.isVisible().catch(() => false)) await analyze.click().catch(() => {});
    await page.waitForTimeout(3000);
  }
}

for (const job of modalJobs) {
  const p = parent(job.parent);
  if (!p) continue;
  try {
    const r = await clickAndScrapeModal(page, p, job.trigger, job.modal, {
      cellClick: job.cellClick,
      rowSelectFirst: job.rowSelectFirst,
      setup: job.setup || null,
    });
    results.push(r);
    console.log(`${r.ok && (r.modalHeader || r.title) ? '✅' : '⚠️'} [모달] ${job.modal}`);
  } catch (e) {
    results.push({ section: p.section, name: job.modal, type: 'modal', parentPath: p.path, ok: false, error: e.message });
    console.log(`❌ [모달] ${job.modal}: ${e.message}`);
  }
}

// 프로모션 — 제외 병원 관리 (숫자 클릭)
try {
  const p = parent('프로모션 관리');
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const numLink = page.locator('.p-datatable tbody a, .p-datatable tbody .clickable-number').filter({ hasText: /^\d+$/ }).first();
  if (await numLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await numLink.click();
    await page.waitForTimeout(1200);
    const data = await scrapeUI(page);
    const promoModal = await attachScreenshot(page, entry({
      section: p.section, name: '제외 병원 관리(제품별)', path: `modal (${data.modalHeader || '제외 병원 관리'})`,
      type: 'modal', trigger: '제외 병의원 숫자 클릭', parentPath: p.path, parentName: p.name,
    }, { ...data, title: data.modalHeader || '제외 병원 관리' }));
    results.push(promoModal);
    console.log(`✅ [모달] 제외 병원 관리(제품별)`);
    await page.keyboard.press('Escape').catch(() => {});
  }
} catch (e) {
  console.log(`⚠️ [모달] 제외 병원 관리: ${e.message}`);
}

const outPath = '/tmp/admin-pages-audit-full.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
const counts = { list: 0, subpage: 0, modal: 0 };
results.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
console.log(`\n저장: ${outPath}`);
console.log(`총 ${results.length}건 — 목록 ${counts.list}, 서브 ${counts.subpage}, 모달 ${counts.modal}`);
console.log(`스크린샷 ${results.filter((r) => r.screenshot).length}장 → public/manual-images/admin/`);
await browser.close();
