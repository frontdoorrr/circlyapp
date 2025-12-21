/**
 * Haptic Feedback Hooks
 *
 * Expo Haptics를 사용한 촉각 피드백 훅
 * 다양한 사용자 액션에 대한 햅틱 패턴 제공
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Haptic Action Types
// ============================================================================

export type HapticAction =
  | 'light'        // 가벼운 터치 (버튼 하이라이트)
  | 'medium'       // 중간 터치 (버튼 클릭)
  | 'heavy'        // 강한 터치 (중요한 액션)
  | 'success'      // 성공 (투표 완료, 저장 성공)
  | 'warning'      // 경고 (주의 필요)
  | 'error'        // 에러 (실패, 오류)
  | 'selection'    // 선택 변경 (옵션 선택)
  | 'swipe'        // 스와이프/슬라이드
  | 'longPress';   // 롱 프레스

// ============================================================================
// Haptic Feedback Hook
// ============================================================================

/**
 * 햅틱 피드백 훅
 *
 * @returns 다양한 햅틱 액션 함수들
 *
 * @example
 * const haptics = useHaptics();
 *
 * // 버튼 클릭
 * <Button onPress={() => {
 *   haptics.trigger('medium');
 *   handleAction();
 * }}>
 *
 * // 성공 피드백
 * haptics.success();
 *
 * // 에러 피드백
 * haptics.error();
 */
export function useHaptics() {
  // 기본 임팩트 피드백
  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // 알림 피드백
  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  // 선택 피드백
  const selection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  // 커스텀 패턴
  const swipe = useCallback(() => {
    // 스와이프 시 가벼운 피드백
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const longPress = useCallback(() => {
    // 롱 프레스 시 중간 피드백
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // 통합 트리거 함수
  const trigger = useCallback((action: HapticAction) => {
    switch (action) {
      case 'light':
        light();
        break;
      case 'medium':
        medium();
        break;
      case 'heavy':
        heavy();
        break;
      case 'success':
        success();
        break;
      case 'warning':
        warning();
        break;
      case 'error':
        error();
        break;
      case 'selection':
        selection();
        break;
      case 'swipe':
        swipe();
        break;
      case 'longPress':
        longPress();
        break;
      default:
        medium();
    }
  }, [light, medium, heavy, success, warning, error, selection, swipe, longPress]);

  return {
    // 개별 함수
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    swipe,
    longPress,
    // 통합 트리거
    trigger,
  };
}

// ============================================================================
// Context-Specific Haptic Hooks
// ============================================================================

/**
 * 투표 관련 햅틱 피드백
 *
 * @example
 * const voteHaptics = useVoteHaptics();
 * voteHaptics.selectOption(); // 옵션 선택
 * voteHaptics.submitVote();   // 투표 제출
 */
export function useVoteHaptics() {
  const haptics = useHaptics();

  return {
    // 투표 옵션 선택
    selectOption: haptics.selection,
    // 투표 제출
    submitVote: haptics.success,
    // 투표 취소
    cancelVote: haptics.light,
    // 투표 마감
    pollEnded: haptics.warning,
  };
}

/**
 * Circle 관련 햅틱 피드백
 *
 * @example
 * const circleHaptics = useCircleHaptics();
 * circleHaptics.joinCircle();  // Circle 가입
 * circleHaptics.leaveCircle(); // Circle 탈퇴
 */
export function useCircleHaptics() {
  const haptics = useHaptics();

  return {
    // Circle 생성
    createCircle: haptics.success,
    // Circle 가입
    joinCircle: haptics.success,
    // Circle 탈퇴
    leaveCircle: haptics.warning,
    // 초대 코드 복사
    copyInviteCode: haptics.light,
  };
}

/**
 * 네비게이션 관련 햅틱 피드백
 *
 * @example
 * const navHaptics = useNavigationHaptics();
 * navHaptics.tabChange();   // 탭 전환
 * navHaptics.backPress();   // 뒤로 가기
 */
export function useNavigationHaptics() {
  const haptics = useHaptics();

  return {
    // 탭 전환
    tabChange: haptics.selection,
    // 뒤로 가기
    backPress: haptics.light,
    // 화면 전환
    screenTransition: haptics.light,
    // 모달 열기
    openModal: haptics.medium,
    // 모달 닫기
    closeModal: haptics.light,
  };
}

/**
 * 폼 입력 관련 햅틱 피드백
 *
 * @example
 * const formHaptics = useFormHaptics();
 * formHaptics.inputFocus();    // 입력 필드 포커스
 * formHaptics.validationError(); // 유효성 검사 에러
 */
export function useFormHaptics() {
  const haptics = useHaptics();

  return {
    // 입력 필드 포커스
    inputFocus: haptics.light,
    // 입력 완료
    inputComplete: haptics.light,
    // 폼 제출 성공
    submitSuccess: haptics.success,
    // 유효성 검사 에러
    validationError: haptics.error,
  };
}
