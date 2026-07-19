/**
 * Circle Detail Screen
 *
 * Circle 상세 정보 및 멤버 관리
 */
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { logger } from '../../src/utils/logger';
import {
  useCircleDetail,
  useCircleMembers,
  useLeaveCircle,
  useRegenerateInviteCode,
} from '../../src/hooks/useCircles';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { useMyCompletedPolls } from '../../src/hooks/usePolls';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import { useToast } from '../../src/providers/ToastProvider';
import { buildInviteUrl } from '../../src/services/invite/inviteUrl';

export default function CircleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();

  // 현재 사용자 정보
  const { data: currentUser } = useCurrentUser();

  // Circle 정보 및 멤버 조회
  const { data: circle, isLoading: circleLoading } = useCircleDetail(id);
  const { data: members, isLoading: membersLoading } = useCircleMembers(id);

  // 이 Circle의 지난 투표 (완료된 투표 기록)
  const { data: completedPolls } = useMyCompletedPolls();
  const circleCompletedPolls = useMemo(
    () => (completedPolls ?? []).filter((poll) => poll.circle_id === id),
    [completedPolls, id]
  );

  // Circle 나가기
  const leaveMutation = useLeaveCircle();

  // 초대 코드 재생성
  const regenerateCodeMutation = useRegenerateInviteCode();

  // 초대 코드 복사
  const handleCopyInviteCode = async () => {
    if (!circle) return;

    await Clipboard.setStringAsync(circle.invite_code);
    showToast('초대 코드가 복사되었습니다', 'success');
  };

  // 초대 링크 공유
  const handleShareInvite = async () => {
    if (!circle) return;

    try {
      const inviteUrl = buildInviteUrl(circle.invite_link_id);
      await Share.share({
        message: `🎉 Circly에서 익명 칭찬 투표해요!\nCircle: ${circle.name}\n링크: ${inviteUrl}\n코드: ${circle.invite_code}\n\n링크를 누르면 바로 참여할 수 있어요.`,
        url: inviteUrl,
      });
    } catch (error) {
      logger.error('Share failed:', error);
    }
  };

  // 초대 코드 재생성
  const handleRegenerateCode = () => {
    Alert.alert(
      '초대 코드 재생성',
      '새로운 초대 코드를 생성하시겠습니까?\n기존 코드는 사용할 수 없게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '재생성',
          style: 'default',
          onPress: async () => {
            try {
              await regenerateCodeMutation.mutateAsync(id);
              showToast('새로운 초대 코드가 생성되었습니다', 'success');
            } catch (error) {
              showToast('초대 코드 재생성에 실패했습니다', 'error');
            }
          }
        }
      ]
    );
  };

  // Circle 나가기
  const handleLeaveCircle = () => {
    Alert.alert(
      'Circle 나가기',
      '정말 이 Circle을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveMutation.mutateAsync(id);
              showToast('Circle을 나갔습니다', 'success');
              router.back();
            } catch (error) {
              showToast('Circle 나가기에 실패했습니다', 'error');
            }
          }
        }
      ]
    );
  };

  if (circleLoading || membersLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Circle',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  if (!circle) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Circle',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Circle을 찾을 수 없습니다</Text>
          <Button onPress={() => router.back()}>돌아가기</Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: circle.name,
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Circle 정보 */}
        <View style={styles.infoCard}>
          <Text style={styles.circleName}>{circle.name}</Text>
          {circle.description && (
            <Text style={styles.circleDescription}>{circle.description}</Text>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{circle.member_count}</Text>
              <Text style={styles.statLabel}>멤버</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{circle.max_members}</Text>
              <Text style={styles.statLabel}>최대</Text>
            </View>
          </View>
        </View>

        <View style={styles.circleActionSection}>
          <Button
            fullWidth
            onPress={() => router.push(`/vote-session?circleId=${id}` as any)}
            disabled={(circle.active_polls_count ?? 0) === 0}
          >
            이 Circle 투표하기
          </Button>
        </View>

        {/* 초대 코드 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>초대 코드</Text>
          <View style={styles.inviteCard}>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeLabel}>초대 코드</Text>
              <Text style={styles.inviteCode}>{circle.invite_code}</Text>
              <Text style={styles.inviteExpiry}>
                만료: {new Date(circle.invite_code_expires_at).toLocaleString('ko-KR')}
              </Text>
            </View>

            <View style={styles.inviteActions}>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleCopyInviteCode}
              >
                <Text style={styles.inviteButtonText}>📋 복사</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleShareInvite}
              >
                <Text style={styles.inviteButtonText}>📤 공유</Text>
              </TouchableOpacity>
            </View>

            {/* 초대 코드 재생성 (OWNER만 가능) */}
            {currentUser && circle.owner_id === currentUser.id && (
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleRegenerateCode}
                disabled={regenerateCodeMutation.isPending}
              >
                <Text style={styles.regenerateButtonText}>
                  {regenerateCodeMutation.isPending ? '재생성 중...' : '🔄 초대 코드 재생성'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 멤버 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>멤버 ({members?.length || 0}명)</Text>
          <View style={styles.memberList}>
            {members?.map((member) => (
              <View key={member.user_id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberEmoji}>{member.profile_emoji}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.nickname || member.display_name || member.username || '익명'}
                  </Text>
                  {member.role === 'OWNER' && (
                    <Text style={styles.memberRole}>👑 방장</Text>
                  )}
                  {member.role === 'ADMIN' && (
                    <Text style={styles.memberRole}>⭐ 관리자</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 지난 투표 */}
        {circleCompletedPolls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지난 투표 ({circleCompletedPolls.length})</Text>
            <View style={styles.pollList}>
              {circleCompletedPolls.map((poll) => (
                <TouchableOpacity
                  key={poll.id}
                  style={styles.pollItem}
                  onPress={() => router.push(`/results/${poll.id}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel={`${poll.question} 결과 보기`}
                >
                  <View style={styles.pollInfo}>
                    <Text style={styles.pollQuestion} numberOfLines={1}>
                      {poll.emoji ? `${poll.emoji} ` : ''}
                      {poll.question}
                    </Text>
                    <Text style={styles.pollMeta}>
                      1위 {poll.winner_name || '알 수 없음'} · {poll.winner_vote_count || 0}표
                    </Text>
                  </View>
                  <Text style={styles.pollArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Circle 나가기 */}
        <View style={styles.dangerZone}>
          <Button
            variant="ghost"
            onPress={handleLeaveCircle}
            fullWidth
          >
            Circle 나가기
          </Button>
        </View>
        </ScrollView>
      </View>
    </>
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
    infoCard: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
      marginBottom: tokens.spacing.lg,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    circleName: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      marginBottom: tokens.spacing.sm,
      textAlign: 'center',
    },
    circleDescription: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: tokens.spacing.lg,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: tokens.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    statLabel: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
      marginTop: tokens.spacing.xs,
    },
    section: {
      marginBottom: tokens.spacing.lg,
    },
    circleActionSection: {
      gap: tokens.spacing.sm,
      marginBottom: tokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.md,
    },
    inviteCard: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    inviteCodeContainer: {
      alignItems: 'center',
      paddingTop: tokens.spacing.sm,
      marginBottom: tokens.spacing.md,
    },
    inviteCodeLabel: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
      marginBottom: tokens.spacing.sm,
    },
    inviteCode: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.primary[isDark ? 400 : 600],
      letterSpacing: 4,
      lineHeight: tokens.typography.fontSize['3xl'] * 1.3,
      marginBottom: tokens.spacing.xs,
    },
    inviteExpiry: {
      fontSize: tokens.typography.fontSize.xs,
      color: theme.textTertiary,
    },
    inviteActions: {
      flexDirection: 'row',
      gap: tokens.spacing.sm,
    },
    inviteButton: {
      flex: 1,
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.borderRadius.md,
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      borderWidth: 1,
      borderColor: isDark ? tokens.colors.primary[700] : tokens.colors.primary[200],
      alignItems: 'center',
    },
    inviteButtonText: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 400 : 700],
    },
    regenerateButton: {
      marginTop: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.borderRadius.md,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    regenerateButtonText: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    memberList: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      overflow: 'hidden',
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.md,
    },
    memberEmoji: {
      fontSize: 24,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    memberRole: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 600],
      marginTop: tokens.spacing.xs,
    },
    pollList: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      overflow: 'hidden',
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    pollItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    pollInfo: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    pollQuestion: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    pollMeta: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    pollArrow: {
      marginLeft: tokens.spacing.sm,
      fontSize: 24,
      color: theme.textTertiary,
    },
    dangerZone: {
      marginTop: tokens.spacing.lg,
      marginBottom: tokens.spacing.xl,
    },
    errorText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      marginBottom: tokens.spacing.lg,
      textAlign: 'center',
    },
  });
