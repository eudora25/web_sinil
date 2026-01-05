<template>
  <TopNavigationBar :breadcrumbMenu="'공지사항'" :breadcrumbSubMenu="'공지사항 등록'" />
  <div class="board_640">
    <div class="form-title">공지사항 등록</div>
    <form @submit.prevent="handleSubmit" class="form-grid-2x">
      <div class="form-group">
        <label>제목<span class="required">*</span></label>
        <input v-model="title" type="text" required />
      </div>
      <div class="form-group">
        <label>내용<span class="required">*</span></label>
        <textarea v-model="content" ref="contentArea" rows="12" required @input="adjustTextareaHeight"></textarea>
      </div>
      <div class="form-group">
        <label style="margin-bottom:0.5rem !important;">필수</label>
        <input type="checkbox" v-model="isPinned" id="requiredCheck" style="width:16px; height:16px; vertical-align:middle;" />
      </div>
      <div class="form-group">
        <label style="margin-top:0.5rem !important; margin-bottom:0.5rem !important;">파일 첨부</label>
        <div style="margin-bottom:0.5rem; font-size:0.8rem; color:#666;">
          최대 5개 파일, 파일당 10MB 이하
        </div>
        <div>
          <label class="file-upload-label" style="font-size:0.85rem !important;">
            파일 선택
            <input type="file" multiple @change="onFileChange" style="display:none;" />
          </label>
          <div v-if="files.length" style="margin-top:1rem;">
            <div v-for="(f, idx) in files" :key="f.name + idx" style="display:flex;align-items:center;margin-bottom:0.5rem;">
              <button type="button" class="btn-delete-sm" @click="removeFile(idx)">삭제</button>
              <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-left:0.25rem;">{{ f.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="justify-content: flex-end !important; margin-top: 2rem !important;">
        <button class="btn-cancel" type="button" @click="goList" style="margin-right: 1rem;">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">등록</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

const title = ref('');
const content = ref('');
const contentArea = ref(null);
const isPinned = ref(false);
const files = ref([]);
const fileInput = ref(null);
const router = useRouter();

// 필수 필드 검증
const isFormValid = computed(() => {
  return title.value && title.value.trim() !== '' && 
         content.value && content.value.trim() !== '';
});

const adjustTextareaHeight = () => {
  if (contentArea.value) {
    contentArea.value.style.height = 'auto';
    contentArea.value.style.height = `${contentArea.value.scrollHeight}px`;
  }
};

onMounted(() => {
  nextTick(adjustTextareaHeight);
});

watch(content, () => {
  nextTick(adjustTextareaHeight);
});

function onFileChange(e) {
  const selected = Array.from(e.target.files);
  
  // 파일 개수 제한 (5개)
  const remainingSlots = 5 - files.value.length;
  if (remainingSlots <= 0) {
    showWarning('최대 5개 파일까지만 첨부할 수 있습니다.');
    e.target.value = '';
    return;
  }
  
  // 파일 크기 제한 (10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  const oversizedFiles = selected.filter(file => file.size > maxSize);
  if (oversizedFiles.length > 0) {
    showWarning(`파일 크기는 10MB 이하만 가능합니다. 다음 파일들이 크기를 초과했습니다:\n${oversizedFiles.map(f => f.name).join('\n')}`);
    e.target.value = '';
    return;
  }
  
  // 선택된 파일 중에서 개수 제한만큼만 추가
  const filesToAdd = selected.slice(0, remainingSlots);
  files.value = files.value.concat(filesToAdd);
  
  // 추가할 수 있는 개수보다 많이 선택했을 경우 알림
  if (selected.length > remainingSlots) {
    showWarning(`최대 5개 파일까지만 첨부할 수 있습니다. ${filesToAdd.length}개 파일만 추가되었습니다.`);
  }
  
  e.target.value = '';
}

function removeFile(idx) {
  files.value.splice(idx, 1);
}

  const handleSubmit = async () => {
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }
    
    // 디버깅을 위한 로그
    // console.log('Current user ID:', user.id);
    // console.log('Current user email:', user.email);
    
    // companies 테이블에서 사용자 정보 확인
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, user_id, email, user_type, approval_status')
      .eq('user_id', user.id)
      .single();
    
    // console.log('Company data:', companyData);
    // console.log('Company error:', companyError);

    // 1단계: 파일 업로드
    let fileData = [];
    for (const f of files.value) {
      // 안전한 파일명 생성 (영문, 숫자, 점, 하이픈만 허용)
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `attachments/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage
        .from('notices')
        .upload(filePath, f);
      if (error) {
        showError('파일 업로드 실패: ' + error.message);
        return;
      }
      const url = data?.path
        ? supabase.storage.from('notices').getPublicUrl(data.path).data.publicUrl
        : null;
      
      // URL과 원본 파일명을 함께 저장
      fileData.push({
        url: url,
        name: f.name
      });
    }

    // 2단계: 공지사항 생성 (RLS 정책 수정 후 직접 접근)
    const { error: insertError } = await supabase
      .from('notices')
      .insert([{
        title: title.value,
        content: content.value,
        is_pinned: isPinned.value,
        view_count: 0,
        file_url: fileData, // URL과 원본 파일명이 포함된 객체 배열
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Insert error:', insertError);
      showError('등록 실패: ' + insertError.message);
    } else {
      showSuccess('등록되었습니다.');
      router.push('/admin/notices');
    }
  };

function goList() {
  router.push('/admin/notices');
}
</script>
