import { Stack } from 'expo-router';
import { tokens } from '../../../src/theme';

/**
 * Create Tab Layout
 *
 * 서클 만들기 탭 레이아웃
 * Gas 앱 모델: 사용자는 서클만 만들고, 질문/템플릿은 어드민이 관리
 */
export default function CreateLayout() {
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
          title: '서클 만들기',
        }}
      />
    </Stack>
  );
}
