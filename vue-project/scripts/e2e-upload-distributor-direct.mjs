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

await loadEnvFallback()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (run in vue-project where .env.local exists)')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function randomDigits(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

function formatBrn10(digits10) {
  return `${digits10.slice(0, 3)}-${digits10.slice(3, 5)}-${digits10.slice(5)}`
}

async function createDirectSalesXlsx({ outPath, distributorBrn }) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('직거래매출템플릿')

  const businessDigits = randomDigits(10)
  const standardCode = randomDigits(13)

  const row = {
    총판사업자번호: distributorBrn,
    약국코드: '',
    약국명: `E2E약국-${randomDigits(4)}`,
    사업자등록번호: formatBrn10(businessDigits),
    주소: 'E2E 테스트 주소',
    표준코드: standardCode,
    제품명: 'E2E제품',
    매출액: 12345,
    매출일자: new Date().toISOString().slice(0, 10),
  }

  const headers = Object.keys(row)
  ws.addRow(headers)
  ws.addRow(Object.values(row))

  // BRN columns as text (총판사업자번호, 사업자등록번호)
  ws.getColumn(1).numFmt = '@'
  ws.getColumn(4).numFmt = '@'

  await workbook.xlsx.writeFile(outPath)
  return { row }
}

async function main() {
  // 1) pick a distributor to validate mapping
  const { data: distributor, error: distErr } = await supabase
    .from('distributors')
    .select('id, name, business_registration_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (distErr) throw distErr
  if (!distributor) throw new Error('No distributor found in table distributors')
  if (!distributor.business_registration_number) throw new Error('Distributor missing business_registration_number')

  // 2) create xlsx (absolute path)
  const tmpDir = path.resolve(process.cwd(), 'tmp')
  await fs.mkdir(tmpDir, { recursive: true })
  const xlsxPath = path.join(tmpDir, `e2e-direct-upload-${Date.now()}.xlsx`)
  await createDirectSalesXlsx({ outPath: xlsxPath, distributorBrn: distributor.business_registration_number })

  // 3) launch browser and login
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    const t = msg.type()
    if (t === 'error' || t === 'warning') {
      // eslint-disable-next-line no-console
      console.log(`[browser:${t}]`, msg.text())
    }
  })

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })

  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()

  // post-login redirect can vary; ensure we land and then go to the target page
  await page.waitForLoadState('networkidle')
  await page.goto(`${BASE_URL}/admin/direct-revenue`, { waitUntil: 'domcontentloaded' })

  // 4) upload xlsx
  await page.getByRole('button', { name: '엑셀 등록' }).click()
  await page.setInputFiles('input[type="file"]', xlsxPath)

  // 5) wait for upload to finish and table to refresh
  await page.waitForTimeout(1500)
  await page.waitForLoadState('networkidle')

  // verify distributor name appears in the table (총판 column)
  const distributorVisible = await page.getByText(distributor.name, { exact: false }).first().isVisible().catch(() => false)

  if (!distributorVisible) {
    const screenshotPath = path.join(tmpDir, `e2e-direct-fail-${Date.now()}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    throw new Error(`Distributor name not visible after upload. Saved screenshot: ${screenshotPath}`)
  }

  // eslint-disable-next-line no-console
  console.log('E2E OK:', {
    page: '/admin/direct-revenue',
    distributor: { id: distributor.id, name: distributor.name, brn: distributor.business_registration_number },
    uploadedFile: xlsxPath,
  })

  await browser.close()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('E2E FAILED:', err)
  process.exitCode = 1
})

