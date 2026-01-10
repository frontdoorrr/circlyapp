import { apiClient } from './client';
import type {
  BroadcastRequest,
  BroadcastResponse,
  BroadcastHistoryResponse,
} from '@/types/notifications';

export const notificationsApi = {
  /**
   * Broadcast notification to all users
   */
  broadcast: async (data: BroadcastRequest): Promise<BroadcastResponse> => {
    const response = await apiClient.post<BroadcastResponse>('/notifications/admin/broadcast', data);
    return response.data;
  },

  /**
   * Get broadcast history
   */
  getHistory: async (limit: number = 50, offset: number = 0): Promise<BroadcastHistoryResponse> => {
    const response = await apiClient.get<BroadcastHistoryResponse>('/notifications/admin/history', {
      params: { limit, offset },
    });
    return response.data;
  },
};
