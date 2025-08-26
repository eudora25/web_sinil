<template>
  <div class="admin-products-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">제품 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row">
        <div style="display: flex; align-items: center; gap: 8px; margin-right: 24px;">
          <label style="white-space: nowrap;">기준월</label>
          <select v-model="selectedMonth" @change="filterByMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
        <span class="filter-item p-input-icon-left">
          <InputText
            v-model="filters['global'].value"
            placeholder="제품명, 보험코드 검색"
            class="search-input-only"
          />
        </span>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ filteredProducts.length }} 건
        </div>
        <div class="data-card-buttons">
          <button class="btn-excell-download" @click="downloadExcel" :disabled="filteredProducts.length === 0">
            엑셀 다운로드
          </button>
        </div>
      </div>
      <DataTable
        :value="filteredProducts"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        v-model:filters="filters"
        :globalFilterFields="['base_month', 'product_name', 'insurance_code']"
        class="custom-table products-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 제품이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
        </Column>
        <Column field="product_name" header="제품명" :headerStyle="{ width: columnWidths.product_name }" :sortable="true">
          <template #body="slotProps">
            <a href="#" class="text-link" @click.prevent="goToDetail(slotProps.data.id)">{{ slotProps.data.product_name }}</a>
          </template>
        </Column>
        <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true" />
        <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true">
          <template #body="slotProps">
            {{ slotProps.data.price !== undefined && slotProps.data.price !== null ? slotProps.data.price.toLocaleString() : '' }}
          </template>
        </Column>
        <Column header="수수료율(%)" :headerStyle="{ width: columnWidths.commission_rate }" :sortable="true">
          <template #body="slotProps">
            {{ getCommissionRate(slotProps.data) }}
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
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const products = ref([]);
const filters = ref({ 'global': { value: null, matchMode: 'contains' } });
const selectedMonth = ref(''); // 문자열로 관리
const availableMonths = ref([]); // 기준월 목록
const router = useRouter();
const userCommissionGrade = ref('A');
const currentPageFirstIndex = ref(0);
const loading = ref(true); // 로딩 상태 추가

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  product_name: '28%',
  insurance_code: '20%',
  price: '12%',
  commission_rate: '12%',
  remarks: '24%'
};

