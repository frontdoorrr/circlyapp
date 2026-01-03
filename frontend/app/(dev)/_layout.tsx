import { Stack } from 'expo-router';
import { tokens } from '../../src/theme';

/**
 * Dev Layout
 *
 * 개발 도구 화면 레이아웃
 * - Responsive Test: 다양한 화면 크기 테스트
 * - Dark Mode Test: 다크 모드 테스트
 *
 * 프로덕션에서는 접근 불가하도록 설정 필요
 */
export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: tokens.colors.warning[100],
        },
        headerTintColor: tokens.colors.warning[900],
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
        contentStyle: { backgroundColor: tokens.colors.neutral[50] },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="responsive-test"
        options={{
          title: '🔧 Responsive Test',
        }}
      />
      <Stack.Screen
        name="dark-mode-test"
        options={{
          title: '🌙 Dark Mode Test',
        }}
      />
    </Stack>
  );
}
