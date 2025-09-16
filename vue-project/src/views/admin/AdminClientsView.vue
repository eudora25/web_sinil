<template>
  <div class="admin-clients-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">병의원 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row" style="display:flex; align-items:center; justify-content:flex-start;">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="병의원명, 사업자번호, 원장명, 주소"
              class="search-input"
              @keyup.enter="doSearch"
              style="width:100%;"
            />
            <button
              v-if="searchInput.length > 0"
              class="clear-btn"
              @click="clearSearch"
              title="검색어 초기화">
              ×
            </button>
          </span>
          <button
            class="search-btn"
            :disabled="searchInput.length < 2"
            @click="doSearch">
            검색
          </button>
        </div>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ filteredClients.length }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-excell-template" @click="downloadTemplate" style="margin-right: 1rem;">엑셀 템플릿</button>
          <button class="btn-excell-upload" @click="triggerFileUpload" style="margin-right: 1rem;">엑셀 등록</button>
          <button class="btn-excell-download" @click="downloadExcel" style="margin-right: 1rem;">엑셀 다운로드</button>
<!--          <button class="btn-delete" @click="deleteAllClients" style="margin-right: 1rem;">모두 삭제</button>-->
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
          <button class="btn-save" @click="openCreateModal">개별 등록</button>
        </div>
      </div>
      <DataTable
        :value="filteredClients"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-clients-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 병의원이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">
            {{ slotProps.index + currentPageFirstIndex + 1 }}
          </template>
        </Column>
        <Column
          field="client_code"
          header="병의원코드"
          :headerStyle="{ width: columnWidths.client_code }"
          :sortable="true"
        >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.client_code"
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.client_code }}</span>
          </template>
        </Column>
        <Column field="name" header="병의원명" :headerStyle="{ width: columnWidths.name }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.name"
              class="inline-edit-input"
              :id="`name_${slotProps.data.id}`"
            />
            <a v-else href="#" class="text-link ellipsis-cell" :title="slotProps.data.name" @click.prevent="goToDetail(slotProps.data.id)" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">
              {{ slotProps.data.name }}
            </a>
          </template>
        </Column>
        <Column
          field="business_registration_number"
          header="사업자등록번호"
          :headerStyle="{ width: columnWidths.business_registration_number }"
          :sortable="true"
          >
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.business_registration_number"
              class="inline-edit-input"
              :id="`business_registration_number_${slotProps.data.id}`"
              @input="formatBusinessNumber"
              @keypress="allowOnlyNumbers"
              @keydown="handleBackspace"
            />
            <span v-else>{{ slotProps.data.business_registration_number }}</span>
          </template>
        </Column>
        <Column field="owner_name" header="원장명" :headerStyle="{ width: columnWidths.owner_name }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.owner_name"
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.owner_name }}</span>
          </template>
        </Column>
        <Column field="address" header="주소" :headerStyle="{ width: columnWidths.address }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.address"
              class="inline-edit-input"
            />
            <span v-else class="ellipsis-cell" :title="slotProps.data.address" @mouseenter="checkOverflow" @mouseleave="removeOverflowClass">{{ slotProps.data.address }}</span>
          </template>
        </Column>
        <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.remarks"
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.remarks }}</span>
          </template>
        </Column>
        <Column field="remarks_settlement" header="정산용 비고" :headerStyle="{ width: columnWidths.remarks_settlement }" :sortable="true">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.remarks_settlement"
              class="inline-edit-input"
            />
            <span v-else>{{ slotProps.data.remarks_settlement }}</span>
          </template>
        </Column>
        <Column field="created_at" header="등록일자" :headerStyle="{ width: columnWidths.created_at }" :sortable="true">
          <template #body="slotProps">
            <span>{{
              slotProps.data.created_at
                ? new Date(slotProps.data.created_at).toISOString().split('T')[0]
                : ''
            }}</span>
          </template>
        </Column>
        <Column field="created_by" header="등록자" :headerStyle="{ width: columnWidths.created_by }" :sortable="true">
          <template #body="slotProps">
            <span>{{ slotProps.data.created_by_name || '-' }}</span>
          </template>
        </Column>
        <Column field="updated_at" header="수정일자" :headerStyle="{ width: columnWidths.updated_at }" :sortable="true">
          <template #body="slotProps">
            <span>{{
              slotProps.data.updated_at
                ? new Date(slotProps.data.updated_at).toISOString().split('T')[0]
                : '-'
            }}</span>
          </template>
        </Column>
        <Column field="updated_by" header="수정자" :headerStyle="{ width: columnWidths.updated_by }" :sortable="true">
          <template #body="slotProps">
            <span>{{ slotProps.data.updated_by_name || '-' }}</span>
          </template>
        </Column>
        <Column field="status" header="상태" :headerStyle="{ width: columnWidths.status }" :sortable="true">
          <template #body="slotProps">
            <select
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.status"
              class="inline-edit-input"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <span
              v-else
              :class="slotProps.data.status === 'active' ? 'active-badge' : 'inactive-badge'"
            >
              {{ slotProps.data.status === 'active' ? '활성' : '비활성' }}
            </span>
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: columnWidths.actions }">
          <template #body="slotProps">
            <div style="display: flex; gap: 4px; justify-content: center">
              <template v-if="slotProps.data.isEditing">
                <button class="btn-save-sm" @click="saveEdit(slotProps.data)" :disabled="!isEditValid(slotProps.data)" title="저장">
                  저장
                </button>
                <button class="btn-cancel-sm" @click="cancelEdit(slotProps.data)" title="취소">
                  취소
                </button>
              </template>
              <template v-else>
                <button class="btn-edit-sm" @click="startEdit(slotProps.data)" title="수정">
                  수정
                </button>
                <button class="btn-delete-sm" @click="deleteClient(slotProps.data)" title="삭제">
                  삭제
                </button>
              </template>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 전체 화면 로딩 오버레이 - 메뉴 진입 시 -->
    <div v-if="loading && !excelLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>

    <!-- 전체 화면 로딩 오버레이 - 엑셀 등록 시 -->
    <div v-if="excelLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">등록 진행중입니다...</div>
      </div>
    </div>

    <!-- 병의원 등록 모달 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>병의원 등록</h2>
          <button class="modal-close-btn" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateSubmit" class="form-grid">
            <div class="form-group">
              <label>병의원코드</label>
              <input v-model="newClient.client_code" type="text" />
            </div>
            <div class="form-group">
              <label>병의원명<span class="required">*</span></label>
              <input v-model="newClient.name" type="text" required />
            </div>
            <div class="form-group">
              <label>사업자등록번호<span class="required">*</span></label>
              <input 
                v-model="newClient.business_registration_number" 
                type="text" 
                required 
                @input="formatBusinessNumberModal"
                @keypress="allowOnlyNumbers"
                @keydown="handleBackspace"
              />
            </div>
            <div class="form-group">
              <label>원장명</label>
              <input v-model="newClient.owner_name" type="text" />
            </div>
            <div class="form-group">
              <label>주소</label>
              <input v-model="newClient.address" type="text" />
            </div>
            <div class="form-group">
              <label>비고</label>
              <input v-model="newClient.remarks" type="text" />
            </div>
            <div class="form-group">
              <label>정산용 비고</label>
              <input v-model="newClient.remarks_settlement" type="text" />
            </div>
            <div class="form-group">
              <label>상태</label>
              <select v-model="newClient.status">
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-save" @click="handleCreateSubmit" :disabled="!isCreateFormValid">등록</button>
          <button class="btn-close" @click="closeCreateModal">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { generateExcelFileName } from '@/utils/excelUtils'

