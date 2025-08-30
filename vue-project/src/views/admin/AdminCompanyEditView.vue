<template>
  <div class="board_640">
    <div class="form-title">업체 수정</div>
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="form-group">
        <label>아이디(이메일)</label>
        <input :value="email" readonly disabled class="input-readonly" />
      </div>
      <div class="form-group">
        <label>업체명<span class="required">*</span></label>
        <input id="companyName" v-model="companyName" type="text" required />
      </div>
      <div class="form-group">
        <label>사업자등록번호<span class="required">*</span></label>
        <input 
          id="businessNumber" 
          v-model="businessNumber" 
          type="text" 
          required 
          @input="formatBusinessNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="form-group">
        <label>대표자<span class="required">*</span></label>
        <input id="representative" v-model="representative" type="text" required />
      </div>
      <div class="form-group">
        <label>사업장 소재지</label>
        <input id="address" v-model="address" type="text" />
      </div>
      <div class="form-group">
        <label>유선 전화번호</label>
        <input 
          id="landline" 
          v-model="landline" 
          type="text" 
          @input="formatPhoneNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="form-group">
        <label>업체 담당자</label>
        <input id="contactPerson" v-model="contactPerson" type="text" />
      </div>
      <div class="form-group">
        <label>휴대폰 번호</label>
        <input 
          id="mobile" 
          v-model="mobile" 
          type="text" 
          @input="formatPhoneNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="form-group">
        <label>휴대폰 번호 2</label>
        <input 
          id="mobile2" 
          v-model="mobile2" 
          type="text" 
          @input="formatPhoneNumber"
          @keypress="allowOnlyNumbers"
          @keydown="handleBackspace"
        />
      </div>
      <div class="form-group">
        <label>수신용 이메일</label>
        <input id="receiveEmail" v-model="receiveEmail" type="email" />
      </div>
      <div class="form-group">
        <label>구분</label>
        <input v-model="companyGroup" type="text" />
      </div>
      <div class="form-group">
        <label>수수료 등급</label>
        <select v-model="commissionGrade">
          <option disabled value="">등급 선택</option>
          <option v-for="item in commissionGradeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>제약사 관리자</label>
        <input v-model="manager" type="text" />
      </div>
      <div class="form-group">
        <label>승인여부</label>
        <select v-model="approvalStatus">
          <option disabled value="">승인여부 선택</option>
          <option v-for="item in approvalStatusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
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
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '@/supabase';
import TopNavigationBar from '@/components/TopNavigationBar.vue';

const email = ref('');
const companyName = ref('');
const businessNumber = ref('');
const representative = ref('');
const address = ref('');
const landline = ref('');
const contactPerson = ref('');
const mobile = ref('');
const mobile2 = ref('');
const receiveEmail = ref('');
const companyGroup = ref('');
const commissionGrade = ref('');
const manager = ref('');
const remarks = ref('');
const approvalStatus = ref('');
const router = useRouter();
const route = useRoute();
const loading = ref(false);

// 원본 데이터 저장
const originalData = ref({
  email: '',
  companyName: '',
  businessNumber: '',
  representative: '',
  address: '',
  landline: '',
  contactPerson: '',
  mobile: '',
  mobile2: '',
  receiveEmail: '',
  companyGroup: '',
  commissionGrade: '',
  manager: '',
  remarks: '',
  approvalStatus: ''
});

// 필수 필드 검증 및 변경값 감지
const isFormValid = computed(() => {
  // 필수값 검증 (이메일 제외)
  const hasRequiredFields = companyName.value && companyName.value.trim() !== '' && 
                           businessNumber.value && businessNumber.value.trim() !== '' && 
                           representative.value && representative.value.trim() !== '';
  
  // 변경값 감지 (이메일 제외)
  const hasChanges = companyName.value !== originalData.value.companyName ||
                    businessNumber.value !== originalData.value.businessNumber ||
                    representative.value !== originalData.value.representative ||
                    address.value !== originalData.value.address ||
                    landline.value !== originalData.value.landline ||
                    contactPerson.value !== originalData.value.contactPerson ||
                    mobile.value !== originalData.value.mobile ||
                    mobile2.value !== originalData.value.mobile2 ||
                    receiveEmail.value !== originalData.value.receiveEmail ||
                    companyGroup.value !== originalData.value.companyGroup ||
                    commissionGrade.value !== originalData.value.commissionGrade ||
                    manager.value !== originalData.value.manager ||
                    remarks.value !== originalData.value.remarks ||
                    approvalStatus.value !== originalData.value.approvalStatus;
  
  return hasRequiredFields && hasChanges;
});

const commissionGradeOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' }
];
const approvalStatusOptions = [
  { label: '승인', value: 'approved' },
  { label: '미승인', value: 'pending' }
];

const breadcrumbSubMenu = computed(() => {
  if (route.query.from === 'pending') return '미승인 업체';
  return '승인 업체';
});

// 숫자만 입력 허용
const allowOnlyNumbers = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
};

