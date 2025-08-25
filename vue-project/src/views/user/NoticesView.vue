<template>
  <div class="admin-notices-view page-container">
    <div class="page-header-title-area">
      <div class="header-title">공지사항 목록</div>
    </div>
    <div class="filter-card">
      <div class="filter-row">
        <span class="filter-item p-input-icon-left">
          <InputText
            v-model="filters['global'].value"
            placeholder="제목, 내용 검색"
            class="search-input-only"
          />
        </span>
      </div>
    </div>
    <div class="data-card">
      <div class="data-card-header">
        <div class="total-count-display">
          전체 {{ filteredNotices.length }} 건
        </div>
        <!-- 이용자용은 버튼 없음 -->
      </div>
      <DataTable
        :value="filteredNotices"
        :loading="false"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        scrollable
        scrollHeight="calc(100vh - 250px)"
        v-model:filters="filters"
        :globalFilterFields="['title']"
        class="custom-table notices-table"
        v-model:first="currentPageFirstIndex"
      >
        <template #empty>
          <div v-if="!loading">등록된 공지사항이 없습니다.</div>
        </template>
        <Column header="No" :headerStyle="{ width: columnWidths.no }">
          <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
        </Column>
        <Column field="is_pinned" header="필수" :headerStyle="{ width: columnWidths.is_pinned }">
          <template #body="slotProps">
            <span v-if="slotProps.data.is_pinned === true" class="required-badge">필수</span>
          </template>
        </Column>
        <Column field="title" header="제목" :headerStyle="{ width: columnWidths.title }">
          <template #body="slotProps">
            <a href="#" class="text-link" @click.prevent="goToDetail(slotProps.data.id)">
              {{ slotProps.data.title }}
            </a>
          </template>
        </Column>
        <Column field="content" header="내용" :headerStyle="{ width: columnWidths.content }">
          <template #body="slotProps">
            <span class="content-preview">{{ slotProps.data.content }}</span>
          </template>
        </Column>
        <Column field="file_count" header="첨부파일" :headerStyle="{ width: columnWidths.file_count }">
          <template #body="slotProps">
            <span>{{ slotProps.data.file_count > 0 ? slotProps.data.file_count : '-' }}</span>
          </template>
        </Column>
        <Column field="view_count" header="조회수" :headerStyle="{ width: columnWidths.view_count }" />
        <Column field="created_at" header="작성일시" :headerStyle="{ width: columnWidths.created_at }">
          <template #body="slotProps">{{ formatKST(slotProps.data.created_at) }}</template>
        </Column>
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
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/supabase';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const notices = ref([]);
const loading = ref(true);
const router = useRouter();
const userType = ref('');
const search = ref('');
const currentPageFirstIndex = ref(0);

const filters = ref({
  'global': { value: null, matchMode: 'contains' }
});

// 컬럼 너비 한 곳에서 관리
const columnWidths = {
  no: '4%',
  is_pinned: '6%',
  title: '32%',
  content: '40%',
  file_count: '6%',
  view_count: '6%',
  created_at: '10%'
};

function goToDetail(id) {
  router.push(`/notices/${id}`);
}

function goEdit(id) {
  router.push(`/admin/notices/${id}/edit`);
}

function formatKST(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
  const utcHours = date.getUTCHours();
  const kstHours = (utcHours + 9) % 24;
  
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(kstHours).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

const filteredNotices = computed(() => {
  if (!search.value) return notices.value;
  return notices.value.filter(n =>
    n.title?.includes(search.value) ||
    formatKST(n.created_at)?.includes(search.value)
  );
});

async function handleDelete(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) {
    alert('삭제 실패: ' + error.message);
  } else {
    alert('삭제되었습니다.');
    router.push('/admin/notices'); // 삭제 후 목록으로 이동
  }
}

onMounted(async () => {
  loading.value = true;
  
  // 1. 공지사항 기본 데이터 조회
  const { data: noticesData, error: noticesError } = await supabase
    .from('notices')
    .select('id, title, content, created_at, is_pinned, view_count, file_url')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
    
  if (noticesError) {
    console.error('공지사항 조회 오류:', noticesError);
    loading.value = false;
    return;
  }
  
  console.log('공지사항 데이터:', noticesData);
  
  // 2. notice_views 테이블에서 실제 조회수 계산
  const { data: viewsData, error: viewsError } = await supabase
    .from('notice_views')
    .select('notice_id');
    
  if (viewsError) {
    console.error('조회수 조회 오류:', viewsError);
  }
  
  // 3. 각 공지사항별 조회수 계산
  const viewCounts = {};
  if (viewsData) {
    viewsData.forEach(view => {
      if (view.notice_id) {
        viewCounts[view.notice_id] = (viewCounts[view.notice_id] || 0) + 1;
      }
    });
  }
  
  console.log('조회수 데이터:', viewCounts);
  
  if (noticesData) {
    notices.value = noticesData.map(n => {
      let fileCount = 0;
      try {
        const arr = JSON.parse(n.file_url || '[]');
        if (Array.isArray(arr)) {
          // 유효한 URL만 카운트
          fileCount = arr.filter(url => url && url.trim() !== '').length;
        } else {
          fileCount = 0;
        }
      } catch {
        fileCount = 0;
      }
      
      // 실제 조회수 사용 (notice_views 테이블 기준)
      const actualViewCount = viewCounts[n.id] || 0;
      
      return { 
        ...n, 
        file_count: fileCount,
        view_count: actualViewCount // 실제 조회수로 덮어쓰기
      };
    });
  }
  
  loading.value = false;
  const { data: { session } } = await supabase.auth.getSession();
  userType.value = session?.user?.user_metadata?.user_type || '';
});

watch(filteredNotices, (val) => {
  console.log('filteredNotices:', val);
});
</script>