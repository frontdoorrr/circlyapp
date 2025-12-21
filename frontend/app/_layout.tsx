import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { tokens } from '../src/theme';

/**
 * Root Layout
 *
 * 전체 앱의 최상위 레이아웃
 * - GestureHandler 초기화 (제스처 인식)
 * - SafeArea Provider 설정 (노치/아일랜드 대응)
 * - StatusBar 설정
 * - Stack Navigation 기본 설정
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.colors.neutral[50] },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
