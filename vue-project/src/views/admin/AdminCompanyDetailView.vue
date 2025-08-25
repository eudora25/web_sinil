<template>
  <div class="board_640">
    <div class="form-title">업체 상세</div>
    <div class="form-grid">
      <div class="form-group">
        <label>아이디(이메일)</label>
        <input :value="company.email || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>업체명</label>
        <input :value="company.company_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업자등록번호</label>
        <input :value="company.business_registration_number || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>대표자</label>
        <input :value="company.representative_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업장 소재지</label>
        <input :value="company.business_address || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>유선 전화번호</label>
        <input :value="company.landline_phone || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>업체 담당자</label>
        <input :value="company.contact_person_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>휴대폰 번호</label>
        <input :value="company.mobile_phone || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>휴대폰 번호 2</label>
        <input :value="company.mobile_phone_2 || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수신용 이메일</label>
        <input :value="company.receive_email || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>구분</label>
        <input :value="company.company_group || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료 등급</label>
        <input :value="company.default_commission_grade || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>제약사 관리자</label>
        <input :value="company.assigned_pharmacist_contact || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>승인여부</label>
        <input :value="company.approval_status === 'approved' ? '승인' : (company.approval_status === 'pending' ? '미승인' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="company.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(company.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="company.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>승인일시</label>
        <input :value="formatKST(company.approved_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(company.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="company.updated_by_name || '-'" readonly disabled />
      </div>
      <div class="button-area">        
        <button class="btn-reset-password" @click="handleResetPassword">비밀번호 재설정 이메일 발송</button>
        <button class="btn-edit" @click="goEdit">수정</button>
        <button class="btn-list" @click="goList">목록</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import TopNavigationBar from '@/components/TopNavigationBar.vue'

const route = useRoute()
const router = useRouter()
const company = ref({})

// KST 날짜 포맷 함수
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
  const sec = String(date.getUTCSeconds()).padStart(2, '0');
  
  // 오전/오후 구분
  const ampm = kstHours >= 12 ? '오후' : '오전';
  const displayHour = kstHours >= 12 ? kstHours - 12 : kstHours;
  const displayHourStr = displayHour === 0 ? '12' : String(displayHour).padStart(2, '0');
  
  return `${yyyy}. ${mm}. ${dd}. ${ampm} ${displayHourStr}:${min}:${sec}`;
}

const breadcrumbSubMenu = computed(() => {
  if (route.query.from === 'pending') return '미승인 업체';
  return '승인 업체';
});

onMounted(async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', route.params.id)
    .single()
  if (!error && data) {
    company.value = data
    
    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();
        
        if (createdByCompany?.company_name) {
          company.value.created_by_name = createdByCompany.company_name;
        } else {
          company.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        company.value.created_by_name = data.created_by; // UUID 표시
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
          company.value.updated_by_name = updatedByCompany.company_name;
        } else {
          company.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        company.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
  }
})

function goEdit() {
  // from 쿼리 파라미터가 있으면 함께 전달
  const from = route.query.from;
  if (from) {
    router.push(`/admin/companies/${route.params.id}/edit?from=${from}`);
  } else {
    const fromDefault = route.query.from === 'pending' ? 'pending' : 'approved';
    router.push(`/admin/companies/${route.params.id}/edit?from=${fromDefault}`);
  }
}

function goList() {
  if (route.query.from === 'admin-clients-assign-companies') {
    router.push('/admin/clients/assign-companies');
  } else if (route.query.from === 'admin-clients-commission-grades') {
    router.push('/admin/clients/commission-grades');
  } else if (route.query.from === 'admin-clients-assign-pharmacies') {
    router.push('/admin/clients/assign-pharmacies');
  } else {
    const from = route.query.from === 'pending' ? 'pending' : 'approved';
    router.push(`/admin/companies/${from}`);
  }
}

async function handleResetPassword() {
  if (!company.value.email) {
    alert('이메일 정보가 없습니다.');
    return;
  }
  if (!confirm(`${company.value.email}로 비밀번호 재설정 이메일을 발송하시겠습니까?`)) return;
  
  try {
    // Supabase 이메일 비밀번호 재설정 기능 사용
    const { error } = await supabase.auth.resetPasswordForEmail(company.value.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('비밀번호 재설정 이메일 발송 오류:', error);
      throw new Error(error.message || '이메일 발송에 실패했습니다.');
    }
    
    alert(`${company.value.email}로 비밀번호 재설정 이메일이 발송되었습니다.\n해당 업체에서 이메일을 확인하여 비밀번호를 재설정하도록 안내해주세요.`);
  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 실패:', error);
    alert('이메일 발송 실패: ' + error.message);
  }
}
</script>
