<template>
  <div class="manual-container">
    <div class="manual-content">
      <!-- 고정될 헤더 영역 (제목 + 탭) -->
      <div class="manual-header">
        <div class="header-top">
          <h1>{{ isAdminManual ? '신일제약 CSO 실적 관리 시스템 - 관리자 매뉴얼' : '신일제약 CSO 실적 관리 시스템 - 이용자 매뉴얼' }}</h1>
          <!-- PDF 다운로드 버튼 : 일시 감추기 -->
          <!--
          <Button 
            label="PDF 다운로드" 
            icon="pi pi-download" 
            iconPos="right"
            @click="downloadPDF" 
            :loading="isPrinting" 
            text severity="secondary" 
            class="pdf-download-button" 
            aria-label="PDF 다운로드"
          />
          -->
        </div>
        
        <!-- 탭 메뉴 -->
        <div class="manual-tabs">
          <div 
            v-for="(tab, index) in tabs" 
            :key="index"
            class="manual-tab"
            :class="{ active: activeTab === index }"
            @click="activeTab = index"
          >
            {{ tab.label }}
          </div>
        </div>
      </div>
      
      <!-- 탭 내용 -->
      <div v-html="tabs[activeTab]?.content" class="manual-html-content"></div>

      <!-- PDF 렌더링을 위한 숨겨진 컨테이너 -->
      <div v-if="isPrinting" style="position: absolute; left: -9999px; top: -9999px;">
        <div id="pdf-render-container" v-html="fullManualContent" class="manual-html-content" style="width: 1200px; background: white;"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import Button from 'primevue/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { adminManualTabs } from '@/data/adminManualTabs.js';



const route = useRoute();
const activeTab = ref(0);
const isPrinting = ref(false);

const isAdminManual = computed(() => route.path === '/admin-manual');

const fullManualContent = computed(() => {
  return tabs.value.map(tab => tab.content).join('');
});

const downloadPDF = async () => {
  isPrinting.value = true;
  await nextTick();

  const renderContainer = document.getElementById('pdf-render-container');
  if (!renderContainer) {
    isPrinting.value = false;
    return;
  }

  const title = isAdminManual.value ? '관리자 매뉴얼' : '이용자 매뉴얼';
  const fileName = `${title}.pdf`;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = { top: 20, right: 15, bottom: 20, left: 15 };
  const pdfWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;
  const pageHeight = pdf.internal.pageSize.getHeight() - margin.top - margin.bottom;

  const sections = renderContainer.querySelectorAll('.section');

  try {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const ratio = canvas.width / pdfWidth;
      const imgHeight = canvas.height / ratio;

      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', margin.left, margin.top, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin.left, margin.top + position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin.left, margin.top, pdfWidth, imgHeight);
      }

      if (i < sections.length - 1) {
        pdf.addPage();
      }
    }
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
  } finally {
    isPrinting.value = false;
  }
};

