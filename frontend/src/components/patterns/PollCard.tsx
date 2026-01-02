import React from 'react';
import { View, StyleSheet, Pressable, AccessibilityRole } from 'react-native';
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

/**
 * Poll Card Variant
 * - active: 진행 중인 투표
 * - completed: 완료된 투표
 */
export type PollCardVariant = 'active' | 'completed';

/**
 * Vote Status for Active Polls
 */
export type VoteStatus = 'voted' | 'not_voted';

/**
 * Winner Info for Completed Polls
 */
export interface WinnerInfo {
  name: string;
  voteCount: number;
}

/**
 * Poll Card Data - Active Variant
 */
export interface ActivePollData {
  id: string;
  question: string;
  emoji: string;
  circleName: string;
  timeRemaining: string; // e.g., "2시간 23분 남음"
  participantCount: number;
  totalMembers: number;
  participationRate: number; // 0-100
  voteStatus: VoteStatus;
}

/**
 * Poll Card Data - Completed Variant
 */
export interface CompletedPollData {
  id: string;
  question: string;
  emoji: string;
  circleName: string;
  winner: WinnerInfo;
}

/**
 * Legacy Poll Card Data (backward compatibility)
 */
export interface PollCardData {
  id: string;
  question: string;
  emoji: string;
  circleName?: string;
  timeRemaining: string;
  participantCount: number;
  totalMembers: number;
  participationRate: number;
  voteStatus?: VoteStatus;
}

/**
 * Active Poll Card Props
 */
interface ActivePollCardProps {
  variant: 'active';
  poll: ActivePollData;
  onPress: () => void;
}

/**
 * Completed Poll Card Props
 */
interface CompletedPollCardProps {
  variant: 'completed';
  poll: CompletedPollData;
  onPress: () => void;
}

/**
 * Legacy Poll Card Props (backward compatibility)
 */
interface LegacyPollCardProps {
  variant?: undefined;
  poll: PollCardData;
  onPress: () => void;
}

type PollCardProps = ActivePollCardProps | CompletedPollCardProps | LegacyPollCardProps;

// ============================================================================
// PollCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PollCard Component
 *
 * 홈 화면에 표시되는 투표 카드
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * @example Active variant
 * ```tsx
 * <PollCard
 *   variant="active"
 *   poll={{
 *     id: '1',
 *     question: '가장 친절한 사람은?',
 *     emoji: '😊',
 *     circleName: 'OO고 2학년 1반',
 *     timeRemaining: '2시간 23분 남음',
 *     participantCount: 12,
 *     totalMembers: 16,
 *     participationRate: 75,
 *     voteStatus: 'not_voted',
 *   }}
 *   onPress={() => router.push(`/poll/${poll.id}/vote`)}
 * />
 * ```
 *
 * @example Completed variant
 * ```tsx
 * <PollCard
 *   variant="completed"
 *   poll={{
 *     id: '1',
 *     question: '가장 친절한 사람은?',
 *     emoji: '😊',
 *     circleName: 'OO고 2학년 1반',
 *     winner: { name: '김민수', voteCount: 8 },
 *   }}
 *   onPress={() => router.push(`/poll/${poll.id}/result`)}
 * />
 * ```
 */
