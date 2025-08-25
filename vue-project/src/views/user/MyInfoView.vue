<template>
  <div class="board_640">
    <div class="form-title">내 정보</div>
    <div class="form-grid">
      <div class="form-group">
        <label>아이디(이메일)</label>
        <input :value="email" readonly disabled />
      </div>
      <div class="form-group">
        <label>업체명</label>
        <input :value="companyName" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업자등록번호</label>
        <input :value="businessNumber" readonly disabled />
      </div>
      <div class="form-group">
        <label>대표자명</label>
        <input :value="representative" readonly disabled />
      </div>
      <div class="form-group">
        <label>사업장 소재지</label>
        <input :value="address" readonly disabled />
      </div>
      <div class="form-group">
        <label>담당자명</label>
        <input :value="contactPerson" readonly disabled />
      </div>
      <div class="form-group">
        <label>휴대폰 번호</label>
        <input :value="mobile" readonly disabled />
      </div>
      <div class="button-area">
        <button class="btn-reset-password" type="button" @click="goChangePassword">비밀번호 변경</button>
        <button class="btn-edit" type="button" @click="goEdit">수정</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

const router = useRouter()

const email = ref('')
const companyName = ref('')
const businessNumber = ref('')
const representative = ref('')
const address = ref('')
const contactPerson = ref('')
const mobile = ref('')

onMounted(async () => {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      router.push('/login')
      return
    }

    // 사용자의 회사 정보 조회
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
      
    if (error) {
      console.error('사용자 정보 조회 오류:', error)
      alert('사용자 정보를 불러올 수 없습니다.')
      return
    }
    
    if (data) {
      email.value = data.email || ''
      companyName.value = data.company_name || ''
      businessNumber.value = data.business_registration_number || ''
      representative.value = data.representative_name || ''
      address.value = data.business_address || ''
      contactPerson.value = data.contact_person_name || ''
      mobile.value = data.mobile_phone || ''
    }
  } catch (err) {
    console.error('사용자 정보 조회 예외:', err)
    alert('사용자 정보를 불러오는 중 오류가 발생했습니다.')
  }
})

function goEdit() {
  router.push('/my-info/edit')
}

function goChangePassword() {
  router.push('/my-info/change-password')
}
</script> 