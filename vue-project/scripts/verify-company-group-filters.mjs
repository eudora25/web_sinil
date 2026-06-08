/**
 * 실적 상세현황(제품별) / 제품별 통계 — 업체 구분 필터·컬럼 확인
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const EMAIL = process.env.E2E_EMAIL || 'test1@test.com'
const PASSWORD = process.env.E2E_PASSWORD || 'asdf1234'

async function loadEnv() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const k = t.slice(0, eq).trim()
      let v = t.slice(eq + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (process.env[k] === undefined) process.env[k] = v
    }
  } catch {
    /* ignore */
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
}

async function waitForTable(page) {
  await page.waitForSelector('.p-datatable, .custom-table, table', { timeout: 20000 })
  await page.waitForTimeout(1500)
}

async function findSelectByOptions(page, requiredOptions) {
  const selects = page.locator('.filter-card select.select_month')
  const n = await selects.count()
  for (let i = 0; i < n; i++) {
    const opts = (await selects.nth(i).locator('option').allTextContents()).map((o) => o.trim())
    if (requiredOptions.every((r) => opts.includes(r))) return selects.nth(i)
  }
  return null
}

async function checkCompanyGroupFilter(page, contextLabel) {
  const filterRow = page.locator('.filter-card')
  const groupLabel = filterRow.locator('label', { hasText: '구분' })
  const groupSelect = filterRow.locator('select.select_month').filter({
    has: page.locator('option', { hasText: '전체' }),
  })

  const hasLabel = (await groupLabel.count()) > 0
  const selects = filterRow.locator('select.select_month')
  let hasGroupSelect = false
  const n = await selects.count()
  for (let i = 0; i < n; i++) {
    const opts = await selects.nth(i).locator('option').allTextContents()
    if (opts.some((o) => o.trim() === '전체') && opts.length > 1) {
      hasGroupSelect = true
      break
    }
  }

  console.log(`  [${contextLabel}] 구분 라벨: ${hasLabel ? 'OK' : '없음'}`)
  console.log(`  [${contextLabel}] 구분 셀렉트(전체+옵션): ${hasGroupSelect ? 'OK' : '없음'}`)
  assert(hasLabel, `${contextLabel}: 구분 필터 라벨 없음`)
  assert(hasGroupSelect, `${contextLabel}: 구분 셀렉트 없음`)
}

async function checkTableHasGroupColumn(page, contextLabel) {
  const headers = await page.locator('.p-datatable-thead th, thead th').allTextContents()
  const hasGroupCol = headers.some((h) => h.trim() === '구분')
  console.log(`  [${contextLabel}] 테이블 '구분' 컬럼: ${hasGroupCol ? 'OK' : '없음'} (헤더: ${headers.map((h) => h.trim()).filter(Boolean).slice(0, 8).join(', ')}...)`)
  assert(hasGroupCol, `${contextLabel}: 테이블에 구분 컬럼 없음`)
}

await loadEnv()

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.setDefaultTimeout(15000)

try {
  console.log('=== 업체 구분(구분) 필터/컬럼 localhost 확인 ===\n')
  await login(page)

  // 1) 실적 상세현황 → 통계 타입 제품별
  console.log('[1] 실적 상세현황 → 제품별')
  await page.goto(`${BASE_URL}/admin/performance/detail`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)

  const statsTypeSelect = await findSelectByOptions(page, ['업체별', '병원별', '제품별'])
  assert(statsTypeSelect, '통계 타입 셀렉트 없음 (실적 상세현황)')
  await statsTypeSelect.selectOption('product')
  await page.waitForTimeout(1200)

  await checkCompanyGroupFilter(page, '실적상세-제품별')
  await waitForTable(page)
  await checkTableHasGroupColumn(page, '실적상세-제품별(제품별 통계)')

  // 통계 하위: 업체별
  const productStatsFilter = await findSelectByOptions(page, ['제품별', '업체별', '병의원별'])
  if (productStatsFilter) {
    await productStatsFilter.selectOption('company')
    await page.waitForTimeout(1200)
    await checkTableHasGroupColumn(page, '실적상세-제품별(업체별 통계)')
  }

  // 2) 제품별 통계 전용 메뉴
  console.log('\n[2] 제품별 통계 메뉴')
  await page.goto(`${BASE_URL}/admin/statistics/product`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)

  const title = await page.locator('.header-title').innerText()
  console.log(`  페이지 제목: ${title}`)
  assert(title.includes('제품별 통계'), `제목 불일치: ${title}`)

  await checkCompanyGroupFilter(page, '제품별통계')
  await waitForTable(page)
  await checkTableHasGroupColumn(page, '제품별통계(제품별)')

  const statsFilter2 = await findSelectByOptions(page, ['제품별', '업체별', '병의원별'])
  if (statsFilter2) {
    await statsFilter2.selectOption('company')
    await page.waitForTimeout(1200)
    await checkTableHasGroupColumn(page, '제품별통계(업체별)')
  }

  console.log('\n=== 확인 완료: 업체 구분 필터·컬럼 정상 ===')
} catch (err) {
  console.error('\n=== 확인 실패 ===')
  console.error(err.message || err)
  process.exit(1)
} finally {
  await browser.close()
}
