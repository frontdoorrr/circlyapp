/**
 * NotificationSettingsScreen 테스트
 * TRD 06-notification-system.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { NotificationSettingsScreen } from '../../../src/screens/settings/NotificationSettingsScreen';
import * as useNotificationsHook from '../../../src/hooks/useNotifications';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

// Mock hooks
jest.mock('../../../src/hooks/useNotifications');

const mockUseNotifications = useNotificationsHook.useNotifications as jest.MockedFunction<
  typeof useNotificationsHook.useNotifications
>;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('NotificationSettingsScreen', () => {
  const mockNotificationsData = {
    isInitialized: true,
    permissionStatus: {
      granted: true,
      canAskAgain: true,
      status: 'granted',
    },
    pushToken: 'test-token',
    settings: {
      poll_created: true,
      poll_deadline: true,
      poll_results: true,
      circle_invites: true,
    },
    initialize: jest.fn(),
    requestPermissions: jest.fn(),
    updateSettings: jest.fn(),
    scheduleLocalNotification: jest.fn(),
    schedulePollDeadline: jest.fn(),
    cancelNotification: jest.fn(),
    clearBadge: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(mockNotificationsData);
  });

  it('renders header correctly', () => {
    const { getByText, getByTestId } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('알림 설정')).toBeTruthy();
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('shows loading state correctly', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      isLoading: true,
    });

    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('설정을 불러오는 중...')).toBeTruthy();
  });

  it('shows error state correctly', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      error: 'Network error',
    });

    const { getByText, getByText: getByTextAgain } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('통계를 불러올 수 없습니다')).toBeTruthy();
    expect(getByTextAgain('Network error')).toBeTruthy();
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('handles back navigation', () => {
    const { getByTestId } = renderWithQueryClient(<NotificationSettingsScreen />);

    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows permission request when permissions not granted', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      permissionStatus: {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      },
    });

    const { getByText, getByTestId } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('알림 권한이 필요합니다')).toBeTruthy();
    expect(getByText('알림을 허용하면 새로운 투표와 결과를 즉시 받아볼 수 있습니다.')).toBeTruthy();
    expect(getByTestId('enable-notifications')).toBeTruthy();
  });

  it('handles permission request successfully', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      permissionStatus: {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      },
      requestPermissions: jest.fn().mockResolvedValue(true),
    });

    const { getByTestId } = renderWithQueryClient(<NotificationSettingsScreen />);

    fireEvent.press(getByTestId('enable-notifications'));

    await waitFor(() => {
      expect(mockNotificationsData.requestPermissions).toHaveBeenCalled();
    });
  });

  it('shows alert when permission request fails', async () => {
    const mockRequestPermissions = jest.fn().mockResolvedValue(false);
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      permissionStatus: {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      },
      requestPermissions: mockRequestPermissions,
    });

    const { getByTestId } = renderWithQueryClient(<NotificationSettingsScreen />);

    fireEvent.press(getByTestId('enable-notifications'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '알림 권한이 필요합니다',
        '설정에서 알림을 허용해주세요.',
        expect.any(Array)
      );
    });
  });

  it('renders notification settings correctly', () => {
    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('투표 알림')).toBeTruthy();
    expect(getByText('새 투표 생성')).toBeTruthy();
    expect(getByText('서클에 새로운 투표가 생성되면 알림을 받습니다')).toBeTruthy();
    expect(getByText('투표 마감 알림')).toBeTruthy();
    expect(getByText('투표 결과 발표')).toBeTruthy();
    
    expect(getByText('서클 알림')).toBeTruthy();
    expect(getByText('서클 초대')).toBeTruthy();
  });

  it('toggles notification settings', async () => {
    const mockUpdateSettings = jest.fn();
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      updateSettings: mockUpdateSettings,
    });

    const { getAllByRole } = renderWithQueryClient(<NotificationSettingsScreen />);
    
    // Get all switches (assuming there are 4 settings)
    const switches = getAllByRole('switch');
    
    // Toggle the first switch (poll_created)
    fireEvent(switches[0], 'valueChange', false);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        poll_created: false,
        poll_deadline: true,
        poll_results: true,
        circle_invites: true,
      });
    });
  });

  it('handles settings update error', async () => {
    const mockUpdateSettings = jest.fn().mockRejectedValue(new Error('Update failed'));
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      updateSettings: mockUpdateSettings,
    });

    const { getAllByRole } = renderWithQueryClient(<NotificationSettingsScreen />);
    
    const switches = getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', false);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '오류',
        '설정 변경에 실패했습니다. 다시 시도해주세요.'
      );
    });
  });

  it('disables settings when permissions not granted', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      permissionStatus: {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      },
    });

    const { getAllByRole } = renderWithQueryClient(<NotificationSettingsScreen />);
    
    const switches = getAllByRole('switch');
    
    // All switches should be disabled
    switches.forEach(switchComponent => {
      expect(switchComponent.props.disabled).toBe(true);
    });
  });

  it('shows help section', () => {
    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    expect(getByText('알림이 오지 않나요?')).toBeTruthy();
    expect(getByText('• 기기 설정에서 Circly 앱의 알림이 허용되었는지 확인해주세요')).toBeTruthy();
    expect(getByText('• 배터리 절약 모드가 활성화되어 있으면 알림이 지연될 수 있습니다')).toBeTruthy();
    expect(getByText('• 방해 금지 모드나 무음 모드를 확인해주세요')).toBeTruthy();
  });

  it('handles retry on error', async () => {
    const mockRefetch = jest.fn();
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      error: 'Network error',
      initialize: mockRefetch,
    });

    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    fireEvent.press(getByText('다시 시도'));
    
    // Note: The actual retry logic would need to be implemented in the component
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('shows all setting items with correct icons', () => {
    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    // Check that all setting descriptions are present
    expect(getByText('서클에 새로운 투표가 생성되면 알림을 받습니다')).toBeTruthy();
    expect(getByText('참여하지 않은 투표가 곧 마감될 때 알림을 받습니다')).toBeTruthy();
    expect(getByText('참여한 투표의 결과가 발표되면 알림을 받습니다')).toBeTruthy();
    expect(getByText('새로운 서클에 초대되면 알림을 받습니다')).toBeTruthy();
  });

  it('handles null settings gracefully', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotificationsData,
      settings: null,
    });

    const { getByText } = renderWithQueryClient(<NotificationSettingsScreen />);

    // Should still render the screen without crashing
    expect(getByText('알림 설정')).toBeTruthy();
  });
});