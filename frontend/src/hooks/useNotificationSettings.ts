/**
 * Notification Settings Hook
 *
 * React Query hook for notification settings API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings,
  NotificationSettingsUpdate,
} from '../api/notification';

const QUERY_KEY = ['notificationSettings'];

/**
 * 알림 설정 조회 훅
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotificationSettings,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });
}

/**
 * 알림 설정 업데이트 훅
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: NotificationSettingsUpdate) =>
      updateNotificationSettings(settings),
    onSuccess: (data) => {
      // 캐시 업데이트
      queryClient.setQueryData<NotificationSettings>(QUERY_KEY, data);
    },
  });
}
