import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pollsApi } from '@/api/polls';
import type { PollFilters, UpdatePollStatusRequest, AdminPollCreate } from '@/types/polls';

export const pollsKeys = {
  all: ['polls'] as const,
  list: (filters: PollFilters) => [...pollsKeys.all, 'list', filters] as const,
  templates: (category?: string) => [...pollsKeys.all, 'templates', category] as const,
};

/**
 * Hook to fetch polls list with filters
 */
export function usePolls(filters: PollFilters = {}) {
  return useQuery({
    queryKey: pollsKeys.list(filters),
    queryFn: () => pollsApi.getAll(filters),
  });
}

/**
 * Hook to fetch templates
 */
export function useTemplates(category?: string) {
  return useQuery({
    queryKey: pollsKeys.templates(category),
    queryFn: () => pollsApi.getTemplates(category),
  });
}

/**
 * Hook to update poll status
 */
export function useUpdatePollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: UpdatePollStatusRequest }) =>
      pollsApi.updateStatus(pollId, data),
    onSuccess: () => {
      toast.success('투표 상태가 변경되었습니다.');
      queryClient.invalidateQueries({ queryKey: pollsKeys.all });
    },
  });
}

/**
 * Hook to broadcast poll to circles
 */
export function useBroadcastPoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminPollCreate) => pollsApi.broadcastPoll(data),
    onSuccess: (data) => {
      toast.success(`${data.created_count}개의 Circle에 투표가 생성되었습니다.`);
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count}개의 Circle에서 생성 실패`);
      }
      queryClient.invalidateQueries({ queryKey: pollsKeys.all });
    },
    onError: () => {
      toast.error('투표 생성에 실패했습니다.');
    },
  });
}
