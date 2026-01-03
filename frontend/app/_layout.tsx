import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
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
 * Deep Link Handler Hook
 *
 * 딥링크 처리:
 * - circly://join?code={code}
 * - https://circly.app/join/{unique_id}
 */
function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep link when app is opened from link
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('[DeepLink] Received URL:', url);

      try {
        const parsedUrl = Linking.parse(url);
        console.log('[DeepLink] Parsed URL:', parsedUrl);

        // Handle circly://join?code={code}
        if (parsedUrl.path === 'join' && parsedUrl.queryParams?.code) {
          const code = String(parsedUrl.queryParams.code).toUpperCase();
          console.log('[DeepLink] Navigating to invite-code with code:', code);
          router.push({
            pathname: '/join/invite-code',
            params: { code },
          });
          return;
        }

        // Handle https://circly.app/join/{unique_id} or circly://join/{id}
        if (parsedUrl.path?.startsWith('join/')) {
          const uniqueId = parsedUrl.path.replace('join/', '');
          console.log('[DeepLink] Navigating with unique ID:', uniqueId);
          // TODO: Convert unique_id to invite_code via API
          router.push('/join/invite-code');
          return;
        }
      } catch (error) {
        console.error('[DeepLink] Error parsing URL:', error);
      }
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLink] Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);
}

/**
 * Themed App Component
 * ThemeProvider 내부에서만 useTheme 사용 가능
 */
function ThemedApp() {
  const { theme, isDark } = useTheme();

  // Initialize deep link handler
  useDeepLinkHandler();

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
