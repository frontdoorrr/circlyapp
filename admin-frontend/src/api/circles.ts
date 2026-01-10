import { apiClient } from './client';
import type {
  Circle,
  CircleDetail,
  CircleListResponse,
  CircleFilters,
  UpdateCircleStatusRequest,
} from '@/types/circles';

export const circlesApi = {
  /**
   * Get all circles with filters
   */
  getAll: async (filters: CircleFilters = {}): Promise<CircleListResponse> => {
    const params: Record<string, string | number | boolean> = {};

    if (filters.search) params.search = filters.search;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset !== undefined) params.offset = filters.offset;

    const response = await apiClient.get<CircleListResponse>('/circles/admin/all', { params });
    return response.data;
  },

  /**
   * Get circle details with members
   */
  getById: async (circleId: string): Promise<CircleDetail> => {
    const response = await apiClient.get<CircleDetail>(`/circles/admin/${circleId}`);
    return response.data;
  },

  /**
   * Update circle status
   */
  updateStatus: async (circleId: string, data: UpdateCircleStatusRequest): Promise<Circle> => {
    const response = await apiClient.put<Circle>(`/circles/admin/${circleId}/status`, data);
    return response.data;
  },

  /**
   * Remove member from circle
   */
  removeMember: async (circleId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/circles/admin/${circleId}/members/${userId}`);
  },
};
