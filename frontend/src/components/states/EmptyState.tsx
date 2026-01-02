import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../../theme';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { useFadeIn } from '../../hooks';
import Animated from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

export type EmptyStateVariant =
  | 'no-polls'
  | 'no-active-polls'
  | 'no-completed-polls'
  | 'no-circles'
  | 'no-results'
  | 'no-notifications'
  | 'poll-ended'
  | 'network-error'
  | 'search-empty'
  | 'generic';

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// EmptyState Component
// ============================================================================

/**
 * EmptyState Component
 *
 * 빈 상태 표시 컴포넌트
 *
 * @param variant - 빈 상태 타입
 * @param title - 제목 (variant 기본값 override)
 * @param description - 설명 (variant 기본값 override)
 * @param icon - 아이콘 이모지
 * @param actionLabel - 액션 버튼 라벨
 * @param onAction - 액션 버튼 핸들러
 * @param style - 커스텀 스타일
 *
 * @example
 * <EmptyState
 *   variant="no-polls"
 *   onAction={() => navigation.navigate('CreatePoll')}
 * />
 *
 * // 또는 커스텀 메시지
 * <EmptyState
 *   title="아직 친구가 없어요"
 *   description="친구를 초대해보세요!"
 *   icon="👥"
 *   actionLabel="친구 초대하기"
 *   onAction={handleInvite}
 * />
 */
export function EmptyState({
  variant = 'generic',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const animatedStyle = useFadeIn(100);

  const config = getEmptyStateConfig(variant);

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalIcon = icon || config.icon;
  const finalActionLabel = actionLabel || config.actionLabel;

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {/* Icon */}
      {finalIcon && (
        <View style={styles.iconContainer}>
          <Text variant="4xl">{finalIcon}</Text>
        </View>
      )}

      {/* Title */}
      {finalTitle && (
        <Text
          variant="xl"
          weight="bold"
          align="center"
          color={tokens.colors.neutral[900]}
          style={styles.title}
        >
          {finalTitle}
        </Text>
      )}

      {/* Description */}
      {finalDescription && (
        <Text
          variant="base"
          align="center"
          color={tokens.colors.neutral[600]}
          style={styles.description}
        >
          {finalDescription}
        </Text>
      )}

      {/* Action Button */}
      {onAction && finalActionLabel && (
        <Button
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        >
          {finalActionLabel}
        </Button>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Empty State Configurations
// ============================================================================

interface EmptyStateConfig {
  title: string;
  description: string;
  icon: string;
  actionLabel?: string;
}

function getEmptyStateConfig(variant: EmptyStateVariant): EmptyStateConfig {
  const configs: Record<EmptyStateVariant, EmptyStateConfig> = {
    'no-polls': {
      icon: '📊',
      title: '진행 중인 투표가 없어요',
      description: '친구들과 함께 재미있는 투표를 만들어보세요!',
      actionLabel: '투표 만들기',
    },
    'no-active-polls': {
      icon: '🎯',
      title: '진행 중인 투표가 없어요',
      description: '친구들이 투표를 시작하면 여기에 표시됩니다',
      actionLabel: '투표 만들기',
    },
    'no-completed-polls': {
      icon: '📊',
      title: '아직 완료된 투표가 없어요',
      description: '투표가 끝나면 결과를 확인할 수 있습니다',
    },
    'no-circles': {
      icon: '👥',
      title: '아직 Circle이 없어요',
      description: 'Circle을 만들거나 초대 코드로 참여해보세요!',
      actionLabel: 'Circle 만들기',
    },
    'no-results': {
      icon: '📭',
      title: '아직 결과가 없어요',
      description: '투표가 마감되면 결과를 확인할 수 있어요',
    },
    'no-notifications': {
      icon: '🔔',
      title: '알림이 없어요',
      description: '새로운 투표나 결과가 있으면 알려드릴게요',
    },
    'poll-ended': {
      icon: '⏰',
      title: '투표가 마감되었어요',
      description: '다음 투표를 기다려주세요!',
    },
    'network-error': {
      icon: '📡',
      title: '인터넷 연결을 확인해주세요',
      description: '네트워크 연결이 불안정합니다',
      actionLabel: '다시 시도',
    },
    'search-empty': {
      icon: '🔍',
      title: '검색 결과가 없어요',
      description: '다른 검색어로 시도해보세요',
    },
    generic: {
      icon: '📝',
      title: '내용이 없어요',
      description: '아직 표시할 내용이 없습니다',
    },
  };

  return configs[variant];
}

// ============================================================================
// Compact EmptyState
// ============================================================================

export interface CompactEmptyStateProps {
  message: string;
  icon?: string;
}

/**
 * CompactEmptyState Component
 *
 * 간단한 빈 상태 표시 (버튼 없음)
 *
 * @param message - 메시지
 * @param icon - 아이콘 이모지
 *
 * @example
 * <CompactEmptyState message="투표가 없습니다" icon="📊" />
 */
export function CompactEmptyState({ message, icon }: CompactEmptyStateProps) {
  const animatedStyle = useFadeIn(100);

  return (
    <Animated.View style={[styles.compactContainer, animatedStyle]}>
      {icon && <Text variant="2xl">{icon}</Text>}
      <Text
        variant="sm"
        align="center"
        color={tokens.colors.neutral[500]}
        style={styles.compactMessage}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  iconContainer: {
    marginBottom: tokens.spacing.lg,
  },
  title: {
    marginBottom: tokens.spacing.sm,
  },
  description: {
    marginBottom: tokens.spacing.xl,
    maxWidth: 280,
  },
  button: {
    marginTop: tokens.spacing.md,
  },
  // Compact variant
  compactContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  compactMessage: {
    marginTop: tokens.spacing.xs,
  },
});
