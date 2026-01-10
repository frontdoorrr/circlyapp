import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '@/api/notifications';
import type { BroadcastRequest } from '@/types/notifications';

export const notificationsKeys = {
  all: ['notifications'] as const,
  history: (limit: number, offset: number) => [...notificationsKeys.all, 'history', limit, offset] as const,
};

/**
 * Hook to fetch broadcast history
 */
export function useBroadcastHistory(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: notificationsKeys.history(limit, offset),
    queryFn: () => notificationsApi.getHistory(limit, offset),
  });
}

/**
 * Hook to broadcast notification
 */
export function useBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BroadcastRequest) => notificationsApi.broadcast(data),
    onSuccess: (result) => {
      toast.success(result.message || '알림이 발송되었습니다.');
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