const userTabs = [
  {
    label: '1. 공지사항 조회',
    content: `
      <div class="section">
        <h2>1. 공지사항 조회</h2>
        <h3>1.1 공지사항 조회 <span class="path">/notices</span></h3>
        <p><strong>설명:</strong> 관리자(제약사)의 주요 공지사항을 확인할 수 있습니다.</p>
        
        <img src="/manual-images/user_1_notice_list.png" alt="공지사항 조회" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>공지사항 목록 조회</strong> - 관리자가 등록한 공지사항들을 제목, 작성일시, 조회수와 함께 목록 형태로 확인할 수 있습니다.</li>
          <li><strong>공지사항 상세 조회</strong> - 제목을 클릭하여 공지사항의 전체 내용을 상세히 확인할 수 있습니다.</li>
          <li><strong>고정 공지사항 확인</strong> - 중요한 공지사항은 목록 상단에 고정되어 우선적으로 확인할 수 있습니다.</li>
          <li><strong>첨부파일 다운로드</strong> - 공지사항에 첨부된 파일들을 다운로드하여 확인할 수 있습니다.</li>
          <li><strong>검색 기능</strong> - 제목이나 내용에서 원하는 키워드로 공지사항을 검색할 수 있습니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li>좌측 메뉴 <strong>공지사항</strong>에서 목록을 엽니다.</li>
          <li>검색창에 키워드를 입력하고 <strong>검색</strong>합니다.</li>
          <li>확인할 <strong>제목</strong>을 클릭해 상세 내용·첨부파일을 확인합니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li><strong>고정(필수)</strong> 공지는 목록 상단에 우선 표시됩니다. 중요 공지부터 확인하세요.</li>
        </ul></div>
      </div>
    `
  },
  {
    label: '2. 제품 조회',
    content: `
      <div class="section">
        <h2>2. 제품 조회</h2>
        <h3>2.1 제품 조회 <span class="path">/products</span></h3>
        <p><strong>설명:</strong> 제품 정보를 조회하고 상세 내용을 확인할 수 있습니다.</p>
        
        <img src="/manual-images/user_2_product_list.png" alt="제품 조회" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>기준월 선택</strong> - 상단 드롭다운에서 기준월을 선택하면 해당 월의 제품·약가·수수료율이 표시됩니다.</li>
          <li><strong>제품 목록 조회</strong> - 제품명, 보험코드, 약가, 수수료율(%), 비고를 테이블 형태로 확인할 수 있습니다.</li>
          <li><strong>제품 상세 조회</strong> - 제품명을 클릭하면 상세 화면으로 이동합니다.</li>
          <li><strong>제품 검색</strong> - 제품명, 보험코드로 목록을 검색할 수 있습니다.</li>
          <li><strong>정렬·엑셀 다운로드</strong> - 컬럼 헤더로 정렬하고, 목록을 엑셀 파일로 내려받을 수 있습니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li>상단 <strong>기준월</strong>을 선택합니다.</li>
          <li>검색창에 <strong>제품명·보험코드</strong>를 입력해 목록을 좁힙니다.</li>
          <li>확인할 <strong>제품명</strong>을 클릭해 상세 정보를 봅니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>보험코드·약가는 <strong>기준월(base_month)</strong>에 따라 다를 수 있습니다.</li>
        </ul></div>
      </div>
    `
  },
  {
    label: '3. 병의원 조회',
    content: `
      <div class="section">
        <h2>3. 병의원 조회</h2>
        <h3>3.1 병의원 조회 <span class="path">/clients</span></h3>
        <p><strong>설명:</strong> 담당 병의원 정보를 조회하고 상세 내용을 확인할 수 있습니다.</p>
        
        <img src="/manual-images/user_3_hospital_list.png" alt="병의원 조회" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>병의원 목록 조회</strong> - 담당 병의원의 병의원코드, 병의원명, 사업자등록번호, 원장명, 주소, 비고를 확인할 수 있습니다.</li>
          <li><strong>병의원 상세 조회</strong> - 병의원명을 클릭하면 상세 화면으로 이동합니다.</li>
          <li><strong>병의원 검색</strong> - 병의원코드, 병의원명, 사업자등록번호로 검색할 수 있습니다.</li>
          <li><strong>정렬·엑셀 다운로드</strong> - 컬럼 헤더로 정렬하고, 목록을 엑셀 파일로 내려받을 수 있습니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li>검색창에 <strong>병의원코드·병의원명·사업자등록번호</strong>로 검색합니다.</li>
          <li>확인할 <strong>병의원명</strong>을 클릭해 상세 정보를 봅니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li><strong>본인 담당 병의원만</strong> 목록에 표시됩니다.</li>
        </ul></div>
      </div>
    `
  },
  {
    label: '4. 실적 관리',
    content: `
      <div class="section">
        <h2>4. 실적 관리</h2>
        <h3>4.1 실적 등록 <span class="path">/performance/register</span></h3>
        <p><strong>설명:</strong> 담당 병의원에 대한 실적 데이터를 등록할 수 있습니다.</p>
        
        <img src="/manual-images/user_4_1_edi.png" alt="실적 등록" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>기본 정보 입력</strong> - 정산월, 처방월, 담당 병의원, 제품, 처방수량, 처방유형, 비고 등 실적의 기본 정보를 입력</li>
          <li><strong>증빙 파일 업로드</strong> - 처방전, 영수증 등 실적을 증명하는 파일을 업로드하여 관리</li>
          <li><strong>입력값 유효성 검사</strong> - 필수 항목 누락, 숫자 형식 오류 등을 자동으로 체크하여 정확한 데이터 입력</li>
          <li><strong>저장 시 확인 메시지</strong> - 실적 데이터 저장 전 입력 내용을 최종 확인할 수 있는 메시지 제공</li>
          <li><strong>실적 데이터 수정</strong> - 이미 등록된 실적 데이터를 선택하여 내용을 수정</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li>상단에서 <strong>정산월</strong>과 <strong>담당 병의원</strong>을 선택합니다.</li>
          <li>표에서 <strong>처방월</strong>을 먼저 선택한 뒤 <strong>제품명</strong>을 입력해 검색·선택합니다.</li>
          <li><strong>처방수량</strong>을 입력하면 처방액·지급액이 자동 계산됩니다.</li>
          <li><strong>저장</strong>을 누르면 검수 대기(신규) 상태로 등록됩니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>수수료율은 병의원-업체 <strong>등급(A~E)에 따라 자동 적용</strong>되며 임의 수정할 수 없습니다.</li>
          <li><strong>검수중·검수완료</strong> 상태의 실적은 수정/삭제할 수 없습니다(대기 상태만 가능).</li>
          <li>등록 화면의 <strong>삭제는 영구 삭제</strong>입니다(복구 불가).</li>
          <li><strong>반품/정정</strong>은 처방수량을 <strong>음수(-)</strong>로 입력합니다.</li>
          <li>본인 <strong>담당 병의원</strong>의 실적만 등록할 수 있습니다.</li>
        </ul></div>

        <h3>4.2 등록 현황 <span class="path">/performance/list</span></h3>
        <p><strong>설명:</strong> 전체 등록한 실적 내용을 조회할 수 있습니다. 이번 달뿐 아니라 지난 내역까지 모두 확인할 수 있습니다.</p>
        
        <img src="/manual-images/user_4_2_edi.png" alt="등록 현황" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>전체 실적 조회</strong> - 월 제한 없이 등록된 모든 실적 데이터를 확인</li>
          <li><strong>정산월별 필터링</strong> - 특정 정산월을 기준으로 실적 데이터를 필터링</li>
          <li><strong>처방월별 필터링</strong> - 특정 처방월을 기준으로 실적 데이터를 필터링</li>
          <li><strong>병의원별 필터링</strong> - 특정 병의원을 기준으로 실적 데이터를 필터링</li>
          <li><strong>실적 상세 조회</strong> - 각 실적 건의 상세 내용을 확인</li>
          <li><strong>실적 수정</strong> - 등록된 실적을 선택하여 내용 수정</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li><strong>정산월</strong>·<strong>처방월</strong>·<strong>병의원</strong> 필터로 범위를 좁힙니다.</li>
          <li>목록에서 건별 상세·수정이 필요한 행을 확인합니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li><strong>검수중·검수완료</strong> 상태 건은 수정할 수 없습니다.</li>
          <li>상태 의미: <strong>대기(신규)</strong>=제출 전·수정 가능, <strong>검수중</strong>=관리자 검수 중, <strong>완료</strong>=검수 완료.</li>
        </ul></div>
      </div>
    `
  },
  {
    label: '5. 정산내역서 조회',
    content: `
      <div class="section">
        <h2>5. 정산내역서 조회</h2>
        <h3>5.1 정산내역서 조회 <span class="path">/settlements</span></h3>
        <p><strong>설명:</strong> 공유된 정산내역서를 조회하고 다운로드할 수 있습니다.</p>
        
        <img src="/manual-images/user_5_1_payment.png" alt="정산내역서 조회" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>정산월 선택</strong> - 관리자가 공유한 정산월만 드롭다운에 표시되며, 선택한 월의 정산 내역이 한 화면에 표시됩니다.</li>
          <li><strong>처방월·병의원 필터</strong> - 처방월, 병의원으로 상세 목록을 좁혀 볼 수 있습니다.</li>
          <li><strong>정산 요약</strong> - 지급 처방액, 구간수수료, 공급가, 부가세, 합계액(총 지급액)을 상단에서 확인할 수 있습니다.</li>
          <li><strong>실적 상세 목록</strong> - 병의원·처방월·제품별 정산 상세 행을 테이블로 확인할 수 있습니다.</li>
          <li><strong>전달사항·엑셀 다운로드</strong> - 관리자 전달사항을 확인하고, 정산 내역을 <strong>엑셀</strong> 파일로 내려받을 수 있습니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li>상단 <strong>정산월</strong>을 선택합니다(공유된 월만 표시).</li>
          <li>필요 시 <strong>처방월</strong>·<strong>병의원</strong> 필터를 적용하고, <strong>전달사항</strong>을 확인합니다.</li>
          <li>상단 요약·하단 상세 목록을 확인한 뒤, 필요 시 <strong>엑셀 다운로드</strong>합니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>관리자가 <strong>공유한 정산월</strong>만 조회할 수 있습니다.</li>
          <li>표시 정산액은 <strong>검수완료분 기준</strong>으로 산정됩니다.</li>
        </ul></div>
      </div>
    `
  },
  {
    label: '6. 내 정보 관리',
    content: `
      <div class="section">
        <h2>6. 내 정보 관리</h2>
        <h3>6.1 내 정보 조회/수정 <span class="path">/my-info</span></h3>
        <p><strong>설명:</strong> 계정 정보를 조회하고 수정할 수 있습니다.</p>
        
        <img src="/manual-images/user_6_1_myinfo.png" alt="내 정보 조회/수정" class="manual-image">
        
        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>기본 정보 조회</strong> - 현재 등록된 업체명, 담당자명, 연락처, 이메일 등 기본 정보를 확인할 수 있습니다.</li>
          <li><strong>담당자 정보 수정</strong> - 담당자명, 부서, 직책 등의 담당자 정보를 수정할 수 있습니다.</li>
          <li><strong>연락처 수정</strong> - 휴대폰 번호, 사무실 전화번호, 팩스 번호 등을 수정할 수 있습니다.</li>
          <li><strong>이메일 수정</strong> - 로그인 시 사용하는 이메일 주소를 변경할 수 있습니다.</li>
          <li><strong>저장 시 확인 메시지</strong> - 정보 수정 후 저장 시 변경사항을 최종 확인할 수 있는 메시지를 제공합니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li><strong>내 정보</strong> 메뉴에서 현재 등록 정보를 확인합니다.</li>
          <li>수정할 항목을 변경한 뒤 <strong>저장</strong>합니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>필수 항목은 비워둘 수 없습니다.</li>
          <li><strong>이메일</strong>은 로그인 ID로 사용됩니다. 변경 시 로그인 정보가 바뀝니다.</li>
        </ul></div>

        <h3>6.2 비밀번호 변경 <span class="path">/my-info/change-password</span></h3>
        <p><strong>설명:</strong> 계정 비밀번호를 변경할 수 있습니다.</p>

        <img src="/manual-images/user_6_2_pw.png" alt="내 정보 조회/수정" class="manual-image">

        <h4>주요 기능:</h4>
        <ul class="feature-list">
          <li><strong>현재 비밀번호 확인</strong> - 보안을 위해 현재 사용 중인 비밀번호를 입력하여 본인 확인을 수행합니다.</li>
          <li><strong>새 비밀번호 입력</strong> - 보안 정책에 맞는 새로운 비밀번호를 입력할 수 있습니다.</li>
          <li><strong>비밀번호 변경</strong> - 입력된 새 비밀번호로 계정 비밀번호를 변경합니다.</li>
          <li><strong>입력값 유효성 검사</strong> - 비밀번호 강도, 길이, 특수문자 포함 여부 등을 자동으로 검사합니다.</li>
          <li><strong>변경 시 확인 메시지</strong> - 비밀번호 변경 완료 시 성공 여부를 확인할 수 있는 메시지를 제공합니다.</li>
        </ul>
        <h4>📋 사용 방법</h4>
        <ol class="usage-steps">
          <li><strong>현재 비밀번호</strong>를 입력해 본인 확인을 합니다.</li>
          <li><strong>새 비밀번호</strong>와 <strong>확인</strong>을 입력합니다.</li>
          <li><strong>변경</strong> 버튼으로 저장합니다.</li>
        </ol>
        <div class="caution"><h4>⚠️ 주의사항</h4><ul>
          <li>비밀번호는 시스템 <strong>보안 정책(길이·특수문자 등)</strong>을 충족해야 합니다.</li>
          <li>변경 후에는 <strong>새 비밀번호</strong>로 다시 로그인해야 할 수 있습니다.</li>
        </ul></div>
      </div>
    `
  }
];

