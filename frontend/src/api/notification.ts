/**
 * Notification API Module
 *
 * Endpoint: /api/v1/notifications
 */
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

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