const clients = ref([])
const loading = ref(false)
const excelLoading = ref(false)
const searchInput = ref('');
const searchKeyword = ref('');
const filteredClients = ref([]);
const currentPageFirstIndex = ref(0)
const filterBackup = ref(null)

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '3%',
  client_code: '6%',
  name: '12%',
  business_registration_number: '7%',
  owner_name: '6%',
  address: '16%',
  remarks: '8%',
  remarks_settlement: '8%',
  created_at: '6%',
  created_by: '6%',
  updated_at: '6%',
  updated_by: '6%',
  status: '5%',
  actions: '7%'
};

const isAnyEditing = ref(false); // 편집 중인 행이 있는지 확인
const router = useRouter();
const fileInput = ref(null)

// 모달 관련 변수
const showCreateModal = ref(false)
const newClient = ref({
  client_code: '',
  name: '',
  business_registration_number: '',
  owner_name: '',
  address: '',
  remarks: '',
  remarks_settlement: '',
  status: 'active'
})

function goCreate() {
  router.push('/admin/clients/create')
}
function goToDetail(id) {
  router.push(`/admin/clients/${id}`)
}

// 모달 관련 함수들
function openCreateModal() {
  showCreateModal.value = true
  // 폼 초기화
  newClient.value = {
    client_code: '',
    name: '',
    business_registration_number: '',
    owner_name: '',
    address: '',
    remarks: '',
    remarks_settlement: '',
    status: 'active'
  }
}

function closeCreateModal() {
  showCreateModal.value = false
}

// 폼 유효성 검사
const isCreateFormValid = computed(() => {
  return newClient.value.name && newClient.value.name.trim() !== '' &&
         newClient.value.business_registration_number && newClient.value.business_registration_number.trim() !== ''
})

