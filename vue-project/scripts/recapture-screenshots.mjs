// 특정 화면 스크린샷 재캡처 (로딩 대기 적용)
// 실행: node scripts/recapture-screenshots.mjs [slug-prefix]
//       node scripts/recapture-screenshots.mjs --list-only
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://127.0.0.1:5173';
const EMAIL = 'test1@test.com';
const PASSWORD = 'asdf1234';
const AUDIT_PATH = '/tmp/admin-pages-audit-full.json';
const SCREENSHOT_DIR = fileURLToPath(new URL('../public/manual-images/admin', import.meta.url));

const args = process.argv.slice(2);
const listOnly = args.includes('--list-only');
const filterPrefix = args.find((a) => a !== '--list-only') || '';

function makeSlug(entry) {
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
  return '';
}

function screenshotPath(entry) {
  const file = entry.screenshot?.split('/').pop();
  return file ? path.join(SCREENSHOT_DIR, file) : null;
}

async function waitForPageReady(page, { timeout = 90000 } = {}) {
  if (await page.locator('.loading-overlay').count()) {
    await page.locator('.loading-overlay').waitFor({ state: 'detached', timeout });
  }
  await page.locator('.p-datatable-loading-overlay').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
const targets = audit.filter((e) => e.ok && e.screenshot && e.type !== 'modal'
  && (!listOnly || e.type === 'list')
  && (!filterPrefix || e.screenshot.includes(filterPrefix) || makeSlug(e).startsWith(filterPrefix)));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.fill('#email', EMAIL);
await page.fill('#password', PASSWORD);
await page.getByRole('button', { name: '로그인' }).click();
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });

console.log(`재캡처 대상: ${targets.length}건${filterPrefix ? ` (filter: ${filterPrefix})` : ''}${listOnly ? ' [목록만]' : ''}`);

for (const entry of targets) {
  const out = screenshotPath(entry);
  if (!out) continue;
  try {
    await page.goto(`${BASE}${entry.path}`, { waitUntil: 'networkidle', timeout: 120000 });
    await waitForPageReady(page);
    const container = page.locator('.page-container').first();
    if (await container.isVisible({ timeout: 3000 }).catch(() => false)) {
      await container.screenshot({ path: out });
    } else {
      await page.screenshot({ path: out, fullPage: true });
    }
    const hasLoading = await page.locator('.loading-overlay, .loading-text').count();
    console.log(`${hasLoading ? '⚠️' : '✅'} ${entry.name} → ${path.basename(out)}`);
  } catch (e) {
    console.log(`❌ ${entry.name}: ${e.message}`);
  }
}

await browser.close();