export function PollCard(props: PollCardProps) {
  const { poll, onPress } = props;
  const variant = props.variant ?? 'active';

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

  // Generate accessibility label based on variant
  const getAccessibilityLabel = (): string => {
    if (variant === 'completed') {
      const completedPoll = poll as CompletedPollData;
      return `완료된 투표: ${poll.question}, 1위: ${completedPoll.winner.name} ${completedPoll.winner.voteCount}표`;
    } else {
      const activePoll = poll as ActivePollData | PollCardData;
      const status = 'voteStatus' in activePoll && activePoll.voteStatus === 'voted'
        ? '투표 완료'
        : '투표하기';
      return `투표: ${poll.question}, ${activePoll.timeRemaining}, ${activePoll.participantCount}/${activePoll.totalMembers}명 참여, ${status}`;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
      accessibilityRole="button" as AccessibilityRole
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={variant === 'completed' ? '결과를 확인하려면 두 번 탭하세요' : '투표에 참여하려면 두 번 탭하세요'}
    >
      {variant === 'completed' ? (
        <CompletedCardContent poll={poll as CompletedPollData} />
      ) : (
        <ActiveCardContent poll={poll as (ActivePollData | PollCardData)} />
      )}
    </AnimatedPressable>
  );
}

// ============================================================================
// Active Card Content
// ============================================================================

interface ActiveCardContentProps {
  poll: ActivePollData | PollCardData;
}

function ActiveCardContent({ poll }: ActiveCardContentProps) {
  const voteStatus = 'voteStatus' in poll ? poll.voteStatus : 'not_voted';
  const circleName = poll.circleName;

  return (
    <>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <Text variant="2xl" style={styles.emoji}>
          {poll.emoji}
        </Text>
        <View style={styles.questionContent}>
          <Text
            variant="lg"
            weight="semibold"
            color={tokens.colors.neutral[900]}
            numberOfLines={2}
          >
            {poll.question}
          </Text>
          {circleName && (
            <Text
              variant="sm"
              color={tokens.colors.neutral[500]}
              style={styles.circleName}
            >
              {circleName}
            </Text>
          )}
        </View>
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
            👥 {poll.participantCount}/{poll.totalMembers}명 참여
          </Text>
        </View>
      </View>

      {/* Vote Status Badge */}
      <View style={styles.statusContainer}>
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

        {/* Vote Status Badge */}
        <VoteStatusBadge status={voteStatus} />
      </View>
    </>
  );
}

// ============================================================================
// Completed Card Content
// ============================================================================

interface CompletedCardContentProps {
  poll: CompletedPollData;
}

function CompletedCardContent({ poll }: CompletedCardContentProps) {
  return (
    <>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <Text variant="2xl" style={styles.emoji}>
          {poll.emoji}
        </Text>
        <View style={styles.questionContent}>
          <Text
            variant="lg"
            weight="semibold"
            color={tokens.colors.neutral[900]}
            numberOfLines={2}
          >
            {poll.question}
          </Text>
          {poll.circleName && (
            <Text
              variant="sm"
              color={tokens.colors.neutral[500]}
              style={styles.circleName}
            >
              {poll.circleName}
            </Text>
          )}
        </View>
      </View>

      {/* Completed Status + Winner */}
      <View style={styles.completedFooter}>
        {/* Completed Badge */}
        <View style={styles.completedBadge}>
          <Text variant="sm" weight="medium" color={tokens.colors.neutral[500]}>
            투표 종료
          </Text>
        </View>

        {/* Winner Preview */}
        <View style={styles.winnerPreview}>
          <Text variant="sm" color={tokens.colors.neutral[600]}>
            🏆
          </Text>
          <Text
            variant="sm"
            weight="semibold"
            color={tokens.colors.neutral[800]}
            style={styles.winnerName}
          >
            {poll.winner.name}
          </Text>
          <Text variant="sm" color={tokens.colors.neutral[500]}>
            {poll.winner.voteCount}표
          </Text>
        </View>
      </View>
    </>
  );
}

// ============================================================================
// Vote Status Badge Component
// ============================================================================

interface VoteStatusBadgeProps {
  status: VoteStatus;
}

function VoteStatusBadge({ status }: VoteStatusBadgeProps) {
  const isVoted = status === 'voted';

  return (
    <View
      style={[
        styles.voteBadge,
        isVoted ? styles.voteBadgeVoted : styles.voteBadgeNotVoted,
      ]}
    >
      <Text
        variant="sm"
        weight="medium"
        color={isVoted ? tokens.colors.success[600] : tokens.colors.primary[600]}
      >
        {isVoted ? '투표 완료 ✅' : '투표하기 →'}
      </Text>
    </View>
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
    marginRight: spacing[2], // 8px
    lineHeight: 28, // Align with text
  },
  questionContent: {
    flex: 1,
  },
  circleName: {
    marginTop: spacing[1], // 4px
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3], // 12px
  },
  metaItem: {
    marginRight: spacing[4], // 16px
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[3], // 12px
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
  // Vote Status Badge
  voteBadge: {
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[1], // 4px
    borderRadius: borderRadius.full,
  },
  voteBadgeVoted: {
    backgroundColor: tokens.colors.success[50],
  },
  voteBadgeNotVoted: {
    backgroundColor: tokens.colors.primary[50],
  },
  // Completed Card
  completedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedBadge: {
    backgroundColor: tokens.colors.neutral[100],
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[1], // 4px
    borderRadius: borderRadius.full,
  },
  winnerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerName: {
    marginHorizontal: spacing[1], // 4px
  },
});
