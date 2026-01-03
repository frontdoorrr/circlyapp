import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Create Poll Tab Layout
 *
 * 투표 생성 탭 내부 화면 레이아웃
 * - Circle 선택
 * - 템플릿 선택
 * - 투표 생성 플로우
 */
export default function CreateLayout() {
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
          title: '투표 만들기',
        }}
      />
      <Stack.Screen
        name="select-circle"
        options={{
          title: 'Circle 선택',
        }}
      />
      <Stack.Screen
        name="select-template"
        options={{
          title: '질문 선택',
        }}
      />
      <Stack.Screen
        name="configure"
        options={{
          title: '투표 설정',
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          title: '미리보기',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: '투표 생성 완료',
          presentation: 'modal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
