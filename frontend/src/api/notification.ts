/**
 * Notification API Module
 *
 * Endpoint: /api/v1/notifications
 */
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

/**
 * 알림 유형 (backend NotificationType enum과 일치)
 */
export type NotificationType =
  | 'POLL_STARTED'
  | 'POLL_REMINDER'
  | 'POLL_ENDED'
  | 'VOTE_RECEIVED'
  | 'CIRCLE_INVITE';

/**
 * 알림 항목 (backend NotificationResponse와 일치)
 */
export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}

/**
 * 백엔드 응답 형식에 따라 데이터 추출
 * - { success: true, data: T } 래핑 형식
 * - T 직접 반환 형식
 */
function extractData<T>(responseData: any, validator: (data: any) => boolean): T {
  if (responseData?.success && responseData.data !== undefined) {
    return responseData.data;
  } else if (validator(responseData)) {
    return responseData;
  }
  throw new Error('Unexpected response format');
}

/**
 * 알림 설정 타입
 */
export interface NotificationSettings {
  poll_started: boolean;
  poll_reminder: boolean;
  poll_ended: boolean;
  vote_received: boolean;
  circle_invite: boolean;
}

/**
 * 알림 설정 업데이트 요청 타입
 */
export interface NotificationSettingsUpdate {
  poll_started?: boolean;
  poll_reminder?: boolean;
  poll_ended?: boolean;
  vote_received?: boolean;
  circle_invite?: boolean;
}

/**
 * 알림 목록 조회
 */
export async function getNotifications(
  limit = 50,
  offset = 0
): Promise<NotificationItem[]> {
  const response = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications', {
    params: { limit, offset },
  });
  return extractData<NotificationItem[]>(response.data, (d) => Array.isArray(d));
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count'
  );
  const data = extractData<{ count: number }>(
    response.data,
    (d) => typeof d?.count === 'number'
  );
  return data.count;
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`/notifications/${notificationId}/read`);
}

/**
 * 전체 알림 읽음 처리
 */
export async function markAllAsRead(): Promise<void> {
  await apiClient.put<ApiResponse<void>>('/notifications/read-all');
}

/**
 * Push Token 등록
 */
export async function registerPushToken(token: string): Promise<void> {
  await apiClient.post<ApiResponse<void>>('/notifications/register-token', {
    expo_push_token: token,
  });
}

/**
 * Push Token 삭제 (로그아웃 시)
 */
export async function unregisterPushToken(): Promise<void> {
  await apiClient.delete<ApiResponse<void>>('/notifications/unregister-token');
}

/**
 * 알림 설정 조회
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiClient.get<NotificationSettings>('/notifications/settings');
  return response.data;
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSettings(
  settings: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  const response = await apiClient.put<NotificationSettings>(
    '/notifications/settings',
    settings
  );
  return response.data;
}
