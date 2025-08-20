/**
 * 알림 관련 React Hook
 * TRD 06-notification-system.md의 알림 시스템 요구사항 기반
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationData } from '../services/notifications';
import * as Notifications from 'expo-notifications';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface NotificationSettings {
  poll_created: boolean;
  poll_deadline: boolean;
  poll_results: boolean;
  circle_invites: boolean;
}

export interface UseNotificationsReturn {
  // 상태
  isInitialized: boolean;
  permissionStatus: NotificationPermissionStatus | null;
  pushToken: string | null;
  settings: NotificationSettings | null;
  
  // 액션
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  scheduleLocalNotification: (notification: NotificationData) => Promise<void>;
  schedulePollDeadline: (pollId: number, pollTitle: string, deadlineDate: Date) => Promise<string | null>;
  cancelNotification: (id: string) => Promise<void>;
  clearBadge: () => Promise<void>;
  
  // 로딩 상태
  isLoading: boolean;
  error: string | null;
}

const NOTIFICATION_QUERY_KEYS = {
  settings: 'notification_settings',
  permissions: 'notification_permissions',
} as const;

/**
 * 알림 관리 Hook
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // 알림 설정 조회
  const { data: settings } = useQuery({
    queryKey: [NOTIFICATION_QUERY_KEYS.settings],
    queryFn: async (): Promise<NotificationSettings> => {
      // TODO: API에서 사용자 알림 설정 조회
      return {
        poll_created: true,
        poll_deadline: true,
        poll_results: true,
        circle_invites: true,
      };
    },
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 권한 상태 확인
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      const permissionData: NotificationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
      setPermissionStatus(permissionData);
      return permissionData;
    } catch (err) {
      console.error('Failed to check notification permissions:', err);
      setError('권한 상태 확인 실패');
      return null;
    }
  }, []);

  // 초기화
  const initialize = useCallback(async (): Promise<void> => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      await notificationService.initialize();
      const token = notificationService.getPushToken();
      setPushToken(token);
      
      await checkPermissionStatus();
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 서비스 초기화 실패';
      console.error('Failed to initialize notifications:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, checkPermissionStatus]);

  // 권한 요청
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const granted = await notificationService.requestPermissions();
      await checkPermissionStatus();
      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '권한 요청 실패';
      console.error('Failed to request permissions:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissionStatus]);

  // 설정 업데이트 뮤테이션
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings): Promise<NotificationSettings> => {
      // TODO: API로 설정 업데이트
      console.log('Updating notification settings:', newSettings);
      
      // 임시로 로컬 스토리지 사용
      return newSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([NOTIFICATION_QUERY_KEYS.settings], data);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : '설정 업데이트 실패';
      console.error('Failed to update notification settings:', err);
      setError(errorMessage);
    },
  });

  // 로컬 알림 표시
  const scheduleLocalNotification = useCallback(async (notification: NotificationData): Promise<void> => {
    try {
      await notificationService.showLocalNotification(notification);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 표시 실패';
      console.error('Failed to show local notification:', err);
      setError(errorMessage);
    }
  }, []);

  // 투표 마감 알림 예약
  const schedulePollDeadline = useCallback(async (
    pollId: number,
    pollTitle: string,
    deadlineDate: Date
  ): Promise<string | null> => {
    try {
      return await notificationService.schedulePollDeadlineNotification(pollId, pollTitle, deadlineDate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 예약 실패';
      console.error('Failed to schedule poll deadline notification:', err);
      setError(errorMessage);
      return null;
    }
  }, []);

  // 알림 취소
  const cancelNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await notificationService.cancelNotification(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알림 취소 실패';
      console.error('Failed to cancel notification:', err);
      setError(errorMessage);
    }
  }, []);

  // 배지 초기화
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearBadge();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배지 초기화 실패';
      console.error('Failed to clear badge:', err);
      setError(errorMessage);
    }
  }, []);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // 상태
    isInitialized,
    permissionStatus,
    pushToken,
    settings: settings || null,
    
    // 액션
    initialize,
    requestPermissions,
    updateSettings: updateSettingsMutation.mutateAsync,
    scheduleLocalNotification,
    schedulePollDeadline,
    cancelNotification,
    clearBadge,
    
    // 로딩 상태
    isLoading: isLoading || updateSettingsMutation.isPending,
    error,
  };
};

/**
 * 투표 관련 알림 Hook
 */
export const usePollNotifications = (circleId: number) => {
  const notifications = useNotifications();

  // 새 투표 생성 알림
  const notifyPollCreated = useCallback(async (pollTitle: string, pollId: number): Promise<void> => {
    if (!notifications.settings?.poll_created) return;

    await notifications.scheduleLocalNotification({
      type: 'poll_created',
      poll_id: pollId,
      circle_id: circleId,
      title: '🗳️ 새로운 투표가 시작되었습니다!',
      body: `"${pollTitle}" 투표에 참여해보세요`,
      data: {
        poll_id: pollId,
        circle_id: circleId,
        action: 'open_poll',
      },
    });
  }, [notifications, circleId]);

  // 투표 결과 알림
  const notifyPollResults = useCallback(async (pollTitle: string, pollId: number): Promise<void> => {
    if (!notifications.settings?.poll_results) return;

    await notifications.scheduleLocalNotification({
      type: 'poll_result',
      poll_id: pollId,
      circle_id: circleId,
      title: '📊 투표 결과가 발표되었습니다!',
      body: `"${pollTitle}" 투표 결과를 확인해보세요`,
      data: {
        poll_id: pollId,
        circle_id: circleId,
        action: 'view_results',
      },
    });
  }, [notifications, circleId]);

  // 투표 마감 임박 알림
  const scheduleDeadlineNotification = useCallback(async (
    pollTitle: string,
    pollId: number,
    deadlineDate: Date
  ): Promise<string | null> => {
    if (!notifications.settings?.poll_deadline) return null;

    return await notifications.schedulePollDeadline(pollId, pollTitle, deadlineDate);
  }, [notifications]);

  return {
    notifyPollCreated,
    notifyPollResults,
    scheduleDeadlineNotification,
    ...notifications,
  };
};

export default useNotifications;