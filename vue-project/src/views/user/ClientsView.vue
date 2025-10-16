<template>
  <div class="admin-clients-view page-container">
    <div class="page-header">
      <div class="header-title">병의원 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row">
        <span class="filter-item p-input-icon-left">
          <InputText
            v-model="filters['global'].value"
            placeholder="병의원코드, 병의원명, 사업자등록번호 검색"
            class="search-input-only"
          />
        </span>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ clients.length }} 건
        </div>
        <div class="data-card-buttons">
        <button class="btn-excell-download" @click="downloadExcel" :disabled="clients.length === 0">
          엑셀 다운로드
        </button>
      </div>
      </div>
      <DataTable
        :value="clients"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        v-model:filters="filters"
        :globalFilterFields="['client_code', 'name', 'business_registration_number']"
        class="custom-table clients-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 병의원이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
        </Column>
        <Column field="client_code" header="병의원코드" :headerStyle="{ width: columnWidths.client_code }" :sortable="true" />
        <Column field="name" header="병의원명" :headerStyle="{ width: columnWidths.name }" :sortable="true">
          <template #body="slotProps">
            <a href="#" class="text-link ellipsis-cell" :title="slotProps.data.name" @click.prevent="goToDetail(slotProps.data.id)" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.name }}</a>
          </template>
        </Column>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: columnWidths.business_registration_number }" :sortable="true">
          <template #body="slotProps">
            {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
          </template>
        </Column>
        <Column field="owner_name" header="원장명" :headerStyle="{ width: columnWidths.owner_name }" :sortable="true" />
        <Column field="address" header="주소" :headerStyle="{ width: columnWidths.address }" :sortable="true">
          <template #body="slotProps">
            <span class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
          </template>
        </Column>
        <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true" />
      </DataTable>
    </div>

    <!-- 전체 화면 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const clients = ref([]);
const filters = ref({ 'global': { value: null, matchMode: 'contains' } });
const router = useRouter();
const currentPageFirstIndex = ref(0);
const loading = ref(true);

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  client_code: '7%',
  name: '18%',
  business_registration_number: '9%',
  owner_name: '7%',
  address: '39%',
  remarks: '16%'
};

function goToDetail(id) {
  router.push(`/clients/${id}`);
}

const fetchClients = async () => {
  loading.value = true;
  try {
    // 1. 로그인한 사용자의 UID
  const { data: { session } } = await supabase.auth.getSession();
  const userUid = session?.user?.id;

  // 2. companies 테이블에서 내 업체 id(uuid) 찾기
  const { data: myCompany, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userUid)
    .single();

  if (companyError || !myCompany) {
    clients.value = [];
    return;
  }
  const companyId = myCompany.id;

  // 3. 매핑 테이블에서 내 거래처 id 목록 추출
  const { data: assignments, error: assignError } = await supabase
    .from('client_company_assignments')
    .select('client_id')
    .eq('company_id', companyId);

  if (assignError || !assignments || assignments.length === 0) {
    clients.value = [];
    return;
  }

  const clientIds = assignments.map(a => a.client_id);

  // 4. 거래처 테이블에서 해당 id만 조회
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .in('id', clientIds)
    .eq('status', 'active')
    .order('client_code', { ascending: true });

  if (!error && data) {
    clients.value = data;
  }
  } finally {
    loading.value = false;
  }
};

// 엑셀 다운로드 함수
async function downloadExcel() {
  if (!clients.value || clients.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  try {
    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('병의원 목록');
    
    // 헤더 추가
    const headers = ['No', '병의원코드', '병의원명', '사업자등록번호', '원장명', '주소', '비고'];
    worksheet.addRow(headers);
    
    // 헤더 스타일 설정
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '76933C' } // RGB(118, 147, 60)
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // 데이터 추가
    clients.value.forEach((client, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        client.client_code || '',
        client.name || '',
        client.business_registration_number || '',
        client.owner_name || '',
        client.address || '',
        client.remarks || ''
      ]);
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle' };
        
        // 가운데 정렬이 필요한 컬럼들 (No, 병의원코드, 사업자등록번호, 원장명)
        if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
    
    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 8 },   // No
      { width: 12 },  // 병의원코드
      { width: 32 },  // 병의원명
      { width: 16 },  // 사업자등록번호
      { width: 12 },  // 원장명
      { width: 64 },  // 주소
      { width: 24 }   // 비고
    ];
    
    // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
    for (let row = 1; row <= worksheet.rowCount; row++) {
      for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      }
    }
    
    // 헤더행 고정 및 눈금선 숨기기
    worksheet.views = [
      {
        showGridLines: false,
        state: 'frozen',
        xSplit: 0,
        ySplit: 1
      }
    ];
    
    // 파일 다운로드
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `병의원목록_${dateStr}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    
  } catch (err) {
    console.error('엑셀 다운로드 오류:', err);
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
  }
}

// 오버플로우 감지 및 툴팁 제어 함수들
const checkOverflow = (event) => {
  const element = event.target;
  
  // 실제 오버플로우 감지
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const fontFamily = computedStyle.fontFamily;
  
  // 임시 캔버스를 만들어서 텍스트의 실제 너비 측정
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(element.textContent).width;
  
  // 패딩과 보더 고려
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
  
  const availableWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
  const isOverflowed = textWidth > availableWidth;
  
  // console.log('이용자 병의원 오버플로우 체크:', { text: element.textContent, textWidth, availableWidth, isOverflowed });
  
  if (isOverflowed) {
    element.classList.add('overflowed');
    // console.log('이용자 병의원 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    // console.log('이용자 병의원 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  // console.log('이용자 병의원 오버플로우 클래스 제거됨');
}

// 사업자번호 형식 변환 함수
function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '-';
  
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 10자리가 아니면 원본 반환
  if (numbers.length !== 10) return businessNumber;
  
  // 형식 변환: ###-##-#####
  return numbers.substring(0, 3) + '-' + numbers.substring(3, 5) + '-' + numbers.substring(5);
}

onMounted(() => {
  fetchClients();
});
</script>
