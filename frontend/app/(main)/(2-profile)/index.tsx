import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser, useUpdateProfile, useLogout } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/theme/ThemeContext';
import { ProfileInfo } from '../../../src/components/profile/ProfileInfo';
import { ProfileEditModal } from '../../../src/components/profile/ProfileEditModal';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens } from '../../../src/theme';
import { ApiError } from '../../../src/types/api';
import { UserUpdate } from '../../../src/types/auth';

/**
 * Profile Screen
 *
 * 사용자 프로필 및 설정 화면
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // 사용자 정보 조회
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // 프로필 수정
  const updateProfileMutation = useUpdateProfile();

  // 로그아웃
  const logoutMutation = useLogout();

  const handleUpdateProfile = async (data: UserUpdate) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      Alert.alert('성공', '프로필이 업데이트되었습니다');
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('오류', error.message);
      } else {
        Alert.alert('오류', '프로필 업데이트 중 문제가 발생했습니다');
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

            {/* 앱 정보 */}
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingItemText}>ℹ️ 앱 정보</Text>
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

      {/* 프로필 수정 모달 */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
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
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
  },
  settingItemText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
  },
  settingItemValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
  settingItemArrow: {
    fontSize: 24,
    color: tokens.colors.neutral[400],
  },
  logoutSection: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
  },
});

