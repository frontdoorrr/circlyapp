import { apiClient } from './client';
import type {
  Report,
  ReportListResponse,
  ReportFilters,
  ReportReviewRequest,
} from '@/types/reports';

export const reportsApi = {
  /**
   * Get all reports with filters (Admin only)
   */
  getAll: async (filters: ReportFilters = {}): Promise<ReportListResponse> => {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.target_type) params.append('target_type', filters.target_type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<ReportListResponse>('/reports/admin/all', { params });
    return response.data;
  },

  /**
   * Get single report by ID (Admin only)
   */
  getById: async (reportId: string): Promise<Report> => {
    const response = await apiClient.get<Report>(`/reports/admin/${reportId}`);
    return response.data;
  },

  /**
   * Review and update report status (Admin only)
   */
  review: async (reportId: string, data: ReportReviewRequest): Promise<void> => {
    await apiClient.put(`/reports/admin/${reportId}/review`, data);
  },
};
