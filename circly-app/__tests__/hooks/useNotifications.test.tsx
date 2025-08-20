/**
 * useNotifications 훅 테스트
 * TRD 06-notification-system.md의 테스트 전략 기반
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useNotifications, usePollNotifications } from '../../src/hooks/useNotifications';
import { notificationService } from '../../src/services/notifications';

// Mock 설정
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('../../src/services/notifications', () => ({
  notificationService: {
    initialize: jest.fn(),
    requestPermissions: jest.fn(),
    getPushToken: jest.fn(),
    showLocalNotification: jest.fn(),
    schedulePollDeadlineNotification: jest.fn(),
    cancelNotification: jest.fn(),
    clearBadge: jest.fn(),
  },
}));

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return Wrapper;
};

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockNotificationService.initialize.mockResolvedValue();
    mockNotificationService.requestPermissions.mockResolvedValue(true);
    mockNotificationService.getPushToken.mockReturnValue('test-token');
    mockNotificationService.showLocalNotification.mockResolvedValue();
    
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      canAskAgain: true,
      granted: true,
      ios: {} as any,
      android: {} as any,
      expires: 'never',
    });
  });

  it('should initialize notification service on mount', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(mockNotificationService.initialize).toHaveBeenCalled();
  });

  it('should handle initialization error', async () => {
    mockNotificationService.initialize.mockRejectedValue(new Error('Init error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Init error');
    });

    expect(result.current.isInitialized).toBe(false);
  });

  it('should request permissions successfully', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    let permissionResult: boolean = false;
    
    await act(async () => {
      permissionResult = await result.current.requestPermissions();
    });

    expect(permissionResult).toBe(true);
    expect(mockNotificationService.requestPermissions).toHaveBeenCalled();
  });

  it('should handle permission request failure', async () => {
    mockNotificationService.requestPermissions.mockResolvedValue(false);

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    let permissionResult: boolean = true;
    
    await act(async () => {
      permissionResult = await result.current.requestPermissions();
    });

    expect(permissionResult).toBe(false);
  });

  it('should schedule local notification', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const notification = {
      type: 'poll_created' as const,
      title: 'Test',
      body: 'Test body',
    };

    await act(async () => {
      await result.current.scheduleLocalNotification(notification);
    });

    expect(mockNotificationService.showLocalNotification).toHaveBeenCalledWith(notification);
  });

  it('should schedule poll deadline notification', async () => {
    mockNotificationService.schedulePollDeadlineNotification.mockResolvedValue('notification-id');

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const deadlineDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    let notificationId: string | null = null;

    await act(async () => {
      notificationId = await result.current.schedulePollDeadline(123, 'Test Poll', deadlineDate);
    });

    expect(notificationId).toBe('notification-id');
    expect(mockNotificationService.schedulePollDeadlineNotification).toHaveBeenCalledWith(
      123,
      'Test Poll',
      deadlineDate
    );
  });

  it('should cancel notification', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.cancelNotification('test-id');
    });

    expect(mockNotificationService.cancelNotification).toHaveBeenCalledWith('test-id');
  });

  it('should clear badge', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.clearBadge();
    });

    expect(mockNotificationService.clearBadge).toHaveBeenCalled();
  });

  it('should return push token', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pushToken).toBe('test-token');
    });
  });

  it('should handle service errors gracefully', async () => {
    mockNotificationService.showLocalNotification.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const notification = {
      type: 'poll_created' as const,
      title: 'Test',
      body: 'Test body',
    };

    await act(async () => {
      await result.current.scheduleLocalNotification(notification);
    });

    expect(result.current.error).toBe('Service error');
  });
});

describe('usePollNotifications', () => {
  const circleId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNotificationService.initialize.mockResolvedValue();
    mockNotificationService.showLocalNotification.mockResolvedValue();
    mockNotificationService.schedulePollDeadlineNotification.mockResolvedValue('test-id');
  });

  it('should notify poll created', async () => {
    const { result } = renderHook(() => usePollNotifications(circleId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.notifyPollCreated('Test Poll', 456);
    });

    expect(mockNotificationService.showLocalNotification).toHaveBeenCalledWith({
      type: 'poll_created',
      poll_id: 456,
      circle_id: circleId,
      title: '🗳️ 새로운 투표가 시작되었습니다!',
      body: '"Test Poll" 투표에 참여해보세요',
      data: {
        poll_id: 456,
        circle_id: circleId,
        action: 'open_poll',
      },
    });
  });

  it('should notify poll results', async () => {
    const { result } = renderHook(() => usePollNotifications(circleId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      await result.current.notifyPollResults('Test Poll', 456);
    });

    expect(mockNotificationService.showLocalNotification).toHaveBeenCalledWith({
      type: 'poll_result',
      poll_id: 456,
      circle_id: circleId,
      title: '📊 투표 결과가 발표되었습니다!',
      body: '"Test Poll" 투표 결과를 확인해보세요',
      data: {
        poll_id: 456,
        circle_id: circleId,
        action: 'view_results',
      },
    });
  });

  it('should schedule deadline notification', async () => {
    const { result } = renderHook(() => usePollNotifications(circleId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const deadlineDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    let notificationId: string | null = null;

    await act(async () => {
      notificationId = await result.current.scheduleDeadlineNotification('Test Poll', 456, deadlineDate);
    });

    expect(notificationId).toBe('test-id');
    expect(mockNotificationService.schedulePollDeadlineNotification).toHaveBeenCalledWith(
      456,
      'Test Poll',
      deadlineDate
    );
  });

  it('should skip notification when settings disabled', async () => {
    // Mock settings to have notifications disabled
    const { result } = renderHook(() => usePollNotifications(circleId), {
      wrapper: createWrapper(),
    });

    // Wait for initialization but settings will be null initially
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // Since settings is null, notifications should be skipped
    // This tests the early return when settings?.poll_created is falsy
    await act(async () => {
      await result.current.notifyPollCreated('Test Poll', 456);
    });

    // Should not call the notification service when settings are not loaded
    expect(mockNotificationService.showLocalNotification).not.toHaveBeenCalled();
  });
});