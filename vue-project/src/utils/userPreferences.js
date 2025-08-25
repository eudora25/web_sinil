import { supabase } from '@/supabase';

/**
 * 사용자 설정 존재 여부 확인
 * @param {string} key - 설정 키
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 설정 존재 여부
 */
export async function hasUserPreference(key, settlementMonthId = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    let query = supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('preference_key', key);

    if (settlementMonthId) {
      query = query.eq('settlement_month_id', settlementMonthId);
    } else {
      query = query.is('settlement_month_id', null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
      console.error('사용자 설정 확인 오류:', error);
      return false;
    }

    return !!data; // 데이터가 있으면 true, 없으면 false
  } catch (err) {
    console.error('사용자 설정 확인 중 오류:', err);
    return false;
  }
}

/**
 * 사용자 설정 등록
 * @param {string} key - 설정 키
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function addUserPreference(key, settlementMonthId = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: session.user.id,
        preference_key: key,
        settlement_month_id: settlementMonthId
      });

    if (error) {
      console.error('사용자 설정 등록 오류:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('사용자 설정 등록 중 오류:', err);
    return false;
  }
}

/**
 * 사용자 설정 삭제
 * @param {string} key - 설정 키
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deleteUserPreference(key, settlementMonthId = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    let query = supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', session.user.id)
      .eq('preference_key', key);

    if (settlementMonthId) {
      query = query.eq('settlement_month_id', settlementMonthId);
    } else {
      query = query.is('settlement_month_id', null);
    }

    const { error } = await query;

    if (error) {
      console.error('사용자 설정 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('사용자 설정 삭제 중 오류:', err);
    return false;
  }
}

/**
 * 체크 상태에 따른 사용자 설정 관리 (새로운 심플한 로직)
 * @param {string} key - 설정 키
 * @param {boolean} isChecked - 체크 여부
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function manageUserPreference(key, isChecked, settlementMonthId = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    // 현재 설정 존재 여부 확인
    const hasPreference = await hasUserPreference(key, settlementMonthId);

    if (isChecked) {
      // 체크된 경우: 있으면 아무 동작 없음, 없으면 등록
      if (!hasPreference) {
        return await addUserPreference(key, settlementMonthId);
      }
      return true; // 이미 있으면 성공으로 처리
    } else {
      // 체크되지 않은 경우: 있으면 삭제, 없으면 아무 동작 없음
      if (hasPreference) {
        return await deleteUserPreference(key, settlementMonthId);
      }
      return true; // 이미 없으면 성공으로 처리
    }
  } catch (err) {
    console.error('사용자 설정 관리 중 오류:', err);
    return false;
  }
}

// 기존 함수들 (하위 호환성을 위해 유지하되 내부 로직 변경)

/**
 * 사용자 설정 조회 (하위 호환성)
 * @param {string} key - 설정 키
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 설정 존재 여부
 */
export async function getUserPreference(key, settlementMonthId = null) {
  return await hasUserPreference(key, settlementMonthId);
}

/**
 * 사용자 설정 저장 (하위 호환성)
 * @param {string} key - 설정 키
 * @param {boolean} value - 설정 값 (true면 등록, false면 삭제)
 * @param {number} settlementMonthId - 정산월 ID (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function setUserPreference(key, value, settlementMonthId = null) {
  return await manageUserPreference(key, value, settlementMonthId);
}

/**
 * 전달사항 모달 숨김 설정 조회
 * @param {string} modalType - 모달 타입 ('performance' 또는 'settlement')
 * @param {number} settlementMonthId - 정산월 ID
 * @returns {Promise<boolean>} 숨김 여부
 */
export async function getNoticeModalHidePreference(modalType, settlementMonthId) {
  const key = `hide_notice_modal_${modalType}`;
  return await hasUserPreference(key, settlementMonthId);
}

/**
 * 전달사항 모달 숨김 설정 저장
 * @param {string} modalType - 모달 타입 ('performance' 또는 'settlement')
 * @param {boolean} hide - 숨김 여부
 * @param {number} settlementMonthId - 정산월 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export async function setNoticeModalHidePreference(modalType, hide, settlementMonthId) {
  const key = `hide_notice_modal_${modalType}`;
  return await manageUserPreference(key, hide, settlementMonthId);
} 