import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';

/**
 * Notifications Settings Screen
 *
 * 알림 설정 화면
 * @see prd/features/03-push-notification.md#3. 알림 설정 및 개인화
 * @see prd/design/04-user-flow.md#알림 및 푸시 플로우
 */
export default function NotificationsScreen() {
  const router = useRouter();

  // 알림 설정 상태 (TODO: 실제 API 연동 필요)
  const [settings, setSettings] = useState({
    allNotifications: true,
    pollStarted: true,
    pollEnding: true,
    pollResult: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
  });

  const handleToggle = async (key: keyof typeof settings) => {
    await Haptics.selectionAsync();

    if (key === 'allNotifications' && settings.allNotifications) {
      // 전체 알림 끄기 확인
      Alert.alert(
        '알림 끄기',
        '모든 알림을 끄시겠습니까?\n\n새로운 투표와 결과 알림을 받을 수 없게 됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '끄기',
            onPress: () => {
              setSettings((prev) => ({
                ...prev,
                allNotifications: false,
                pollStarted: false,
                pollEnding: false,
                pollResult: false,
              }));
            },
          },
        ]
      );
      return;
    }

    if (key === 'allNotifications' && !settings.allNotifications) {
      // 전체 알림 켜기
      setSettings((prev) => ({
        ...prev,
        allNotifications: true,
        pollStarted: true,
        pollEnding: true,
        pollResult: true,
      }));
      return;
    }

    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof settings],
    }));
  };

  const handleQuietHoursToggle = async () => {
    await Haptics.selectionAsync();
    if (!settings.quietHours) {
      Alert.alert(
        '조용한 시간',
        `${settings.quietStart} ~ ${settings.quietEnd} 동안 알림을 받지 않습니다.`,
        [{ text: '확인' }]
      );
    }
    setSettings((prev) => ({
      ...prev,
      quietHours: !prev.quietHours,
    }));
  };

  const isDisabled = !settings.allNotifications;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.placeholder} />
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
                value={settings.allNotifications}
                onValueChange={() => handleToggle('allNotifications')}
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
                <Text style={[styles.settingItemTitle, isDisabled && styles.disabled]}>
                  🗳️ 새 투표 시작
                </Text>
                <Text style={[styles.settingItemDesc, isDisabled && styles.disabled]}>
                  Circle에서 새로운 투표가 시작되면 알림
                </Text>
              </View>
              <Switch
                value={settings.pollStarted}
                onValueChange={() => handleToggle('pollStarted')}
                disabled={isDisabled}
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
                <Text style={[styles.settingItemTitle, isDisabled && styles.disabled]}>
                  ⏰ 마감 임박
                </Text>
                <Text style={[styles.settingItemDesc, isDisabled && styles.disabled]}>
                  투표 마감 1시간 전, 10분 전 알림
                </Text>
              </View>
              <Switch
                value={settings.pollEnding}
                onValueChange={() => handleToggle('pollEnding')}
                disabled={isDisabled}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>

            {/* 결과 발표 알림 */}
            <View style={[styles.settingItem, styles.noBorder]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingItemTitle, isDisabled && styles.disabled]}>
                  🎉 결과 발표
                </Text>
                <Text style={[styles.settingItemDesc, isDisabled && styles.disabled]}>
                  투표가 끝나고 결과가 나오면 알림
                </Text>
              </View>
              <Switch
                value={settings.pollResult}
                onValueChange={() => handleToggle('pollResult')}
                disabled={isDisabled}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
          </View>
        </View>

        {/* 조용한 시간 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>조용한 시간</Text>
          <View style={styles.card}>
            <View style={[styles.settingItem, styles.noBorder]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingItemTitle, isDisabled && styles.disabled]}>
                  🌙 조용한 시간
                </Text>
                <Text style={[styles.settingItemDesc, isDisabled && styles.disabled]}>
                  {settings.quietStart} ~ {settings.quietEnd} 알림 끄기
                </Text>
              </View>
              <Switch
                value={settings.quietHours}
                onValueChange={handleQuietHoursToggle}
                disabled={isDisabled}
                trackColor={{
                  false: tokens.colors.neutral[300],
                  true: tokens.colors.primary[500],
                }}
                thumbColor={tokens.colors.white}
              />
            </View>
          </View>
          <Text style={styles.hint}>
            조용한 시간에는 알림이 오지 않아요. 알림은 나중에 확인할 수 있습니다.
          </Text>
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
  disabled: {
    color: tokens.colors.neutral[400],
  },
  hint: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500],
    marginTop: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
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
