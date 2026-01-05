<template>
  <div class="board_640">
    <div class="form-title">공지사항 상세</div>
    <form class="form-grid-2x">
      <div class="form-group">
        <label>제목</label>
        <input :value="notice.title" type="text" readonly disabled />
      </div>
      <div class="form-group">
        <label>내용</label>
        <div class="input-readonly-detail">{{ notice.content }}</div>
      </div>
      <div class="form-group">
        <label style="margin-bottom:0.5rem !important;">필수</label>
        <div style="display: flex; align-items: center;">
          <input type="checkbox" :checked="notice.is_pinned" disabled style="width:16px;height:16px;vertical-align:middle;" />
          <span style="margin-left:8px;">상단 고정</span>
        </div>
      </div>
      <div class="form-group" v-if="notice.file_url && notice.file_url.length > 0">
        <label style="margin-top:0.5rem !important;">첨부 파일</label>
        <div>
          <div v-for="(file, idx) in notice.file_url" :key="file.url || file" style="margin-bottom:2px;">
            <a @click.prevent="downloadFile(file.url || file, file.name)" class="file-link" style="cursor: pointer;">{{ file.name || getFileName(file.url || file) }}</a>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(notice.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="notice.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(notice.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="notice.updated_by_name || '-'" readonly disabled />
      </div>
      <div style="justify-content: flex-end; margin-top: 2rem;">
        <button class="btn-list" type="button" @click="goList">목록</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotifications();

const route = useRoute();
const router = useRouter();
const notice = ref({ title: '', content: '', is_pinned: false, file_url: [] });

// KST 날짜 포맷 함수
function formatKST(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  // UTC 시간에 9시간을 더해서 KST 계산
  const kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  
  const yyyy = kstTime.getUTCFullYear();
  const mm = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstTime.getUTCDate()).padStart(2, '0');
  const hh = kstTime.getUTCHours();
  const min = String(kstTime.getUTCMinutes()).padStart(2, '0');
  const sec = String(kstTime.getUTCSeconds()).padStart(2, '0');
  
  // 오전/오후 구분
  const ampm = hh >= 12 ? '오후' : '오전';
  const displayHour = hh >= 12 ? hh - 12 : hh;
  const displayHourStr = displayHour === 0 ? '12' : String(displayHour).padStart(2, '0');
  
  return `${yyyy}. ${mm}. ${dd}. ${ampm} ${displayHourStr}:${min}:${sec}`;
}

// 조회수 증가 함수 (중복 방지)
async function increaseViewCount(noticeId) {
  try {
    // 현재 사용자 ID 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('사용자 정보를 가져올 수 없습니다.');
      return;
    }

    // 이미 조회한 기록이 있는지 확인
    const { data: existingView, error: checkError } = await supabase
      .from('notice_views')
      .select('id')
      .eq('notice_id', noticeId)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 데이터가 없을 때
      console.error('조회 기록 확인 실패:', checkError);
      return;
    }

    // 이미 조회한 기록이 있으면 조회수 증가하지 않음
    if (existingView) {
      // console.log('이미 조회한 공지사항입니다.');
      return;
    }

    // 조회 기록 저장
    const { error: insertError } = await supabase
      .from('notice_views')
      .insert({
        notice_id: noticeId,
        user_id: user.id
      });

    if (insertError) {
      console.error('조회 기록 저장 실패:', insertError);
      return;
    }

    // 조회수 증가
    const { data: currentData, error: selectError } = await supabase
      .from('notices')
      .select('view_count')
      .eq('id', noticeId)
      .single();
    
    if (selectError) {
      console.error('현재 조회수 조회 실패:', selectError);
      return;
    }
    
    const newViewCount = (currentData.view_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('notices')
      .update({ view_count: newViewCount })
      .eq('id', noticeId);
    
    if (updateError) {
      console.error('조회수 증가 실패:', updateError);
    } else {
      // console.log('조회수 증가 성공:', newViewCount);
    }
  } catch (err) {
    console.error('조회수 증가 중 오류:', err);
  }
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('notices')
    .select('id, title, content, is_pinned, file_url, view_count, created_at, created_by, updated_at, updated_by')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    // file_url 처리 (새로운 구조와 기존 구조 모두 지원)
    if (data.file_url) {
      let fileData = [];
      if (typeof data.file_url === 'string') {
        try {
          fileData = JSON.parse(data.file_url);
        } catch {
          fileData = [data.file_url];
        }
      } else if (Array.isArray(data.file_url)) {
        fileData = data.file_url;
      }
      
      // 새로운 구조와 기존 구조 모두 지원
      data.file_url = fileData.map(item => {
        if (typeof item === 'string') {
          // 기존 방식 (URL만 있는 경우)
          return {
            name: getFileName(item),
            url: item
          };
        } else if (item && item.url) {
          // 새로운 방식 (URL과 원본 파일명이 있는 경우)
          return {
            name: item.name || getFileName(item.url),
            url: item.url
          };
        }
        return null;
      }).filter(Boolean);
    }
    notice.value = data;
    
    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();
        
        if (createdByCompany?.company_name) {
          notice.value.created_by_name = createdByCompany.company_name;
        } else {
          notice.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        notice.value.created_by_name = data.created_by; // UUID 표시
      }
    }
    
    // 수정자 정보 - companies 테이블에서 company_name 조회
    if (data.updated_by) {
      try {
        const { data: updatedByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.updated_by)
          .single();
        
        if (updatedByCompany?.company_name) {
          notice.value.updated_by_name = updatedByCompany.company_name;
        } else {
          notice.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        notice.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
    
    // 조회수 증가
    await increaseViewCount(route.params.id);
  }
});

function getFileName(url) {
  if (!url) return '';
  try {
    const fileName = url.split('/').pop();
    const decodedName = decodeURIComponent(fileName);
    return decodedName.replace(/^[0-9]+_/, '');
  } catch {
    return url;
  }
}

function goEdit() {
  router.push(`/admin/notices/${route.params.id}/edit`);
}

async function downloadFile(fileUrl, fileName = null) {
  try {
    const url = new URL(fileUrl);
    const filePath = url.pathname.split('/').slice(6).join('/');
    
    // 전달받은 파일명이 있으면 사용, 없으면 URL에서 추출
    const downloadFileName = fileName || getFileName(fileUrl);

    const { data, error } = await supabase.storage
      .from('notices')
      .download(filePath);
      
    if (error) throw error;

    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

  } catch (err) {
    console.error('파일 다운로드 오류:', err);
    showError('파일을 다운로드하는 중 오류가 발생했습니다.');
  }
}

function goList() {
  router.push('/notices');
}

async function handleDelete() {
  const confirmed = await showConfirm('정말 삭제하시겠습니까?');
  if (!confirmed) return;
  const { error } = await supabase.from('notices').delete().eq('id', route.params.id);
  if (!error) {
    showSuccess('삭제되었습니다.');
    router.push('/admin/notices');
  } else {
    showError('삭제 실패: ' + error.message);
  }
}
</script> 