// 모달 함수 테스트 스크립트
// 브라우저 콘솔에서 실행하여 모달이 올바르게 작동하는지 확인

console.log('=== 모달 함수 테스트 시작 ===');

// 테스트용 모달 함수 (실제 코드와 동일)
function testShowUploadChoiceModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `
    
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      text-align: center;
    `
    
    modalContent.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">테스트: 어떤 방식으로 등록하시겠습니까?</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="test-append-btn" style="
          padding: 12px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
          기존 데이터는 그대로 두고 추가 등록
        </button>
        <button id="test-replace-btn" style="
          padding: 12px 20px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#da190b'" onmouseout="this.style.background='#f44336'">
          기존 데이터 모두 지우고 등록
        </button>
        <button id="test-cancel-btn" style="
          padding: 12px 20px;
          background: #9e9e9e;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#757575'" onmouseout="this.style.background='#9e9e9e'">
          취소
        </button>
      </div>
    `
    
    modal.appendChild(modalContent)
    document.body.appendChild(modal)
    
    document.getElementById('test-append-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      console.log('✅ 테스트 결과: append 선택됨')
      resolve('append')
    })
    
    document.getElementById('test-replace-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      console.log('✅ 테스트 결과: replace 선택됨')
      resolve('replace')
    })
    
    document.getElementById('test-cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      console.log('✅ 테스트 결과: cancel 선택됨')
      resolve('cancel')
    })
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        console.log('✅ 테스트 결과: 모달 외부 클릭으로 cancel 선택됨')
        resolve('cancel')
      }
    })
  })
}

// 테스트 실행 함수
async function runModalTest() {
  console.log('🚀 모달 테스트 시작...');
  try {
    const result = await testShowUploadChoiceModal();
    console.log(`🎉 최종 결과: ${result}`);
    return result;
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 테스트 실행 명령어
console.log('테스트를 실행하려면: runModalTest()');
console.log('=== 모달 함수 테스트 준비 완료 ===');
