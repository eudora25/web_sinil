<template>
  <div class="board_640">
    <div class="form-title">표준코드 수정</div>
    <form @submit.prevent="handleSubmit" class="form-grid">

      <div class="form-group">
        <label>제품명</label>
        <input :value="productName || '-'" readonly disabled style="background-color: #f5f5f5; color: #666;" />
      </div>
      <div class="form-group">
        <label>보험코드<span class="required">*</span></label>
        <input id="insuranceCode" v-model="insuranceCode" type="text" maxlength="9" required />
      </div>
      <div class="form-group">
        <label>표준코드<span class="required">*</span></label>
        <input id="standardCode" v-model="standardCode" type="text" maxlength="13" required />
      </div>
      <div class="form-group">
        <label>단위/포장형태</label>
        <input v-model="unitPackageForm" type="text" />
      </div>
      <div class="form-group">
        <label>단위수량</label>
        <input v-model="unitQuantity" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>상태</label>
        <select v-model="status">
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
      <div class="form-group">
        <label>비고</label>
        <input v-model="remarks" type="text" />
      </div>
      <div class="button-area">
        <button class="btn-cancel" type="button" @click="goDetail">취소</button>
        <button class="btn-save" type="submit" :disabled="!isFormValid">수정</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const route = useRoute();
const router = useRouter();
const productName = ref('');
const insuranceCode = ref('');
const standardCode = ref('');
const unitPackageForm = ref('');
const unitQuantity = ref('');
const status = ref('active');
const remarks = ref('');

// 원본 데이터 저장
const originalData = ref({
  insuranceCode: '',
  standardCode: '',
  unitPackageForm: '',
  unitQuantity: '',
  status: '',
  remarks: ''
});

// 필수 필드 검증 및 변경값 감지
const isFormValid = computed(() => {
  // 필수값 검증
  const hasRequiredFields = insuranceCode.value && insuranceCode.value.toString().trim() !== '' && 
                           standardCode.value && standardCode.value.toString().trim() !== '';
  
  // 변경값 감지
  const hasChanges = insuranceCode.value !== originalData.value.insuranceCode ||
                    standardCode.value !== originalData.value.standardCode ||
                    unitPackageForm.value !== originalData.value.unitPackageForm ||
                    unitQuantity.value !== originalData.value.unitQuantity ||
                    status.value !== originalData.value.status ||
                    remarks.value !== originalData.value.remarks;
  
  return hasRequiredFields && hasChanges;
});

