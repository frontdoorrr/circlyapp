/**
 * Push Notification Service
 *
 * Expo Push Notification 등록 및 관리
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';

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
    // EAS 프로젝트 ID 가져오기 (우선순위: easConfig > expoConfig.extra.eas)
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn(
        'EAS project ID not found. Run `eas build:configure` to set up EAS.',
      );
      // 개발 환경에서는 projectId 없이도 작동할 수 있음
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId ?? undefined,
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
      lightColor: '#8b5cf6',
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

/**
 * 알림 데이터 타입
 */
interface NotificationData {
  type?: 'poll_start' | 'poll_deadline' | 'poll_result' | 'vote_received' | 'circle_invite';
  poll_id?: string;
  circle_id?: string;
  action_url?: string;
}

/**
 * 알림 응답 핸들러 - 사용자가 알림을 탭했을 때 적절한 화면으로 이동
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as NotificationData;

  console.log('[Push] Notification tapped:', data);

  if (!data?.type) {
    console.log('[Push] No notification type, skipping navigation');
    return;
  }

  try {
    switch (data.type) {
      case 'poll_start':
      case 'poll_deadline':
        // 투표 참여 화면으로 이동
        if (data.poll_id) {
          router.push(`/poll-participation/${data.poll_id}`);
        }
        break;

      case 'poll_result':
      case 'vote_received':
        // 투표 결과 화면으로 이동
        if (data.poll_id) {
          router.push(`/results/${data.poll_id}`);
        }
        break;

      case 'circle_invite':
        // Circle 상세 화면으로 이동
        if (data.circle_id) {
          router.push(`/circle/${data.circle_id}`);
        }
        break;

      default:
        console.log('[Push] Unknown notification type:', data.type);
    }
  } catch (error) {
    console.error('[Push] Failed to navigate:', error);
  }
}

/**
 * 알림 리스너 설정 헬퍼 (앱 시작 시 호출)
 * @returns cleanup 함수
 */
export function setupNotificationListeners(): () => void {
  // 알림 수신 리스너 (포그라운드)
  const receivedSubscription = addNotificationReceivedListener((notification) => {
    console.log('[Push] Notification received:', notification.request.content);
  });

  // 알림 탭 리스너
  const responseSubscription = addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

  // cleanup 함수 반환
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