// 모달에서 사업자등록번호 포맷팅
function formatBusinessNumberModal(event) {
  let value = event.target.value.replace(/[^0-9]/g, '')
  if (value.length >= 3) {
    value = value.substring(0, 3) + '-' + value.substring(3)
  }
  if (value.length >= 6) {
    value = value.substring(0, 6) + '-' + value.substring(6)
  }
  newClient.value.business_registration_number = value
}

// 모달에서 등록 처리
async function handleCreateSubmit() {
  // 필수 필드 검증
  if (!newClient.value.name || newClient.value.name.trim() === '') {
    alert('병의원명은 필수 입력 항목입니다.')
    return
  }

  if (!newClient.value.business_registration_number || newClient.value.business_registration_number.trim() === '') {
    alert('사업자등록번호는 필수 입력 항목입니다.')
    return
  }

  // 사업자등록번호 형식 검증 (10자리 숫자)
  const businessNumberDigits = newClient.value.business_registration_number.replace(/[^0-9]/g, '')
  if (businessNumberDigits.length !== 10) {
    alert('사업자등록번호는 10자리여야 합니다.')
    return
  }

  // 사업자등록번호 중복 확인
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('business_registration_number', newClient.value.business_registration_number)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때의 에러
    alert('중복 확인 중 오류가 발생했습니다: ' + checkError.message)
    return
  }

  if (existingClient) {
    alert(`이미 등록된 사업자등록번호입니다.\n등록된 병의원: ${existingClient.name}`)
    return
  }

  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('로그인 정보가 없습니다. 다시 로그인해주세요.')
    return
  }

  const dataToInsert = {
    client_code: newClient.value.client_code,
    name: newClient.value.name,
    business_registration_number: newClient.value.business_registration_number,
    owner_name: newClient.value.owner_name,
    address: newClient.value.address,
    remarks: newClient.value.remarks,
    remarks_settlement: newClient.value.remarks_settlement,
    status: newClient.value.status,
    created_by: user.id
  }

  const { error } = await supabase.from('clients').insert([dataToInsert])
  if (error) {
    alert('등록 실패: ' + error.message)
  } else {
    alert('등록되었습니다.')
    closeCreateModal()
    await fetchClients() // 목록 새로고침
  }
}

const fetchClients = async () => {
  loading.value = true;
  try {
    // 먼저 기본 데이터 가져오기
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_code', { ascending: true })

    console.log('fetchClients result:', { data, error });

    if (!error && data) {
      // created_by와 updated_by에 해당하는 회사명을 별도로 조회
      const userIds = [...new Set([
        ...data.filter(item => item.created_by).map(item => item.created_by),
        ...data.filter(item => item.updated_by).map(item => item.updated_by)
      ])];

      let companyMap = {};
      if (userIds.length > 0) {
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('user_id, company_name')
          .in('user_id', userIds);

        if (!companyError && companies) {
          companyMap = companies.reduce((acc, company) => {
            acc[company.user_id] = company.company_name;
            return acc;
          }, {});
        }
      }

      // 각 행에 편집 상태와 원본 데이터 백업 추가
      clients.value = data.map((item) => ({
        ...item,
        created_by_name: item.created_by ? (companyMap[item.created_by] || '관리자') : '-',
        updated_by_name: item.updated_by ? (companyMap[item.updated_by] || '관리자') : '-',
        isEditing: false,
        originalData: { ...item },
      }))
      filteredClients.value = clients.value;
    } else if (error) {
      console.error('fetchClients error:', error);
    }
  } catch (err) {
    console.error('fetchClients exception:', err);
  } finally {
    loading.value = false;
  }
}

// 수정 시작
const startEdit = (row) => {
  // 편집 시작 시 검색어 백업 및 필터 해제
  if (filterBackup.value === null) {
    filterBackup.value = searchInput.value
    searchInput.value = ''
  }
  // 다른 행이 편집 중이면 취소
  clients.value.forEach((item) => {
    if (item.isEditing && item.id !== row.id) {
      cancelEdit(item)
    }
  })

  // 원본 데이터 백업
  row.originalData = { ...row }
  row.isEditing = true
  isAnyEditing.value = true; // 편집 중인 행이 있음을 표시
}

// 변경값 감지 및 필수값 검증
const isEditValid = (row) => {
  // 필수값 검증
  const hasRequiredFields = row.name && row.name.trim() !== '' &&
                           row.business_registration_number && row.business_registration_number.trim() !== '';

  // 변경값 감지
  const hasChanges = row.client_code !== row.originalData.client_code ||
                    row.name !== row.originalData.name ||
                    row.business_registration_number !== row.originalData.business_registration_number ||
                    row.owner_name !== row.originalData.owner_name ||
                    row.address !== row.originalData.address ||
                    row.status !== row.originalData.status ||
                    row.remarks !== row.originalData.remarks ||
                    row.remarks_settlement !== row.originalData.remarks_settlement;

  return hasRequiredFields && hasChanges;
}

