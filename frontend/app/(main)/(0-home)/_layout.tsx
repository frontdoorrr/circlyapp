import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Home Tab Layout
 *
 * 홈 탭 내부 화면 레이아웃
 * - 진행 중인 투표 목록
 *
 * Note: poll/[id]와 results/[id]는 root _layout.tsx에서 정의됨
 */
export default function HomeLayout() {
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
          title: '홈',
        }}
      />
    </Stack>
  );
}
