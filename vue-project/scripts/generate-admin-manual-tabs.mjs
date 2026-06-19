// audit-admin-full.mjs 결과로 ManualView adminTabs HTML 생성
// 실행: node scripts/generate-admin-manual-tabs.mjs
import fs from 'fs';
import { ADMIN_CURATION } from './admin-manual-curation.mjs';

const AUDIT_PATH = '/tmp/admin-pages-audit-full.json';
const FALLBACK_PATH = '/tmp/admin-pages-audit.json';
const auditPath = fs.existsSync(AUDIT_PATH) ? AUDIT_PATH : FALLBACK_PATH;
const auditRaw = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

// 자동 감사로 열기 어렵거나 데이터 없는 화면·모달 (코드 기반 보완)
const STATIC_EXTRAS = [
  { section: '2. 업체 관리', name: '업체 수정', path: '/admin/companies/:id/edit', type: 'subpage', parentName: '업체 상세', parentPath: '/admin/companies/:id', trigger: '수정', ok: true, title: '업체 수정', formFields: ['구분', '업체명', '사업자등록번호', '대표자', '수수료 등급', '관리자', '비고'], buttons: ['저장', '취소'] },
  { section: '2. 업체 관리', name: '승인 확인', path: 'modal (승인 확인)', type: 'modal', parentName: '미승인 업체', parentPath: '/admin/companies/pending', trigger: '승인', ok: true, title: '승인 확인', buttons: ['확인', '취소'] },
  { section: '2. 업체 관리', name: '승인 취소 확인', path: 'modal (승인 취소 확인)', type: 'modal', parentName: '승인 업체', parentPath: '/admin/companies/approved', trigger: '취소', ok: true, title: '승인 취소 확인', buttons: ['확인', '취소'] },
  { section: '3. 제품 관리', name: '제품 상세', path: '/admin/products/:id', type: 'subpage', parentName: '제품 목록', parentPath: '/admin/products', trigger: '제품명 클릭', ok: true, title: '제품 상세', buttons: ['수정', '목록'] },
  { section: '3. 제품 관리', name: '제품 수정', path: '/admin/products/:id/edit', type: 'subpage', parentName: '제품 상세', trigger: '수정', ok: true, title: '제품 수정', formFields: ['제품명', '보험코드', '약가', '수수료율 A~E'], buttons: ['저장', '취소'] },
  { section: '3. 제품 관리', name: '업체 할당', path: '/admin/products/:productId/assignment', type: 'subpage', parentName: '제품 목록', trigger: '업체 컬럼 클릭', ok: true, title: '업체 할당', buttons: ['저장', '목록'] },
  { section: '3. 제품 관리', name: '엑셀 업로드 확인', path: 'modal (데이터 확인)', type: 'modal', parentName: '제품 목록', trigger: '엑셀 등록', ok: true, title: '기존 데이터 확인', buttons: ['확인', '취소'] },
  { section: '3. 제품 관리', name: '엑셀 중복 처리', path: 'modal (중복 처리 선택)', type: 'modal', parentName: '제품 목록', trigger: '엑셀 등록(중복 시)', ok: true, title: '중복 처리 방식 선택', buttons: ['건너뛰기', '덮어쓰기', '취소'] },
  { section: '3. 제품 관리', name: '표준코드 상세', path: '/admin/products-standard-code/:id', type: 'subpage', parentName: '표준코드 목록', trigger: '제품명 클릭', ok: true, title: '표준코드 상세', buttons: ['수정', '목록'] },
  { section: '3. 제품 관리', name: '표준코드 수정', path: '/admin/products-standard-code/:id/edit', type: 'subpage', parentName: '표준코드 상세', trigger: '수정', ok: true, title: '표준코드 수정', formFields: ['제품명', '보험코드', '표준코드', '단위/포장형태', '단위수량', '비고'], buttons: ['저장', '취소'] },
  { section: '4. 병의원 관리', name: '엑셀 업로드 확인', path: 'modal (데이터 확인)', type: 'modal', parentName: '병의원 목록', trigger: '엑셀 등록', ok: true, title: '엑셀 등록 확인', buttons: ['확인', '취소'] },
  { section: '5. 문전약국 관리', name: '엑셀 업로드 확인', path: 'modal (데이터 확인)', type: 'modal', parentName: '문전약국 목록', trigger: '엑셀 등록', ok: true, title: '엑셀 등록 확인', buttons: ['확인', '취소'] },
  { section: '7. 실적 관리', name: '실적 입력(편집)', path: '/performance/register/edit', type: 'subpage', parentName: '실적 등록', parentPath: '/admin/performance/register', trigger: '등록', ok: true, title: '실적 입력', formFields: ['병의원', '처방월', '제품명', '보험코드', '처방수량', '처방액', '처방구분', '비고'], buttons: ['저장', '목록', '행 추가', '행 삭제'] },
  { section: '7. 실적 관리', name: '실적 조회', path: 'modal (병의원 실적 조회)', type: 'modal', parentName: '실적 등록', trigger: '조회', ok: true, title: '실적 조회', columns: ['처방월', '제품명', '처방수량', '처방액', '검수'], buttons: ['닫기'] },
  { section: '7. 실적 관리', name: '증빙 파일 업로드', path: 'modal (증빙 파일 업로드)', type: 'modal', parentName: '실적 등록', trigger: '업로드', ok: true, title: '증빙 파일 업로드', buttons: ['업로드', '취소'] },
  { section: '7. 실적 관리', name: '증빙 파일 목록', path: 'modal (증빙 파일)', type: 'modal', parentName: '업체별 등록 현황', trigger: '보기', ok: true, title: '증빙 파일 목록', columns: ['파일명', '업로드일', '다운로드'], buttons: ['닫기'] },
  { section: '8. 정산 관리', name: '검수 상태 변경', path: 'modal (검수 상태 변경)', type: 'modal', parentName: '실적 검수', trigger: '검수 상태 변경 (N건)', ok: true, title: '검수 상태 변경', formFields: ['변경할 상태 (완료/검수중/신규)'], buttons: ['확인', '취소'] },
  { section: '8. 정산 관리', name: '일괄 변경', path: 'modal (일괄 변경)', type: 'modal', parentName: '실적 검수', trigger: '일괄 변경 (N건)', ok: true, title: '일괄 변경 항목 선택', buttons: ['다음', '취소'] },
  { section: '8. 정산 관리', name: '프로모션 데이터 업데이트', path: 'modal (프로모션 데이터 업데이트)', type: 'modal', parentName: '실적 검수', trigger: '프로모션 데이터 업데이트', ok: true, title: '프로모션 데이터 업데이트', buttons: ['실행', '취소'] },
  { section: '8. 정산 관리', name: '제외 병원 관리(제품별)', path: 'modal (제외 병원 관리)', type: 'modal', parentName: '프로모션 관리', trigger: '제외 병의원 숫자 클릭', ok: true, title: '제외 병원 관리', columns: ['병의원명', '사업자번호', '제외 사유'], buttons: ['제외 병원 추가', '삭제', '닫기'] },
  { section: '8. 정산 관리', name: '제외 병원 추가(제품별)', path: 'modal (제외 병원 추가)', type: 'modal', parentName: '제외 병원 관리', trigger: '제외 병원 추가', ok: true, title: '제외 병원 추가', buttons: ['추가', '취소'] },
  { section: '8. 정산 관리', name: '통계 계산 완료', path: 'modal (통계 계산 완료)', type: 'modal', parentName: '실적 상세 현황', trigger: '통계 갱신 완료 후', ok: true, title: '통계 계산 완료', buttons: ['확인'] },
];

