import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../../../src/hooks';

/**
 * Notifications Settings Screen
 *
 * 알림 설정 화면
 * @see prd/features/03-push-notification.md#3. 알림 설정 및 개인화
 * @see prd/design/04-user-flow.md#알림 및 푸시 플로우
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { data: settings, isLoading, error, refetch } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateNotificationSettings();

  // 로컬 상태 (API 연동 전 즉각적인 UI 반응을 위해)
  const [localSettings, setLocalSettings] = useState({
    pollStarted: true,
    pollReminder: true,
    pollEnded: true,
    voteReceived: true,
    circleInvite: true,
  });

  // 서버에서 설정 로드 시 로컬 상태 동기화
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        pollStarted: settings.poll_started,
        pollReminder: settings.poll_reminder,
        pollEnded: settings.poll_ended,
        voteReceived: settings.vote_received,
        circleInvite: settings.circle_invite,
      });
    }
  }, [settings]);

  // 전체 알림 상태 계산
  const allEnabled =
    localSettings.pollStarted &&
    localSettings.pollReminder &&
    localSettings.pollEnded &&
    localSettings.voteReceived &&
    localSettings.circleInvite;

  const handleToggle = async (key: keyof typeof localSettings) => {
    await Haptics.selectionAsync();
    const newValue = !localSettings[key];

    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setLocalSettings((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    // 서버에 업데이트 요청
    const updatePayload: Record<string, boolean> = {};
    if (key === 'pollStarted') updatePayload.poll_started = newValue;
    if (key === 'pollReminder') updatePayload.poll_reminder = newValue;
    if (key === 'pollEnded') updatePayload.poll_ended = newValue;
    if (key === 'voteReceived') updatePayload.vote_received = newValue;
    if (key === 'circleInvite') updatePayload.circle_invite = newValue;

    updateSettings(updatePayload, {
      onError: () => {
        // 실패 시 원복
        setLocalSettings((prev) => ({
          ...prev,
          [key]: !newValue,
        }));
        Alert.alert('오류', '설정 변경에 실패했습니다. 다시 시도해주세요.');
      },
    });
  };

  const handleToggleAll = async () => {
    await Haptics.selectionAsync();

    if (allEnabled) {
      // 전체 알림 끄기 확인
      Alert.alert(
        '알림 끄기',
        '모든 알림을 끄시겠습니까?\n\n새로운 투표와 결과 알림을 받을 수 없게 됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '끄기',
            onPress: () => {
              setLocalSettings({
                pollStarted: false,
                pollReminder: false,
                pollEnded: false,
                voteReceived: false,
                circleInvite: false,
              });
              updateSettings({
                poll_started: false,
                poll_reminder: false,
                poll_ended: false,
                vote_received: false,
                circle_invite: false,
              });
            },
          },
        ]
      );
    } else {
      // 전체 알림 켜기
      setLocalSettings({
        pollStarted: true,
        pollReminder: true,
        pollEnded: true,
        voteReceived: true,
        circleInvite: true,
      });
      updateSettings({
        poll_started: true,
        poll_reminder: true,
        poll_ended: true,
        vote_received: true,
        circle_invite: true,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>설정을 불러오지 못했습니다</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.placeholder}>
          {isUpdating && (
            <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 전체 알림 */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>🔔 전체 알림</Text>
                <Text style={styles.settingItemDesc}>
                  모든 푸시 알림을 켜거나 끕니다
                </Text>
              </View>
              <Switch
                value={allEnabled}
                onValueChange={handleToggleAll}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
          </View>
        </View>

        {/* 알림 유형별 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 유형</Text>
          <View style={styles.card}>
            {/* 투표 시작 알림 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>🗳️ 새 투표 시작</Text>
                <Text style={styles.settingItemDesc}>
                  Circle에서 새로운 투표가 시작되면 알림
                </Text>
              </View>
              <Switch
                value={localSettings.pollStarted}
                onValueChange={() => handleToggle('pollStarted')}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>

            {/* 마감 임박 알림 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>⏰ 마감 임박</Text>
                <Text style={styles.settingItemDesc}>
                  투표 마감 1시간 전, 10분 전 알림
                </Text>
              </View>
              <Switch
                value={localSettings.pollReminder}
                onValueChange={() => handleToggle('pollReminder')}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>

            {/* 결과 발표 알림 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>🎉 결과 발표</Text>
                <Text style={styles.settingItemDesc}>
                  투표가 끝나고 결과가 나오면 알림
                </Text>
              </View>
              <Switch
                value={localSettings.pollEnded}
                onValueChange={() => handleToggle('pollEnded')}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>

            {/* 투표 받음 알림 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>🎊 누군가 나를 선택</Text>
                <Text style={styles.settingItemDesc}>
                  누군가 나를 선택했을 때 알림
                </Text>
              </View>
              <Switch
                value={localSettings.voteReceived}
                onValueChange={() => handleToggle('voteReceived')}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>

            {/* 서클 초대 알림 */}
            <View style={[styles.settingItem, styles.noBorder]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingItemTitle}>🎈 서클 초대</Text>
                <Text style={styles.settingItemDesc}>
                  새로운 서클에 초대받으면 알림
                </Text>
              </View>
              <Switch
                value={localSettings.circleInvite}
                onValueChange={() => handleToggle('circleInvite')}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
          </View>
        </View>

        {/* 안내 문구 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 알림 설정은 Circle별로 다르게 설정할 수도 있어요.{'\n'}
            Circle 상세 화면에서 개별 설정이 가능합니다.
          </Text>
        </View>
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
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.md,
  },
  retryButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.md,
  },
  retryText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.white,
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
  settingInfo: {
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  settingItemTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  settingItemDesc: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  infoSection: {
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  infoText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[700],
    lineHeight: 20,
  },
});
