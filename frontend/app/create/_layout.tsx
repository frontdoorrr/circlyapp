import { Stack } from 'expo-router';

export default function CreatePollLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: '새 투표' }} />
      <Stack.Screen name="question" options={{ title: '질문 선택' }} />
      <Stack.Screen name="settings" options={{ title: '마감 설정' }} />
      <Stack.Screen name="preview" options={{ title: '미리보기' }} />
    </Stack>
  );
}
