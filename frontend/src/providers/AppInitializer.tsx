/**
 * App Initializer
 *
 * Supabase Auth 직접 연동 방식
 * - onAuthStateChange 리스너로 세션 자동 동기화
 * - 토큰 자동 갱신 (Supabase SDK)
 * - 인증 상태에 따른 자동 리다이렉트
 * - 온보딩 완료 여부 확인
 * - 푸시 알림 초기화
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';
import * as authApi from '../api/auth';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '../services/notification/pushNotification';
import * as notificationApi from '../api/notification';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import { tokens } from '../theme';
import {
  initializePurchases,
  addCustomerInfoUpdateListener,
} from '../services/subscription/revenuecat';
import { logger } from '../utils/logger';

interface AppInitializerProps {
  children: ReactNode;
}

const ONBOARDING_KEY = '@circly:onboarding_completed';
const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'supabase';
const isMockAuth = AUTH_MODE === 'mock';

export function AppInitializer({ children }: AppInitializerProps) {
  const { setSession, setUser, isLoading, isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // 1. Supabase Auth 초기화 및 세션 구독
  useEffect(() => {
    if (isMockAuth) {
      async function initializeMockApp() {
        try {
          logger.log('[AppInitializer] Mock Auth 앱 초기화 시작');
          setSession(null);

          const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
          if (!onboardingCompleted) {
            setShowOnboarding(true);
          }
        } catch (error) {
          logger.error('[AppInitializer] Mock Auth 초기화 실패:', error);
        } finally {
          setIsReady(true);
        }
      }

      initializeMockApp();
      return;
    }

    async function initializeApp() {
      try {
        logger.log('[AppInitializer] 앱 초기화 시작');

        // 1. Supabase에서 기존 세션 로드
        const {
          data: { session },
        } = await supabase.auth.getSession();
        logger.log('[AppInitializer] 초기 세션:', session ? '있음' : '없음');

        setSession(session);

        // 세션이 있으면 백엔드에서 사용자 Profile 가져오기
        if (session) {
          try {
            const userProfile = await authApi.getCurrentUser();
            setUser(userProfile);
            logger.log('[AppInitializer] 사용자 Profile 로드 완료');
          } catch (profileError) {
            logger.error('[AppInitializer] Profile 로드 실패:', profileError);
            // Profile 로드 실패해도 세션은 유지
          }
        }

        // 2. 온보딩 완료 여부 확인
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }

        setIsReady(true);
        logger.log('[AppInitializer] 앱 초기화 완료');
      } catch (error) {
        logger.error('[AppInitializer] 초기화 실패:', error);
        setIsReady(true); // 실패해도 앱은 실행
      }
    }

    initializeApp();

    // 3. Supabase Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('[AppInitializer] Auth 상태 변경:', event);

      setSession(session);

      if (session) {
        // 로그인/토큰 갱신 시 사용자 Profile 다시 로드
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const userProfile = await authApi.getCurrentUser();
            setUser(userProfile);
            logger.log('[AppInitializer] Profile 업데이트 완료');
          } catch (error) {
            logger.error('[AppInitializer] Profile 로드 실패:', error);
          }
        }
      } else {
        // 로그아웃 시 사용자 정보 초기화
        setUser(null);
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      logger.log('[AppInitializer] Auth 구독 해제');
      subscription.unsubscribe();
    };
  }, [setSession, setUser]);

  // 2. 인증 상태에 따른 자동 리다이렉트
  useEffect(() => {
    if (!isReady || isLoading || showOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';

    // 로그인되지 않았는데 메인 화면에 있으면 → 로그인 화면으로
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    // 로그인되었는데 로그인 화면에 있으면 → Home 화면으로
    else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/(0-home)');
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
          logger.error('[AppInitializer] 푸시 토큰 등록 실패:', error);
        }
      }
    }

    registerPushToken();
  }, [isAuthenticated]);

  // 4. RevenueCat 초기화 (인증 성공 시)
  useEffect(() => {
    const { user } = useAuthStore.getState();

    if (!isAuthenticated || !user?.id) return;

    let removeListener: (() => void) | null = null;

    async function initRevenueCat() {
      try {
        logger.log('[AppInitializer] RevenueCat 초기화 시작');
        await initializePurchases(user!.id);

        // 구독 상태 변경 리스너 등록
        removeListener = addCustomerInfoUpdateListener((customerInfo) => {
          const isPro = customerInfo.entitlements.active['frontdoorrr Pro'] !== undefined;
          logger.log('[AppInitializer] 구독 상태 변경:', isPro ? 'Pro 활성' : 'Pro 비활성');

          // 사용자 정보 새로고침 (Pro 구독 상태 반영을 위해)
          authApi.getCurrentUser().then((updatedUser) => {
            setUser(updatedUser);
          }).catch((error) => {
            logger.error('[AppInitializer] 사용자 정보 갱신 실패:', error);
          });
        });

        logger.log('[AppInitializer] RevenueCat 초기화 완료');
      } catch (error) {
        logger.error('[AppInitializer] RevenueCat 초기화 실패:', error);
        // RevenueCat 초기화 실패해도 앱 실행에는 지장 없음
      }
    }

    initRevenueCat();

    return () => {
      if (removeListener) {
        removeListener();
        logger.log('[AppInitializer] RevenueCat 리스너 해제');
      }
    };
  }, [isAuthenticated, setUser]);

  // 5. 푸시 알림 리스너 설정
  useEffect(() => {
    logger.log('[AppInitializer] 푸시 알림 리스너 설정');
    const cleanup = setupNotificationListeners();

    return () => {
      logger.log('[AppInitializer] 푸시 알림 리스너 해제');
      cleanup();
    };
  }, []);

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
