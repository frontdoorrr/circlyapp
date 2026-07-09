import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { useThemedStyles } from '../../theme/ThemeContext';
import type { Theme } from '../../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface PollEmptyStateProps {
  onCreatePoll: () => void;
}

// ============================================================================
// PollEmptyState Component
// ============================================================================

/**
 * PollEmptyState Component
 *
 * 진행 중인 투표가 없을 때 표시되는 빈 상태
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 6
 *
 * @param onCreatePoll - 투표 만들기 버튼 핸들러
 *
 * @example
 * <PollEmptyState onCreatePoll={() => router.push('/create')} />
 */
export function PollEmptyState({ onCreatePoll }: PollEmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      {/* Icon */}
      <Text variant="4xl" style={styles.icon}>
        🗳️
      </Text>

      {/* Title */}
      <Text
        variant="lg"
        weight="semibold"
        style={styles.title}
      >
        진행 중인 투표가 없어요
      </Text>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text
          variant="sm"
          align="center"
          style={styles.description}
        >
          새로운 투표를 만들거나
        </Text>
        <Text
          variant="sm"
          align="center"
          style={styles.description}
        >
          친구들이 투표를 시작하면
        </Text>
        <Text
          variant="sm"
          align="center"
          style={styles.description}
        >
          여기에 표시돼요!
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <Button onPress={onCreatePoll} style={styles.button}>
          투표 만들기
        </Button>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6], // 24px
    paddingVertical: spacing[12], // 48px
  },
  icon: {
    marginBottom: spacing[4], // 16px
  },
  title: {
    marginBottom: spacing[3], // 12px
    color: theme.text,
  },
  descriptionContainer: {
    marginBottom: spacing[8], // 32px
  },
  description: {
    lineHeight: 20,
    color: theme.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
  button: {
    height: 48,
  },
});
