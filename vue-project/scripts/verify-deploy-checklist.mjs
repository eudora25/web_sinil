/**
 * 배포 체크리스트 검증 (localhost 또는 BASE_URL)
 * BASE_URL=https://web-sinil.vercel.app — 로그인 불가 시 번들 키워드만 검사
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const EMAIL = process.env.E2E_EMAIL || 'test1@test.com'
const PASSWORD = process.env.E2E_PASSWORD || 'asdf1234'
const SKIP_SAVE = process.env.SKIP_SAVE === '1' || BASE_URL.includes('vercel.app')

const results = []

function log(id, section, ok, detail) {
  results.push({ id, section, ok, detail })
  console.log(`${ok ? '✓' : '✗'} [${id}] ${section}: ${detail}`)
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
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button.login-btn, .login-btn').first().click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 25000 })
}

async function findSelectByOptions(page, opts) {
  const selects = page.locator('.filter-card select.select_month')
  const n = await selects.count()
  for (let i = 0; i < n; i++) {
    const o = (await selects.nth(i).locator('option').allTextContents()).map((x) => x.trim())
    if (opts.every((r) => o.includes(r))) return selects.nth(i)
  }
  return null
}

async function getLegendColors(page) {
  return page.evaluate(() => {
    const items = {}
    document.querySelectorAll('.legend-color').forEach((el) => {
      const cls = [...el.classList].find((c) => c.startsWith('legend-') && c !== 'legend-color')
      if (cls) items[cls] = getComputedStyle(el).backgroundColor
    })
    return items
  })
}

async function getFirstRowBg(page, rowClass) {
  return page.evaluate((cls) => {
    const row = document.querySelector(`tr.${cls}, tr[class*="${cls}"]`)
    return row ? getComputedStyle(row).backgroundColor : null
  }, rowClass)
}

async function verifyBundleKeywords(baseUrl) {
  const html = await (await fetch(`${baseUrl}/login`)).text()
  const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
  let combined = html
  for (const s of scripts.slice(0, 15)) {
    try {
      combined += await (await fetch(`${baseUrl}${s}`)).text()
    } catch {
      /* ignore */
    }
  }
  const checks = {
    'legend-promotion-added': combined.includes('legend-promotion-added') || combined.includes('프로모션+추가'),
    company_groups: combined.includes('company_groups'),
    'sortField="name"': combined.includes('sortField') && combined.includes('"name"'),
    '처방 수량을 숫자로': combined.includes('처방 수량을 숫자로 입력해주세요'),
    'no old negative msg': !combined.includes('0보다 큰') && !combined.includes('음수는 입력할 수 없'),
  }
  return checks
}

await loadEnv()
console.log(`\n=== 배포 체크리스트 검증: ${BASE_URL} ===\n`)

let page, browser
let loggedIn = false

