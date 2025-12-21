import { Stack } from 'expo-router';

/**
 * Auth Layout
 *
 * 비인증 화면 레이아웃 (로그인, 회원가입)
 * - 헤더 숨김
 * - 밝은 배경색
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="invite/[code]" />
    </Stack>
  );
}
