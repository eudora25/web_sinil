<template>
  <TopNavigationBar :breadcrumbMenu="'공지사항'" :breadcrumbSubMenu="'공지사항 수정'" />
  <div class="board_640">
    <div class="form-title">공지사항 수정</div>
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
        <div>
          <label class="file-upload-label" style="font-size:0.85rem !important;">
            파일 선택
            <input type="file" multiple @change="onFileChange" style="display:none;" />
          </label>
          <div v-if="files.length" style="margin-top:1rem;">
            <div v-for="(f, idx) in files" :key="f.name + idx" style="display: flex; align-items:center; margin-bottom:0.5rem;">
              <button class="btn-delete-sm" @click="removeFile(idx)">삭제</button>
              <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-left:0.25rem;">{{ f.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="justify-content: flex-end; margin-top: 2rem;">
        <button class="btn-cancel" type="button" @click="goDetail" style="margin-right: 1rem;">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">수정</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const title = ref('');
const content = ref('');
const contentArea = ref(null);
const isPinned = ref(false);
const files = ref([]);
const fileInput = ref(null);

// 원본 데이터 저장
const originalData = ref({
  title: '',
  content: '',
  isPinned: false,
  files: []
});

// 필수 필드 검증 및 변경값 감지
const isFormValid = computed(() => {
  // 필수값 검증
  const hasRequiredFields = title.value && title.value.trim() !== '' && 
                           content.value && content.value.trim() !== '';
  
  // 변경값 감지
  const hasChanges = title.value !== originalData.value.title ||
                    content.value !== originalData.value.content ||
                    isPinned.value !== originalData.value.isPinned ||
                    JSON.stringify(files.value) !== JSON.stringify(originalData.value.files);
  
  return hasRequiredFields && hasChanges;
});

const adjustTextareaHeight = () => {
  if (contentArea.value) {
    contentArea.value.style.height = 'auto';
    contentArea.value.style.height = `${contentArea.value.scrollHeight}px`;
  }
};

onMounted(async () => {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (error) {
    alert('데이터 로드 실패: ' + error.message);
    router.push('/admin/notices');
    return;
  }
  title.value = data.title;
  content.value = data.content;
  isPinned.value = data.is_pinned;
  
  // 원본 데이터 저장
  originalData.value.title = data.title;
  originalData.value.content = data.content;
  originalData.value.isPinned = data.is_pinned;
  
  if (data.file_url) {
    let fileUrls = [];
    if (typeof data.file_url === 'string') {
      try {
        fileUrls = JSON.parse(data.file_url);
      } catch {
        fileUrls = [data.file_url];
      }
    } else if (Array.isArray(data.file_url)) {
      fileUrls = data.file_url;
    }
    
    // 유효한 URL만 필터링
    const validFileUrls = fileUrls.filter(url => url && url.trim() !== '');
    
    const fileObjects = validFileUrls.map(url => ({
      name: getFileName(url),
      url: url
    }));
    
    files.value = fileObjects;
    originalData.value.files = JSON.parse(JSON.stringify(fileObjects)); // 깊은 복사
  }
  nextTick(adjustTextareaHeight);
});

watch(content, () => {
  nextTick(adjustTextareaHeight);
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

function onFileChange(e) {
  const selected = Array.from(e.target.files);
  files.value = files.value.concat(selected).slice(0, 10);
  e.target.value = '';
}

function removeFile(idx) {
  files.value.splice(idx, 1);
}

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!title.value || title.value.trim() === '') {
    alert('제목은 필수 입력 항목입니다.');
    return;
  }
  
  if (!content.value || content.value.trim() === '') {
    alert('내용은 필수 입력 항목입니다.');
    return;
  }
  let fileUrls = files.value.map(f => f.url || '');
  for (const f of files.value) {
    if (!f.url) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `attachments/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage
        .from('notices')
        .upload(filePath, f);
      if (error) {
        alert('파일 업로드 실패: ' + error.message);
        return;
      }
      const url = data?.path
        ? supabase.storage.from('notices').getPublicUrl(data.path).data.publicUrl
        : null;
      fileUrls.push(url);
    }
  }
  const { error: updateError } = await supabase
    .from('notices')
    .update({
      title: title.value,
      content: content.value,
      is_pinned: isPinned.value,
      file_url: fileUrls
    })
    .eq('id', route.params.id);
  if (updateError) {
    alert('수정 실패: ' + updateError.message);
  } else {
    alert('수정되었습니다.');
    router.push('/admin/notices');
  }
};

function goDetail() {
  router.push(`/admin/notices/${route.params.id}`);
}
</script>