// 감사 결과 + 정적 보완 (스크린샷 있는 감사 결과 우선)
function mergeAudit(raw, extras) {
  const key = (r) => `${r.section}|${r.name}|${r.type}|${r.parentPath || ''}`;
  const map = new Map();
  for (const r of [...raw, ...extras]) {
    const k = key(r);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, r);
    } else if (r.screenshot && !prev.screenshot) {
      map.set(k, { ...prev, ...r, screenshot: r.screenshot });
    } else if (r.ok && !prev.ok) {
      map.set(k, { ...prev, ...r });
    }
  }
  return [...map.values()];
}

const audit = mergeAudit(auditRaw, STATIC_EXTRAS);

const SECTION_DESC = {
  '1. 공지사항 관리': 'CSO 업체 및 관리자에게 전달할 공지사항을 등록·수정·삭제합니다.',
  '2. 업체 관리': 'CSO 업체 가입 승인, 승인 업체 정보 관리, 수수료 등급 설정을 수행합니다.',
  '3. 제품 관리': '정산 기준 제품 정보와 표준코드를 관리합니다. 수수료 등급(A~E)별 수수료율이 제품에 연결됩니다.',
  '4. 병의원 관리': '병의원 마스터 데이터와 담당 CSO 업체, 수수료 등급, 문전약국 관계를 설정합니다.',
  '5. 문전약국 관리': '문전약국 마스터 데이터를 관리합니다. 흡수율 분석 시 병의원-약국 매핑에 사용됩니다.',
  '6. 매출 관리': '도매 업체·도매매출·직거래매출 데이터를 등록하여 흡수율 분석의 매출 근거로 사용합니다.',
  '7. 실적 관리': '정산월 생성, CSO 실적 등록·모니터링, 전체/상세 현황 조회를 수행합니다.',
  '8. 정산 관리': '프로모션, 실적 검수, 흡수율 분석, 정산내역서 공유 등 정산 프로세스를 처리합니다.',
  '9. 실적 통계': '정산월 기준 업체·병원·제품별 통계를 조회하고 엑셀로 다운로드합니다.',
};

