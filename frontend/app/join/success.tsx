import { View, Text, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { tokens } from '../../src/theme';

/**
 * Circle 가입 성공 화면
 *
 * 가입 완료 후 축하 애니메이션과 함께 표시됩니다.
 * - 🎉 이모지 bounce 애니메이션
 * - Confetti 효과
 * - 3초 후 자동으로 홈 화면으로 이동
 */
export default function JoinSuccessScreen() {
  const { circleName, nickname } = useLocalSearchParams<{
    circleName: string;
    nickname: string;
  }>();

  // Animation values
  const emojiScale = useSharedValue(0.5);
  const emojiRotate = useSharedValue(-15);
  const messageOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Confetti particles
  const confetti1Y = useSharedValue(-20);
  const confetti2Y = useSharedValue(-20);
  const confetti3Y = useSharedValue(-20);
  const confetti4Y = useSharedValue(-20);
  const confetti5Y = useSharedValue(-20);

  const navigateToHome = () => {
    router.replace('/(main)/(home)');
  };

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Emoji bounce animation
    emojiScale.value = withSequence(
      withSpring(1.2, { damping: 15, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );

    emojiRotate.value = withSequence(
      withSpring(15, { damping: 15, stiffness: 200 }),
      withSpring(0, { damping: 12 })
    );

    // Message fade in
    messageOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Progress bar animation (3 seconds)
    progressWidth.value = withTiming(100, { duration: 3000, easing: Easing.linear });

    // Confetti animations
    const confettiConfig = { damping: 8, stiffness: 80 };
    confetti1Y.value = withDelay(100, withSpring(500, confettiConfig));
    confetti2Y.value = withDelay(200, withSpring(550, confettiConfig));
    confetti3Y.value = withDelay(150, withSpring(480, confettiConfig));
    confetti4Y.value = withDelay(250, withSpring(520, confettiConfig));
    confetti5Y.value = withDelay(180, withSpring(510, confettiConfig));

    // Navigate to home after 3 seconds
    const timer = setTimeout(() => {
      navigateToHome();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotate.value}deg` },
    ],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: (1 - messageOpacity.value) * 20 }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Confetti styles
  const confetti1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: confetti1Y.value }, { rotate: '45deg' }],
    opacity: confetti1Y.value > 400 ? 0 : 1,
  }));

  const confetti2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: confetti2Y.value }, { rotate: '-30deg' }],
    opacity: confetti2Y.value > 450 ? 0 : 1,
  }));

  const confetti3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: confetti3Y.value }, { rotate: '60deg' }],
    opacity: confetti3Y.value > 380 ? 0 : 1,
  }));

  const confetti4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: confetti4Y.value }, { rotate: '-45deg' }],
    opacity: confetti4Y.value > 420 ? 0 : 1,
  }));

  const confetti5Style = useAnimatedStyle(() => ({
    transform: [{ translateY: confetti5Y.value }, { rotate: '15deg' }],
    opacity: confetti5Y.value > 410 ? 0 : 1,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <View style={styles.container}>
        {/* Confetti particles */}
        <Animated.View style={[styles.confetti, styles.confetti1, confetti1Style]} />
        <Animated.View style={[styles.confetti, styles.confetti2, confetti2Style]} />
        <Animated.View style={[styles.confetti, styles.confetti3, confetti3Style]} />
        <Animated.View style={[styles.confetti, styles.confetti4, confetti4Style]} />
        <Animated.View style={[styles.confetti, styles.confetti5, confetti5Style]} />

        <View style={styles.content}>
          {/* Success Emoji */}
          <Animated.View style={[styles.emojiContainer, emojiAnimatedStyle]}>
            <Text style={styles.emoji}>🎉</Text>
          </Animated.View>

          {/* Success Message */}
          <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
            <Text style={styles.title}>환영합니다!</Text>
            <Text style={styles.subtitle}>
              {circleName}에 성공적으로 참여했어요
            </Text>
            <View style={styles.nicknameCard}>
              <Text style={styles.nicknameLabel}>나의 닉네임</Text>
              <Text style={styles.nickname}>{nickname}</Text>
            </View>
          </Animated.View>

          {/* Auto-redirect notice */}
          <Animated.View style={[styles.redirectContainer, messageAnimatedStyle]}>
            <Text style={styles.redirectText}>잠시 후 홈으로 이동합니다...</Text>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
            </View>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  // Emoji styles
  emojiContainer: {
    marginBottom: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 120,
  },
  // Message styles
  messageContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing['2xl'],
  },
  title: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  nicknameCard: {
    backgroundColor: tokens.colors.primary[50],
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary[100],
  },
  nicknameLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing.xs,
  },
  nickname: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
  },
  // Redirect styles
  redirectContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: tokens.spacing.xl,
  },
  redirectText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[400],
    marginBottom: tokens.spacing.sm,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 2,
  },
  // Confetti styles
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  confetti1: {
    left: '15%',
    top: -20,
    backgroundColor: tokens.colors.primary[400],
  },
  confetti2: {
    left: '35%',
    top: -20,
    backgroundColor: tokens.colors.secondary[400],
  },
  confetti3: {
    left: '55%',
    top: -20,
    backgroundColor: tokens.colors.success[500],
  },
  confetti4: {
    left: '75%',
    top: -20,
    backgroundColor: tokens.colors.warning[500],
  },
  confetti5: {
    left: '90%',
    top: -20,
    backgroundColor: tokens.colors.secondary[500],
  },
});
