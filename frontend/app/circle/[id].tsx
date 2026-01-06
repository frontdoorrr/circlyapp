/**
 * Circle Detail Screen
 *
 * Circle 상세 정보 및 멤버 관리
 */
import React, { useState } from 'react';
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
import {
  useCircleDetail,
  useCircleMembers,
  useLeaveCircle,
  useRegenerateInviteCode,
} from '../../src/hooks/useCircles';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { tokens } from '../../src/theme';

export default function CircleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // 현재 사용자 정보
  const { data: currentUser } = useCurrentUser();

  // Circle 정보 및 멤버 조회
  const { data: circle, isLoading: circleLoading } = useCircleDetail(id);
  const { data: members, isLoading: membersLoading } = useCircleMembers(id);

  // Circle 나가기
  const leaveMutation = useLeaveCircle();

  // 초대 코드 재생성
  const regenerateCodeMutation = useRegenerateInviteCode();

  // 초대 코드 복사
  const handleCopyInviteCode = async () => {
    if (!circle) return;

    await Clipboard.setStringAsync(circle.invite_code);
    Alert.alert('복사 완료', '초대 코드가 복사되었습니다');
  };

  // 초대 링크 공유
  const handleShareInvite = async () => {
    if (!circle) return;

    try {
      await Share.share({
        message: `${circle.name}에 초대합니다!\n초대 코드: ${circle.invite_code}\n\nCircly 앱에서 코드를 입력하고 참여하세요!`,
      });
    } catch (error) {
      console.error('Share failed:', error);
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
              Alert.alert('완료', '새로운 초대 코드가 생성되었습니다');
            } catch (error) {
              Alert.alert('오류', '초대 코드 재생성에 실패했습니다');
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
              Alert.alert('완료', 'Circle을 나갔습니다');
              router.back();
            } catch (error) {
              Alert.alert('오류', 'Circle 나가기에 실패했습니다');
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
  infoCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  circleName: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  circleDescription: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    marginTop: tokens.spacing.xs,
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
  inviteCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  inviteCodeContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  inviteCodeLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.xs,
  },
  inviteCode: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    letterSpacing: 4,
    marginBottom: tokens.spacing.xs,
  },
  inviteExpiry: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500],
  },
  inviteActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  inviteButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.primary[50],
    borderWidth: 1,
    borderColor: tokens.colors.primary[200],
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
  },
  regenerateButton: {
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.neutral[100],
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    alignItems: 'center',
  },
  regenerateButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[700],
  },
  memberList: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[100],
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.primary[50],
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
    color: tokens.colors.neutral[900],
  },
  memberRole: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
    marginTop: tokens.spacing.xs,
  },
  dangerZone: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
});
