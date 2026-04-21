import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import ExcelJS from 'exceljs'
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

function randomDigits(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

function formatBrn10(digits10) {
  return `${digits10.slice(0, 3)}-${digits10.slice(3, 5)}-${digits10.slice(5)}`
}

async function fillWholesaleTemplate({ templatePath, outPath, distributorBrn }) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)
  const ws = workbook.worksheets[0]
  if (!ws) throw new Error('Template has no worksheet')

  const headerRow = ws.getRow(1)
  const headers = headerRow.values
    .slice(1)
    .map((v) => (v ?? '').toString().trim())

  const idx = (name) => headers.findIndex((h) => h === name) + 1 // 1-based

  const required = [
    '총판사업자번호',
    '약국코드',
    '약국명',
    '사업자등록번호',
    '주소',
    '표준코드',
    '제품명',
    '매출액',
    '매출일자',
  ]
  for (const r of required) {
    if (idx(r) <= 0) throw new Error(`Template header missing: ${r}`)
  }

  const row2 = ws.getRow(2)
  const businessDigits = randomDigits(10)
  const standardCode = randomDigits(13)
  const pharmacyName = `E2E도매약국-${randomDigits(4)}`

  row2.getCell(idx('총판사업자번호')).value = distributorBrn
  row2.getCell(idx('약국코드')).value = ''
  row2.getCell(idx('약국명')).value = pharmacyName
  row2.getCell(idx('사업자등록번호')).value = formatBrn10(businessDigits)
  row2.getCell(idx('주소')).value = 'E2E 테스트 주소'
  row2.getCell(idx('표준코드')).value = standardCode
  row2.getCell(idx('제품명')).value = 'E2E제품'
  row2.getCell(idx('매출액')).value = 23456
  row2.getCell(idx('매출일자')).value = new Date().toISOString().slice(0, 10)

  row2.commit()
  await workbook.xlsx.writeFile(outPath)
  return { pharmacyName }
}

async function main() {
  await loadEnvFallback()
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // ensure authenticated (some DBs have RLS; inserts may require auth)
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authErr) throw authErr

  // pick a distributor to validate mapping; if none exist, create one for E2E
  let { data: distributor, error: distErr } = await supabase
    .from('distributors')
    .select('id, name, business_registration_number, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (distErr) throw distErr

  if (!distributor) {
    const brnDigits = randomDigits(10)
    const brn = formatBrn10(brnDigits)
    const name = `E2E총판-${randomDigits(4)}`

    const { data: created, error: createErr } = await supabase
      .from('distributors')
      .insert({
        name,
        business_registration_number: brn,
      })
      .select('id, name, business_registration_number, created_at')
      .maybeSingle()

    if (createErr) throw createErr
    distributor = created
  }

  if (!distributor || !distributor.business_registration_number) {
    throw new Error('Distributor is unavailable or missing business_registration_number')
  }

  const tmpDir = path.resolve(process.cwd(), 'tmp')
  await fs.mkdir(tmpDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    acceptDownloads: true,
  })
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForLoadState('networkidle')

  await page.goto(`${BASE_URL}/admin/wholesale-revenue`, { waitUntil: 'domcontentloaded' })

  // download template from UI
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '엑셀 템플릿' }).click(),
  ]).then(([d]) => d)

  const templatePath = path.join(tmpDir, `template-${Date.now()}.xlsx`)
  await download.saveAs(templatePath)

  // fill template row and save
  const filledPath = path.join(tmpDir, `e2e-wholesale-upload-${Date.now()}.xlsx`)
  const { pharmacyName } = await fillWholesaleTemplate({
    templatePath,
    outPath: filledPath,
    distributorBrn: distributor.business_registration_number,
  })

  // upload filled file
  await page.getByRole('button', { name: '엑셀 등록' }).click()
  await page.setInputFiles('input[type="file"]', filledPath)

  // wait for upload to finish and table to refresh
  await page.waitForTimeout(1500)
  await page.waitForLoadState('networkidle')

  // Verify: uploaded row's distributor cell is non-empty
  const row = page.locator('tr', { hasText: pharmacyName }).first()
  await row.waitFor({ state: 'visible', timeout: 15000 })
  const cells = row.locator('td')
  const distributorCellText = (await cells.nth(1).innerText().catch(() => '')).trim()

  if (!distributorCellText) {
    const screenshotPath = path.join(tmpDir, `e2e-wholesale-fail-${Date.now()}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    throw new Error(`Distributor cell empty after upload (row: ${pharmacyName}). Saved screenshot: ${screenshotPath}`)
  }

  // Verify: distributor filter works
  // Select distributor in the filter dropdown (총판) — there are multiple .select_month, so anchor by label.
  const distributorSelect = page.locator('label:has-text("총판")').locator('..').locator('select')
  await distributorSelect.waitFor({ state: 'visible', timeout: 15000 })
  await distributorSelect.selectOption({ label: distributor.name })
  // avoid networkidle flakiness; wait until the uploaded row is visible after filtering
  await page.waitForTimeout(500)

  const filteredRowVisible = await page
    .locator('tr', { hasText: pharmacyName })
    .first()
    .isVisible({ timeout: 20000 })
    .catch(() => false)

  if (!filteredRowVisible) {
    const screenshotPath = path.join(tmpDir, `e2e-wholesale-filter-fail-${Date.now()}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    throw new Error(`Uploaded row not visible after distributor filter (row: ${pharmacyName}). Saved screenshot: ${screenshotPath}`)
  }

  // eslint-disable-next-line no-console
  console.log('E2E OK:', {
    page: '/admin/wholesale-revenue',
    distributor: { id: distributor.id, name: distributor.name, brn: distributor.business_registration_number },
    distributorCellText,
    pharmacyName,
    templateDownloadedTo: templatePath,
    uploadedFile: filledPath,
    filterVerified: true,
  })

  await browser.close()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('E2E FAILED:', err)
  process.exitCode = 1
})