// 수정 취소
const cancelEdit = (row) => {
  // 편집 취소 시 검색어 복원
  if (filterBackup.value !== null) {
    searchInput.value = filterBackup.value
    filterBackup.value = null
  }
  // 원본 데이터로 복원
  Object.keys(row.originalData).forEach((key) => {
    if (key !== 'isEditing' && key !== 'originalData') {
      row[key] = row.originalData[key]
    }
  })
  row.isEditing = false
  isAnyEditing.value = false; // 편집 중인 행이 없음을 표시
}

// 수정 저장
const saveEdit = async (row) => {
  try {
    // 필수 필드 검증
    if (!row.name || row.name.trim() === '') {
      alert('병의원명은 필수 입력 항목입니다.');
      setTimeout(() => {
        const nameInput = document.getElementById(`name_${row.id}`);
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 100);
      return;
    }

    if (!row.business_registration_number || row.business_registration_number.trim() === '') {
      alert('사업자등록번호는 필수 입력 항목입니다.');
      setTimeout(() => {
        const businessNumberInput = document.getElementById(`business_registration_number_${row.id}`);
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

    // 사업자등록번호 형식 검증 (10자리 숫자)
    const businessNumberDigits = row.business_registration_number.replace(/[^0-9]/g, '');
    if (businessNumberDigits.length !== 10) {
      alert('사업자등록번호는 10자리여야 합니다.');
      setTimeout(() => {
        const businessNumberInput = document.getElementById(`business_registration_number_${row.id}`);
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

    // 상태 값 검증
    if (!['active', 'inactive'].includes(row.status)) {
      alert('상태는 active 또는 inactive여야 합니다.')
      return
    }

    // 변경된 값에 대해서만 중복체크
    const clientCodeChanged = row.client_code !== row.originalData.client_code;
    const businessNumberChanged = row.business_registration_number !== row.originalData.business_registration_number;

    // 병의원 코드 중복 체크 (변경된 경우에만)
    if (clientCodeChanged && row.client_code && row.client_code.trim() !== '') {
      try {
        console.log('병의원 코드 중복 검사 시작...');
        const { data: existingClientByCode, error: codeCheckError } = await supabase
          .from('clients')
          .select('id, name, client_code')
          .eq('client_code', row.client_code.trim())
          .neq('id', row.id) // 자신 제외
          .single();
        
        if (codeCheckError) {
          if (codeCheckError.code === 'PGRST116') {
            // 결과가 없는 경우 - 중복 없음
            console.log('병의원 코드 중복 없음');
          } else {
            // 다른 모든 오류 (HTTP 406, 500 등) - 중단
            console.error('병의원 코드 중복 검사 실패:', codeCheckError);
            alert(`병의원 코드 중복 검사 중 오류가 발생했습니다.\n\n오류 코드: ${codeCheckError.code}\n오류 메시지: ${codeCheckError.message}\n\n관리자에게 문의해주세요.`);
            return;
          }
        } else if (existingClientByCode) {
          alert(`동일한 병의원 코드로 이미 등록된 병의원이 있습니다.\n\n병의원명: ${existingClientByCode.name}\n병의원 코드: ${existingClientByCode.client_code}`);
          setTimeout(() => {
            const clientCodeInput = document.getElementById(`client_code_${row.id}`);
            if (clientCodeInput) {
              clientCodeInput.focus();
              clientCodeInput.select();
            }
          }, 100);
          return;
        }
        console.log('병의원 코드 중복 검사 통과');
      } catch (codeDuplicateCheckError) {
        console.error('병의원 코드 중복 검사 중 예외 발생:', codeDuplicateCheckError);
        alert('병의원 코드 중복 검사 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
    }

    // 사업자등록번호 중복 체크 (변경된 경우에만)
    if (businessNumberChanged) {
      try {
        console.log('사업자등록번호 중복 검사 시작...');
        const { data: existingClientByBusiness, error: businessCheckError } = await supabase
          .from('clients')
          .select('id, name, business_registration_number')
          .eq('business_registration_number', row.business_registration_number)
          .neq('id', row.id) // 자신 제외
          .single();
        
        if (businessCheckError) {
          if (businessCheckError.code === 'PGRST116') {
            // 결과가 없는 경우 - 중복 없음
            console.log('사업자등록번호 중복 없음');
          } else {
            // 다른 모든 오류 (HTTP 406, 500 등) - 중단
            console.error('사업자등록번호 중복 검사 실패:', businessCheckError);
            alert(`사업자등록번호 중복 검사 중 오류가 발생했습니다.\n\n오류 코드: ${businessCheckError.code}\n오류 메시지: ${businessCheckError.message}\n\n관리자에게 문의해주세요.`);
            return;
          }
        } else if (existingClientByBusiness) {
          alert(`동일한 사업자등록번호로 이미 등록된 병의원이 있습니다.\n\n병의원명: ${existingClientByBusiness.name}\n사업자등록번호: ${existingClientByBusiness.business_registration_number}`);
          setTimeout(() => {
            const businessNumberInput = document.getElementById(`business_registration_number_${row.id}`);
            if (businessNumberInput) {
              businessNumberInput.focus();
              businessNumberInput.select();
            }
          }, 100);
          return;
        }
        console.log('사업자등록번호 중복 검사 통과');
      } catch (businessDuplicateCheckError) {
        console.error('사업자등록번호 중복 검사 중 예외 발생:', businessDuplicateCheckError);
        alert('사업자등록번호 중복 검사 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
    }

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const updateData = {
      client_code: row.client_code || '',
      name: row.name,
      business_registration_number: row.business_registration_number,
      owner_name: row.owner_name || '',
      address: row.address || '',
      remarks: row.remarks || '',
      remarks_settlement: row.remarks_settlement || '',
      status: row.status,
      updated_by: currentUserId,
      updated_at: new Date().toISOString() // 명시적으로 수정 시간 설정
    }

    const { error } = await supabase.from('clients').update(updateData).eq('id', row.id)

    if (error) {
      alert('수정 실패: ' + error.message)
      return
    }

    // 편집 모드 종료
    row.isEditing = false
    row.originalData = { ...row }
    // 편집 저장 후 검색어 복원
    if (filterBackup.value !== null) {
      searchInput.value = filterBackup.value
      filterBackup.value = null
    }

    alert('수정되었습니다.')
  } catch (error) {
    console.error('수정 오류:', error)
    alert('수정 중 오류가 발생했습니다.')
  }
}

// 삭제
const deleteClient = async (row) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    // RPC를 호출하여 참조 여부 확인
    const { data: isReferenceExist, error: rpcError } = await supabase.rpc(
      'check_client_references_exist',
      { p_client_id: row.id }
    )

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    if (isReferenceExist != 0) {
      alert(`이 병의원은(${row.name}) 이미 사용되고있어 삭제할 수 없습니다.`);
      return;
    }

    const { error } = await supabase.from('clients').delete().eq('id', row.id)

    if (error) {
      throw new Error(error.message);
      return
    }

    // 목록에서 제거
    const index = clients.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      clients.value.splice(index, 1)
    }

    alert('삭제되었습니다.')
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

// 엑셀 템플릿 다운로드
const downloadTemplate = async () => {
  const templateData = [
    {
      병의원코드: '10001',
      병의원명: '강남사랑병원',
      사업자등록번호: '123-45-67890',
      원장명: '홍길동',
      주소: '서울시 강남구 테헤란로 123',
      비고: '',
      정산용비고: '',
      상태: '활성',
    },
  ]

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('병의원템플릿')

  // 헤더 정의
  const headers = Object.keys(templateData[0])
  worksheet.addRow(headers)

  // 헤더 스타일 설정
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 데이터 추가
  templateData.forEach((row) => {
    const dataRow = worksheet.addRow(Object.values(row))

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 가운데 정렬할 컬럼 지정 (병의원코드, 원장명, 상태)
      if ([1, 3, 4, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 3) {
        cell.numFmt = '@'
      }
    })
  })

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 12 }, // 병의원코드
    { width: 32 }, // 병의원명
    { width: 16 }, // 사업자등록번호
    { width: 12 }, // 원장명
    { width: 64 }, // 주소
    { width: 24 }, // 비고
    { width: 24 }, // 정산용비고
    { width: 10 }, // 상태
  ]

  // 헤더행 고정 및 눈금선 숨기기
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
      showGridLines: false
    }
  ]

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '병의원_엑셀등록_템플릿.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}

// 파일 업로드 트리거
const triggerFileUpload = () => {
  fileInput.value.click()
}

// 엑셀 파일 업로드 처리
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 엑셀 등록 로딩 시작
  excelLoading.value = true

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      alert('엑셀 파일에 데이터가 없습니다.')
      return
    }

    // 기존 데이터 확인
    const hasExistingData = clients.value.length > 0

    // 1단계: 기존 데이터 존재 시 확인
    if (hasExistingData) {
      if (!confirm('기존 데이터가 있습니다.\n계속 등록하시겠습니까?')) {
        event.target.value = ''
        return
      }

      // 2단계: 추가 등록 확인
      const choice = await showUploadChoiceModal()

      if (choice !== 'append') {
        // cancel이거나 잘못된 입력
        event.target.value = ''
        return
      }
    }

    // 데이터 변환 및 검증
    let uploadData = []
    const errors = []

    jsonData.forEach((row, index) => {
      const rowNum = index + 2 // 엑셀 행 번호 (헤더 제외)

      // 필수 필드 검증
      if (!row['병의원명']) {
        errors.push(`${rowNum}행: 병의원명이 필요합니다.`)
        return
      }
      if (!row['사업자등록번호']) {
        errors.push(`${rowNum}행: 사업자등록번호가 필요합니다.`)
        return
      }

      // 사업자등록번호 형식 검증 및 변환 (10자리 숫자)
      const businessNumber = row['사업자등록번호'].toString().replace(/[^0-9]/g, '');
      if (businessNumber.length !== 10) {
        errors.push(`${rowNum}행: 사업자등록번호는 10자리 숫자여야 합니다.`)
        return
      }

      // 사업자등록번호 형식 변환: ###-##-#####
      const formattedBusinessNumber = businessNumber.substring(0, 3) + '-' +
                                     businessNumber.substring(3, 5) + '-' +
                                     businessNumber.substring(5);

      // 상태 값 검증 및 변환
      let statusValue = 'active' // 기본값
      if (row['상태']) {
        if (row['상태'] === '활성') {
          statusValue = 'active'
        } else if (row['상태'] === '비활성') {
          statusValue = 'inactive'
        } else {
          errors.push(`${rowNum}행: 상태는 '활성' 또는 '비활성'이어야 합니다.`)
          return
        }
      } else {
        statusValue = 'active'
      }

      uploadData.push({
        client_code: row['병의원코드'] || '',
        name: row['병의원명'],
        business_registration_number: formattedBusinessNumber,
        owner_name: row['원장명'] || '',
        address: row['주소'] || '',
        remarks: row['비고'] || '',
        remarks_settlement: row['정산용비고'] || '',
        status: statusValue,
        rowNum: rowNum // 에러 표시용
      })
    })

    if (errors.length > 0) {
      alert('데이터 오류:\n' + errors.join('\n'))
      return
    }

    // 3단계: 데이터베이스 전체에서 중복 체크
    console.log('데이터베이스 중복 체크 시작...')
    const duplicateErrors = []
    const duplicateClients = []

    // 데이터베이스에서 모든 기존 데이터 조회
    const { data: existingClients, error: fetchError } = await supabase
      .from('clients')
      .select('client_code, business_registration_number, name')

    if (fetchError) {
      alert('기존 데이터 조회 중 오류가 발생했습니다: ' + fetchError.message)
      return
    }

    // 기존 데이터를 Set과 Map으로 변환하여 빠른 검색
    const existingClientCodes = new Set(existingClients.map(c => c.client_code).filter(code => code && code.trim() !== ''))
    const existingBusinessNumbers = new Set(existingClients.map(c => c.business_registration_number).filter(num => num))
    const existingClientCodeMap = new Map(existingClients.filter(c => c.client_code && c.client_code.trim() !== '').map(c => [c.client_code, c.name]))
    const existingBusinessNumberMap = new Map(existingClients.filter(c => c.business_registration_number).map(c => [c.business_registration_number, c.name]))

    for (const newClient of uploadData) {
      // 병의원 코드 중복 체크 (입력된 경우에만)
      if (newClient.client_code && newClient.client_code.trim() !== '') {
        if (existingClientCodes.has(newClient.client_code.trim())) {
          const existingName = existingClientCodeMap.get(newClient.client_code.trim())
          duplicateErrors.push(`${newClient.rowNum}행: 동일한 병의원 코드(${newClient.client_code})로 이미 등록된 병의원이 있습니다. (${existingName})`)
          duplicateClients.push(newClient)
        }
      }

      // 사업자등록번호 중복 체크
      if (newClient.business_registration_number) {
        if (existingBusinessNumbers.has(newClient.business_registration_number)) {
          const existingName = existingBusinessNumberMap.get(newClient.business_registration_number)
          duplicateErrors.push(`${newClient.rowNum}행: 동일한 사업자등록번호(${newClient.business_registration_number})로 이미 등록된 병의원이 있습니다. (${existingName})`)
          duplicateClients.push(newClient)
        }
      }
    }

    // 4단계: 중복 발견 시 처리
    if (duplicateErrors.length > 0) {
      console.log('중복 오류 발견:', duplicateErrors)
      
      // 중복 발견 시 계속 진행 여부 확인
      const duplicateCount = duplicateErrors.length
      if (!confirm(`중복 오류가 ${duplicateCount}건 발견되었습니다:\n\n` + duplicateErrors.join('\n') + `\n\n계속 등록 작업을 진행하시겠습니까?`)) {
        return
      }

      // 5단계: 중복 해결 방법 선택 (버튼 모달)
      const duplicateChoice = await showDuplicateChoiceModal()

      if (duplicateChoice === 'replace') {
        // 교체 모드: 중복되는 기존 병의원들 삭제
        for (const duplicateClient of duplicateClients) {
          // 병의원 코드로 삭제
          if (duplicateClient.client_code && duplicateClient.client_code.trim() !== '') {
            const { error: deleteError } = await supabase
              .from('clients')
              .delete()
              .eq('client_code', duplicateClient.client_code.trim())

            if (deleteError) {
              alert('기존 병의원 삭제 실패 (코드): ' + deleteError.message)
              return
            }
          }
          
          // 사업자등록번호로 삭제
          if (duplicateClient.business_registration_number) {
            const { error: deleteError } = await supabase
              .from('clients')
              .delete()
              .eq('business_registration_number', duplicateClient.business_registration_number)

            if (deleteError) {
              alert('기존 병의원 삭제 실패 (사업자번호): ' + deleteError.message)
              return
            }
          }
        }
        
        // 로컬 데이터에서도 삭제
        for (const duplicateClient of duplicateClients) {
          if (duplicateClient.client_code && duplicateClient.client_code.trim() !== '') {
            const index = clients.value.findIndex(c => c.client_code === duplicateClient.client_code.trim())
            if (index > -1) {
              clients.value.splice(index, 1)
            }
          }
          if (duplicateClient.business_registration_number) {
            const index = clients.value.findIndex(c => c.business_registration_number === duplicateClient.business_registration_number)
            if (index > -1) {
              clients.value.splice(index, 1)
            }
          }
        }
      } else if (duplicateChoice === 'keep') {
        // 기존 유지 모드: 중복되는 신규 병의원들 제외
        const duplicateItems = duplicateClients.map(c => c.rowNum)
        uploadData = uploadData.filter(item => !duplicateItems.includes(item.rowNum))
      } else {
        // cancel 모드: 업로드 취소
        return
      }
    }

    // 최종 등록
    const insertData = uploadData.map(item => {
      const { rowNum, ...data } = item
      return data
    })

    if (insertData.length === 0) {
      alert('등록할 데이터가 없습니다.')
      return
    }

    // 데이터베이스에 일괄 삽입
    const { error } = await supabase.from('clients').insert(insertData)

    if (error) {
      alert('업로드 실패: ' + error.message)
    } else {
      alert(`${insertData.length}건의 병의원 정보가 업로드되었습니다.`)
      await fetchClients() // 목록 새로고침
    }
  } catch (error) {
    console.error('파일 처리 오류:', error)
    alert('파일 처리 중 오류가 발생했습니다.')
  } finally {
    // 엑셀 등록 로딩 종료
    excelLoading.value = false
    // 파일 입력 초기화
    event.target.value = ''
  }
}

// 엑셀 다운로드 (현재 목록)
const downloadExcel = async () => {
  if (clients.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.')
    return
  }

  // 데이터 변환
  const excelData = clients.value.map((client, index) => ({
    No: index + 1,
    병의원코드: client.client_code || '',
    병의원명: client.name || '',
    사업자등록번호: client.business_registration_number || '',
    원장명: client.owner_name || '',
    주소: client.address || '',
    비고: client.remarks || '',
    정산용비고: client.remarks_settlement || '',
    상태: client.status === 'active' ? '활성' : '비활성',
    등록일시: client.created_at ? new Date(client.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    등록자: client.created_by_name || '-',
    수정일시: client.updated_at ? new Date(client.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    수정자: client.updated_by_name || '',
  }))

  // ExcelJS 워크북 생성
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('병의원목록')

  // 헤더 정의
  const headers = Object.keys(excelData[0])
  worksheet.addRow(headers)

  // 헤더 스타일 설정
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // 데이터 추가
  excelData.forEach((row) => {
    const dataRow = worksheet.addRow(Object.values(row))

    // 데이터 행 스타일 설정
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 }
      cell.alignment = { vertical: 'middle' }

      // 가운데 정렬할 컬럼 지정 (No, 병의원코드, 원장명, 상태, 등록일시, 등록자, 수정일시, 수정자)
      if ([1, 2, 4, 5, 9, 10, 12].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }

      // 사업자등록번호 컬럼은 텍스트 형식으로 설정
      if (colNumber === 4) {
        cell.numFmt = '@'
      }
    })
  })

  // 테이블 테두리 설정 - 전체를 얇은 실선으로 통일
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    })
  })

  // 컬럼 너비 설정
  worksheet.columns = [
    { width: 8 },  // No
    { width: 12 }, // 병의원코드
    { width: 32 }, // 병의원명
    { width: 16 }, // 사업자등록번호
    { width: 12 }, // 원장명
    { width: 64 }, // 주소
    { width: 24 }, // 비고
    { width: 24 }, // 정산용비고
    { width: 10 }, // 상태
    { width: 18 }, // 등록일시
    { width: 16 }, // 등록자
    { width: 18 }, // 수정일시
    { width: 16 }, // 수정자
  ]

  // 헤더행 고정 및 눈금선 숨기기
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
      showGridLines: false
    }
  ]

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = generateExcelFileName('병의원목록')
  link.click()
  window.URL.revokeObjectURL(url)
}

