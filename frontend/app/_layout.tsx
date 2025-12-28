import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme';
import { QueryProvider } from '../src/providers/QueryProvider';
import { AppInitializer } from '../src/providers/AppInitializer';

/**
 * Root Layout
 *
 * 전체 앱의 최상위 레이아웃
 * - GestureHandler 초기화 (제스처 인식)
 * - SafeArea Provider 설정 (노치/아일랜드 대응)
 * - Theme Provider 설정 (다크모드 지원)
 * - React Query Provider (서버 상태 관리)
 * - App Initializer (인증 정보 로드)
 * - StatusBar 설정
 * - Stack Navigation 기본 설정
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider initialMode="light" initialFollowSystem={true}>
            <AppInitializer>
              <ThemedApp />
            </AppInitializer>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Themed App Component
 * ThemeProvider 내부에서만 useTheme 사용 가능
 */
function ThemedApp() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth & Onboarding */}
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="join" options={{ animation: 'slide_from_right' }} />

        {/* Main App */}
        <Stack.Screen name="(main)" options={{ animation: 'fade' }} />

        {/* Poll & Results */}
        <Stack.Screen name="poll/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="results/[id]" options={{ animation: 'slide_from_right' }} />

        {/* Circle */}
        <Stack.Screen name="circle/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="circle/create" options={{ presentation: 'modal' }} />

        {/* Development */}
        <Stack.Screen name="(dev)" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
