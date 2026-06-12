// 병원-문전약국 지정 화면: 삭제 시 페이지 초기화(전체 새로고침) 방지 검증
// 시나리오(net-zero): 약국 0개 병원 검색 → 약국 1개 추가 → 그 약국 삭제 → 원복
// 검증: 삭제 후 (1) 검색 필터 유지 (2) fetchClients 미호출(id 필터 없는 clients 조회 없음)
// 실행: cd vue-project && node scripts/verify-assign-pharmacy-delete-no-refresh.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const EMAIL = 'test1@test.com';
const PASSWORD = 'asdf1234';

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(30000);

// clients 테이블 GET 요청 추적 (id 필터 유무로 fetchClients vs updateClientPharmacies 구분)
const clientGets = [];
page.on('request', (req) => {
  const u = req.url();
  if (req.method() === 'GET' && u.includes('/rest/v1/clients?')) {
    clientGets.push(u.includes('id=eq.') ? 'single' : 'full');
  }
});
// confirm() 자동 수락
page.on('dialog', (d) => d.accept());

let pass = 0, fail = 0;
const check = (label, cond) => { if (cond) { console.log(`✅ ${label}`); pass++; } else { console.log(`❌ ${label}`); fail++; } };

// 로그인
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.fill('#email', EMAIL);
await page.fill('#password', PASSWORD);
await page.getByRole('button', { name: '로그인' }).click();
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });
console.log('✅ 로그인 성공:', EMAIL);

await page.goto(`${BASE}/admin/clients/assign-pharmacies`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.admin-assign-pharmacies-table .p-datatable-tbody > tr', { timeout: 25000 });
await page.waitForTimeout(1500);

// 검색 시 기본 '담당업체 지정' 필터가 회사 없는 병원을 제외하므로, '전체 병의원'으로 전환
await page.selectOption('.select_180px', 'all');
await page.waitForTimeout(800);

// 약국 0개(삭제버튼 없는) 병원 행을 찾아 병의원명 확보
const targetName = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.admin-assign-pharmacies-table .p-datatable-tbody > tr'));
  for (const tr of rows) {
    const hasDelete = tr.querySelector('.btn-delete-sm');
    const nameEl = tr.querySelector('td:nth-child(3) .text-link');
    if (!hasDelete && nameEl && nameEl.textContent.trim().length >= 2) {
      return nameEl.textContent.trim();
    }
  }
  return null;
});
if (!targetName) { console.log('❌ 약국 0개 병원을 찾지 못함'); await browser.close(); process.exit(1); }
console.log('대상 병원(약국 0개):', targetName);

// 병원 검색으로 목록 좁히기
await page.fill('.search-input', targetName);
await page.locator('.search-btn', { hasText: '검색' }).first().click();
await page.waitForTimeout(800);
const countAfterSearch = parseInt((await page.locator('.total-count-display').innerText()).replace(/[^0-9]/g, ''), 10);
console.log(`검색 후 전체 건수: ${countAfterSearch}`);
check('검색으로 목록이 좁혀짐(전체 건수 감소)', countAfterSearch >= 1 && countAfterSearch < 50);

// 첫 행의 추가 버튼 → 모달 → 약국 1개 추가
const firstRow = page.locator('.admin-assign-pharmacies-table .p-datatable-tbody > tr').first();
await firstRow.locator('.btn-add-sm').click();
await page.waitForSelector('.p-dialog .modal-assign-pharmacies-table .p-datatable-tbody > tr', { timeout: 15000 });
await page.waitForTimeout(500);
// 첫 약국 체크박스 선택
const addedPharmacyName = await page.locator('.p-dialog .modal-assign-pharmacies-table .p-datatable-tbody > tr').first()
  .locator('td:nth-child(2)').innerText();
await page.locator('.p-dialog .modal-assign-pharmacies-table .p-datatable-tbody > tr').first().locator('td').first().click();
await page.locator('.p-dialog .btn-save', { hasText: '지정' }).click();
await page.waitForTimeout(1200);
console.log('추가한 약국:', addedPharmacyName.trim());
// 모달 닫기
await page.locator('.p-dialog .btn-cancel', { hasText: '취소' }).click();
await page.waitForTimeout(500);

// 추가 후 검색 유지 확인
const searchValAfterAdd = await page.locator('.search-input').inputValue();
const deleteBtnCount = await firstRow.locator('.btn-delete-sm').count();
check('추가 후 검색어 유지', searchValAfterAdd === targetName);
check('추가로 약국 칩 1개 생성(삭제버튼 존재)', deleteBtnCount >= 1);

// === 삭제 검증 시작: 여기부터의 clients GET 요청만 본다 ===
const marker = clientGets.length;
await firstRow.locator('.btn-delete-sm').first().click();
await page.waitForTimeout(1500);

const searchValAfterDelete = await page.locator('.search-input').inputValue();
const countAfterDelete = parseInt((await page.locator('.total-count-display').innerText()).replace(/[^0-9]/g, ''), 10);
const getsAfterDelete = clientGets.slice(marker);
console.log(`삭제 후 clients GET 요청: [${getsAfterDelete.join(', ') || '없음'}]`);

check('삭제 후 검색어 유지(초기화 안 됨)', searchValAfterDelete === targetName);
check('삭제 후 목록 필터 유지(전체 건수 그대로)', countAfterDelete === countAfterSearch);
check('삭제 시 fetchClients(전체 재조회) 미호출', !getsAfterDelete.includes('full'));
check('삭제 시 해당 병원만 부분 갱신(id 단건 조회) 수행', getsAfterDelete.includes('single'));

await browser.close();
console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail > 0 ? 1 : 0);