// async function deleteAllClients() {
//   if (!confirm('정말 모든 병의원 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
//   // 거래처 전체 삭제
//   const { error: clientError } = await supabase.from('clients').delete().neq('id', 0);
//   // 담당업체 지정 전체 삭제
//   await supabase.from('client_company_assignments').delete().neq('id', 0);
//   // 문전약국 지정 전체 삭제
//   await supabase.from('client_pharmacy_assignments').delete().neq('id', 0);
//   if (clientError) {
//     alert('삭제 중 오류가 발생했습니다: ' + clientError.message);
//     return;
//   }
//   clients.value = [];
//   alert('모든 병의원 및 관련 지정 데이터가 삭제되었습니다.');
// }

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

  console.log('병의원 오버플로우 체크:', {
    text: element.textContent,
    textWidth,
    availableWidth,
    isOverflowed
  });

  if (isOverflowed) {
    element.classList.add('overflowed');
    console.log('병의원 오버플로우 클래스 추가됨');
  } else {
    element.classList.remove('overflowed'); // Ensure class is removed if not overflowed
    console.log('병의원 오버플로우 아님 - 클래스 제거됨');
  }
}

const removeOverflowClass = (event) => {
  const element = event.target;
  element.classList.remove('overflowed');
  console.log('병의원 오버플로우 클래스 제거됨');
}

