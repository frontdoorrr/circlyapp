import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens, animations, spacing, borderRadius } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

export interface PollCardData {
  id: string;
  question: string;
  emoji: string;
  timeRemaining: string; // e.g., "2시간 23분 남음"
  participantCount: number;
  totalMembers: number;
  participationRate: number; // 0-100
}

interface PollCardProps {
  poll: PollCardData;
  onPress: () => void;
}

// ============================================================================
// PollCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PollCard Component
 *
 * 홈 화면에 표시되는 진행 중인 투표 카드
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * @param poll - 투표 데이터
 * @param onPress - 카드 클릭 핸들러
 *
 * @example
 * <PollCard
 *   poll={{
 *     id: '1',
 *     question: '가장 친절한 사람은?',
 *     emoji: '😊',
 *     timeRemaining: '2시간 23분 남음',
 *     participantCount: 12,
 *     totalMembers: 16,
 *     participationRate: 75,
 *   }}
 *   onPress={() => router.push(`/poll/${poll.id}`)}
 * />
 */
export function PollCard({ poll, onPress }: PollCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(0.98, { duration: animations.duration.faster });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.responsive);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <Text variant="2xl" style={styles.emoji}>
          {poll.emoji}
        </Text>
        <Text
          variant="lg"
          weight="semibold"
          color={tokens.colors.neutral[900]}
          style={styles.question}
          numberOfLines={2}
        >
          {poll.question}
        </Text>
      </View>

      {/* Meta Information */}
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Text variant="sm" color={tokens.colors.neutral[500]}>
            ⏰ {poll.timeRemaining}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text variant="sm" color={tokens.colors.neutral[500]}>
            👥 {poll.participantCount}명 참여
          </Text>
        </View>
      </View>

      {/* Participation Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <ProgressBarFill percentage={poll.participationRate} />
        </View>
        <Text
          variant="sm"
          weight="medium"
          color={tokens.colors.primary[600]}
          style={styles.progressText}
        >
          {poll.participationRate}%
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// ============================================================================
// ProgressBarFill Component
// ============================================================================

interface ProgressBarFillProps {
  percentage: number;
}

function ProgressBarFill({ percentage }: ProgressBarFillProps) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withSpring(percentage, animations.spring.responsive);
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return <Animated.View style={[styles.progressBarFill, animatedStyle]} />;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: borderRadius['2xl'], // 20px
    padding: spacing[5], // 20px
    marginBottom: spacing[3], // 12px
    ...tokens.shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3], // 12px
  },
  emoji: {
    marginRight: spacing[1], // 4px
    lineHeight: 28, // Align with text
  },
  question: {
    flex: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3], // 12px
  },
  metaItem: {
    marginRight: spacing[4], // 16px
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginRight: spacing[2], // 8px
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    minWidth: 36,
    textAlign: 'right',
  },
});
