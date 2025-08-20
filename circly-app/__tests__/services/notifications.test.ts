/**
 * 알림 서비스 테스트
 * TRD 06-notification-system.md의 테스트 전략 기반
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationService } from '../../src/services/notifications';

// Mock 설정
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

jest.mock('../../src/services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock implementations
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockDevice = Device as jest.Mocked<typeof Device>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'undetermined' as any,
      canAskAgain: true,
      granted: false,
      ios: {} as any,
      android: {} as any,
      expires: 'never',
    });
    
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      canAskAgain: true,
      granted: true,
      ios: {} as any,
      android: {} as any,
      expires: 'never',
    });
    
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[test-token]',
      type: 'expo',
    });
    
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('test-notification-id');
    
    mockDevice.isDevice = true;
  });

  describe('initialize', () => {
    it('should initialize notification service successfully', async () => {
      await notificationService.initialize();
      
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
      expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should skip initialization if already initialized', async () => {
      // First initialization
      await notificationService.initialize();
      
      // Reset mocks to track second call
      jest.clearAllMocks();
      
      // Second initialization should be skipped
      await notificationService.initialize();
      
      // Should not call permissions again
      expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('Permission error'));
      
      await expect(notificationService.initialize()).rejects.toThrow('Permission error');
    });
  });

  describe('requestPermissions', () => {
    it('should return true when permissions are granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        canAskAgain: true,
        granted: true,
        ios: {} as any,
        android: {} as any,
        expires: 'never',
      });

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(true);
    });

    it('should request permissions when not granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as any,
        canAskAgain: true,
        granted: false,
        ios: {} as any,
        android: {} as any,
        expires: 'never',
      });

      const result = await notificationService.requestPermissions();
      
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when permissions are denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        canAskAgain: false,
        granted: false,
        ios: {} as any,
        android: {} as any,
        expires: 'never',
      });
      
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        canAskAgain: false,
        granted: false,
        ios: {} as any,
        android: {} as any,
        expires: 'never',
      });

      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
    });

    it('should return false when not on physical device', async () => {
      Object.defineProperty(mockDevice, 'isDevice', {
        value: false,
        writable: true,
      });
      
      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
      
      // Reset for other tests
      Object.defineProperty(mockDevice, 'isDevice', {
        value: true,
        writable: true,
      });
    });
  });

  describe('registerForPushNotifications', () => {
    it('should register push token successfully', async () => {
      const result = await notificationService.registerForPushNotifications();
      
      expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
      expect(result).toBe('ExponentPushToken[test-token]');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'push_token', 
        'ExponentPushToken[test-token]'
      );
    });

    it('should return null when not on physical device', async () => {
      Object.defineProperty(mockDevice, 'isDevice', {
        value: false,
        writable: true,
      });
      
      const result = await notificationService.registerForPushNotifications();
      
      expect(result).toBeNull();
      
      // Reset for other tests
      Object.defineProperty(mockDevice, 'isDevice', {
        value: true,
        writable: true,
      });
    });

    it('should handle token registration error', async () => {
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('Token error'));
      
      const result = await notificationService.registerForPushNotifications();
      
      expect(result).toBeNull();
    });
  });

  describe('showLocalNotification', () => {
    it('should schedule local notification', async () => {
      const notification = {
        type: 'poll_created' as const,
        title: 'Test Notification',
        body: 'Test body',
        data: { test: 'data' },
      };

      await notificationService.showLocalNotification(notification);
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Notification',
          body: 'Test body',
          data: { test: 'data' },
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
    });

    it('should handle notification scheduling error', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Schedule error'));
      
      const notification = {
        type: 'poll_created' as const,
        title: 'Test Notification',
        body: 'Test body',
      };

      // Should not throw
      await expect(notificationService.showLocalNotification(notification)).resolves.toBeUndefined();
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule notification with trigger', async () => {
      const notification = {
        type: 'poll_deadline' as const,
        title: 'Poll Deadline',
        body: 'Poll is ending soon',
      };
      
      const trigger = { type: 'date' as const, date: new Date() };

      const result = await notificationService.scheduleNotification(notification, trigger);
      
      expect(result).toBe('test-notification-id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Poll Deadline',
          body: 'Poll is ending soon',
          data: {},
          sound: 'default',
          categoryIdentifier: 'poll_actions',
        },
        trigger,
      });
    });
  });

  describe('schedulePollDeadlineNotification', () => {
    it('should schedule poll deadline notification', async () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      const result = await notificationService.schedulePollDeadlineNotification(
        123,
        'Test Poll',
        futureDate
      );
      
      expect(result).toBe('test-notification-id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should return null for past deadline', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      
      const result = await notificationService.schedulePollDeadlineNotification(
        123,
        'Test Poll',
        pastDate
      );
      
      expect(result).toBeNull();
    });

    it('should return null for near deadline (less than 1 hour)', async () => {
      const nearDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      
      const result = await notificationService.schedulePollDeadlineNotification(
        123,
        'Test Poll',
        nearDate
      );
      
      expect(result).toBeNull();
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification successfully', async () => {
      await notificationService.cancelNotification('test-id');
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test-id');
    });

    it('should handle cancel error', async () => {
      mockNotifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('Cancel error'));
      
      // Should not throw
      await expect(notificationService.cancelNotification('test-id')).resolves.toBeUndefined();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications', async () => {
      await notificationService.cancelAllNotifications();
      
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('setBadgeCount', () => {
    it('should set badge count', async () => {
      await notificationService.setBadgeCount(5);
      
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it('should handle badge count error', async () => {
      mockNotifications.setBadgeCountAsync.mockRejectedValue(new Error('Badge error'));
      
      // Should not throw
      await expect(notificationService.setBadgeCount(5)).resolves.toBeUndefined();
    });
  });

  describe('clearBadge', () => {
    it('should clear badge count', async () => {
      await notificationService.clearBadge();
      
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('getPushToken', () => {
    it('should return current push token after registration', async () => {
      await notificationService.registerForPushNotifications();
      
      const token = notificationService.getPushToken();
      
      expect(token).toBe('ExponentPushToken[test-token]');
    });

    it('should return null when no token is set initially', () => {
      // Create a new service instance to ensure clean state
      const { NotificationService } = jest.requireActual('../../src/services/notifications');
      const freshService = new NotificationService();
      
      const token = freshService.getPushToken();
      
      expect(token).toBeNull();
    });
  });
});