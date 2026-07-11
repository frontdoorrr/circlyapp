import { Stack } from 'expo-router';

/**
 * Inbox Tab Layout
 *
 * 받은 하트 탭 내부 화면 레이아웃
 */
export default function InboxLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
