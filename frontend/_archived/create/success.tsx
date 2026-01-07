import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { usePollCreateStore } from '../../../src/stores/pollCreate';

/**
 * Poll Success Screen (투표 발행 완료 화면)
 *
 * 투표 생성 성공을 축하하고 3초 후 자동으로 홈으로 전환합니다.
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.5
 */

export default function SuccessScreen() {
  // Zustand store - reset after success
  const { reset } = usePollCreateStore();

  // 애니메이션 값
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(-15);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // 홈으로 이동하는 함수 (worklet에서 호출 가능하도록 분리)
  const navigateToHome = () => {
    reset();
    router.replace('/(main)/(home)');
  };

  // Success 햅틱 피드백
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // 이모지 애니메이션 시작
    scale.value = withSequence(
      withSpring(1.2, { stiffness: 200, damping: 15 }),
      withSpring(1.0, { stiffness: 200, damping: 15 })
    );
    rotate.value = withSequence(
      withSpring(15, { stiffness: 200, damping: 15 }),
      withSpring(0, { stiffness: 200, damping: 15 })
    );
    opacity.value = withTiming(1, { duration: 300 });

    // 로딩 바 애니메이션 (0 → 100% in 3초)
    progressWidth.value = withTiming(1, {
      duration: 3000,
      easing: Easing.linear,
    });

    // 3초 후 홈으로 자동 전환
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        // worklet에서 JS 함수 호출 시 runOnJS 필요
        runOnJS(navigateToHome)();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [reset]);

  // 이모지 애니메이션 스타일
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // 전체 화면 페이드 스타일
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // 로딩 바 애니메이션 스타일
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />

      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <View style={styles.content}>
          {/* Success 애니메이션 이모지 */}
          <Animated.Text style={[styles.emoji, emojiAnimatedStyle]}>
            🎉
          </Animated.Text>

          {/* Success 메시지 */}
          <Text style={styles.successMessage}>투표가 시작되었어요!</Text>

          {/* 상세 정보 */}
          <Text style={styles.detailInfo}>
            15명의 친구에게{'\n'}알림을 보냈어요
          </Text>

          {/* 로딩 바 (자동 전환 표시) */}
          <View style={styles.loadingBarContainer}>
            <View style={styles.loadingBarBackground}>
              <Animated.View style={progressAnimatedStyle}>
                <LinearGradient
                  colors={[tokens.colors.primary[500], tokens.colors.secondary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loadingBarFill}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Confetti 파티클 효과 (간단한 구현) */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, index) => (
            <ConfettiParticle key={index} index={index} />
          ))}
        </View>
      </Animated.View>
    </>
  );
}

// Confetti 파티클 컴포넌트
interface ConfettiParticleProps {
  index: number;
}

function ConfettiParticle({ index }: ConfettiParticleProps) {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // 랜덤 시작 위치와 각도
    const randomX = (Math.random() - 0.5) * 300;
    const randomRotate = Math.random() * 360;
    const randomDelay = Math.random() * 500;

    setTimeout(() => {
      translateY.value = withTiming(800, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      translateX.value = withTiming(randomX, {
        duration: 2000 + Math.random() * 1000,
      });
      rotate.value = withTiming(randomRotate + 360, {
        duration: 2000 + Math.random() * 1000,
      });
      opacity.value = withTiming(0, {
        duration: 2000,
      });
    }, randomDelay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // 랜덤 색상
  const colors = [
    tokens.colors.primary[500],
    tokens.colors.secondary[500],
    tokens.colors.red[500],
    '#FFD700', // Gold
    '#FF69B4', // Hot pink
  ];
  const randomColor = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: randomColor,
          left: `${50 + (Math.random() - 0.5) * 20}%`,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // 이모지 (120px)
  emoji: {
    fontSize: 120,
    lineHeight: 144,  // fontSize * 1.2 (iOS 잘림 방지)
    textAlign: 'center',
  },

  // Success 메시지
  successMessage: {
    fontSize: tokens.typography.fontSize['2xl'], // 24px
    fontWeight: tokens.typography.fontWeight.bold, // 700
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    marginTop: 32,
  },

  // 상세 정보
  detailInfo: {
    fontSize: tokens.typography.fontSize.base, // 16px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },

  // 로딩 바
  loadingBarContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingBarBackground: {
    width: 80,
    height: 4,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: 9999, // full
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    borderRadius: 9999,
  },

  // Confetti 파티클
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confettiParticle: {
    position: 'absolute',
    top: 100,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