// 사업자등록번호 형식 변환
const formatBusinessNumber = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
  
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
  
  businessNumber.value = value;
};

// 전화번호 형식 변환
const formatPhoneNumber = (event) => {
  const target = event.target;
  let value = target.value.replace(/[^0-9]/g, '');
  
  if (target.id === 'mobile' || target.id === 'mobile2') {
    // 휴대폰번호: 010-####-####
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    if (value.length >= 8) {
      value = value.substring(0, 8) + '-' + value.substring(8);
    }
    
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    if (target.id === 'mobile') {
      mobile.value = value;
    } else {
      mobile2.value = value;
    }
  } else if (target.id === 'landline') {
    // 유선전화: 서울(02)은 02-####-####, 나머지는 0##-####-####
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    if (value.startsWith('02')) {
      // 서울: 02-####-####
      if (value.length >= 2) {
        value = value.substring(0, 2) + '-' + value.substring(2);
      }
      if (value.length >= 7) {
        value = value.substring(0, 7) + '-' + value.substring(7);
      }
    } else {
      // 나머지 지역: 0##-####-####
      if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
      }
      if (value.length >= 8) {
        value = value.substring(0, 8) + '-' + value.substring(8);
      }
    }
    
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    landline.value = value;
  }
};

// 백스페이스 처리 (하이픈 건너뛰기)
const handleBackspace = (event) => {
  const target = event.target;
  if ((target.id === 'businessNumber' || target.id === 'mobile' || target.id === 'mobile2' || target.id === 'landline') && event.key === 'Backspace') {
    const cursorPosition = target.selectionStart;
    const value = target.value;
    
    if (value[cursorPosition - 1] === '-') {
      event.preventDefault();
      const newPosition = cursorPosition - 2;
      const newValue = value.substring(0, newPosition) + value.substring(cursorPosition);
      
      if (target.id === 'businessNumber') {
        businessNumber.value = newValue;
      } else if (target.id === 'mobile') {
        mobile.value = newValue;
      } else if (target.id === 'mobile2') {
        mobile2.value = newValue;
      } else if (target.id === 'landline') {
        landline.value = newValue;
      }
      
      setTimeout(() => {
        target.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};

onMounted(async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (!error && data) {
    email.value = data.email || '';
    companyName.value = data.company_name || '';
    businessNumber.value = data.business_registration_number || '';
    representative.value = data.representative_name || '';
    address.value = data.business_address || '';
    landline.value = data.landline_phone || '';
    contactPerson.value = data.contact_person_name || '';
    mobile.value = data.mobile_phone || '';
    mobile2.value = data.mobile_phone_2 || '';
    receiveEmail.value = data.receive_email || '';
    companyGroup.value = data.company_group || '';
    commissionGrade.value = data.default_commission_grade || '';
    manager.value = data.assigned_pharmacist_contact || '';
    remarks.value = data.remarks || '';
    approvalStatus.value = data.approval_status || '';
    
    // 원본 데이터 저장
    originalData.value.email = data.email || '';
    originalData.value.companyName = data.company_name || '';
    originalData.value.businessNumber = data.business_registration_number || '';
    originalData.value.representative = data.representative_name || '';
    originalData.value.address = data.business_address || '';
    originalData.value.landline = data.landline_phone || '';
    originalData.value.contactPerson = data.contact_person_name || '';
    originalData.value.mobile = data.mobile_phone || '';
    originalData.value.mobile2 = data.mobile_phone_2 || '';
    originalData.value.receiveEmail = data.receive_email || '';
    originalData.value.companyGroup = data.company_group || '';
    originalData.value.commissionGrade = data.default_commission_grade || '';
    originalData.value.manager = data.assigned_pharmacist_contact || '';
    originalData.value.remarks = data.remarks || '';
    originalData.value.approvalStatus = data.approval_status || '';
  }
});

function goDetail() {
  // from 쿼리 파라미터가 있으면 함께 전달
  const from = route.query.from;
  if (from) {
    router.push(`/admin/companies/${route.params.id}?from=${from}`);
  } else {
    const fromDefault = route.query.from === 'pending' ? 'pending' : 'approved';
    router.push(`/admin/companies/${route.params.id}?from=${fromDefault}`);
  }
}

const handleSubmit = async () => {

  if (!companyName.value || companyName.value.trim() === '') {
    alert('업체명은 필수 입력 항목입니다.');
    setTimeout(() => {
      const companyNameInput = document.getElementById('companyName');
      if (companyNameInput) {
        companyNameInput.focus();
        companyNameInput.select();
      }
    }, 100);
    return;
  }

  if (!businessNumber.value || businessNumber.value.trim() === '') {
    alert('사업자등록번호는 필수 입력 항목입니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  if (!representative.value || representative.value.trim() === '') {
    alert('대표자는 필수 입력 항목입니다.');
    setTimeout(() => {
      const representativeInput = document.getElementById('representative');
      if (representativeInput) {
        representativeInput.focus();
        representativeInput.select();
      }
    }, 100);
    return;
  }





  // 사업자등록번호 형식 검증 (10자리 숫자)
  const businessNumberDigits = businessNumber.value.replace(/[^0-9]/g, '');
  if (businessNumberDigits.length !== 10) {
    alert('사업자등록번호는 10자리여야 합니다.');
    setTimeout(() => {
      const businessNumberInput = document.getElementById('businessNumber');
      if (businessNumberInput) {
        businessNumberInput.focus();
        businessNumberInput.select();
      }
    }, 100);
    return;
  }

  // 유선전화 형식 검증 (입력된 경우에만)
  if (landline.value && landline.value.trim() !== '') {
    const landlineNumber = landline.value.replace(/[^0-9]/g, '');
    if (!landlineNumber.startsWith('0')) {
      alert('유선전화 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const landlineInput = document.getElementById('landline');
        if (landlineInput) {
          landlineInput.focus();
          landlineInput.select();
        }
      }, 100);
      return;
    }
    
    // 서울(02)은 10자리, 나머지는 11자리
    if (landlineNumber.startsWith('02')) {
      if (landlineNumber.length !== 10) {
        alert('유선전화 번호 형식이 올바르지 않습니다.');
        setTimeout(() => {
          const landlineInput = document.getElementById('landline');
          if (landlineInput) {
            landlineInput.focus();
            landlineInput.select();
          }
        }, 100);
        return;
      }
    } else {
      if (landlineNumber.length !== 11) {
        alert('유선전화 번호 형식이 올바르지 않습니다.');
        setTimeout(() => {
          const landlineInput = document.getElementById('landline');
          if (landlineInput) {
            landlineInput.focus();
            landlineInput.select();
          }
        }, 100);
        return;
      }
    }
  }

  // 휴대폰번호 형식 검증 (입력된 경우에만)
  if (mobile.value && mobile.value.trim() !== '') {
    const mobileNumber = mobile.value.replace(/[^0-9]/g, '');
    if (mobileNumber.length !== 11 || !mobileNumber.startsWith('010')) {
      alert('휴대폰번호 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const mobileInput = document.getElementById('mobile');
        if (mobileInput) {
          mobileInput.focus();
          mobileInput.select();
        }
      }, 100);
      return;
    }
  }

  // 휴대폰번호2 형식 검증 (입력된 경우에만)
  if (mobile2.value && mobile2.value.trim() !== '') {
    const mobile2Number = mobile2.value.replace(/[^0-9]/g, '');
    if (mobile2Number.length !== 11 || !mobile2Number.startsWith('010')) {
      alert('휴대폰번호2 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const mobile2Input = document.getElementById('mobile2');
        if (mobile2Input) {
          mobile2Input.focus();
          mobile2Input.select();
        }
      }, 100);
      return;
    }
  }

  // 수신용 이메일 형식 검증 (입력된 경우에만)
  if (receiveEmail.value && receiveEmail.value.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiveEmail.value)) {
      alert('수신용 이메일 형식이 올바르지 않습니다.');
      setTimeout(() => {
        const receiveEmailInput = document.getElementById('receiveEmail');
        if (receiveEmailInput) {
          receiveEmailInput.focus();
          receiveEmailInput.select();
        }
      }, 100);
      return;
    }
  }

  try {
    loading.value = true;
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      loading.value = false;
      return;
    }
    const adminUserId = currentUser.data.user.id;
    
    // 사업자등록번호에서 특수문자 제거
    const cleanBusinessNumber = businessNumber.value.replace(/[^0-9]/g, '');
    
    // 사업자등록번호 중복 검증 (자신 제외, 특수문자 제거된 값으로 검색)
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('business_registration_number', cleanBusinessNumber)
      .neq('id', route.params.id) // 자신 제외
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없는 경우
      throw checkError;
    }
    
    if (existingCompany) {
      alert('동일한 사업자등록번호로 이미 가입된 이력이 있습니다.');
      setTimeout(() => {
        const businessNumberInput = document.getElementById('businessNumber');
        if (businessNumberInput) {
          businessNumberInput.focus();
          businessNumberInput.select();
        }
      }, 100);
      return;
    }

    const { error } = await supabase
      .from('companies')
      .update({
        company_name: companyName.value,
        business_registration_number: cleanBusinessNumber,
        representative_name: representative.value,
        business_address: address.value,
        landline_phone: landline.value,
        contact_person_name: contactPerson.value,
        mobile_phone: mobile.value,
        mobile_phone_2: mobile2.value,
        receive_email: receiveEmail.value,
        company_group: companyGroup.value,
        default_commission_grade: commissionGrade.value,
        assigned_pharmacist_contact: manager.value,
        approval_status: approvalStatus.value,
        remarks: remarks.value,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      })
      .eq('id', route.params.id);

    if (error) throw error;
    alert('수정되었습니다.');
    goDetail();
  } catch (err) {
    console.error('업체 정보 수정 중 오류가 발생했습니다.', err);
    alert('업체 정보 수정에 실패했습니다.');
  } finally {
    loading.value = false;
  }
};
</script>
