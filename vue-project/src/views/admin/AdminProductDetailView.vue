<template>
  <div class="board_640">
    <div class="form-title">제품 상세</div>
    <div class="form-grid">
      <div class="form-group">
        <label>기준월</label>
        <input :value="product.base_month || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>제품명</label>
        <input :value="product.product_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>보험코드</label>
        <input :value="product.insurance_code || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>약가</label>
        <input :value="product.price || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율 A등급(%)</label>
        <input :value="product.commission_rate_a !== undefined && product.commission_rate_a !== null ? (product.commission_rate_a * 100).toFixed(1) : '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율 B등급(%)</label>
        <input :value="product.commission_rate_b !== undefined && product.commission_rate_b !== null ? (product.commission_rate_b * 100).toFixed(1) : '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율 C등급(%)</label>
        <input :value="product.commission_rate_c !== undefined && product.commission_rate_c !== null ? (product.commission_rate_c * 100).toFixed(1) : '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율 D등급(%)</label>
        <input :value="product.commission_rate_d !== undefined && product.commission_rate_d !== null ? (product.commission_rate_d * 100).toFixed(1) : '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수수료율 E등급(%)</label>
        <input :value="product.commission_rate_e !== undefined && product.commission_rate_e !== null ? (product.commission_rate_e * 100).toFixed(1) : '-'" readonly disabled />
      </div>

      <div class="form-group">
        <label>상태</label>
        <input :value="product.status === 'active' ? '활성' : (product.status === 'inactive' ? '비활성' : '-')" readonly disabled />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input :value="product.remarks || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록일시</label>
        <input :value="formatKST(product.created_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>등록자</label>
        <input :value="product.created_by_name || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정일시</label>
        <input :value="formatKST(product.updated_at) || '-'" readonly disabled />
      </div>
      <div class="form-group">
        <label>수정자</label>
        <input :value="product.updated_by_name || '-'" readonly disabled />
      </div>
      <div class="button-area">
        <button class="btn-delete" @click="handleDelete">삭제</button>
        <button class="btn-edit" @click="goEdit">수정</button>
        <button class="btn-list" @click="goList">목록</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const product = ref({});

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

onMounted(async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*, created_at, created_by, updated_at, updated_by')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    product.value = data;
    
    // 등록자 정보 - companies 테이블에서 company_name 조회
    if (data.created_by) {
      try {
        const { data: createdByCompany } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', data.created_by)
          .single();
        
        if (createdByCompany?.company_name) {
          product.value.created_by_name = createdByCompany.company_name;
        } else {
          product.value.created_by_name = data.created_by; // UUID 표시
        }
      } catch (err) {
        console.error('등록자 정보 조회 실패:', err);
        product.value.created_by_name = data.created_by; // UUID 표시
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
          product.value.updated_by_name = updatedByCompany.company_name;
        } else {
          product.value.updated_by_name = data.updated_by; // UUID 표시
        }
      } catch (err) {
        console.error('수정자 정보 조회 실패:', err);
        product.value.updated_by_name = data.updated_by; // UUID 표시
      }
    }
  }
});

function goEdit() {
  router.push(`/admin/products/${route.params.id}/edit`);
}
function goList() {
  router.push('/admin/products');
}
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('products').delete().eq('id', route.params.id);
  if (!error) {
    alert('삭제되었습니다.');
    router.push('/admin/products');
  } else {
    alert('삭제 실패: ' + error.message);
  }
}
</script>
