import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens, spacing, borderRadius } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

interface SectionHeaderProps {
  title: string;
  count?: number;
}

// ============================================================================
// SectionHeader Component
// ============================================================================

/**
 * SectionHeader Component
 *
 * 섹션 제목 컴포넌트 (카운트 뱃지 포함)
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * @param title - 섹션 제목
 * @param count - 아이템 개수 (옵션)
 *
 * @example
 * <SectionHeader title="진행 중인 투표" count={3} />
 */
export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text
        variant="base"
        weight="semibold"
        color={tokens.colors.neutral[700]}
      >
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.badge}>
          <Text
            variant="xs"
            weight="medium"
            color={tokens.colors.white}
            style={styles.badgeText}
          >
            {count}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5], // 20px
    paddingTop: spacing[4], // 16px
    paddingBottom: spacing[3], // 12px
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: tokens.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing[2], // 8px
  },
  badgeText: {
    lineHeight: 14,
  },
});
