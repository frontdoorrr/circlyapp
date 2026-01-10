/**
 * Notification API Module
 *
 * Endpoint: /api/v1/notifications
 */
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

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
