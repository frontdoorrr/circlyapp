import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

/**
 * Auth Layout
 *
 * 비인증 화면 레이아웃 (로그인, 회원가입)
 * - 헤더 숨김
 * - 테마 배경색
 * - 슬라이드 애니메이션
 */
export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: '로그인',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: '회원가입',
        }}
      />
    </Stack>
  );
}
