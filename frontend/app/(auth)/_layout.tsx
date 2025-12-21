import { Stack } from 'expo-router';
import { tokens } from '../../src/theme';

/**
 * Auth Layout
 *
 * 비인증 화면 레이아웃 (로그인, 회원가입)
 * - 헤더 숨김
 * - 흰색 배경
 * - 슬라이드 애니메이션
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.white },
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