// 기준월 목록 생성 (최신순)
const generateAvailableMonths = () => {
  const monthSet = new Set();
  products.value.forEach((product) => {
    if (product.base_month) {
      monthSet.add(product.base_month);
    }
  });
  availableMonths.value = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

// 기준월 필터링 (중복 보험코드 제거 로직 삭제)
const filteredProducts = computed(() => {
  if (!selectedMonth.value) return [];
  return products.value.filter((p) => {
    return p.base_month === selectedMonth.value;
  });
});

function getCommissionRate(product) {
  let rate = 0;
  if (userCommissionGrade.value === 'A') {
    rate = product.commission_rate_a || 0;
  } else if (userCommissionGrade.value === 'B') {
    rate = product.commission_rate_b || 0;
  } else if (userCommissionGrade.value === 'C') {
    rate = product.commission_rate_c || 0;
  } else if (userCommissionGrade.value === 'D') {
    rate = product.commission_rate_d || 0;
  } else if (userCommissionGrade.value === 'E') {
    rate = product.commission_rate_e || 0;
  } else {
    rate = product.commission_rate_a || 0;
  }
  return rate ? (rate * 100).toFixed(1) + '%' : '-';
}

function goToDetail(id) {
  router.push(`/products/${id}`);
}

const fetchProducts = async () => {
  loading.value = true;
  try {
    // 페이지네이션을 사용하여 모든 기준월 데이터 가져오기
    let allMonthData = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000;
    
    while (hasMore) {
      const { data: monthData, error: monthError } = await supabase
        .from('products')
        .select('base_month')
        .eq('status', 'active')
        .not('base_month', 'is', null)
        .order('base_month', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (monthError) {
        console.error('기준월 목록 로딩 오류:', monthError);
        return;
      }
      
      if (monthData && monthData.length > 0) {
        allMonthData = allMonthData.concat(monthData);
        offset += limit;
        
        // 더 이상 데이터가 없으면 중단
        if (monthData.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    console.log('가져온 기준월 데이터 개수:', allMonthData.length);
    
    // 중복 제거하고 최신순으로 정렬
    const monthSet = new Set();
    allMonthData.forEach((item) => {
      if (item.base_month) {
        monthSet.add(item.base_month);
      }
    });
    
    availableMonths.value = Array.from(monthSet).sort((a, b) => {
      return b.localeCompare(a); // 최신순 정렬
    });
    
    console.log('추출된 기준월 목록:', availableMonths.value);
    
    // 최신 연월을 기본값으로 설정하고 해당 월의 제품 불러오기
    if (availableMonths.value.length > 0) {
      selectedMonth.value = availableMonths.value[0];
      await fetchProductsByMonth(selectedMonth.value);
    }
  } catch (err) {
    console.error('기준월 목록 로딩 오류:', err);
  } finally {
    loading.value = false;
  }
}

// 선택된 기준월의 제품만 불러오는 함수 (product_company_not_assignments 제외)
const fetchProductsByMonth = async (month) => {
  if (!month) return;
  
  loading.value = true;
  try {
    // 1. product_company_not_assignments에 있는 제품 ID들 가져오기
    const { data: assignedProductIds, error: assignedError } = await supabase
      .from('product_company_not_assignments')
      .select(`
        product_id,
        companies!inner(
          id,
          user_type,
          approval_status
        )
      `)
      .eq('companies.user_type', 'user')
      .eq('companies.approval_status', 'approved');

    if (assignedError) {
      console.error('할당된 제품 ID 조회 오류:', assignedError);
      return;
    }

    const excludedProductIds = assignedProductIds.map(item => item.product_id);

    // 2. products 테이블에서 해당 기준월의 모든 제품 조회 (할당된 제품 제외)
    let query = supabase
      .from('products')
      .select('*')
      .eq('base_month', month)
      .eq('status', 'active')
      .order('product_name', { ascending: true })
      .limit(1000);

    if (excludedProductIds.length > 0) {
      query = query.not('id', 'in', `(${excludedProductIds.join(',')})`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('제품 데이터 로딩 오류:', error);
      return;
    }
    
    products.value = data || [];
  } catch (err) {
    console.error('제품 데이터 로딩 오류:', err);
  } finally {
    loading.value = false;
  }
}

// 기준월 변경 시 제품 다시 불러오기
const filterByMonth = async () => {
  if (selectedMonth.value) {
    await fetchProductsByMonth(selectedMonth.value);
  }
}

const fetchUserCommissionGrade = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: company, error } = await supabase
      .from('companies')
      .select('default_commission_grade')
      .eq('user_id', session.user.id)
      .single();
    if (!error && company) {
      userCommissionGrade.value = company.default_commission_grade || 'A';
    }
  } catch (err) {
    console.error('사용자 등급 조회 오류:', err);
    userCommissionGrade.value = 'A';
  }
};

// 엑셀 다운로드 함수
async function downloadExcel() {
  if (!filteredProducts.value || filteredProducts.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  try {
    // ExcelJS 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('제품목록');
    
    // 헤더 추가
    const headers = ['No', '기준월', '제품명', '보험코드', '약가', '수수료율(%)', '비고'];
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
    filteredProducts.value.forEach((product, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        product.base_month || '',
        product.product_name || '',
        product.insurance_code || '',
        product.price || 0,
        getCommissionRate(product),
        product.remarks || ''
      ]);
      
      // 데이터 행 스타일 설정
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle' };
        
        // 가운데 정렬이 필요한 컬럼들 (No, 기준월, 보험코드)
        if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // 숫자 형식 설정
        if (colNumber === 5) { // 약가
          cell.numFmt = '#,##0';
        }
      });
    });
    
    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 8 },   // No
      { width: 12 },  // 기준월
      { width: 32 },  // 제품명
      { width: 12 },  // 보험코드
      { width: 12 },  // 약가
      { width: 12 },  // 수수료율
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
    let fileName = '제품목록';
    if (selectedMonth.value) {
      fileName += `_${selectedMonth.value}`;
    }
    fileName += `_${dateStr}.xlsx`;
    
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

onMounted(async () => {
  await fetchUserCommissionGrade();
  await fetchProducts();
});
</script>
