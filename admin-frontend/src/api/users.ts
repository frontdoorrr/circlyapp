import { apiClient } from './client';
import type {
  User,
  UserListResponse,
  UserFilters,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
} from '@/types/users';

export const usersApi = {
  /**
   * Get all users with filters
   */
  getAll: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const params: Record<string, string | number | boolean> = {};

    if (filters.search) params.search = filters.search;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;
    if (filters.role) params.role = filters.role;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset !== undefined) params.offset = filters.offset;

    const response = await apiClient.get<UserListResponse>('/auth/admin/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/auth/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user status
   */
  updateStatus: async (userId: string, data: UpdateUserStatusRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/auth/admin/users/${userId}/status`, data);
    return response.data;
  },

  /**
   * Update user role
   */
  updateRole: async (userId: string, data: UpdateUserRoleRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/auth/admin/users/${userId}/role`, data);
    return response.data;
  },
};
