<template>
  <div class="admin-revenue-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">총판 관리</div>
    </div>
    <div class="filter-card">
      <div class="filter-row">
        <div style="display:flex; align-items:center;">
          <span class="filter-item p-input-icon-left" style="position:relative; width:320px;">
            <InputText
              v-model="searchInput"
              placeholder="업체명, 사업자등록번호"
              class="search-input"
              @keyup.enter="applyFilters"
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
            @click="applyFilters">
            검색
          </button>
        </div>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ totalCount.toLocaleString() }} 건
        </div>
        <div class="action-buttons-group">
          <button class="btn-save" @click="showCreateForm = true" :disabled="showCreateForm">신규 등록</button>
        </div>
      </div>
      <DataTable
        :value="distributors"
        :loading="false"
        paginator
        :rows="pageSize"
        :totalRecords="totalCount"
        :rowsPerPageOptions="[20, 50, 100]"
        v-model:first="currentPageFirstIndex"
        v-model:page="currentPage"
        @page="onPageChange"
        :lazy="true"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        class="admin-wholesale-revenue-table"
      >
        <template #empty>
          <div v-if="!loading">등록된 총판이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: '8%' }">
          <template #body="slotProps">
            {{ (currentPage - 1) * pageSize + slotProps.index + 1 }}
          </template>
        </Column>
        <Column field="name" header="업체명" :headerStyle="{ width: '30%' }">
          <template #body="slotProps">
            <input v-if="slotProps.data.isEditing" v-model="slotProps.data.name" :id="`name_${slotProps.data.id}`" />
            <span v-else>{{ slotProps.data.name }}</span>
          </template>
        </Column>
        <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '20%' }">
          <template #body="slotProps">
            <input
              v-if="slotProps.data.isEditing"
              v-model="slotProps.data.business_registration_number"
              :id="`brn_${slotProps.data.id}`"
              @input="formatBusinessNumber"
              @keypress="allowOnlyNumbers"
              @keydown="handleBackspace"
            />
            <span v-else>{{ slotProps.data.business_registration_number }}</span>
          </template>
        </Column>
        <Column field="created_at" header="등록일" :headerStyle="{ width: '15%' }">
          <template #body="slotProps">
            {{ slotProps.data.created_at ? new Date(slotProps.data.created_at).toISOString().slice(0, 10) : '' }}
          </template>
        </Column>
        <Column header="작업" :headerStyle="{ width: '17%' }">
          <template #body="slotProps">
            <div style="display: flex; gap: 4px; justify-content: center">
              <template v-if="slotProps.data.isEditing">
                <button @click="saveEdit(slotProps.data)" class="btn-save-sm">저장</button>
                <button @click="cancelEdit(slotProps.data)" class="btn-cancel-sm">취소</button>
              </template>
              <template v-else>
                <button class="btn-edit-sm" @click="startEdit(slotProps.data)">수정</button>
                <button class="btn-delete-sm" @click="deleteDistributor(slotProps.data)">삭제</button>
              </template>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">목록을 불러오는 중입니다...</div>
      </div>
    </div>

    <!-- 신규 등록 모달 -->
    <Dialog v-model:visible="showCreateForm" header="총판 등록" modal :style="{ width: '480px' }">
      <div class="modal-form">
        <div class="form-group">
          <label>업체명<span class="required">*</span></label>
          <input v-model="newName" placeholder="업체명을 입력하세요" id="newDistributorName" />
        </div>
        <div class="form-group">
          <label>사업자등록번호<span class="required">*</span></label>
          <input
            v-model="newBrn"
            placeholder="000-00-00000"
            @input="formatNewBrn"
            @keypress="allowOnlyNumbers"
            @keydown="handleNewBrnBackspace"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="cancelCreate">취소</button>
        <button class="btn-save" @click="createDistributor">등록</button>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import { supabase } from '@/supabase'
import { useNotifications } from '@/utils/notifications'

const { showSuccess, showError, showWarning } = useNotifications()

const distributors = ref([])
const loading = ref(true)
const searchInput = ref('')
const currentPageFirstIndex = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const totalCount = ref(0)

// 신규 등록 폼
const showCreateForm = ref(false)
const newName = ref('')
const newBrn = ref('')

// 데이터 조회
const fetchDistributors = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('distributors')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchInput.value.length >= 2) {
      const keyword = searchInput.value.toLowerCase()
      query = query.or(`name.ilike.%${keyword}%,business_registration_number.ilike.%${keyword}%`)
    }

    const from = (currentPage.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
    query = query.range(from, to)

    const { data, error } = await query
    if (error || !data) return

    distributors.value = data.map((item) => ({
      ...item,
      isEditing: false,
      originalData: { ...item },
    }))
  } finally {
    loading.value = false
  }
}

const fetchTotalCount = async () => {
  try {
    let query = supabase.from('distributors').select('*', { count: 'exact', head: true })
    if (searchInput.value.length >= 2) {
      const keyword = searchInput.value.toLowerCase()
      query = query.or(`name.ilike.%${keyword}%,business_registration_number.ilike.%${keyword}%`)
    }
    const { count, error } = await query
    if (!error) totalCount.value = count || 0
  } catch (e) {
    console.error('총 개수 조회 오류:', e)
  }
}

