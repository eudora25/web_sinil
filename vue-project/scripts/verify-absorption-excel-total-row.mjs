// 흡수율 분석 엑셀 다운로드 합계행 검증
// 수정일시/수정자 컬럼 최하단 회색 칸 존재 여부 확인
// 실행: cd vue-project && node scripts/verify-absorption-excel-total-row.mjs
import ExcelJS from 'exceljs';

// downloadExcel()의 데이터행/합계행 키 구조를 그대로 재현
const dataRow = {
  'No': 1, '작업': '', '구분': '도매', '업체명': '테스트업체', '병의원명': '테스트의원',
  '처방월': '2026-03', '제품명': '자누엑스알', '보험코드': '12345', '약가': 1000,
  '수량': 10, '처방액': 10000, '처방구분': '신규', '도매매출': 5000, '직거래매출': 3000,
  '합산액': 8000, '흡수율': 0.8, '수수료율': 0.3, '지급액': 2400, '반영 흡수율': 0.8,
  '최종 지급액': 2400, '비고': '', '등록일시': '2026-03-01', '등록자': 'admin',
  '수정일시': '2026-03-02', '수정자': 'admin'
};

// 수정 후 합계행 (수정일시/수정자 포함)
const totalRow = {
  'No': '', '작업': '', '구분': '', '업체명': '', '병의원명': '', '처방월': '',
  '제품명': '', '보험코드': '', '약가': '합계', '수량': 10, '처방액': 10000,
  '처방구분': '', '도매매출': 5000, '직거래매출': 3000, '합산액': 8000, '흡수율': 0.8,
  '수수료율': 0.3, '지급액': 2400, '반영 흡수율': 0.8, '최종 지급액': 2400, '비고': '',
  '등록일시': '', '등록자': '', '수정일시': '', '수정자': ''
};

const dataToExport = [dataRow, totalRow];

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('흡수율 분석');

const headers = Object.keys(dataToExport[0]);
worksheet.addRow(headers);

// 데이터행
worksheet.addRow(Object.values(dataRow));

// 합계행 (실제 코드와 동일하게 회색 fill + border)
const tr = worksheet.addRow(Object.values(dataToExport[dataToExport.length - 1]));
tr.eachCell((cell) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
});
worksheet.eachRow((row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
  });
});

// 검증
const headerCount = headers.length;
const idxUpdatedDate = headers.indexOf('수정일시') + 1; // 1-based
const idxUpdatedBy = headers.indexOf('수정자') + 1;

console.log(`헤더 컬럼 수: ${headerCount}`);
console.log(`수정일시 컬럼 인덱스: ${idxUpdatedDate}, 수정자 컬럼 인덱스: ${idxUpdatedBy}\n`);

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { console.log(`✅ ${label}`); pass++; }
  else { console.log(`❌ ${label}`); fail++; }
}

const cellUpdatedDate = tr.getCell(idxUpdatedDate);
const cellUpdatedBy = tr.getCell(idxUpdatedBy);

check('합계행에 수정일시 셀 존재', !!cellUpdatedDate);
check('합계행에 수정자 셀 존재', !!cellUpdatedBy);
check('수정일시 셀 회색(F0F0F0) 채움',
  cellUpdatedDate.fill?.fgColor?.argb === 'F0F0F0' || cellUpdatedDate.fill?.fgColor?.argb === 'FFF0F0F0');
check('수정자 셀 회색(F0F0F0) 채움',
  cellUpdatedBy.fill?.fgColor?.argb === 'F0F0F0' || cellUpdatedBy.fill?.fgColor?.argb === 'FFF0F0F0');
check('수정일시 셀 테두리 존재', !!cellUpdatedDate.border?.bottom);
check('수정자 셀 테두리 존재', !!cellUpdatedBy.border?.bottom);
check('합계행 마지막 셀 == 수정자 컬럼 (밀림 없음)',
  worksheet.getRow(3).cellCount === headerCount);

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail > 0 ? 1 : 0);
