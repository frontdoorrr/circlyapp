import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser, useUpdateProfile, useLogout } from '../../../src/hooks/useAuth';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import { ProfileInfo } from '../../../src/components/profile/ProfileInfo';
import { ProfileEditModal } from '../../../src/components/profile/ProfileEditModal';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { Toast, ToastType } from '../../../src/components/primitives/Toast';
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
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // Toast 상태
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // 사용자 정보 조회
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Profile 수정
  const updateProfileMutation = useUpdateProfile();

  // 로그아웃
  const logoutMutation = useLogout();

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

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logoutMutation.mutateAsync();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  if (userLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 사용자 정보 */}
        <ProfileInfo
          user={user}
          onEdit={() => setEditModalOpen(true)}
        />

        {/* 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.card}>
            {/* 다크 모드 토글 */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={toggleTheme}
            >
              <Text style={styles.settingItemText}>
                🌙 다크 모드
              </Text>
              <Text style={styles.settingItemValue}>
                {isDark ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            {/* 알림 설정 */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(main)/(2-profile)/notifications')}
            >
              <Text style={styles.settingItemText}>🔔 알림 설정</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>

            {/* 설정 (회원탈퇴 포함) */}
            <TouchableOpacity
              style={[styles.settingItem, styles.lastItem]}
              onPress={() => router.push('/(main)/(2-profile)/settings')}
            >
              <Text style={styles.settingItemText}>⚙️ 설정</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <View style={styles.logoutSection}>
          <Button
            variant="ghost"
            onPress={handleLogout}
            fullWidth
          >
            로그아웃
          </Button>
        </View>
      </ScrollView>

      {/* Profile 수정 모달 */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        initialData={{
          username: user.username,
          display_name: user.display_name,
          profile_emoji: user.profile_emoji,
        }}
        onSubmit={handleUpdateProfile}
        onClose={() => setEditModalOpen(false)}
      />

      {/* Toast 알림 */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
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
    logoutSection: {
      marginTop: tokens.spacing.md,
      marginBottom: tokens.spacing.xl,
    },
    errorText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
