import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useLogout, useDeleteAccount } from '../../../src/hooks/useAuth';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens } from '../../../src/theme';

/**
 * Settings Screen
 *
 * 설정 화면
 * @see prd/design/04-user-flow.md#3. [설정]
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, followSystem, setFollowSystem } = useTheme();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleLogout = () => {
    Alert.alert(
      '정말 로그아웃할까요?',
      '다시 로그인하면 모든 Circle에 다시 참여할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logoutMutation.mutateAsync();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== '탈퇴합니다') {
      Alert.alert('오류', '"탈퇴합니다"를 정확히 입력해주세요');
      return;
    }

    Alert.alert(
      '최종 확인',
      '정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountMutation.mutateAsync();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('오류', '회원 탈퇴 중 문제가 발생했습니다');
            }
          },
        },
      ]
    );
  };

  const handleDarkModeToggle = async () => {
    await Haptics.selectionAsync();
    toggleTheme();
  };

  const handleFollowSystemToggle = async (value: boolean) => {
    await Haptics.selectionAsync();
    setFollowSystem(value);
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 계정 관리</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(main)/(profile)' as any)}
            >
              <Text style={styles.settingItemText}>프로필 수정</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 앱 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 앱 설정</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>다크 모드</Text>
              <Switch
                value={isDark}
                onValueChange={handleDarkModeToggle}
                disabled={followSystem}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
            <View style={[styles.settingItem, styles.noBorder]}>
              <Text style={styles.settingItemText}>시스템 설정 따르기</Text>
              <Switch
                value={followSystem}
                onValueChange={handleFollowSystemToggle}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
          </View>
        </View>

        {/* 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ 정보</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/privacy')}
            >
              <Text style={styles.settingItemText}>개인정보처리방침</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/terms')}
            >
              <Text style={styles.settingItemText}>서비스 이용약관</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/licenses')}
            >
              <Text style={styles.settingItemText}>오픈소스 라이선스</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <View style={[styles.settingItem, styles.noBorder]}>
              <Text style={styles.settingItemText}>앱 버전</Text>
              <Text style={styles.settingItemValue}>v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* 계정 (위험 구역) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleDanger}>⚠️ 계정</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <Text style={styles.dangerText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, styles.noBorder]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Text style={styles.dangerText}>회원 탈퇴</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 회원 탈퇴 확인 영역 */}
        {showDeleteConfirm && (
          <View style={styles.deleteConfirmSection}>
            <Text style={styles.deleteWarning}>
              ⚠️ 탈퇴 시 복구할 수 없어요:
            </Text>
            <Text style={styles.deleteWarningItem}>• 모든 Circle 탈퇴</Text>
            <Text style={styles.deleteWarningItem}>• 받은 하트 기록 삭제</Text>
            <Text style={styles.deleteWarningItem}>• 투표 참여 기록 삭제</Text>

            <Text style={styles.deleteConfirmLabel}>
              확인을 위해 "탈퇴합니다"를 입력해주세요.
            </Text>
            <TextInput
              style={styles.deleteConfirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="탈퇴합니다"
              placeholderTextColor={tokens.colors.neutral[400]}
            />
            <View style={styles.deleteButtonRow}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                style={styles.deleteButton}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleDeleteAccount}
                style={[styles.deleteButton, styles.deleteConfirmButton]}
              >
                탈퇴하기
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[200],
  },
  backButton: {
    padding: tokens.spacing.sm,
  },
  backText: {
    fontSize: 24,
    color: tokens.colors.neutral[900],
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
  },
  placeholder: {
    width: 40,
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
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  sectionTitleDanger: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.error[600],
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    ...tokens.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingItemText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
  },
  settingItemValue: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  settingItemArrow: {
    fontSize: 20,
    color: tokens.colors.neutral[400],
  },
  dangerText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.error[600],
  },
  deleteConfirmSection: {
    backgroundColor: tokens.colors.error[50],
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    borderWidth: 1,
    borderColor: tokens.colors.error[200],
  },
  deleteWarning: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.error[700],
    marginBottom: tokens.spacing.sm,
  },
  deleteWarningItem: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.error[600],
    marginLeft: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  deleteConfirmLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[700],
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  deleteConfirmInput: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  deleteButtonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  deleteButton: {
    flex: 1,
  },
  deleteConfirmButton: {
    backgroundColor: tokens.colors.error[600],
  },
});
