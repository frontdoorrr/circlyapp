import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMyCircles, useLeaveCircle } from '../../../src/hooks/useCircles';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { tokens } from '../../../src/theme';

/**
 * Circles Screen
 *
 * 내 Circle 목록/관리 화면
 * @see prd/design/04-user-flow.md#Circle 관리
 */
export default function CirclesScreen() {
  const router = useRouter();
  const { data: circles, isLoading, refetch } = useMyCircles();
  const leaveCircleMutation = useLeaveCircle();

  const handleCopyInviteCode = async (inviteCode: string) => {
    await Clipboard.setStringAsync(inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다');
  };

  const handleShareInviteLink = async (circleName: string, inviteCode: string) => {
    try {
      await Share.share({
        message: `${circleName}에 초대합니다! 코드: ${inviteCode}\n\n앱에서 참여하기: circly://join?code=${inviteCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLeaveCircle = (circleId: string, circleName: string) => {
    Alert.alert(
      'Circle 나가기',
      `정말 "${circleName}"을(를) 나가시겠습니까?\n\n나가면 이 Circle의 투표에 참여할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircleMutation.mutateAsync(circleId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('완료', 'Circle을 나갔습니다');
              refetch();
            } catch (error) {
              Alert.alert('오류', 'Circle 나가기에 실패했습니다');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>내 Circle</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingSpinner />
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
        <Text style={styles.headerTitle}>내 Circle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {circles && circles.length > 0 ? (
          circles.map((circle) => (
            <View key={circle.id} style={styles.circleCard}>
              {/* Circle 정보 */}
              <View style={styles.circleInfo}>
                <Text style={styles.circleName}>🎯 {circle.name}</Text>
                <Text style={styles.circleMeta}>
                  👥 {circle.member_count}명 참여중
                </Text>
              </View>

              {/* 초대하기 섹션 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 친구 초대하기</Text>
                <View style={styles.buttonRow}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handleCopyInviteCode(circle.invite_code)}
                    style={styles.actionButton}
                  >
                    초대 코드 복사
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handleShareInviteLink(circle.name, circle.invite_code)}
                    style={styles.actionButton}
                  >
                    공유하기
                  </Button>
                </View>
                <Text style={styles.inviteCode}>
                  코드: {circle.invite_code}
                </Text>
              </View>

              {/* 위험 구역 */}
              <View style={styles.dangerSection}>
                <Text style={styles.dangerTitle}>⚠️ 위험 구역</Text>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => handleLeaveCircle(circle.id, circle.name)}
                >
                  <Text style={styles.dangerButtonText}>Circle 나가기</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            emoji="👥"
            title="참여한 Circle이 없어요"
            description="초대 코드를 받아 Circle에 참여해보세요"
            actionLabel="코드로 참여하기"
            onAction={() => router.push('/join/invite-code')}
          />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  circleCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  circleInfo: {
    marginBottom: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
  },
  circleName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  circleMeta: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
  },
  section: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  inviteCode: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
  },
  dangerSection: {
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[100],
  },
  dangerTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.error[600],
    marginBottom: tokens.spacing.sm,
  },
  dangerButton: {
    paddingVertical: tokens.spacing.sm,
  },
  dangerButtonText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.error[600],
  },
});