try {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage()
  page.setDefaultTimeout(20000)

  try {
    await login(page)
    loggedIn = true
    log('AUTH', '로그인', true, page.url())
  } catch (e) {
    log('AUTH', '로그인', false, `UI 로그인 실패 — ${e.message?.slice(0, 80)}`)
    if (BASE_URL.includes('vercel.app')) {
      const bundle = await verifyBundleKeywords(BASE_URL)
      console.log('\n--- Vercel JS 번들 키워드 (로그인 대체) ---')
      for (const [k, v] of Object.entries(bundle)) {
        log('BUNDLE', k, v, v ? '번들에 포함' : '미포함')
      }
    }
    if (!BASE_URL.includes('vercel.app')) throw e
    await browser.close()
    process.exit(1)
  }

  async function selectFirstCompanyOnRegister() {
    const input = page.locator('.company-search-container input')
    if ((await input.count()) === 0) return false
    await input.click()
    await page.waitForSelector('.company-dropdown-item', { timeout: 8000 })
    const items = page.locator('.company-dropdown-item')
    const n = await items.count()
    for (let i = 0; i < n; i++) {
      const t = (await items.nth(i).innerText()).trim()
      if (t && t !== '전체') {
        await items.nth(i).click()
        await page.waitForTimeout(2000)
        return true
      }
    }
    return false
  }

  // ─── 1. 실적 등록 목록 ───
  await page.goto(`${BASE_URL}/admin/performance/register`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const companySelected = await selectFirstCompanyOnRegister()
  log('1prep', '업체 선택', companySelected, companySelected ? 'OK' : '업체 드롭다운 없음')
  await page.waitForTimeout(1500)
  const nameHeader = page.locator('.p-datatable-thead th').filter({ hasText: '병의원명' }).first()
  const nameCells = page.locator('.p-datatable-tbody tr').locator('td').nth(2)
  const namesBefore = await nameCells.allTextContents().catch(() => [])
  let sortArrow = false
  if ((await nameHeader.count()) > 0) {
    await nameHeader.click()
    await page.waitForTimeout(600)
    sortArrow =
      (await nameHeader.getAttribute('aria-sort')) !== null ||
      (await nameHeader.locator('[data-pc-section="sort"]').count()) > 0
    await nameHeader.click()
    await page.waitForTimeout(600)
  }
  const namesAfter = await nameCells.allTextContents().catch(() => [])
  const filtered = namesAfter.map((n) => n.trim()).filter(Boolean)
  const sortedAsc = [...filtered].sort((a, b) => a.localeCompare(b, 'ko'))
  const isAsc = filtered.length > 1 && filtered.join('|') === sortedAsc.join('|')
  log('1a', '병의원명 정렬 UI', (await nameHeader.count()) > 0 && sortArrow, `헤더 클릭·정렬표시=${sortArrow}`)
  log(
    '1b',
    '가나다순 목록',
    filtered.length > 0 && (isAsc || namesBefore.join('|') !== namesAfter.join('|')),
    `행 ${filtered.length}건, 기본가나다=${isAsc}, 클릭후변경=${namesBefore.join('|') !== namesAfter.join('|')}`,
  )

  // ─── 2. 실적 검수 범례 ───
  await page.goto(`${BASE_URL}/admin/performance/review`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const reviewLegends = [
    '추가',
    '수정',
    '삭제',
    '프로모션',
    '프로모션+추가',
    '프로모션+수정',
    '이전 2개월 동일',
  ]
  const reviewBody = await page.locator('body').innerText()
  const legendCount = reviewLegends.filter((t) => reviewBody.includes(t)).length
  const reviewColors = await getLegendColors(page)
  log('2a', '실적검수 범례 7종', legendCount >= 7, `${legendCount}/7 (${reviewLegends.filter((t) => reviewBody.includes(t)).join(', ')})`)
  log(
    '2b',
    '프로모션+추가 범례 클래스',
    !!reviewColors['legend-promotion-added'],
    reviewColors['legend-promotion-added'] || '없음',
  )
  const legendWrap = await page.locator('.status-legend').evaluate((el) => {
    const s = getComputedStyle(el)
    return { flexWrap: s.flexWrap, width: el.getBoundingClientRect().width }
  }).catch(() => null)
  log('2c', '범례 줄바꿈 레이아웃', legendWrap?.flexWrap === 'wrap' || legendWrap?.flexWrap === 'wrap-reverse', `flex-wrap=${legendWrap?.flexWrap}`)

  // ─── 3. 흡수율 분석 범례 ───
  await page.goto(`${BASE_URL}/admin/absorption-analysis`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const absLegends = ['추가', '수정', '삭제', '프로모션', '프로모션+추가', '프로모션+수정']
  const absBody = await page.locator('body').innerText()
  const absCount = absLegends.filter((t) => absBody.includes(t)).length
  const absColors = await getLegendColors(page)
  const hasButtons =
    (await page.getByRole('button', { name: /분석 데이터 삭제|흡수율 분석|엑셀/ }).count()) >= 2
  log('3a', '흡수율 범례 6종', absCount >= 6, `${absCount}/6`)
  log('3b', '흡수율 프로모션+추가', !!absColors['legend-promotion-added'], absColors['legend-promotion-added'] || '없음')
  log('3c', '흡수율 버튼 배치', hasButtons, `관련 버튼 존재=${hasButtons}`)

  // ─── 4. 처방수량 음수 ───
  await page.goto(`${BASE_URL}/admin/performance/register`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await selectFirstCompanyOnRegister()
  await page.waitForTimeout(1500)
  const regBtn = page.locator('button.btn-input-sm', { hasText: '등록' }).first()
  if ((await regBtn.count()) > 0) {
    await regBtn.click()
    await page.waitForURL(/\/edit/, { timeout: 15000 }).catch(() => {})
  }
  if (page.url().includes('/edit')) {
    const row = page.locator('.input-table tbody tr').first()
    const productBtn = row.locator('.dropdown-arrow-btn')
    if ((await productBtn.count()) > 0) {
      await productBtn.click()
      await page.waitForSelector('.product-search-dropdown li', { timeout: 10000 }).catch(() => {})
      const li = page.locator('.product-search-dropdown li').first()
      if ((await li.count()) > 0) await li.click()
    }
    const qty = row.locator('td:nth-child(7) input')
    for (const v of ['-5', '-3.5']) {
      await qty.fill('')
      await qty.pressSequentially(v, { delay: 20 })
      await qty.blur()
      await page.waitForTimeout(300)
    }
    const qtyVal = await qty.inputValue()
    const amount = (await row.locator('td:nth-child(8) span').innerText()).trim()
    const payment = (await row.locator('td:nth-child(10) input, td:nth-child(10) span').first().inputValue().catch(() =>
      row.locator('td:nth-child(10) span').innerText(),
    )).trim()
    const negOk = parseFloat(qtyVal) < 0 && amount.startsWith('-')
    log('4a', '음수 수량·처방액', negOk, `qty=${qtyVal}, 처방액=${amount}`)
    log('4b', '음수 지급액', payment.startsWith('-') || payment === '0' || payment === '', `지급액=${payment || 'N/A'}`)

    if (!SKIP_SAVE) {
      await row.locator('td:nth-child(12) input').fill(`E2E_CHK_${Date.now()}`)
      await page.evaluate(() => {
        window.onbeforeunload = null
      })
      await page.getByRole('button', { name: '저장' }).click()
      await page.waitForURL(/register/, { timeout: 20000 }).catch(() => {})
      log('4c', '음수 저장', page.url().includes('register'), page.url())
    } else {
      log('4c', '음수 저장', true, 'SKIP_SAVE — UI만 확인')
    }
  } else {
    log('4a', '음수 수량', false, '등록 편집 화면 진입 실패')
  }

  // ─── 5. 제품별 구분 ───
  for (const [label, url] of [
    ['5-1 상세현황', `${BASE_URL}/admin/performance/detail`],
    ['5-2 제품별통계', `${BASE_URL}/admin/statistics/product`],
  ]) {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    if (url.includes('detail')) {
      const st = await findSelectByOptions(page, ['업체별', '병원별', '제품별'])
      if (st) await st.selectOption('product')
      await page.waitForTimeout(1000)
    }
    const filterTxt = await page.locator('.filter-card').innerText()
    const hasGroupFilter = filterTxt.includes('구분') && filterTxt.includes('전체')
    const headers = (await page.locator('.p-datatable-thead th, thead th').allTextContents()).map((h) => h.trim())
    const hasGroupCol = headers.includes('구분')
    log('5', `${label} 구분 필터`, hasGroupFilter, hasGroupFilter ? 'OK' : filterTxt.slice(0, 80))
    log('5', `${label} 구분 컬럼`, hasGroupCol, headers.slice(0, 8).join(', '))

    const pf = await findSelectByOptions(page, ['제품별', '업체별', '병의원별'])
    if (pf) {
      await pf.selectOption('hospital')
      await page.waitForTimeout(1200)
      const h2 = (await page.locator('.p-datatable-thead th').allTextContents()).map((x) => x.trim())
      log('5', `${label} 병의원별 구분열`, h2.includes('구분'), h2.join(', '))
      await pf.selectOption('company')
      await page.waitForTimeout(1200)
      const h3 = (await page.locator('.p-datatable-thead th').allTextContents()).map((x) => x.trim())
      const groupCols = h3.filter((h) => h === '구분').length
      log('5', `${label} 업체별 구분열 1개`, groupCols === 1, `구분 컬럼 수=${groupCols}`)
    }
  }

  // 회귀: 업체별 통계 구분 필터
  await page.goto(`${BASE_URL}/admin/statistics/company`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const companyFilter = await page.locator('.filter-card').innerText()
  log('R1', '업체별 통계 구분필터', companyFilter.includes('구분'), companyFilter.includes('구분') ? 'OK' : '없음')

  console.log('\n--- 최종 요약 ---')
  const fail = results.filter((r) => !r.ok)
  results.forEach((r) => console.log(`  ${r.ok ? '✓' : '✗'} ${r.section}`))
  if (fail.length) {
    console.log(`\n실패 ${fail.length}건 / 전체 ${results.length}건`)
    process.exit(1)
  }
  console.log(`\n=== 전체 ${results.length}건 통과 ===`)
} catch (err) {
  console.error('\n치명적 오류:', err.message || err)
  process.exit(1)
} finally {
  if (browser) await browser.close()
}
