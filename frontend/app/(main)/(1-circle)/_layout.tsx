import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Circle Tab Layout
 *
 * Circle 탭 레이아웃
 * - 내 Circle 목록 화면
 */
export default function CircleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.neutral[50] },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '내 Circle',
        }}
      />
    </Stack>
  );
}
