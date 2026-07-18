import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import { useLogout, useDeleteAccount } from '../../../src/hooks/useAuth';
import { logger } from '../../../src/utils/logger';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { presentCustomerCenter } from '../../../src/services/subscription/revenuecat';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens } from '../../../src/theme';
import type { Theme } from '../../../src/theme/tokens';
import { useToast } from '../../../src/providers/ToastProvider';

// 앱 버전 (컴포넌트 외부에서 상수로 정의)
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Settings Screen
 *
 * 설정 화면
 * @see prd/design/04-user-flow.md#3. [설정]
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme, followSystem, setFollowSystem } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const { isSubscribed, status, isLoading: isLoadingSubscription } = useSubscription();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isOpeningCustomerCenter, setIsOpeningCustomerCenter] = useState(false);

  // Open Customer Center for subscription management
  const handleManageSubscription = async () => {
    try {
      await Haptics.selectionAsync();
      setIsOpeningCustomerCenter(true);
      await presentCustomerCenter();
    } catch (error) {
      logger.error('Failed to open Customer Center:', error);
      showToast('구독 관리 화면을 열지 못했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsOpeningCustomerCenter(false);
    }
  };

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
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            ).catch(() => undefined);
            try {
              await logoutMutation.mutateAsync();
            } catch (error) {
              logger.warn('Failed to sign out remotely:', error);
              showToast('원격 로그아웃에 실패했지만 기기에서는 로그아웃했습니다.', 'info');
            } finally {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== '탈퇴합니다') {
      showToast('"탈퇴합니다"를 정확히 입력해주세요', 'error');
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
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch(() => undefined);
              router.replace('/(auth)/login');
            } catch {
              showToast('회원 탈퇴 중 문제가 발생했습니다', 'error');
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

  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: tokens.colors.primary[500],
      });
    } catch (error) {
      logger.warn('Failed to open browser:', error);
      showToast('페이지를 열지 못했습니다. 네트워크 연결을 확인해주세요.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          hitSlop={8}
        >
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
              style={[styles.settingItem, styles.noBorder]}
              onPress={() =>
                router.push({
                  pathname: '/(main)/(2-profile)',
                  params: { edit: 'true' },
                } as any)
              }
              accessibilityRole="button"
              accessibilityLabel="프로필 수정"
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
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(main)/(2-profile)/notifications')}
              accessibilityRole="button"
              accessibilityLabel="알림 설정"
            >
              <Text style={styles.settingItemText}>알림 설정</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <Text style={styles.settingItemText}>다크 모드</Text>
              <Switch
                value={isDark}
                onValueChange={handleDarkModeToggle}
                disabled={followSystem}
                trackColor={{
                  false: isDark ? tokens.colors.neutral[600] : tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
                accessibilityLabel="다크 모드"
                accessibilityHint={
                  followSystem ? '시스템 설정 따르기를 끄면 변경할 수 있습니다' : undefined
                }
              />
            </View>
            <View style={[styles.settingItem, styles.noBorder]}>
              <Text style={styles.settingItemText}>시스템 설정 따르기</Text>
              <Switch
                value={followSystem}
                onValueChange={handleFollowSystemToggle}
                trackColor={{
                  false: isDark ? tokens.colors.neutral[600] : tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
                accessibilityLabel="시스템 화면 설정 따르기"
              />
            </View>
          </View>
        </View>

        {/* 구독 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ 구독</Text>
          <View style={styles.card}>
            {isLoadingSubscription ? (
              <View style={[styles.settingItem, styles.noBorder, styles.loadingItem]}>
                <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
              </View>
            ) : isSubscribed ? (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingItemText}>구독 상태</Text>
                  <View style={styles.subscriptionBadge}>
                    <Text style={styles.subscriptionBadgeText}>Pro ✨</Text>
                  </View>
                </View>
                {status?.expirationDate && (
                  <View style={styles.settingItem}>
                    <Text style={styles.settingItemText}>
                      {status.isLifetime ? '평생 구독' : '다음 결제일'}
                    </Text>
                    <Text style={styles.settingItemValue}>
                      {status.isLifetime
                        ? '평생'
                        : status.expirationDate.toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.settingItem, styles.noBorder]}
                  onPress={handleManageSubscription}
                  disabled={isOpeningCustomerCenter}
                  accessibilityRole="button"
                  accessibilityLabel="구독 관리"
                  accessibilityState={{ disabled: isOpeningCustomerCenter }}
                >
                  <Text style={styles.settingItemText}>구독 관리</Text>
                  {isOpeningCustomerCenter ? (
                    <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
                  ) : (
                    <Text style={styles.settingItemArrow}>›</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingItemText}>구독 상태</Text>
                  <Text style={styles.settingItemValue}>무료</Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingItem, styles.noBorder]}
                  onPress={() => router.push('/subscription' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Pro로 업그레이드"
                >
                  <Text style={styles.upgradeText}>Pro로 업그레이드</Text>
                  <Text style={styles.settingItemArrow}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ 정보</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/privacy')}
              accessibilityRole="link"
              accessibilityLabel="개인정보처리방침 열기"
            >
              <Text style={styles.settingItemText}>개인정보처리방침</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/terms')}
              accessibilityRole="link"
              accessibilityLabel="서비스 이용약관 열기"
            >
              <Text style={styles.settingItemText}>서비스 이용약관</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => openLink('https://circly.app/licenses')}
              accessibilityRole="link"
              accessibilityLabel="오픈소스 라이선스 열기"
            >
              <Text style={styles.settingItemText}>오픈소스 라이선스</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </TouchableOpacity>
            <View style={[styles.settingItem, styles.noBorder]}>
              <Text style={styles.settingItemText}>앱 버전</Text>
              <Text style={styles.settingItemValue}>v{APP_VERSION}</Text>
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
              disabled={logoutMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
              accessibilityState={{ disabled: logoutMutation.isPending }}
            >
              <Text style={styles.dangerText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, styles.noBorder]}
              onPress={() => setShowDeleteConfirm(true)}
              disabled={deleteAccountMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="회원 탈퇴"
              accessibilityState={{ disabled: deleteAccountMutation.isPending }}
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
              확인을 위해 &ldquo;탈퇴합니다&rdquo;를 입력해주세요.
            </Text>
            <TextInput
              style={styles.deleteConfirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="탈퇴합니다"
              placeholderTextColor={theme.textTertiary}
              editable={!deleteAccountMutation.isPending}
              accessibilityLabel="회원 탈퇴 확인 문구"
              accessibilityHint="탈퇴합니다를 정확히 입력하세요"
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
                disabled={deleteAccountMutation.isPending}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleDeleteAccount}
                style={styles.deleteConfirmButton}
                loading={deleteAccountMutation.isPending}
                accessibilityLabel="회원 탈퇴 최종 확인"
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

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: tokens.spacing.sm,
    },
    backText: {
      fontSize: 24,
      color: theme.text,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
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
      color: theme.textSecondary,
      marginBottom: tokens.spacing.sm,
      marginLeft: tokens.spacing.xs,
    },
    sectionTitleDanger: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.error[isDark ? 400 : 600],
      marginBottom: tokens.spacing.sm,
      marginLeft: tokens.spacing.xs,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    noBorder: {
      borderBottomWidth: 0,
    },
    settingItemText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.text,
    },
    settingItemValue: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textTertiary,
    },
    settingItemArrow: {
      fontSize: 20,
      color: theme.textTertiary,
    },
    dangerText: {
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.error[isDark ? 400 : 600],
    },
    deleteConfirmSection: {
      backgroundColor: isDark
        ? 'rgba(239, 68, 68, 0.1)'
        : tokens.colors.error[50],
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
      marginBottom: tokens.spacing.xl,
      borderWidth: 1,
      borderColor: isDark
        ? tokens.colors.error[800]
        : tokens.colors.error[200],
    },
    deleteWarning: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.error[isDark ? 400 : 700],
      marginBottom: tokens.spacing.sm,
    },
    deleteWarningItem: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.error[isDark ? 400 : 600],
      marginLeft: tokens.spacing.sm,
      marginBottom: tokens.spacing.xs,
    },
    deleteConfirmLabel: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
      marginTop: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
    },
    deleteConfirmInput: {
      backgroundColor: isDark ? theme.backgroundSecondary : tokens.colors.white,
      borderRadius: tokens.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.typography.fontSize.base,
      color: theme.text,
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
      flex: 1,
      backgroundColor: tokens.colors.error[600],
    },
    subscriptionBadge: {
      backgroundColor: tokens.colors.primary[100],
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.full,
    },
    subscriptionBadgeText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[700],
    },
    loadingItem: {
      justifyContent: 'center',
      minHeight: 48,
    },
    upgradeText: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.primary[600],
    },
  });
