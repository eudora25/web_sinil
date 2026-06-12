// 로컬 개발서버에서 흡수율 분석 엑셀 실제 다운로드 → 합계행 수정일시/수정자 회색칸 검증
// 실행: cd vue-project && node scripts/verify-absorption-excel-download.mjs
import { chromium } from 'playwright';
import ExcelJS from 'exceljs';
import os from 'os';
import path from 'path';

const BASE = 'http://localhost:5173';
const EMAIL = 'test1@test.com';
const PASSWORD = 'asdf1234';

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(30000);

// 로그인
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.fill('#email', EMAIL);
await page.fill('#password', PASSWORD);
await page.getByRole('button', { name: '로그인' }).click();
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });
console.log('✅ 로그인 성공:', EMAIL);

// 흡수율 분석 화면 진입
await page.goto(`${BASE}/admin/absorption-analysis`, { waitUntil: 'domcontentloaded' });

// 정산월 옵션 로드 대기
await page.waitForFunction(() => {
  const sel = document.querySelector('select.select_month');
  return sel && sel.options.length > 0;
}, { timeout: 20000 });

// 데이터가 들어있는 월을 찾아 순회 (첫 옵션부터 테이블 행이 생길 때까지)
const months = await page.$$eval('select.select_month option', opts => opts.map(o => o.value).filter(Boolean));
console.log('정산월 옵션:', months.join(', '));

let usedMonth = null;
for (const m of months) {
  await page.selectOption('select.select_month', m);
  // 테이블 로딩 대기 (행 생성 또는 타임아웃)
  try {
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.p-datatable tbody tr');
      // 실제 데이터행 (빈 메시지 행 제외)
      return rows.length > 0 && !document.querySelector('.p-datatable-emptymessage');
    }, { timeout: 8000 });
    usedMonth = m;
    break;
  } catch { /* 다음 월 시도 */ }
}

if (!usedMonth) {
  console.log('❌ 데이터가 있는 정산월을 찾지 못했습니다.');
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(1500);
const rowCount = await page.$$eval('.p-datatable tbody tr', rs => rs.length);
console.log(`✅ 데이터 로드: ${usedMonth} (${rowCount}행)`);

// 다운로드 트리거
const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
await page.click('button.btn-excell-download');
const download = await downloadPromise;
const savePath = path.join(os.tmpdir(), `absorption-verify-${usedMonth}.xlsx`);
await download.saveAs(savePath);
console.log('✅ 엑셀 다운로드 완료:', download.suggestedFilename());
await browser.close();

// 다운로드된 엑셀 파싱 검증
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(savePath);
const ws = wb.worksheets[0];

const headerRow = ws.getRow(1);
const headers = [];
headerRow.eachCell((c, n) => { headers[n] = String(c.value || ''); });
const headerCount = headers.filter(Boolean).length;
const idxUpdatedDate = headers.indexOf('수정일시');
const idxUpdatedBy = headers.indexOf('수정자');

console.log(`\n총 행 수: ${ws.rowCount}, 헤더 컬럼 수: ${headerCount}`);
console.log(`수정일시 컬럼=${idxUpdatedDate}, 수정자 컬럼=${idxUpdatedBy}`);

// 합계행 = 마지막 행. 약가 컬럼(9)이 '합계'인지 확인
const lastRow = ws.getRow(ws.rowCount);
const priceCol = headers.indexOf('약가');
const lastRowLabel = lastRow.getCell(priceCol).value;
console.log(`마지막 행 약가셀 값: "${lastRowLabel}" (합계행 여부 확인)`);

let pass = 0, fail = 0;
const check = (label, cond) => {
  if (cond) { console.log(`✅ ${label}`); pass++; }
  else { console.log(`❌ ${label}`); fail++; }
};

check('마지막 행이 합계행', lastRowLabel === '합계');

const cellD = lastRow.getCell(idxUpdatedDate);
const cellB = lastRow.getCell(idxUpdatedBy);
const grayD = cellD.fill?.fgColor?.argb;
const grayB = cellB.fill?.fgColor?.argb;
const isGray = (v) => v === 'F0F0F0' || v === 'FFF0F0F0';

check(`합계행 수정일시 셀 회색 채움 (argb=${grayD})`, isGray(grayD));
check(`합계행 수정자 셀 회색 채움 (argb=${grayB})`, isGray(grayB));
check('합계행 수정일시 셀 테두리 존재', !!cellD.border?.bottom);
check('합계행 수정자 셀 테두리 존재', !!cellB.border?.bottom);
check('합계행 셀 수 == 헤더 컬럼 수 (밀림 없음)', lastRow.cellCount === headerCount);

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
console.log('파일:', savePath);
process.exit(fail > 0 ? 1 : 0);
