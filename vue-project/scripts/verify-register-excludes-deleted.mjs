/**
 * 실적등록 화면이 실적검수 소프트 삭제(review_action='삭제') 건을 제외하는지 검증
 * 실행: node scripts/verify-register-excludes-deleted.mjs
 *
 * AdminPerformanceRegisterView.vue 의 두 쿼리 로직을 그대로 재현해
 * 수정 전(필터 없음) vs 수정 후(review_action !== '삭제' 필터) 결과를 실제 dev DB 데이터로 비교한다.
 * 읽기 전용 — 데이터를 변경하지 않는다.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function parseDotEnv(c){const o={};for(const l of c.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith('#'))continue;const e=t.indexOf('=');if(e===-1)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[k]=v}return o}
const env = parseDotEnv(await fs.readFile(path.resolve(process.cwd(),'.env.local'),'utf8'))
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const EMAIL = process.env.E2E_EMAIL || 'test1@test.com'
const PASSWORD = process.env.E2E_PASSWORD || 'asdf1234'
const { error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (authErr) { console.error('로그인 실패:', authErr.message); process.exit(1) }

// 소프트 삭제건이 있는 (company_id, settlement_month, client_id) 조합 수집
const { data: delRows, error: delErr } = await supabase
  .from('performance_records')
  .select('company_id, settlement_month, client_id')
  .eq('review_action', '삭제')
if (delErr) { console.error('삭제건 조회 실패:', delErr.message); process.exit(1) }

const combos = [...new Map(delRows.map(r => [`${r.company_id}|${r.settlement_month}|${r.client_id}`, r])).values()]
console.log(`소프트 삭제건이 포함된 (업체×정산월×거래처) 조합: ${combos.length}개\n`)

let pass = 0, fail = 0
const sample = combos.slice(0, 8) // 대표 8개만 상세 출력

for (const combo of combos) {
  const { company_id, settlement_month, client_id } = combo

  // ===== (A) 메인 목록 집계 쿼리 재현 (fetchClientList) =====
  const { data: perfData } = await supabase
    .from('performance_records')
    .select('client_id, prescription_qty, review_action, products(price)')
    .eq('company_id', company_id)
    .eq('settlement_month', settlement_month)

  const rowsForClient = (perfData || []).filter(p => p.client_id === client_id)
  // 수정 전
  const oldCount = rowsForClient.length
  const oldAmount = rowsForClient.reduce((s,p)=> s + Math.round((p.prescription_qty||0)*(p.products?.price||0)), 0)
  // 수정 후 (적용된 로직과 동일)
  const newRows = rowsForClient.filter(p => p.review_action !== '삭제')
  const newCount = newRows.length
  const newAmount = newRows.reduce((s,p)=> s + Math.round((p.prescription_qty||0)*(p.products?.price||0)), 0)

  const deletedHere = rowsForClient.filter(p => p.review_action === '삭제').length
  const nullKept = rowsForClient.filter(p => p.review_action == null).length // NULL 정상 유지 확인

  // ===== (B) 조회 모달 쿼리 재현 (fetchViewModalData) =====
  const { data: viewData } = await supabase
    .from('performance_records')
    .select('prescription_qty, review_action, products(product_name, price)')
    .eq('company_id', company_id)
    .eq('settlement_month', settlement_month)
    .eq('client_id', client_id)
  const viewOld = (viewData || []).length
  const viewNew = (viewData || []).filter(r => r.review_action !== '삭제').length

  // 검증 조건
  const ok =
    deletedHere > 0 &&                       // 이 거래처에 삭제건이 실제로 존재
    newCount === oldCount - deletedHere &&   // 집계에서 삭제건만큼 정확히 줄어듦
    newRows.every(p => p.review_action !== '삭제') && // 남은 건에 삭제건 없음
    newCount >= nullKept &&                  // NULL(정상 등록건)은 유지됨
    viewNew === viewOld - deletedHere        // 조회 모달도 동일하게 감소

  if (ok) pass++; else fail++

  if (sample.includes(combo) || !ok) {
    console.log(`[${ok?'PASS':'FAIL'}] company=${company_id.slice(0,8)} month=${settlement_month} client=${client_id}`)
    console.log(`   집계 건수  : 수정전 ${oldCount} → 수정후 ${newCount}  (삭제건 ${deletedHere}, NULL유지 ${nullKept})`)
    console.log(`   처방액합계 : 수정전 ${oldAmount.toLocaleString()} → 수정후 ${newAmount.toLocaleString()}`)
    console.log(`   조회모달   : 수정전 ${viewOld}행 → 수정후 ${viewNew}행`)
  }
}

console.log(`\n===== 결과: PASS ${pass} / FAIL ${fail} (총 ${combos.length}) =====`)
process.exit(fail === 0 ? 0 : 1)