onMounted(async () => {
  console.log('🔍 표준코드 수정 로드 시작 - ID:', route.params.id);
  
  const { data, error } = await supabase
    .from('products_standard_code')
    .select('*')
    .eq('id', route.params.id)
    .single();
    
  if (error) {
    console.error('❌ 표준코드 데이터 로드 실패:', error);
    alert('데이터를 불러오는데 실패했습니다.');
    return;
  }
  
  if (!data) {
    console.error('❌ 표준코드 데이터가 없습니다.');
    alert('해당 표준코드를 찾을 수 없습니다.');
    return;
  }
  
  console.log('✅ 표준코드 데이터 로드 성공:', data);
  
  productName.value = '조회 중...'; // 임시 설정
  
  // insurance_code를 이용해서 products 테이블에서 제품명 조회
  if (data.insurance_code) {
    console.log('🔍 제품명 조회 시작 - insurance_code:', data.insurance_code);
    try {
      const { data: productsData, error: productError } = await supabase
        .from('products')
        .select('product_name, created_at')
        .eq('insurance_code', data.insurance_code)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('🔍 제품명 조회 결과:', { productsData, productError });
      
      if (productError) {
        console.error('제품명 조회 에러:', productError);
        productName.value = '제품명 조회 실패';
      } else if (productsData && productsData.length > 0) {
        const productData = productsData[0]; // 첫 번째 제품 사용
        productName.value = productData.product_name;
        console.log('✅ 제품명 조회 성공:', productData.product_name);
        if (productsData.length > 1) {
          console.log(`⚠️ 보험코드 ${data.insurance_code}에 ${productsData.length}개의 제품이 있습니다. 첫 번째 제품을 사용합니다.`);
        }
      } else {
        productName.value = '제품 목록 등록 필요';
        console.log('⚠️ 제품명 없음 - insurance_code:', data.insurance_code);
      }
    } catch (err) {
      console.error('제품명 조회 실패:', err);
      productName.value = '제품명 조회 실패';
    }
  }
  
  insuranceCode.value = data.insurance_code;
  standardCode.value = data.standard_code;
  unitPackageForm.value = data.unit_packaging_desc || '';
  unitQuantity.value = data.unit_quantity || '';
  status.value = data.status || 'active';
  remarks.value = data.remarks || '';
    
  // 원본 데이터 저장
  originalData.value.insuranceCode = data.insurance_code;
  originalData.value.standardCode = data.standard_code;
  originalData.value.unitPackageForm = data.unit_packaging_desc || '';
  originalData.value.unitQuantity = data.unit_quantity || '';
  originalData.value.status = data.status;
  originalData.value.remarks = data.remarks || '';
});

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!insuranceCode.value || insuranceCode.value.toString().trim() === '') {
    alert('보험코드는 필수 입력 항목입니다.');
    setTimeout(() => {
      const insuranceCodeInput = document.getElementById('insuranceCode');
      if (insuranceCodeInput) {
        insuranceCodeInput.focus();
        insuranceCodeInput.select();
      }
    }, 100);
    return;
  }

  if (!standardCode.value || standardCode.value.toString().trim() === '') {
    alert('표준코드는 필수 입력 항목입니다.');
    setTimeout(() => {
      const standardCodeInput = document.getElementById('standardCode');
      if (standardCodeInput) {
        standardCodeInput.focus();
        standardCodeInput.select();
      }
    }, 100);
    return;
  }

  // 보험코드 형식 검증 (9자리 숫자)
  if (insuranceCode.value.toString().length !== 9 || !/^\d{9}$/.test(insuranceCode.value.toString())) {
    alert('보험코드는 9자리 숫자여야 합니다.');
    setTimeout(() => {
      const insuranceCodeInput = document.getElementById('insuranceCode');
      if (insuranceCodeInput) {
        insuranceCodeInput.focus();
        insuranceCodeInput.select();
      }
    }, 100);
    return;
  }

  // 표준코드 형식 검증 (13자리 숫자)
  if (standardCode.value.toString().length !== 13 || !/^\d{13}$/.test(standardCode.value.toString())) {
    alert('표준코드는 13자리 숫자여야 합니다.');
    setTimeout(() => {
      const standardCodeInput = document.getElementById('standardCode');
      if (standardCodeInput) {
        standardCodeInput.focus();
        standardCodeInput.select();
      }
    }, 100);
    return;
  }

  // 단위수량 검증 (0 이상의 숫자)
  if (unitQuantity.value && (isNaN(Number(unitQuantity.value)) || Number(unitQuantity.value) < 0)) {
    alert('단위수량은 0 이상의 숫자여야 합니다.');
    setTimeout(() => {
      const unitQuantityInput = document.querySelector('input[v-model="unitQuantity"]');
      if (unitQuantityInput) {
        unitQuantityInput.focus();
        unitQuantityInput.select();
      }
    }, 100);
    return;
  }

  // 현재 사용자 ID 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  
  const dataToUpdate = {
    insurance_code: insuranceCode.value,
    standard_code: standardCode.value,
    unit_packaging_desc: unitPackageForm.value || '',
    unit_quantity: unitQuantity.value === '' ? 0 : Number(unitQuantity.value),
    status: status.value,
    remarks: remarks.value || '',
    updated_by: user?.id // 수정자 ID 설정
  };
  
  const { error } = await supabase
    .from('products_standard_code')
    .update(dataToUpdate)
    .eq('id', route.params.id);
  if (error) {
    alert('수정 실패: ' + error.message);
  } else {
    alert('수정되었습니다.');
    router.push('/admin/products-standard-code');
  }
};

function goDetail() {
  router.push(`/admin/products-standard-code/${route.params.id}`);
}
</script> 