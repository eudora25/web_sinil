/**
 * 음수 처방수량 E2E 검증
 * 실행: node scripts/e2e-negative-prescription-qty.mjs
 * (vue-project dev server http://127.0.0.1:5173 필요)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const EMAIL = process.env.E2E_EMAIL || 'test1@test.com'
const PASSWORD = process.env.E2E_PASSWORD || 'asdf1234'

function parseDotEnv(content) {
  const out = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

async function loadEnvFallback() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  try {
    const content = await fs.readFile(envPath, 'utf8')
    const parsed = parseDotEnv(content)
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v
    }
  } catch {
    // ignore
  }
}

function getPrescriptionMonthFromSettlement(settlementMonth) {
  const [y, m] = settlementMonth.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function selectProductOnRow(page, productName) {
  const row = page.locator('.input-table tbody tr').first()
  const productInput = row.locator('td:nth-child(4) input')
  await productInput.click()
  await page.waitForTimeout(800)
  await row.locator('.dropdown-arrow-btn').click()
  await page.waitForSelector('.product-search-dropdown li', { timeout: 20000 })
  const item = page.locator('.product-search-dropdown li').filter({ hasText: productName }).first()
  if ((await item.count()) === 0) {
    await page.locator('.product-search-dropdown li').first().click()
  } else {
    await item.click()
  }
  await page.waitForTimeout(500)
}

function parseNum(s) {
  if (s == null || s === '') return NaN
  return Number(String(s).replace(/,/g, '').trim())
}

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

await loadEnvFallback()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL)
      if (res.ok || res.status === 404) return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error(`Dev server not reachable at ${BASE_URL}`)
}

async function login(page) {
  console.log('[1/6] 로그인...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  // networkidle은 Supabase 등 지속 요청 때문에 사실상 멈춤처럼 보일 수 있음
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  console.log('[1/6] 로그인 완료')
}

async function prepareTestContext() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (authErr) throw authErr
  const isAdmin = auth.user?.user_metadata?.user_type === 'admin'

  let companyId
  let companyName = ''
  let client
  let clientId

  if (isAdmin) {
    const { data: assignment, error: assignErr } = await supabase
      .from('client_company_assignments')
      .select('company_id, client_id, companies(company_name), clients(id, name, business_registration_number, address)')
      .limit(1)
      .maybeSingle()
    if (assignErr) throw assignErr
    assert(assignment?.client_id, '테스트용 거래처 매핑 없음')
    companyId = assignment.company_id
    companyName = assignment.companies?.company_name || ''
    client = assignment.clients
    clientId = assignment.client_id
  } else {
    const uid = auth.user?.id
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', uid)
      .single()
    if (compErr) throw compErr
    companyId = company.id
    const { data: co } = await supabase.from('companies').select('company_name').eq('id', companyId).single()
    companyName = co?.company_name || ''

    const { data: assignment, error: assignErr } = await supabase
      .from('client_company_assignments')
      .select('client_id, clients(id, name, business_registration_number, address)')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle()
    if (assignErr) throw assignErr
    assert(assignment?.client_id, '테스트용 거래처 매핑 없음')
    client = assignment.clients
    clientId = assignment.client_id
  }

  const { data: months } = await supabase
    .from('settlement_months')
    .select('settlement_month')
    .order('settlement_month', { ascending: false })
    .limit(1)

  const settlementMonth = months?.[0]?.settlement_month
  assert(settlementMonth, '정산월 없음')

  const prescriptionMonth = getPrescriptionMonthFromSettlement(settlementMonth)
  const { data: product } = await supabase
    .from('products')
    .select('id, product_name, price, insurance_code, base_month')
    .gt('price', 0)
    .eq('status', 'active')
    .eq('base_month', prescriptionMonth)
    .limit(1)
    .maybeSingle()

  assert(product?.id, `${prescriptionMonth} 처방월 제품 없음`)

  return {
    companyId,
    companyName,
    client,
    clientId,
    settlementMonth,
    product,
    testRemark: `E2E_NEG_QTY_${Date.now()}`,
    isAdmin,
  }
}

async function main() {
  console.log('=== 음수 처방수량 E2E 테스트 ===\n')
  await waitForServer()
  const ctx = await prepareTestContext()
  console.log('테스트 거래처:', ctx.client.name)
  console.log('정산월:', ctx.settlementMonth)
  console.log('제품:', ctx.product.product_name, '/ 단가:', ctx.product.price)

  const price = Number(ctx.product.price)
  const cases = [
    { qty: '-5', expectedQty: -5 },
    { qty: '-3.5', expectedQty: -3.5 },
  ]

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)

  page.on('dialog', async (dialog) => {
    console.log('[dialog]', dialog.type(), dialog.message().slice(0, 80))
    await dialog.accept()
  })

  try {
    await login(page)

    const query = {
      clientId: String(ctx.clientId),
      clientName: ctx.client.name || '',
      businessRegistrationNumber: ctx.client.business_registration_number || '',
      address: ctx.client.address || '',
      settlementMonth: ctx.settlementMonth,
    }
    if (ctx.isAdmin) query.companyId = String(ctx.companyId)
    const editUrl = `${BASE_URL}/performance/register/edit?` + new URLSearchParams(query).toString()

    console.log('[2/6] 실적 등록 화면 진입...')
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('.input-table', { timeout: 15000 })
    await selectProductOnRow(page, ctx.product.product_name)

    // 1) 입력·처방액 자동계산 검증 (-5, -3.5)
    console.log('[3/6] 음수 수량·처방액 계산 검증...')
    for (const tc of cases) {
      const row = page.locator('.input-table tbody tr').first()
      const qtyInput = row.locator('td:nth-child(7) input')
      const amountCell = row.locator('td:nth-child(8) span')

      await qtyInput.click()
      await qtyInput.fill('')
      await qtyInput.pressSequentially(tc.qty, { delay: 30 })
      await qtyInput.blur()
      await page.waitForTimeout(300)

      const qtyDisplayed = await qtyInput.inputValue()
      const amountText = (await amountCell.innerText()).trim()
      const expectedAmount = tc.expectedQty * price

      console.log(`\n[입력] qty="${tc.qty}" → 필드값="${qtyDisplayed}", 처방액="${amountText}"`)
      assert(parseNum(qtyDisplayed) === tc.expectedQty, `수량 ${tc.qty} 입력 실패 (표시: ${qtyDisplayed})`)
      assert(
        parseNum(amountText) === expectedAmount,
        `처방액 불일치: 기대 ${expectedAmount}, 실제 ${amountText}`,
      )
      console.log(`  OK: qty×price = ${tc.expectedQty}×${price} = ${expectedAmount}`)
    }

    // 2) 저장 (-5, 비고로 식별)
    console.log('[4/6] 저장...')
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('.input-table', { timeout: 15000 })
    await selectProductOnRow(page, ctx.product.product_name)

    const row = page.locator('.input-table tbody tr').first()
    const qtyInput = row.locator('td:nth-child(7) input')
    const remarksInput = row.locator('td:nth-child(12) input')

    await qtyInput.fill('')
    await qtyInput.pressSequentially('-5', { delay: 30 })
    await remarksInput.fill(ctx.testRemark)

    await page.evaluate(() => {
      window.onbeforeunload = null
    })

    await page.getByRole('button', { name: '저장' }).click()
    try {
      await page.waitForURL(/\/(performance\/register|admin\/performance\/register)\/?$/, { timeout: 25000 })
    } catch {
      const toast = await page.locator('body').innerText()
      throw new Error(`저장 후 목록 이동 실패. 화면 일부: ${toast.slice(0, 500)}`)
    }
    console.log('\n[저장] 목록 화면 이동 OK')

    // DB 확인
    const { data: saved, error: saveErr } = await supabase
      .from('performance_records')
      .select('id, prescription_qty, remarks, review_status')
      .eq('company_id', ctx.companyId)
      .eq('client_id', ctx.clientId)
      .eq('settlement_month', ctx.settlementMonth)
      .eq('remarks', ctx.testRemark)
      .maybeSingle()

    if (saveErr) throw saveErr
    assert(saved, 'DB에 저장된 행 없음')
    assert(Number(saved.prescription_qty) === -5, `DB 수량 기대 -5, 실제 ${saved.prescription_qty}`)
    console.log(`[DB] prescription_qty=${saved.prescription_qty}, review_status=${saved.review_status}`)

    // 3) 등록 화면 재진입 후 음수 조회 (데이터 로드 대기)
    console.log('[5/6] 저장 후 재조회...')
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('.input-table', { timeout: 15000 })

    let foundQty = null
    for (let attempt = 0; attempt < 10; attempt++) {
      const rows = page.locator('.input-table tbody tr')
      const rowCount = await rows.count()
      for (let i = 0; i < rowCount; i++) {
        const r = rows.nth(i)
        const rem = await r.locator('td:nth-child(12) input').inputValue().catch(() => '')
        const rowText = await r.innerText().catch(() => '')
        if (rem === ctx.testRemark || rowText.includes(ctx.testRemark)) {
          foundQty = await r.locator('td:nth-child(7) input').inputValue()
          break
        }
      }
      if (foundQty == null) {
        const allQty = await page.locator('.input-table tbody tr td:nth-child(7) input').all()
        for (const inp of allQty) {
          const v = parseNum(await inp.inputValue())
          if (v === -5) {
            foundQty = String(v)
            break
          }
        }
      }
      if (foundQty != null) break
      await page.waitForTimeout(500)
    }
    assert(foundQty != null, '등록 화면에서 저장 행 미발견')
    assert(parseNum(foundQty) === -5, `재조회 수량 기대 -5, 실제 ${foundQty}`)
    console.log(`[재조회] 등록 화면 수량="${foundQty}" OK`)

    // 4) 실적검수(관리자) — 관리자 등록은 review_status=완료 → 상태 필터 필수
    if (ctx.isAdmin) {
      console.log('[6/6] 실적검수 화면 확인...')
      const reviewUrl =
        `${BASE_URL}/admin/performance/review?` +
        new URLSearchParams({
          settlementMonth: ctx.settlementMonth,
          company: String(ctx.companyId),
          status: '완료',
        }).toString()
      await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)

      if (ctx.client?.name) {
        const hospitalInput = page.locator('.hospital-search-container input')
        await hospitalInput.fill(ctx.client.name)
        await page.waitForSelector('.hospital-dropdown-item', { timeout: 8000 })
        await page
          .locator('.hospital-dropdown-item')
          .filter({ hasText: ctx.client.name })
          .first()
          .click()
        await page.waitForTimeout(1500)
      }

      let hasNegQty = false
      for (let attempt = 0; attempt < 8; attempt++) {
        const body = await page.locator('body').innerText()
        if (body.includes(ctx.testRemark) || /-5(\.0)?/.test(body)) {
          hasNegQty = true
          break
        }
        await page.waitForTimeout(500)
      }
      console.log(`[실적검수] 업체=${ctx.companyName}, 병의원=${ctx.client.name}, 상태=완료`)
      assert(hasNegQty, '실적검수 화면에서 -5 또는 테스트 비고 미확인')
      console.log('[실적검수] 음수 수량 표시 OK')
    } else {
      console.log('[6/6] 실적검수 — 일반 사용자 계정이라 생략')
    }

    // 정리: 테스트 행만 삭제 (비고 일치)
    if (saved?.id) {
      await supabase.from('performance_records').delete().eq('id', saved.id)
      console.log(`\n[정리] 테스트 레코드 id=${saved.id} 삭제`)
    }

    console.log('\n=== 전체 테스트 통과 ===')
  } finally {
    await browser.close()
    await supabase.auth.signOut()
  }
}

main().catch((err) => {
  console.error('\n=== 테스트 실패 ===')
  console.error(err.message || err)
  process.exit(1)
})
