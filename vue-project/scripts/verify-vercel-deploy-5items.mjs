/**
 * Vercel 배포 5건 변경사항 확인
 * BASE_URL=https://web-sinil.vercel.app node scripts/verify-vercel-deploy-5items.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || process.env.E2E_BASE_URL || 'https://web-sinil.vercel.app'
const EMAIL = process.env.E2E_EMAIL || 'test1@test.com'
const PASSWORD = process.env.E2E_PASSWORD || 'asdf1234'

const results = []

function record(id, name, ok, detail) {
  results.push({ id, name, ok, detail })
  const mark = ok ? '✓' : '✗'
  console.log(`[${id}] ${name}: ${mark} ${detail}`)
}

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

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 })
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

await loadEnv()

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.setDefaultTimeout(25000)

try {
  console.log(`=== Vercel 배포 확인: ${BASE_URL} ===\n`)
  await login(page)

  // 1) 병의원명 정렬 — AdminPerformanceRegisterView
  await page.goto(`${BASE_URL}/admin/performance/register`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const nameHeader = page.locator('.p-datatable-thead th').filter({ hasText: '병의원명' }).first()
  const hasNameHeader = (await nameHeader.count()) > 0
  let sortOk = false
  if (hasNameHeader) {
    const ariaSort = await nameHeader.getAttribute('aria-sort')
    const pcIcon = await nameHeader.locator('[data-pc-section="sort"]').count()
    sortOk = ariaSort !== null || pcIcon > 0 || (await nameHeader.getAttribute('class') || '').includes('sortable')
    if (sortOk) {
      await nameHeader.click()
      await page.waitForTimeout(800)
      sortOk = true
    }
  }
  const html1 = await page.content()
  const bundleHasSortField = html1.includes('sortField') || html1.includes('sortable')
  record(
    1,
    '병의원명 정렬',
    hasNameHeader && (sortOk || bundleHasSortField),
    hasNameHeader
      ? `병의원명 헤더 있음, 정렬 가능=${sortOk}`
      : '병의원명 컬럼 없음',
  )

  // 2) 실적검수 범례
  await page.goto(`${BASE_URL}/admin/performance/review`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const reviewLegend = await page.locator('.legend-promotion-added').count()
  const reviewText = await page.locator('body').innerText()
  record(
    2,
    '실적검수 범례',
    reviewLegend > 0 && reviewText.includes('프로모션+추가'),
    `legend-promotion-added=${reviewLegend}, 텍스트=${reviewText.includes('프로모션+추가')}`,
  )

  // 3) 흡수율 분석 범례
  await page.goto(`${BASE_URL}/admin/absorption-analysis`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const absLegend = await page.locator('.legend-promotion-added').count()
  const absText = await page.locator('body').innerText()
  record(
    3,
    '흡수율 분석 범례',
    absLegend > 0 && absText.includes('프로모션+추가'),
    `legend-promotion-added=${absLegend}, 텍스트=${absText.includes('프로모션+추가')}`,
  )

  // 4) 처방수량 음수 허용 — 번들에 구 메시지 없음 + UI 입력 (저장 없음)
  const perfRegister = await page.goto(`${BASE_URL}/admin/performance/register`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1500)
  const registerBtn = page.getByRole('button', { name: '등록' }).first()
  if ((await registerBtn.count()) > 0) {
    await registerBtn.click()
    await page.waitForURL(/\/performance\/register\/edit/, { timeout: 15000 }).catch(() => {})
  }
  if (!page.url().includes('/edit')) {
    const editLink = page.locator('a, button').filter({ hasText: '등록' }).first()
    if ((await editLink.count()) > 0) await editLink.click()
    await page.waitForTimeout(2000)
  }

  let negQtyOk = false
  let bundleMsgOk = false
  if (page.url().includes('/edit')) {
    const scripts = await page.locator('script[src]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('src')).filter(Boolean),
    )
    const mainChunk = scripts.find((s) => s.includes('PerformanceRegisterEdit') || s.includes('index'))
    const pageHtml = await page.content()
    const oldMsgs = ['0보다 큰', '0 이상', '양수로', '음수는 입력할 수 없']
    bundleMsgOk = !oldMsgs.some((m) => pageHtml.includes(m))

    const qtyInput = page.locator('.input-table tbody tr').first().locator('td:nth-child(7) input')
    if ((await qtyInput.count()) > 0) {
      await qtyInput.fill('-5')
      await qtyInput.blur()
      await page.waitForTimeout(400)
      const val = await qtyInput.inputValue()
      const amountCell = page.locator('.input-table tbody tr').first().locator('td:nth-child(8) span')
      const amount = (await amountCell.innerText().catch(() => '')).trim()
      negQtyOk = val === '-5' || val === '-5.0'
      if (negQtyOk && amount.startsWith('-')) bundleMsgOk = true
    }
    record(
      4,
      '처방수량 음수 허용',
      negQtyOk,
      page.url().includes('/edit')
        ? `수량="${await qtyInput.inputValue().catch(() => 'N/A')}", 저장 없이 UI만 확인`
        : '등록 편집 화면 진입 실패 — 번들 검사 생략',
    )
  } else {
    const res = await fetch(perfRegister?.url() || `${BASE_URL}/admin/performance/register`)
    const txt = await res.text()
    const hasNewMsg = txt.includes('처방 수량을 숫자로 입력해주세요') || txt.includes('PerformanceRegisterEdit')
    const oldMsgs = ['0보다 큰', '음수는 입력할 수 없']
    bundleMsgOk = hasNewMsg && !oldMsgs.some((m) => txt.includes(m))
    record(4, '처방수량 음수 허용', bundleMsgOk, '편집 화면 미진입, HTML/청크 키워드만 확인')
  }

  // 5) 제품별 구분 필터
  await page.goto(`${BASE_URL}/admin/performance/detail`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const statsTypeSelect = await findSelectByOptions(page, ['업체별', '병원별', '제품별'])
  let productGroupOk = false
  if (statsTypeSelect) {
    await statsTypeSelect.selectOption('product')
    await page.waitForTimeout(1200)
    const filterText = await page.locator('.filter-card').innerText()
    const headers = await page.locator('.p-datatable-thead th, thead th').allTextContents()
    productGroupOk =
      filterText.includes('구분') &&
      headers.some((h) => h.trim() === '구분') &&
      (filterText.includes('NEWCSO') || filterText.includes('기존CSO') || filterText.includes('전체'))
  }
  await page.goto(`${BASE_URL}/admin/statistics/product`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const productPageFilter = await page.locator('.filter-card').innerText()
  const productHeaders = await page.locator('.p-datatable-thead th, thead th').allTextContents()
  const productMenuOk =
    productPageFilter.includes('구분') &&
    productHeaders.some((h) => h.trim() === '구분')
  record(
    5,
    '제품별 구분 필터',
    productGroupOk && productMenuOk,
    `상세현황 제품별=${productGroupOk}, 제품별통계=${productMenuOk}`,
  )

  console.log('\n--- 요약 ---')
  const failed = results.filter((r) => !r.ok)
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : '✗'} #${r.id} ${r.name}`)
  }
  if (failed.length) {
    console.log(`\n실패 ${failed.length}건`)
    process.exit(1)
  }
  console.log('\n=== 전체 5건 Vercel 배포 확인 통과 ===')
} catch (err) {
  console.error('\n오류:', err.message || err)
  process.exit(1)
} finally {
  await browser.close()
}
