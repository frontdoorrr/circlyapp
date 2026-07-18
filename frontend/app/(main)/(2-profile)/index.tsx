import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCurrentUser, useUpdateProfile } from '../../../src/hooks/useAuth';
import { useThemedStyles } from '../../../src/theme/ThemeContext';
import { ProfileInfo } from '../../../src/components/profile/ProfileInfo';
import { ProfileEditModal } from '../../../src/components/profile/ProfileEditModal';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { LiquidBackground } from '../../../src/components/primitives/LiquidBackground';
import { Text } from '../../../src/components/primitives/Text';
import { useToast } from '../../../src/providers/ToastProvider';
import { tokens } from '../../../src/theme';
import { ApiError } from '../../../src/types/api';
import { UserUpdate } from '../../../src/types/auth';
import type { Theme } from '../../../src/theme/tokens';

/**
 * Profile Screen
 *
 * 사용자 Profile 및 설정 화면
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // 사용자 정보 조회
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Profile 수정
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (edit === 'true') {
      setEditModalOpen(true);
    }
  }, [edit]);

  const handleUpdateProfile = async (data: UserUpdate) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      showToast('Profile이 업데이트되었습니다', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Profile 업데이트 중 문제가 발생했습니다', 'error');
      }
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    if (edit === 'true') {
      router.replace('/(main)/(2-profile)');
    }
  };

  if (userLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <LiquidBackground />
        <LoadingSpinner />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <LiquidBackground />
        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LiquidBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 사용자 정보 */}
        <ProfileInfo
          user={user}
          onEdit={() => setEditModalOpen(true)}
        />

        {/* Orb Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orb Mode</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.settingItem, styles.lastItem]}
              onPress={() => router.push('/subscription' as any)}
              accessibilityRole="button"
              accessibilityLabel={
                user.is_orb_mode ? 'Orb Mode 구독 관리' : 'Orb Mode 알아보기'
              }
            >
              <Text style={styles.settingItemText}>🔮 안전 힌트 구독</Text>
              {user.is_orb_mode ? (
                <Text style={styles.settingItemValue}>구독 중</Text>
              ) : (
                <Text style={styles.settingItemArrow}>›</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 설정 허브 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.settingItem, styles.lastItem]}
              onPress={() => router.push('/(main)/(2-profile)/settings')}
              accessibilityRole="button"
              accessibilityLabel="설정 열기"
              accessibilityHint="알림, 화면, 구독 및 계정 설정을 엽니다"
            >
              <Text style={styles.settingItemText}>⚙️ 앱 및 계정 설정</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Profile 수정 모달 */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        initialData={{
          username: user.username,
          display_name: user.display_name,
          gender: user.gender,
          age_group: user.age_group,
          profile_emoji: user.profile_emoji,
        }}
        onSubmit={handleUpdateProfile}
        onClose={handleCloseEditModal}
      />
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      padding: tokens.spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
      paddingBottom: 120,
    },
    section: {
      marginBottom: tokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.md,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.md,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: tokens.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingItemText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.text,
    },
    settingItemValue: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    settingItemArrow: {
      fontSize: 24,
      color: theme.textTertiary,
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    errorText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
