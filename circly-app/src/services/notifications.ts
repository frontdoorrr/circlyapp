/**
 * 푸시 알림 서비스
 * TRD 06-notification-system.md의 알림 시스템 요구사항 기반
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/client';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'poll_start' | 'poll_deadline' | 'poll_result';
  poll_id?: string;
  circle_id?: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushTokenCreate {
  expo_token: string;
  device_id?: string;
  platform?: 'ios' | 'android';
}

export interface NotificationSettings {
  id: string;
  all_notifications: boolean;
  poll_start_notifications: boolean;
  poll_deadline_notifications: boolean;
  poll_result_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_daily_notifications: number;
  updated_at: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  /**
   * 알림 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 알림 권한 요청
      await this.requestPermissions();
      
      // Push Token 등록
      await this.registerForPushNotifications();
      
      // 알림 리스너 설정
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * 알림 권한 요청
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return false;
    }

    // iOS 추가 설정
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('poll_actions', [
        {
          identifier: 'vote_now',
          buttonTitle: '지금 투표',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'view_results',
          buttonTitle: '결과 보기',
          options: { opensAppToForeground: true },
        },
      ]);
    }

    return true;
  }

  /**
   * Push Token 등록
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) return null;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = pushTokenData.data;

      console.log('Expo push token:', this.expoPushToken);

      // 서버에 토큰 등록
      await this.registerTokenWithServer();

      // 로컬 저장
      await AsyncStorage.setItem('push_token', this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * 서버에 Push Token 등록
   */
  private async registerTokenWithServer(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const deviceId = await this.getDeviceId();
      const tokenData: PushTokenCreate = {
        expo_token: this.expoPushToken,
        platform: Platform.OS as 'ios' | 'android',
        device_id: deviceId,
      };

      const response = await apiClient.post('/v1/notifications/push-tokens', tokenData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Push token registered with server successfully');
    } catch (error) {
      console.error('Failed to register push token with server:', error);
    }
  }

  /**
   * 알림 리스너 설정
   */
  private setupNotificationListeners(): void {
    // 알림 수신 시 (앱이 포그라운드)
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // 알림 탭 시 (앱이 백그라운드/종료)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * 알림 수신 처리
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    
    // 알림 타입에 따른 처리
    if (data?.type === 'poll_created') {
      // 새 투표 생성 알림
      this.showLocalNotification({
        title: '새로운 투표가 시작되었습니다! 🗳️',
        body: notification.request.content.body || '친구들의 투표에 참여해보세요',
        data: data,
      });
    }
  }

  /**
   * 알림 응답 처리 (탭 등)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    const actionIdentifier = response.actionIdentifier;

    // 액션에 따른 네비게이션 처리
    if (actionIdentifier === 'vote_now' && data?.poll_id) {
      // 투표 화면으로 이동
      this.navigateToPoll(data.poll_id, data.circle_id);
    } else if (actionIdentifier === 'view_results' && data?.poll_id) {
      // 결과 화면으로 이동
      this.navigateToPollResults(data.poll_id);
    } else {
      // 기본 동작: 해당 화면으로 이동
      this.handleDefaultNavigation(data);
    }
  }

  /**
   * 로컬 알림 표시
   */
  async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: null, // 즉시 표시
      });
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  /**
   * 예약 알림 설정
   */
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          categoryIdentifier: notification.type === 'poll_deadline' ? 'poll_actions' : undefined,
        },
        trigger,
      });

      console.log('Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * 투표 마감 알림 예약
   */
  async schedulePollDeadlineNotification(
    pollId: number,
    pollTitle: string,
    deadlineDate: Date
  ): Promise<string | null> {
    try {
      // 마감 1시간 전 알림
      const notificationDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000);
      
      if (notificationDate <= new Date()) {
        console.log('Poll deadline is too soon, skipping notification');
        return null;
      }

      return await this.scheduleNotification(
        {
          type: 'poll_deadline',
          poll_id: pollId,
          title: '⏰ 투표 마감 1시간 전!',
          body: `"${pollTitle}" 투표가 곧 마감됩니다. 지금 참여하세요!`,
          data: { poll_id: pollId, action: 'vote_reminder' },
        },
        { date: notificationDate }
      );
    } catch (error) {
      console.error('Failed to schedule poll deadline notification:', error);
      return null;
    }
  }

  /**
   * 알림 취소
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * 모든 알림 취소
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * 배지 수 설정
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * 배지 수 초기화
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Push Token 가져오기
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.get('/v1/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.put('/v1/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return null;
    }
  }

  /**
   * 기기 ID 생성/가져오기
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * 투표 화면으로 이동
   */
  private navigateToPoll(pollId: number, circleId: number): void {
    // TODO: Navigation 서비스와 연동하여 구현
    console.log(`Navigate to poll: ${pollId}, circle: ${circleId}`);
  }

  /**
   * 투표 결과 화면으로 이동
   */
  private navigateToPollResults(pollId: number): void {
    // TODO: Navigation 서비스와 연동하여 구현
    console.log(`Navigate to poll results: ${pollId}`);
  }

  /**
   * 기본 네비게이션 처리
   */
  private handleDefaultNavigation(data: any): void {
    // TODO: 데이터 타입에 따른 적절한 화면으로 이동
    console.log('Handle default navigation:', data);
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();

// 기본 export
export default notificationService;