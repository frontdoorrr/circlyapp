/**
 * Notifications Inbox Hook
 *
 * React Query hooks for the notification inbox (list, unread badge, read state)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  NotificationItem,
} from '../api/notification';

const LIST_KEY = ['notifications'];
const UNREAD_KEY = ['notifications', 'unread-count'];

/**
 * 알림 목록 조회 훅
 */
export function useNotifications() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => getNotifications(),
    staleTime: 1000 * 30,
  });
}

/**
 * 읽지 않은 알림 개수 훅 (홈 벨 배지용)
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCount,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
  });
}

/**
 * 알림 읽음 처리 훅 (낙관적 업데이트)
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previousList = queryClient.getQueryData<NotificationItem[]>(LIST_KEY);
      const previousCount = queryClient.getQueryData<number>(UNREAD_KEY);

      queryClient.setQueryData<NotificationItem[]>(LIST_KEY, (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      const wasUnread = previousList?.find((n) => n.id === notificationId && !n.is_read);
      if (wasUnread && typeof previousCount === 'number') {
        queryClient.setQueryData<number>(UNREAD_KEY, Math.max(0, previousCount - 1));
      }
      return { previousList, previousCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(LIST_KEY, context.previousList);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(UNREAD_KEY, context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

/**
 * 전체 알림 읽음 처리 훅
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const previousList = queryClient.getQueryData<NotificationItem[]>(LIST_KEY);
      const previousCount = queryClient.getQueryData<number>(UNREAD_KEY);

      queryClient.setQueryData<NotificationItem[]>(LIST_KEY, (old) =>
        old?.map((n) => ({ ...n, is_read: true }))
      );
      queryClient.setQueryData<number>(UNREAD_KEY, 0);
      return { previousList, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(LIST_KEY, context.previousList);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(UNREAD_KEY, context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}
