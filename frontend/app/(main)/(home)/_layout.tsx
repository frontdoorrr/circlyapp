import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Home Tab Layout
 *
 * 홈 탭 내부 화면 레이아웃
 * - 진행 중인 투표 목록
 * - 투표 상세 화면
 * - 투표 결과 화면
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
      <Stack.Screen
        name="poll/[id]"
        options={{
          title: '투표 참여',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="results/[id]"
        options={{
          title: '투표 결과',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
