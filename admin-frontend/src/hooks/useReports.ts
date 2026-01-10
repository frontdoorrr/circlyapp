import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportsApi } from '@/api/reports';
import type { ReportFilters, ReportReviewRequest } from '@/types/reports';

export const reportsKeys = {
  all: ['reports'] as const,
  list: (filters: ReportFilters) => [...reportsKeys.all, 'list', filters] as const,
  detail: (id: string) => [...reportsKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch reports list with filters
 */
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.list(filters),
    queryFn: () => reportsApi.getAll(filters),
  });
}

/**
 * Hook to fetch single report
 */
export function useReport(reportId: string) {
  return useQuery({
    queryKey: reportsKeys.detail(reportId),
    queryFn: () => reportsApi.getById(reportId),
    enabled: !!reportId,
  });
}

/**
 * Hook to review/update report status
 */
export function useReviewReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: ReportReviewRequest }) =>
      reportsApi.review(reportId, data),
    onSuccess: () => {
      toast.success('신고 처리가 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: reportsKeys.all });
    },
  });
}