function doSearch() {
  if (searchInput.value.length >= 2) {
    searchKeyword.value = searchInput.value;
    const keyword = searchKeyword.value.toLowerCase();
    filteredClients.value = clients.value.filter(c =>
      (c.name && c.name.toLowerCase().includes(keyword)) ||
      (c.business_registration_number && c.business_registration_number.toLowerCase().includes(keyword)) ||
      (c.client_code && c.client_code.toLowerCase().includes(keyword)) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(keyword)) ||
      (c.address && c.address.toLowerCase().includes(keyword))
    );
  }
}
function clearSearch() {
  searchInput.value = '';
  searchKeyword.value = '';
  filteredClients.value = clients.value;
}

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  const target = event.target;
  let value = target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

  if (value.length > 10) {
    value = value.substring(0, 10); // 최대 10자리로 제한
  }

  // 형식 변환: ###-##-#####
  if (value.length >= 3) {
    value = value.substring(0, 3) + '-' + value.substring(3);
  }
  if (value.length >= 6) {
    value = value.substring(0, 6) + '-' + value.substring(6);
  }

  // 최대 12자리(하이픈 포함)로 제한
  if (value.length > 12) {
    value = value.substring(0, 12);
  }

  target.value = value;
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  if (event.key === 'Backspace') {
    const cursorPosition = event.target.selectionStart;
    const value = event.target.value;

    // 커서 위치에 하이픈이 있으면 한 칸 더 뒤로 이동
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      event.target.value = value.substring(0, newPosition) + value.substring(cursorPosition);

      // 커서 위치 조정
      setTimeout(() => {
        event.target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

// 중복 선택 모달 함수
function showDuplicateChoiceModal() {
  return new Promise((resolve) => {
    // 모달 컨테이너 생성
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

    // 모달 내용 생성
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
      <h3 style="margin: 0 0 20px 0; color: #333;">이미 동일한 사업자등록번호 병의원을 어떻게 처리하시겠습니까?</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="replace-btn" style="
          padding: 12px 20px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#da190b'" onmouseout="this.style.background='#f44336'">
          기존 병의원 정보를 신규 병의원 정보로 교체하기
        </button>
        <button id="keep-btn" style="
          padding: 12px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
          기존 병의원 정보는 그대로 두고 신규 병의원만 등록하기
        </button>
        <button id="cancel-btn" style="
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

    // 버튼 이벤트 리스너
    document.getElementById('replace-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('replace')
    })

    document.getElementById('keep-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('keep')
    })

    document.getElementById('cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('cancel')
    })

    // 모달 외부 클릭 시 취소
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
  })
}

// 업로드 선택 모달 함수
function showUploadChoiceModal() {
  return new Promise((resolve) => {
    // 모달 컨테이너 생성
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

    // 모달 내용 생성
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
    `

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">기존 데이터는 그대로 두고 추가 등록하시겠습니까?</h3>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirm-btn" style="
          padding: 12px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
          확인
        </button>
        <button id="cancel-btn" style="
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

    // 버튼 이벤트 리스너
    document.getElementById('confirm-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('append')
    })

    document.getElementById('cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve('cancel')
    })

    // 모달 외부 클릭 시 취소
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
  })
}

onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.btn-save-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
