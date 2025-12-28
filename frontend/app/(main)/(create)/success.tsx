import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { tokens } from '../../../src/theme';

/**
 * 투표 생성 완료 화면
 *
 * 투표 생성 성공을 축하하고 다음 액션을 안내합니다.
 * - 축하 애니메이션/메시지
 * - 투표 보기 버튼
 * - 홈으로 돌아가기 버튼
 */
export default function SuccessScreen() {
  const { pollId } = useLocalSearchParams<{ pollId: string }>();

  // TODO: 햅틱 피드백 추가
  useEffect(() => {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleViewPoll = () => {
    // 생성된 투표로 이동
    router.replace({
      pathname: '/poll/[id]',
      params: { id: pollId },
    });
  };

  const handleGoHome = () => {
    // 홈으로 돌아가기
    router.replace('/(main)/(home)');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
          presentation: 'modal',
        }}
      />

      <View style={styles.container}>
        <View style={styles.content}>
          {/* 축하 이모지 */}
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>🎉</Text>
          </View>

          {/* 축하 메시지 */}
          <Text style={styles.title}>투표가 생성되었어요!</Text>
          <Text style={styles.description}>
            친구들이 투표에 참여할 수 있도록{'\n'}알림이 전송되었어요
          </Text>

          {/* 투표 정보 카드 */}
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>생성된 투표</Text>
              <Text style={styles.infoValue}>로딩 중...</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Circle</Text>
              <Text style={styles.infoValue}>로딩 중...</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>마감까지</Text>
              <Text style={styles.infoValue}>로딩 중...</Text>
            </View>
          </View>

          {/* 안내 메시지 */}
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              💡 투표는 홈 화면에서 확인할 수 있어요
            </Text>
          </View>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.footer}>
          <Pressable style={styles.viewButton} onPress={handleViewPoll}>
            <Text style={styles.viewButtonText}>투표 보러가기</Text>
          </Pressable>

          <Pressable style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  content: {
    flex: 1,
    padding: tokens.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing.xl,
  },
  infoCard: {
    width: '100%',
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
  },
  infoValue: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.neutral[200],
    marginVertical: tokens.spacing.md,
  },
  tipCard: {
    width: '100%',
    backgroundColor: tokens.colors.primary[50],
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
  },
  tipText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[700],
    textAlign: 'center',
  },
  footer: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  viewButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  homeButton: {
    backgroundColor: tokens.colors.white,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
  },
  homeButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[700],
  },
});
