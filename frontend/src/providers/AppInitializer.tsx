/**
 * App Initializer
 *
 * 앱 시작 시 필요한 초기화 작업 수행
 * - 저장된 토큰 로드 및 인증 상태 복원
 * - 인증 상태에 따른 자동 리다이렉트
 * - 온보딩 완료 여부 확인
 * - 푸시 알림 초기화
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { registerForPushNotificationsAsync } from '../services/notification/pushNotification';
import * as notificationApi from '../api/notification';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import { tokens } from '../theme';

interface AppInitializerProps {
  children: ReactNode;
}

const ONBOARDING_KEY = '@circly:onboarding_completed';

export function AppInitializer({ children }: AppInitializerProps) {
  const { initialize, isLoading, isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // 1. 앱 초기화
  useEffect(() => {
    async function initializeApp() {
      try {
        // 1. 저장된 토큰 로드
        await initialize();

        // 2. 온보딩 완료 여부 확인
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }

        setIsReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsReady(true); // 실패해도 앱은 실행
      }
    }

    initializeApp();
  }, [initialize]);

  // 2. 인증 상태에 따른 자동 리다이렉트
  useEffect(() => {
    if (!isReady || isLoading || showOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';

    // 로그인되지 않았는데 메인 화면에 있으면 → 로그인 화면으로
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    // 로그인되었는데 로그인 화면에 있으면 → 홈 화면으로
    else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/(home)');
    }
  }, [isAuthenticated, segments, isReady, isLoading, showOnboarding, router]);

  // 3. 인증 성공 시 푸시 토큰 등록
  useEffect(() => {
    async function registerPushToken() {
      if (isAuthenticated) {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await notificationApi.registerPushToken(pushToken);
          }
        } catch (error) {
          console.error('Failed to register push token:', error);
        }
      }
    }

    registerPushToken();
  }, [isAuthenticated]);

  // 초기화 중이면 로딩 화면 표시
  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
      </View>
    );
  }

  // 온보딩 미완료 시 온보딩 화면 표시
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
  },
});
