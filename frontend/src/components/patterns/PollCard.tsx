import React from 'react';
import { View, StyleSheet, Pressable, AccessibilityRole } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens, animations, spacing, borderRadius } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { Text } from '../primitives/Text';
import type { Theme } from '../../theme/tokens';

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

/**
 * PollCard Component
 *
 * Home 화면에 표시되는 투표 카드
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
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={variant === 'completed' ? '결과를 확인하려면 두 번 탭하세요' : '투표에 참여하려면 두 번 탭하세요'}
    >
      <View style={styles.card}>
        {variant === 'completed' ? (
          <CompletedCardContent poll={poll as CompletedPollData} theme={theme} isDark={isDark} styles={styles} />
        ) : (
          <ActiveCardContent poll={poll as (ActivePollData | PollCardData)} theme={theme} isDark={isDark} styles={styles} />
        )}
      </View>
    </Pressable>
  );
}

// ============================================================================
// Active Card Content
// ============================================================================

interface ActiveCardContentProps {
  poll: ActivePollData | PollCardData;
  theme: Theme;
  isDark: boolean;
  styles: ReturnType<typeof createStyles>;
}

function ActiveCardContent({ poll, theme, isDark, styles }: ActiveCardContentProps) {
  const voteStatus = 'voteStatus' in poll ? poll.voteStatus : 'not_voted';
  const circleName = poll.circleName;

  return (
    <>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <View style={styles.emojiContainer}>
          <Text variant="2xl" style={styles.emoji}>
            {poll.emoji}
          </Text>
        </View>
        <View style={styles.questionContent}>
          <Text
            variant="lg"
            weight="semibold"
            color={theme.text}
            numberOfLines={2}
          >
            {poll.question}
          </Text>
          {circleName && (
            <Text
              variant="sm"
              color={theme.textTertiary}
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
          <Text variant="sm" color={theme.textTertiary}>
            ⏰ {poll.timeRemaining}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text variant="sm" color={theme.textTertiary}>
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
            color={tokens.colors.primary[isDark ? 400 : 600]}
            style={styles.progressText}
          >
            {poll.participationRate}%
          </Text>
        </View>

        {/* Vote Status Badge */}
        <VoteStatusBadge status={voteStatus} isDark={isDark} />
      </View>
    </>
  );
}

// ============================================================================
// Completed Card Content
// ============================================================================

interface CompletedCardContentProps {
  poll: CompletedPollData;
  theme: Theme;
  isDark: boolean;
  styles: ReturnType<typeof createStyles>;
}

function CompletedCardContent({ poll, theme, isDark, styles }: CompletedCardContentProps) {
  return (
    <>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <View style={styles.emojiContainer}>
          <Text variant="2xl" style={styles.emoji}>
            {poll.emoji}
          </Text>
        </View>
        <View style={styles.questionContent}>
          <Text
            variant="lg"
            weight="semibold"
            color={theme.text}
            numberOfLines={2}
          >
            {poll.question}
          </Text>
          {poll.circleName && (
            <Text
              variant="sm"
              color={theme.textTertiary}
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
          <Text variant="sm" weight="medium" color={theme.textTertiary}>
            투표 종료
          </Text>
        </View>

        {/* Winner Preview */}
        <View style={styles.winnerPreview}>
          <Text variant="sm" color={theme.textSecondary}>
            🏆
          </Text>
          <Text
            variant="sm"
            weight="semibold"
            color={theme.text}
            style={styles.winnerName}
          >
            {poll.winner.name}
          </Text>
          <Text variant="sm" color={theme.textTertiary}>
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
  isDark: boolean;
}

function VoteStatusBadge({ status, isDark }: VoteStatusBadgeProps) {
  const isVoted = status === 'voted';

  const badgeStyle = {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: isVoted
      ? isDark ? 'rgba(34, 197, 94, 0.15)' : tokens.colors.success[50]
      : isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
  };

  return (
    <View style={badgeStyle}>
      <Text
        variant="sm"
        weight="medium"
        color={isVoted
          ? tokens.colors.success[isDark ? 400 : 600]
          : tokens.colors.primary[isDark ? 400 : 600]}
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

  const fillStyle = {
    height: '100%' as const,
    backgroundColor: tokens.colors.primary[500],
    borderRadius: borderRadius.full,
  };

  return <Animated.View style={[fillStyle, animatedStyle]} />;
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: borderRadius['2xl'], // 20px
      padding: spacing[5], // 20px
      marginBottom: spacing[3], // 12px
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing[3], // 12px
    },
    emojiContainer: {
      width: 40,      // 32 → 40 (iOS 이모지 렌더링 여유 공간)
      height: 40,     // 32 → 40
      marginRight: spacing[2], // 8px
      alignItems: 'center',
      justifyContent: 'center',
      // Note: overflow: 'visible'은 iOS에서 무시되므로 제거
    },
    emoji: {
      fontSize: 28,   // 24 → 28
      lineHeight: 32, // 28 → 32 (1.15 배수)
      textAlign: 'center',
      // Note: includeFontPadding은 Android 전용이므로 제거
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
      backgroundColor: theme.backgroundSecondary,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      marginRight: spacing[2], // 8px
    },
    progressText: {
      minWidth: 36,
      textAlign: 'right',
    },
    // Completed Card
    completedFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    completedBadge: {
      backgroundColor: theme.backgroundSecondary,
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
