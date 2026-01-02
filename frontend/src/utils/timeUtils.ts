/**
 * Time Formatting Utilities
 *
 * 투표 남은 시간 계산 및 표시 관련 유틸리티 함수
 * Spec: todo.md - 11.11.4
 */

import { tokens } from '../theme';

// ============================================================================
// Time Remaining Functions
// ============================================================================

/**
 * 남은 시간 포맷팅
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 포맷팅된 시간 문자열
 *
 * @example
 * formatTimeRemaining('2025-01-03T15:00:00Z')
 * // 1시간 이상: "3H 남음"
 * // 1시간 미만: "30분 남음"
 * // 마감: "마감됨"
 */
export function formatTimeRemaining(endDate: string | Date): string {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  // 이미 마감됨
  if (diff <= 0) {
    return '마감됨';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  // 24시간 이상
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 남음`;
  }

  // 1시간 이상
  if (hours >= 1) {
    if (remainingMinutes > 0) {
      return `${hours}시간 ${remainingMinutes}분 남음`;
    }
    return `${hours}H 남음`;
  }

  // 1시간 미만
  if (minutes > 0) {
    return `${minutes}분 남음`;
  }

  // 1분 미만
  const seconds = Math.floor(diff / 1000);
  return `${seconds}초 남음`;
}

/**
 * 간단한 남은 시간 포맷팅 (짧은 버전)
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 짧은 시간 문자열
 *
 * @example
 * formatTimeRemainingShort('2025-01-03T15:00:00Z')
 * // "3H", "30분", "마감"
 */
export function formatTimeRemainingShort(endDate: string | Date): string {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return '마감';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}일`;
  }

  if (hours >= 1) {
    return `${hours}H`;
  }

  if (minutes > 0) {
    return `${minutes}분`;
  }

  return '곧 마감';
}

// ============================================================================
// Time Remaining Color Functions
// ============================================================================

export type TimeUrgencyLevel = 'urgent' | 'warning' | 'normal';

/**
 * 긴급도에 따른 색상 반환
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 긴급도에 맞는 색상 코드
 *
 * @example
 * getTimeRemainingColor('2025-01-03T15:00:00Z')
 * // <30분: red-500 (긴급)
 * // <1H: orange-500 (주의)
 * // >1H: neutral-500 (보통)
 */
export function getTimeRemainingColor(endDate: string | Date): string {
  const urgency = getTimeUrgency(endDate);

  switch (urgency) {
    case 'urgent':
      return tokens.colors.error[500]; // red-500
    case 'warning':
      return tokens.colors.warning[500]; // orange-500
    case 'normal':
    default:
      return tokens.colors.neutral[500]; // neutral-500
  }
}

/**
 * 긴급도 레벨 반환
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 긴급도 레벨
 */
export function getTimeUrgency(endDate: string | Date): TimeUrgencyLevel {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const minutes = Math.floor(diff / (1000 * 60));

  // 30분 미만 - 긴급
  if (minutes < 30) {
    return 'urgent';
  }

  // 1시간 미만 - 주의
  if (minutes < 60) {
    return 'warning';
  }

  // 1시간 이상 - 보통
  return 'normal';
}

/**
 * 1시간 이내 여부 확인
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 1시간 이내이면 true
 */
export function isUrgent(endDate: string | Date): boolean {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const minutes = Math.floor(diff / (1000 * 60));

  return minutes > 0 && minutes < 60;
}

/**
 * 마감 여부 확인
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 마감됐으면 true
 */
export function isExpired(endDate: string | Date): boolean {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  return end.getTime() <= now.getTime();
}

// ============================================================================
// Time Calculation Functions
// ============================================================================

/**
 * 밀리초 단위 남은 시간 계산
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 남은 밀리초 (음수면 이미 마감)
 */
export function getTimeRemainingMs(endDate: string | Date): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  return end.getTime() - now.getTime();
}

/**
 * 분 단위 남은 시간 계산
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 남은 분 (음수면 이미 마감)
 */
export function getTimeRemainingMinutes(endDate: string | Date): number {
  return Math.floor(getTimeRemainingMs(endDate) / (1000 * 60));
}

/**
 * 시간 단위 남은 시간 계산
 *
 * @param endDate - 마감 시간 (ISO string 또는 Date)
 * @returns 남은 시간 (음수면 이미 마감)
 */
export function getTimeRemainingHours(endDate: string | Date): number {
  return Math.floor(getTimeRemainingMs(endDate) / (1000 * 60 * 60));
}

// ============================================================================
// Duration Functions
// ============================================================================

/**
 * 투표 기간 옵션에서 마감 시간 계산
 *
 * @param duration - 기간 (1H, 3H, 6H, 24H)
 * @param startDate - 시작 시간 (기본: 현재)
 * @returns 마감 시간 Date 객체
 */
export function calculateEndDate(
  duration: '1H' | '3H' | '6H' | '24H',
  startDate: Date = new Date()
): Date {
  const durationHours: Record<string, number> = {
    '1H': 1,
    '3H': 3,
    '6H': 6,
    '24H': 24,
  };

  const hours = durationHours[duration] || 1;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + hours);

  return endDate;
}

/**
 * 투표 기간 옵션 레이블 생성
 *
 * @param duration - 기간 (1H, 3H, 6H, 24H)
 * @returns 레이블 문자열
 */
export function getDurationLabel(duration: '1H' | '3H' | '6H' | '24H'): string {
  const labels: Record<string, string> = {
    '1H': '1시간',
    '3H': '3시간',
    '6H': '6시간',
    '24H': '24시간',
  };

  return labels[duration] || duration;
}

// ============================================================================
// Relative Time Functions
// ============================================================================

/**
 * 상대 시간 포맷팅 (과거 시간)
 *
 * @param date - 대상 시간 (ISO string 또는 Date)
 * @returns 상대 시간 문자열
 *
 * @example
 * formatRelativeTime('2025-01-02T10:00:00Z')
 * // "방금 전", "5분 전", "2시간 전", "어제", "3일 전"
 */
export function formatRelativeTime(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - target.getTime();

  // 미래 시간
  if (diff < 0) {
    return '방금 전';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '방금 전';
  }

  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  if (hours < 24) {
    return `${hours}시간 전`;
  }

  if (days === 1) {
    return '어제';
  }

  if (days < 7) {
    return `${days}일 전`;
  }

  // 7일 이상은 날짜로 표시
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}월 ${day}일`;
}
