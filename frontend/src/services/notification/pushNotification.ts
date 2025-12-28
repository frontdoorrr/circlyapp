/**
 * Push Notification Service
 *
 * Expo Push Notification 등록 및 관리
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 알림 핸들러 설정 (포그라운드 알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 푸시 알림 권한 요청 및 토큰 획득
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // 실제 기기에서만 작동
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // 권한 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한이 없으면 요청
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 권한이 거부되었으면 null 반환
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Expo Push Token 획득
  try {
    const projectId = 'your-project-id'; // TODO: app.json에서 가져오기
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Android 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#667eea',
    });
  }

  return token;
}

/**
 * 알림 리스너 등록
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * 알림 응답 리스너 등록 (사용자가 알림을 탭했을 때)
 */
export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * 로컬 알림 전송 (테스트용)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // 즉시 전송
  });
}

/**
 * 알림 배지 초기화
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}
