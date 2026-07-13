/**
 * Poll Detail Screen
 *
 * 투표하기 전용 화면. 결과는 /results/[id]로 정본화한다.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { usePollDetail, useVote } from '../../src/hooks/usePolls';
import { useCircleMembers } from '../../src/hooks/useCircles';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import { ApiError } from '../../src/types/api';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { VoteCard, VoteOption } from '../../src/components/patterns/VoteCard';
import { VoteCelebration } from '../../src/components/patterns/VoteCelebration';
import type { MemberInfo } from '../../src/types/circle';
import { useToast } from '../../src/providers/ToastProvider';

function sampleMembers(members: MemberInfo[], count = 4): MemberInfo[] {
  const shuffled = [...members];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export default function PollDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();

  const { data: currentUser } = useCurrentUser();
  const { data: poll, isLoading: pollLoading } = usePollDetail(id);
  const { data: members, isLoading: membersLoading } = useCircleMembers(poll?.circle_id || '');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MemberInfo[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const voteMutation = useVote();
  const isVotingRef = React.useRef(false);
  const isRedirectingToResults = Boolean(poll && !showCelebration && (poll.has_voted || poll.status !== 'ACTIVE'));

  const eligibleMembers = useMemo(
    () => (members ?? []).filter((member) => member.user_id !== currentUser?.id),
    [members, currentUser?.id]
  );
  const canShuffle = eligibleMembers.length > 4;

  useEffect(() => {
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(null);
  }, [eligibleMembers]);

  useEffect(() => {
    if (!poll || poll.status !== 'ACTIVE') return;

    const calculateTimeRemaining = (endsAt: string): string => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) return '마감됨';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}일 ${hours}시간 남음`;
      }

      if (hours > 0) {
        return `${hours}시간 ${minutes}분 ${seconds}초`;
      }

      if (minutes > 0) {
        return `${minutes}분 ${seconds}초`;
      }

      return `${seconds}초`;
    };

    setTimeRemaining(calculateTimeRemaining(poll.ends_at));
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(poll.ends_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    if (isRedirectingToResults) {
      router.replace(`/results/${id}` as any);
    }
  }, [id, isRedirectingToResults, router]);

  const voteOptions: VoteOption[] = candidates.map((member) => ({
    id: member.user_id,
    name: member.nickname || member.display_name || member.username || '익명',
    emoji: member.profile_emoji,
  }));

  const handleShuffle = () => {
    if (!canShuffle) return;
    Haptics.selectionAsync();
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(null);
  };

  const handleVote = async () => {
    if (isVotingRef.current || voteMutation.isPending) return;

    if (!selectedUserId) {
      showToast('투표할 친구를 선택해주세요', 'error');
      return;
    }

    isVotingRef.current = true;

    try {
      await voteMutation.mutateAsync({
        pollId: id,
        data: { voted_for_id: selectedUserId },
      });

      setShowCelebration(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('투표 중 문제가 발생했습니다', 'error');
      }
    } finally {
      isVotingRef.current = false;
    }
  };

  if (pollLoading || membersLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  if (!poll) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>투표를 찾을 수 없습니다</Text>
          <Button onPress={() => router.back()}>돌아가기</Button>
        </View>
      </>
    );
  }

  if (isRedirectingToResults) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '투표하기',
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.voteProgress}>
            <Text style={styles.voteProgressText}>1 / 1</Text>
            <Text style={styles.timeRemaining}>⏰ {timeRemaining}</Text>
          </View>

          <VoteCard
            question={poll.question_text}
            options={voteOptions}
            selectedId={selectedUserId ?? undefined}
            onSelect={setSelectedUserId}
            disabled={voteMutation.isPending}
          />

          <View style={styles.voteButtonContainer}>
            <View style={styles.voteActions}>
              <Button variant="ghost" onPress={() => router.back()}>
                건너뛰기
              </Button>
              <Button
                variant="secondary"
                onPress={handleShuffle}
                disabled={!canShuffle || voteMutation.isPending}
              >
                섞기
              </Button>
            </View>
            <Button
              onPress={handleVote}
              loading={voteMutation.isPending}
              disabled={!selectedUserId || voteMutation.isPending}
              fullWidth
            >
              선택 완료
            </Button>
          </View>
        </ScrollView>

        {showCelebration && (
          <VoteCelebration
            onComplete={() => router.replace(`/results/${id}` as any)}
          />
        )}
      </View>
    </>
  );
}

const createStyles = (theme: Theme) =>
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
    voteButtonContainer: {
      marginTop: tokens.spacing.lg,
      gap: tokens.spacing.md,
    },
    voteActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    voteProgress: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.md,
    },
    voteProgressText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.textSecondary,
    },
    timeRemaining: {
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.primary[600],
    },
    errorText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      marginBottom: tokens.spacing.lg,
      textAlign: 'center',
    },
  });
