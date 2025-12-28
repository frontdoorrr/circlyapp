/**
 * Profile Info Component
 *
 * 사용자 정보 표시 컴포넌트
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { UserResponse } from '../../types/auth';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';

interface ProfileInfoProps {
  user: UserResponse;
  onEdit: () => void;
}

export function ProfileInfo({ user, onEdit }: ProfileInfoProps) {
  return (
    <View style={styles.container}>
      {/* 프로필 이모지 */}
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
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <Text style={styles.editButtonText}>프로필 편집</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  emoji: {
    fontSize: 56,
  },
  displayName: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  username: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.xs,
  },
  email: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    marginBottom: tokens.spacing.lg,
  },
  editButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary[200],
    backgroundColor: tokens.colors.primary[50],
  },
  editButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
});