const tabs = computed(() => {
  return isAdminManual.value ? adminManualTabs : userTabs;
});
</script>

<style scoped>
.manual-container {
  height: 100vh;
  overflow-y: auto;
  background-color: #fff;
  padding: 0px;
  margin-left: 0px;
}

.manual-content {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
  position: relative;
  overflow: visible;
}

.manual-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  box-shadow: 0 0px 0px rgba(0,0,0,0);
  border-radius: 0px 0px 0px 0px;
  margin: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 40px 16px 40px;
}

h1 {
  color: #555;
  border-bottom: none;
  padding: 0;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  background: #fff;
  font-size: 24px;
  font-weight: 600;
}

.manual-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  overflow-x: auto;
  padding: 0 20px;
}

.manual-tab {
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.3s ease;
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: #999;
  flex-shrink: 0;
}

.manual-tab:hover {
  background-color: var(--primary-color-lightest);
  color: var(--primary-color);
}

.manual-tab.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
  background-color: #fff;
}

.manual-html-content {
  font-family: 'Noto Sans KR', sans-serif;
  line-height: 1.6;
  color: #333;
  padding: 40px;
}

.manual-html-content :deep(.section) {
  margin-bottom: 30px;
  padding: 0px;
  background: #fff;
  border-radius: 5px;
}

