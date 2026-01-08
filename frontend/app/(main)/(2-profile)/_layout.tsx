import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Profile Tab Layout
 *
 * 프로필 탭 내부 화면 레이아웃
 * - 내 프로필
 * - Circle 관리
 * - 설정
 * - 알림 설정
 *
 * Note: circle/[id]는 root _layout.tsx에서 정의됨
 */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.neutral[50] },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '프로필',
        }}
      />
      <Stack.Screen
        name="circles"
        options={{
          title: '내 Circle',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: '설정',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: '알림 설정',
        }}
      />
    </Stack>
  );
}
