import { apiClient } from './client';
import type {
  Poll,
  PollListResponse,
  PollFilters,
  UpdatePollStatusRequest,
  TemplateListResponse,
  AdminPollCreate,
  BroadcastPollResponse,
} from '@/types/polls';

export const pollsApi = {
  /**
   * Get all polls (Admin)
   */
  async getAll(filters: PollFilters = {}): Promise<PollListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.circle_id) params.append('circle_id', filters.circle_id);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<PollListResponse>(
      `/polls/admin/all?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Update poll status (Admin)
   */
  async updateStatus(pollId: string, data: UpdatePollStatusRequest): Promise<Poll> {
    const response = await apiClient.put<Poll>(
      `/polls/admin/${pollId}/status`,
      data
    );
    return response.data;
  },

  /**
   * Get all templates (Admin)
   */
  async getTemplates(category?: string): Promise<TemplateListResponse> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await apiClient.get<TemplateListResponse>(
      `/polls/admin/templates?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Broadcast poll to circles (Admin)
   */
  async broadcastPoll(data: AdminPollCreate): Promise<BroadcastPollResponse> {
    const response = await apiClient.post<BroadcastPollResponse>(
      '/polls/admin/broadcast',
      data
    );
    return response.data;
  },
};
