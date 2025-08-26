// 매출 관리 엑셀 등록 테스트 스크립트
// Playwright를 사용한 자동화 테스트

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('매출 관리 엑셀 등록 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동 (필요한 경우)
    await page.goto('http://localhost:5173');
    
    // 로그인이 필요한 경우 여기에 로그인 로직 추가
    // await page.fill('#email', 'admin@example.com');
    // await page.fill('#password', 'password');
    // await page.click('#login-button');
  });

  test('직거래매출 엑셀 템플릿 다운로드', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/direct-revenue');
    
    // 엑셀 템플릿 다운로드 버튼 클릭
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("엑셀 템플릿")');
    const download = await downloadPromise;
    
    // 다운로드된 파일명 확인
    expect(download.suggestedFilename()).toContain('직거래매출자료_엑셀등록_템플릿.xlsx');
  });

  test('직거래매출 정상 데이터 업로드', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/direct-revenue');
    
    // 파일 업로드 input 찾기
    const fileInput = page.locator('input[type="file"]');
    
    // 테스트 파일 업로드
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/direct-revenue-test.xlsx'));
    
    // 엑셀 등록 버튼 클릭
    await page.click('button:has-text("엑셀 등록")');
    
    // 성공 메시지 확인 (실제 메시지에 맞게 수정 필요)
    await expect(page.locator('.success-message, .alert-success')).toBeVisible();
    
    // 업로드된 데이터가 목록에 표시되는지 확인
    await expect(page.locator('text=테스트제품1')).toBeVisible();
    await expect(page.locator('text=테스트제품2')).toBeVisible();
    await expect(page.locator('text=테스트제품3')).toBeVisible();
  });

  test('도매매출 엑셀 템플릿 다운로드', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/wholesale-revenue');
    
    // 엑셀 템플릿 다운로드 버튼 클릭
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("엑셀 템플릿")');
    const download = await downloadPromise;
    
    // 다운로드된 파일명 확인
    expect(download.suggestedFilename()).toContain('도매매출자료_엑셀등록_템플릿.xlsx');
  });

  test('도매매출 정상 데이터 업로드', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/wholesale-revenue');
    
    // 파일 업로드 input 찾기
    const fileInput = page.locator('input[type="file"]');
    
    // 테스트 파일 업로드
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/wholesale-revenue-test.xlsx'));
    
    // 엑셀 등록 버튼 클릭
    await page.click('button:has-text("엑셀 등록")');
    
    // 성공 메시지 확인
    await expect(page.locator('.success-message, .alert-success')).toBeVisible();
    
    // 업로드된 데이터가 목록에 표시되는지 확인
    await expect(page.locator('text=도매제품1')).toBeVisible();
    await expect(page.locator('text=도매제품2')).toBeVisible();
    await expect(page.locator('text=도매제품3')).toBeVisible();
  });

  test('에러 데이터 업로드 테스트', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/direct-revenue');
    
    // 파일 업로드 input 찾기
    const fileInput = page.locator('input[type="file"]');
    
    // 에러 테스트 파일 업로드
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/error-test.xlsx'));
    
    // 엑셀 등록 버튼 클릭
    await page.click('button:has-text("엑셀 등록")');
    
    // 에러 메시지 확인
    await expect(page.locator('.error-message, .alert-error, .alert-danger')).toBeVisible();
  });

  test('빈 파일 업로드 테스트', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/direct-revenue');
    
    // 빈 엑셀 파일 생성 및 업로드
    const fileInput = page.locator('input[type="file"]');
    
    // 빈 파일 업로드 시도
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/empty.xlsx'));
    
    // 엑셀 등록 버튼 클릭
    await page.click('button:has-text("엑셀 등록")');
    
    // 에러 메시지 확인
    await expect(page.locator('text=엑셀 파일에 데이터가 없습니다')).toBeVisible();
  });
});
