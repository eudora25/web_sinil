/**
 * 실적등록 편집 페이지(PerformanceRegisterEdit.vue) 로드 쿼리가
 * 소프트 삭제(review_action='삭제') 건을 그리드에서 제외하는지 검증.
 * 사용자가 보고한 정확한 케이스 + 전체 영향 조합을 함께 확인.
 * 실행: node scripts/verify-edit-excludes-deleted.mjs   (읽기 전용)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
function parseDotEnv(c){const o={};for(const l of c.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith('#'))continue;const e=t.indexOf('=');if(e===-1)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[k]=v}return o}
const env = parseDotEnv(await fs.readFile(path.resolve(process.cwd(),'.env.local'),'utf8'))
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
await supabase.auth.signInWithPassword({ email:'test1@test.com', password:'asdf1234' })

console.log('DB:', env.VITE_SUPABASE_URL, '\n')

// ===== 1) 사용자 보고 케이스 =====
const CASE = { company_id:'b9c85cb9-d3e1-40b7-95c2-882b55594791', settlement_month:'2026-05', client_id:1222 }
{
  const { data: all } = await supabase.from('performance_records')
    .select('id, prescription_qty, review_action, review_status')
    .eq('company_id', CASE.company_id).eq('settlement_month', CASE.settlement_month).eq('client_id', CASE.client_id)

  // 수정 전(필터 없음) = .eq 3개만
  const oldRows = all || []
  // 수정 후 = .or('review_action.is.null,review_action.neq.삭제') 동일 의미
  const newRows = (all || []).filter(r => r.review_action == null || r.review_action !== '삭제')

  const byAction = {}
  for (const r of oldRows) { const k = r.review_action ?? 'NULL'; byAction[k] = (byAction[k]||0)+1 }

  console.log('=== 사용자 보고 케이스 (client 1222 / 2026-05 / b9c85cb9) ===')
  console.log('  전체 행:', oldRows.length, '| review_action 분포:', JSON.stringify(byAction))
  console.log('  수정 전 그리드 표시:', oldRows.length, '행')
  console.log('  수정 후 그리드 표시:', newRows.length, '행')
  console.log('  → 제외된 삭제건:', oldRows.length - newRows.length, '\n')
}

// ===== 2) 전체 영향: 삭제건이 있는 (company×month×client) 조합 전수 검증 =====
const { data: delRows } = await supabase.from('performance_records')
  .select('company_id, settlement_month, client_id').eq('review_action','삭제')
const combos = [...new Map((delRows||[]).map(r=>[`${r.company_id}|${r.settlement_month}|${r.client_id}`,r])).values()]

let pass=0, fail=0
for (const c of combos) {
  const { data: all } = await supabase.from('performance_records')
    .select('id, review_action')
    .eq('company_id', c.company_id).eq('settlement_month', c.settlement_month).eq('client_id', c.client_id)
  const oldN = (all||[]).length
  const newN = (all||[]).filter(r => r.review_action == null || r.review_action !== '삭제').length
  const deleted = (all||[]).filter(r => r.review_action === '삭제').length
  const nullKept = (all||[]).filter(r => r.review_action == null).length
  const ok = deleted>0 && newN === oldN - deleted && newN >= nullKept
  if (ok) pass++; else { fail++; console.log('  [FAIL]', c, {oldN,newN,deleted,nullKept}) }
}
console.log(`=== 전체 영향 검증: PASS ${pass} / FAIL ${fail} (삭제건 포함 조합 ${combos.length}개) ===`)
process.exit(fail===0?0:1)