.manual-html-content :deep(h2) {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
}

.manual-html-content :deep(h3) {
  color: #555;
  margin-top: 25px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 500;
}

.manual-html-content :deep(h4) {
  color: #333;
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.manual-html-content :deep(.feature-list) {
  list-style-type: none;
  padding-left: 20px;
  margin: 15px 0;
}

.manual-html-content :deep(.feature-list li) {
  margin-bottom: 8px;
  position: relative;
  padding-left: 0;
}

.manual-html-content :deep(.feature-list li:before) {
  content: "•";
  color: var(--primary-color);
  font-weight: bold;
  position: absolute;
  left: -15px;
}

.manual-html-content :deep(.path) {
  color: #7f8c8d;
  font-family: 'Courier New', monospace;
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
}

.manual-html-content :deep(.path-note) {
  color: #666;
  font-size: 13px;
  background: #f8f9fa;
  padding: 8px 12px;
  border-left: 3px solid var(--primary-color);
  margin: 12px 0;
}

.manual-html-content :deep(.manual-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.manual-html-content :deep(.manual-table th),
.manual-html-content :deep(.manual-table td) {
  border: 1px solid #ddd;
  padding: 8px 10px;
  text-align: left;
}

.manual-html-content :deep(.manual-table th) {
  background: #f5f5f5;
  font-weight: 600;
}

.manual-html-content :deep(.type-badge) {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 6px;
  vertical-align: middle;
}

.manual-html-content :deep(.type-badge.list) {
  background: #e3f2fd;
  color: #1565c0;
}

.manual-html-content :deep(.type-badge.subpage) {
  background: #e8f5e9;
  color: #2e7d32;
}

.manual-html-content :deep(.type-badge.modal) {
  background: #fff3e0;
  color: #e65100;
}

.manual-html-content :deep(.subsection-title) {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 2px solid #eee;
  color: #555;
}

.manual-html-content :deep(.audit-skip) {
  color: #999;
  font-style: italic;
}

.manual-html-content :deep(.muted) {
  color: #999;
  font-size: 13px;
}

.manual-html-content :deep(p) {
  margin: 15px 0;
  line-height: 1.6;
}

.manual-html-content :deep(strong) {
  color: #2c3e50;
  font-weight: 600;
}

.manual-html-content :deep(.manual-image) {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 8px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.manual-html-content :deep(.process-steps) {
  margin: 20px 0;
}

.manual-html-content :deep(.usage-steps) {
  margin: 12px 0 20px;
  padding-left: 24px;
  line-height: 1.7;
}

.manual-html-content :deep(.usage-steps li) {
  margin-bottom: 8px;
}

.manual-html-content :deep(.caution) {
  background: #fff8e6;
  border: 1px solid #f0d78c;
  border-left: 4px solid #e6a800;
  border-radius: 6px;
  padding: 14px 18px;
  margin: 16px 0 24px;
}

.manual-html-content :deep(.caution h4) {
  margin-top: 0;
  margin-bottom: 10px;
  color: #8a6d00;
}

.manual-html-content :deep(.caution ul) {
  margin: 0;
  padding-left: 20px;
}

.manual-html-content :deep(.caution li) {
  margin-bottom: 6px;
  line-height: 1.6;
}

.manual-html-content :deep(.step) {
  background: #f8f9fa;
  border-left: 4px solid #3498db;
  padding: 15px 20px;
  margin-bottom: 15px;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.manual-html-content :deep(.step strong) {
  color: #2980b9;
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.manual-html-content :deep(.step em) {
  font-style: normal;
  font-weight: 600;
  color: #27ae60;
}

.pdf-download-button {
  font-weight: 400;
  font-size: 0.9rem;
}

:deep(.pdf-download-button .p-button-icon) {
  font-size: 1.25rem;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .manual-container {
    padding: 10px;
  }
  
  .manual-content {
    border-radius: 0;
  }
  
  h1 {
    font-size: 20px;
    padding: 15px 20px;
  }
  
  .manual-tabs {
    padding: 0 10px;
  }
  
  .manual-tab {
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .manual-html-content :deep(.section) {
    padding: 15px;
  }
  
  .manual-html-content :deep(.image-placeholder) {
    height: 200px;
  }
}
</style> 