/**
 * Profile Info Component
 *
 * 사용자 정보 표시 컴포넌트
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { UserResponse } from '../../types/auth';
import { Text } from '../primitives/Text';
import { tokens, useThemedStyles } from '../../theme';
import type { Theme } from '../../theme/tokens';

interface ProfileInfoProps {
  user: UserResponse;
  onEdit: () => void;
}

export function ProfileInfo({ user, onEdit }: ProfileInfoProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {/* Profile 이모지 */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{user.profile_emoji}</Text>
      </View>

      {/* 사용자 정보 */}
      <Text style={styles.displayName}>
        {user.display_name || user.username || '사용자'}
      </Text>

      {user.username && (
        <Text style={styles.username}>@{user.username}</Text>
      )}

      <Text style={styles.email}>{user.email}</Text>

      {/* 편집 버튼 */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="프로필 편집"
      >
        <Text style={styles.editButtonText}>프로필 편집</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: tokens.spacing.lg,
    backgroundColor: theme.card,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.lg,
    ...(isDark
      ? { borderWidth: 1, borderColor: theme.border }
      : tokens.shadows.sm),
  },
  emojiContainer: {
    width: 120,      // 100 → 120 (iOS 이모지 렌더링 여유 공간)
    height: 120,     // 100 → 120
    borderRadius: 60,
    backgroundColor: isDark
      ? theme.backgroundTertiary
      : tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 64,  // fontSize * 1.15 (iOS 잘림 방지)
    textAlign: 'center',
  },
  displayName: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: theme.text,
    marginBottom: tokens.spacing.xs,
  },
  username: {
    fontSize: tokens.typography.fontSize.base,
    color: theme.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  email: {
    fontSize: tokens.typography.fontSize.sm,
    color: theme.textTertiary,
    marginBottom: tokens.spacing.lg,
  },
  editButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary[isDark ? 700 : 200],
    backgroundColor: tokens.colors.primary[isDark ? 900 : 50],
  },
  editButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[isDark ? 300 : 600],
  },
});
