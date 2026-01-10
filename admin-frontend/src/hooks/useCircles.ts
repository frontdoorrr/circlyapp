import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { circlesApi } from '@/api/circles';
import type { CircleFilters, UpdateCircleStatusRequest } from '@/types/circles';

export const circlesKeys = {
  all: ['circles'] as const,
  list: (filters: CircleFilters) => [...circlesKeys.all, 'list', filters] as const,
  detail: (id: string) => [...circlesKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch circles list with filters
 */
export function useCircles(filters: CircleFilters = {}) {
  return useQuery({
    queryKey: circlesKeys.list(filters),
    queryFn: () => circlesApi.getAll(filters),
  });
}

/**
 * Hook to fetch single circle with members
 */
export function useCircleDetail(circleId: string | null) {
  return useQuery({
    queryKey: circlesKeys.detail(circleId || ''),
    queryFn: () => circlesApi.getById(circleId!),
    enabled: !!circleId,
  });
}

/**
 * Hook to update circle status
 */
export function useUpdateCircleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, data }: { circleId: string; data: UpdateCircleStatusRequest }) =>
      circlesApi.updateStatus(circleId, data),
    onSuccess: () => {
      toast.success('Circle 상태가 변경되었습니다.');
      queryClient.invalidateQueries({ queryKey: circlesKeys.all });
    },
  });
}

/**
 * Hook to remove member from circle
 */
export function useRemoveCircleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      circlesApi.removeMember(circleId, userId),
    onSuccess: (_data, variables) => {
      toast.success('멤버가 제거되었습니다.');
      queryClient.invalidateQueries({ queryKey: circlesKeys.detail(variables.circleId) });
      queryClient.invalidateQueries({ queryKey: circlesKeys.all });
    },
  });
}
