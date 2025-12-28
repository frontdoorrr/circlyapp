/**
 * App Initializer
 *
 * 앱 시작 시 필요한 초기화 작업 수행
 * - 저장된 인증 정보 로드
 * - 온보딩 완료 여부 확인
 * - 푸시 알림 초기화
 * - 스플래시 화면 표시
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { loadAuthFromStorage, isLoading, token } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // 1. 저장된 인증 정보 로드
        await loadAuthFromStorage();

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

    initialize();
  }, [loadAuthFromStorage]);

  // 2. 로그인 후 푸시 알림 토큰 등록
  useEffect(() => {
    async function registerPushNotification() {
      if (!token) return; // 로그인하지 않았으면 스킵

      try {
        // 푸시 알림 권한 요청 및 토큰 획득
        const pushToken = await registerForPushNotificationsAsync();

        if (pushToken) {
          // 백엔드에 토큰 등록
          await notificationApi.registerPushToken(pushToken);
          console.log('Push notification registered successfully');
        }
      } catch (error) {
        console.error('Failed to register push notification:', error);
        // 푸시 알림 실패해도 앱은 정상 작동
      }
    }

    registerPushNotification();
  }, [token]);

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