// 신규 등록
const createDistributor = async () => {
  if (!newName.value.trim()) {
    showWarning('업체명을 입력하세요.')
    return
  }
  const brnDigits = newBrn.value.replace(/[^0-9]/g, '')
  if (brnDigits.length !== 10) {
    showWarning('사업자등록번호는 10자리여야 합니다.')
    return
  }
  const formattedBrn = brnDigits.substring(0, 3) + '-' + brnDigits.substring(3, 5) + '-' + brnDigits.substring(5)

  // 중복 체크
  const { data: existing } = await supabase.from('distributors').select('id').eq('business_registration_number', formattedBrn).maybeSingle()
  if (existing) {
    showWarning('이미 등록된 사업자등록번호입니다.')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('distributors').insert({
    name: newName.value.trim(),
    business_registration_number: formattedBrn,
    created_by: user?.id,
    updated_by: user?.id
  })

  if (error) {
    showError('등록 실패: ' + error.message)
    return
  }

  showSuccess('등록되었습니다.')
  cancelCreate()
  await fetchTotalCount()
  await fetchDistributors()
}

const cancelCreate = () => {
  showCreateForm.value = false
  newName.value = ''
  newBrn.value = ''
}

// 수정
const startEdit = (row) => {
  distributors.value.forEach(item => {
    if (item.isEditing && item.id !== row.id) cancelEdit(item)
  })
  row.originalData = { ...row }
  row.isEditing = true
}

const cancelEdit = (row) => {
  Object.keys(row.originalData).forEach(key => {
    if (key !== 'isEditing' && key !== 'originalData') row[key] = row.originalData[key]
  })
  row.isEditing = false
}

const saveEdit = async (row) => {
  if (!row.name || !row.name.trim()) {
    showWarning('업체명을 입력하세요.')
    return
  }
  const brnDigits = row.business_registration_number.replace(/[^0-9]/g, '')
  if (brnDigits.length !== 10) {
    showWarning('사업자등록번호는 10자리여야 합니다.')
    return
  }
  const formattedBrn = brnDigits.substring(0, 3) + '-' + brnDigits.substring(3, 5) + '-' + brnDigits.substring(5)

  // 중복 체크 (자기 자신 제외)
  const { data: existing } = await supabase.from('distributors').select('id').eq('business_registration_number', formattedBrn).neq('id', row.id).maybeSingle()
  if (existing) {
    showWarning('이미 등록된 사업자등록번호입니다.')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('distributors').update({
    name: row.name.trim(),
    business_registration_number: formattedBrn,
    updated_by: user?.id,
    updated_at: new Date().toISOString()
  }).eq('id', row.id)

  if (error) {
    showError('수정 실패: ' + error.message)
    return
  }

  row.business_registration_number = formattedBrn
  row.isEditing = false
  row.originalData = { ...row }
  showSuccess('수정되었습니다.')
}

// 삭제
const deleteDistributor = async (row) => {
  if (!confirm(`'${row.name}' 총판을 삭제하시겠습니까?`)) return

  const { error } = await supabase.from('distributors').delete().eq('id', row.id)
  if (error) {
    showError('삭제 실패: ' + error.message)
    return
  }
  showSuccess('삭제되었습니다.')
  await fetchTotalCount()
  await fetchDistributors()
}

// 필터/페이징
const applyFilters = async () => {
  currentPage.value = 1
  currentPageFirstIndex.value = 0
  await fetchTotalCount()
  await fetchDistributors()
}

const clearSearch = () => {
  searchInput.value = ''
  applyFilters()
}

const onPageChange = async (event) => {
  currentPage.value = event.page + 1
  currentPageFirstIndex.value = event.first
  await fetchDistributors()
}

// 사업자등록번호 유틸 (인라인 편집용)
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) event.preventDefault()
}

const formatBusinessNumber = (event) => {
  const target = event.target
  let value = target.value.replace(/[^0-9]/g, '')
  if (value.length > 10) value = value.substring(0, 10)
  if (value.length >= 3) value = value.substring(0, 3) + '-' + value.substring(3)
  if (value.length >= 6) value = value.substring(0, 6) + '-' + value.substring(6)
  if (value.length > 12) value = value.substring(0, 12)
  target.value = value
}

const handleBackspace = (event) => {
  if (event.key === 'Backspace') {
    const pos = event.target.selectionStart
    const val = event.target.value
    if (val[pos - 1] === '-') {
      event.preventDefault()
      const newPos = pos - 2
      event.target.value = val.substring(0, newPos) + val.substring(pos)
      setTimeout(() => event.target.setSelectionRange(newPos, newPos), 0)
    }
  }
}

// 신규 등록용 사업자번호 포맷
const formatNewBrn = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, '')
  if (value.length > 10) value = value.substring(0, 10)
  if (value.length >= 3) value = value.substring(0, 3) + '-' + value.substring(3)
  if (value.length >= 6) value = value.substring(0, 6) + '-' + value.substring(6)
  if (value.length > 12) value = value.substring(0, 12)
  newBrn.value = value
}

const handleNewBrnBackspace = (event) => {
  if (event.key === 'Backspace') {
    const pos = event.target.selectionStart
    const val = event.target.value
    if (val[pos - 1] === '-') {
      event.preventDefault()
      const newPos = pos - 2
      newBrn.value = val.substring(0, newPos) + val.substring(pos)
      setTimeout(() => event.target.setSelectionRange(newPos, newPos), 0)
    }
  }
}

onMounted(async () => {
  await fetchTotalCount()
  await fetchDistributors()
})
</script>

<style scoped>
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.modal-form .form-group label {
  font-weight: 500;
  font-size: 13px;
}
.modal-form .form-group input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 13px;
}
.required {
  color: #e74c3c;
  margin-left: 2px;
}
</style>