const PAGE_NOTES = {
  '공지사항 목록': '제목 클릭 → 상세. 「필수」는 상단 고정 공지.',
  '공지사항 등록': '제목·내용·필수(상단고정)·첨부파일 입력 후 저장.',
  '공지사항 상세': '조회수 증가. 수정·삭제·목록 버튼 제공.',
  '공지사항 수정': '등록 화면과 동일 필드 수정.',
  '승인 업체': '업체명 → 상세. 「승인 취소」로 미승인 전환.',
  '미승인 업체': '「승인」 시 수수료 등급 지정.',
  '업체 등록': '구분·업체명·사업자번호·대표자·수수료등급 등 입력.',
  '업체 상세': '비밀번호 재설정·수정·목록.',
  '제품 목록': '기준월별 제품·수수료율(A~E). 엑셀 일괄등록 시 중복 확인.',
  '문전약국 지정': '「추가」→ 약국 지정 모달. 삭제 시 검색 필터 유지.',
  '실적 등록': '업체 선택 후 「등록」→ 실적 입력 화면.',
  '실적 입력(편집)': '병의원별 처방 제품 행 입력. Enter로 제품 검색·다음 행 이동.',
  '실적 검수': '행 선택 후 검수 상태 일괄 변경.',
  '흡수율 분석': '「흡수율 분석」 실행 → 엑셀 다운로드(합계행 포함).',
  '정산내역서 공유': '공유 체크·전달사항·구간 수수료 입력 후 저장.',
  '프로모션 관리': '제품별 프로모션 수수료·제외 병원 관리.',
  '프로모션 병원 실적': '제품별 병원 처방 실적·제외 병원 관리.',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function li(items, { buttons = false } = {}) {
  const clean = (items || []).filter((t) => t && !/^\d+$/.test(t));
  if (!clean.length) return '<p class="muted">(없음)</p>';
  if (buttons) {
    return `<ul class="feature-list">${clean.map((t) => `<li><strong>${esc(t)}</strong></li>`).join('')}</ul>`;
  }
  return `<ul class="feature-list">${clean.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

function typeBadge(type) {
  if (type === 'modal') return '<span class="type-badge modal">모달</span>';
  if (type === 'subpage') return '<span class="type-badge subpage">서브화면</span>';
  return '<span class="type-badge list">목록</span>';
}

function usageBlock(steps) {
  if (!steps?.length) return '';
  return `<h4>📋 사용 방법</h4><ol class="usage-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
}

function cautionBlock(items) {
  if (!items?.length) return '';
  return `<div class="caution"><h4>⚠️ 주의사항</h4><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`;
}

// 상세 프로세스(단계별) 블록 — process: [{ title, steps: [{ heading, lines: [...] }] }]
function processBlock(sections) {
  if (!sections?.length) return '';
  return sections.map((sec) =>
    `<h4>${sec.title}</h4><div class="process-steps">${
      sec.steps.map((st) => `<div class="step"><strong>${st.heading}</strong><br>${st.lines.join('<br>')}</div>`).join('')
    }</div>`
  ).join('');
}

function curationBlocks(name) {
  const c = ADMIN_CURATION[name];
  if (!c) return '';
  return `${usageBlock(c.usageSteps)}${processBlock(c.process)}${cautionBlock(c.cautions)}`;
}

function screenshotBlock(p) {
  if (!p.screenshot) return '';
  return `<img src="${esc(p.screenshot)}" alt="${esc(p.name)} 화면" class="manual-image" loading="lazy">`;
}

function pageBlock(p, idx) {
  const note = PAGE_NOTES[p.name];
  const actionBtns = (p.buttons || []).filter((b) => !/^\d+$/.test(b));
  const filterItems = (p.filters || []).filter((f) => !f.includes(': []'));
  const isForm = p.type === 'subpage' && (p.formFields?.length > 0) && (p.columns?.length === 0 || p.path?.includes('/create') || p.path?.includes('/edit'));
  const parentInfo = p.parentName
    ? `<p><strong>상위 화면:</strong> ${esc(p.parentName)} <span class="path">${esc(p.parentPath || '')}</span>${p.trigger ? ` · <strong>진입:</strong> ${esc(p.trigger)}` : ''}</p>`
    : '';

  if (p.ok === false) {
    return `
        <h3>${idx}. ${typeBadge(p.type)} ${esc(p.name)}</h3>
        ${parentInfo}
        <p class="audit-skip"><em>자동 확인 불가: ${esc(p.error || '데이터 없음')}</em></p>
    `;
  }

  return `
        <h3>${idx}. ${typeBadge(p.type)} ${esc(p.name)} <span class="path">${esc(p.path)}</span></h3>
        ${screenshotBlock(p)}
        ${parentInfo}
        <p><strong>화면 제목:</strong> ${esc(p.title)}${p.totalCount ? ` · ${esc(p.totalCount)}` : ''}</p>
        ${note ? `<p><strong>사용 안내:</strong> ${esc(note)}</p>` : ''}
        ${p.emptyMsg ? `<p><strong>빈 목록 안내:</strong> ${esc(p.emptyMsg)}</p>` : ''}
        ${p.type === 'list' || (p.type === 'subpage' && !isForm) ? `
        <h4>검색·필터</h4>
        ${li(filterItems.length ? filterItems : ['(별도 필터 없음)'])}
        ` : ''}
        ${isForm || p.type === 'modal' ? `
        <h4>${p.type === 'modal' ? '모달 입력·필드' : '입력 필드'}</h4>
        ${li((p.formFields?.length ? p.formFields : p.modalFields)?.length ? (p.formFields?.length ? p.formFields : p.modalFields) : ['(폼 필드 — 화면에서 확인)'])}
        ` : ''}
        <h4>주요 버튼·기능</h4>
        ${li(actionBtns, { buttons: true })}
        ${!isForm && p.columns?.length ? `
        <h4>테이블 컬럼</h4>
        ${li(p.columns)}
        ` : ''}
        ${curationBlocks(p.name)}
        ${p.extra?.length ? `<p><strong>UI:</strong> ${esc(p.extra.join(', '))}</p>` : ''}
  `;
}

const sections = [...new Set(audit.map((p) => p.section))];
const listOnly = audit.filter((p) => p.type === 'list');
const overviewRows = listOnly.map((p) => `<tr><td>${esc(p.section)}</td><td>${esc(p.name)}</td><td><span class="path">${esc(p.path)}</span></td><td>${esc(p.totalCount || '-')}</td></tr>`).join('');

const subModalCount = audit.filter((p) => p.type !== 'list').length;
const overviewTab = {
  label: '0. 개요',
  content: `
      <div class="section">
        <h2>관리자 메뉴 개요</h2>
        <p>좌측 사이드바 <strong>25개 목록</strong> + <strong>서브화면·모달 ${subModalCount}개</strong> (직접 접속·클릭 확인 + 코드 기반 보완)입니다.</p>
        <p class="path-note"><em>검증: 2026-06-12 · http://localhost:5173/admin · test1@test.com</em></p>
        <h3>목록 메뉴 (25개)</h3>
        <table class="manual-table">
          <thead><tr><th>구분</th><th>메뉴명</th><th>경로</th><th>건수</th></tr></thead>
          <tbody>${overviewRows}</tbody>
        </table>
        <h3>화면 유형 범례</h3>
        <ul class="feature-list">
          <li><span class="type-badge list">목록</span> — 사이드바 메인 메뉴</li>
          <li><span class="type-badge subpage">서브화면</span> — 등록/상세/수정·공유 편집 등 별도 URL</li>
          <li><span class="type-badge modal">모달</span> — 목록에서 버튼 클릭으로 열리는 팝업</li>
        </ul>
        <h3>정산 업무 흐름</h3>
        <ol class="usage-steps">
          <li><strong>정산월 관리</strong> — 실적 입력 기간 설정</li>
          <li><strong>실적 등록/검수</strong> — CSO 제출 실적 확인·수정</li>
          <li><strong>흡수율 분석</strong> — 매출 대비 처방 흡수율 계산</li>
          <li><strong>정산내역서 공유</strong> — 업체별 정산서 공개</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>등록 화면 <strong>삭제=영구 삭제</strong>, 검수 화면 <strong>삭제=소프트 삭제(↶ 복원 가능)</strong>입니다.</li>
          <li>수수료율은 등급(A~E) 기본율로 저장되며, 프로모션은 정산·표시 단계에서만 적용됩니다.</li>
          <li>통계·정산액은 <strong>검수완료분</strong> 기준으로 집계됩니다.</li>
        </ul></div>
      </div>
    `,
};

const tabs = [overviewTab, ...sections.map((section) => {
  const pages = audit.filter((p) => p.section === section);
  const lists = pages.filter((p) => p.type === 'list');
  const subs = pages.filter((p) => p.type === 'subpage');
  const modals = pages.filter((p) => p.type === 'modal');
  let idx = 0;
  const body = [
    ...lists.map((p) => pageBlock(p, ++idx)),
    subs.length ? `<h3 class="subsection-title">서브화면</h3>` : '',
    ...subs.map((p) => pageBlock(p, ++idx)),
    modals.length ? `<h3 class="subsection-title">모달</h3>` : '',
    ...modals.map((p) => pageBlock(p, ++idx)),
  ].join('');
  return {
    label: section,
    content: `
      <div class="section">
        <h2>${esc(section)}</h2>
        <p>${SECTION_DESC[section] || ''}</p>
        <p class="path-note"><em>목록 ${lists.length} · 서브 ${subs.length} · 모달 ${modals.length}</em></p>
        ${body}
      </div>
    `,
  };
})];

const outPath = new URL('../src/data/adminManualTabs.js', import.meta.url);
fs.writeFileSync(outPath, `// AUTO-GENERATED — audit-admin-full.mjs + generate-admin-manual-tabs.mjs\nexport const adminManualTabs = ${JSON.stringify(tabs, null, 2)};\n`);
console.log(`생성: src/data/adminManualTabs.js (${tabs.length} tabs, ${audit.length} screens)`);
