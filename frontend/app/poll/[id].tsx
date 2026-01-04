/**
 * Poll Detail Screen
 *
 * 투표하기 및 결과 보기
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { usePollDetail, useVote } from '../../src/hooks/usePolls';
import { useCircleMembers } from '../../src/hooks/useCircles';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { ResultCard } from '../../src/components/share/ResultCard';
import { tokens } from '../../src/theme';
import { ApiError } from '../../src/types/api';

// 애니메이션 결과 바 컴포넌트
function AnimatedResultBar({ percentage }: { percentage: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(percentage, {
      damping: 15,
      stiffness: 100,
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.resultBarContainer}>
      <Animated.View style={[styles.resultBar, animatedStyle]} />
    </View>
  );
}

export default function PollDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Poll 정보 조회
  const { data: poll, isLoading: pollLoading } = usePollDetail(id);
  const { data: members, isLoading: membersLoading } = useCircleMembers(poll?.circle_id || '');

  // 투표 선택 상태
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 실시간 카운트다운 상태
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 결과 카드 참조 (이미지 캡처용)
  const resultCardRef = React.useRef<View | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 투표하기
  const voteMutation = useVote();

  // 중복 요청 방지를 위한 ref (React 상태보다 빠르게 업데이트)
  const isVotingRef = React.useRef(false);
  // 디버깅용 호출 카운터
  const callCountRef = React.useRef(0);

  const handleVote = async () => {
    // 호출 추적
    callCountRef.current += 1;
    const callId = callCountRef.current;
    console.log(`[Vote] handleVote 호출됨 #${callId}, isVoting: ${isVotingRef.current}, isPending: ${voteMutation.isPending}`);

    // 이미 투표 진행 중이면 무시 (중복 요청 방지)
    if (isVotingRef.current || voteMutation.isPending) {
      console.log(`[Vote] 중복 요청 방지됨 #${callId}`);
      return;
    }

    if (!selectedUserId) {
      Alert.alert('선택 오류', '투표할 친구를 선택해주세요');
      return;
    }

    // 동기적으로 플래그 설정 (React 상태 업데이트보다 빠름)
    isVotingRef.current = true;
    console.log(`[Vote] 투표 시작 #${callId}`);

    try {
      await voteMutation.mutateAsync({
        pollId: id,
        data: { voted_for_id: selectedUserId }
      });

      console.log(`[Vote] 투표 성공 #${callId}`);
      Alert.alert('완료', '투표가 완료되었습니다!');
    } catch (error) {
      console.log(`[Vote] 투표 실패 #${callId}`, error);
      if (error instanceof ApiError) {
        Alert.alert('투표 실패', error.message);
      } else {
        Alert.alert('오류', '투표 중 문제가 발생했습니다');
      }
    } finally {
      // 투표 완료 후 플래그 해제
      isVotingRef.current = false;
      console.log(`[Vote] 투표 완료, 플래그 해제 #${callId}`);
    }
  };

  // 남은 시간 계산 (초 단위 포함)
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

  // 결과 카드 공유
  const handleShareResult = async () => {
    if (!resultCardRef.current || !poll) return;

    try {
      setIsSharing(true);

      // 결과 카드를 이미지로 캡처
      const uri = await captureRef(resultCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // 공유 가능한지 확인
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('오류', '이 기기에서는 공유 기능을 사용할 수 없습니다');
        return;
      }

      // 이미지 공유
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Circly 투표 결과 공유',
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('오류', '결과 공유에 실패했습니다');
    } finally {
      setIsSharing(false);
    }
  };

  // 실시간 카운트다운 타이머
  useEffect(() => {
    if (!poll || poll.status !== 'ACTIVE') return;

    // 초기 시간 설정
    setTimeRemaining(calculateTimeRemaining(poll.ends_at));

    // 1초마다 업데이트
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(poll.ends_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  if (pollLoading || membersLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>투표를 찾을 수 없습니다</Text>
        <Button onPress={() => router.back()}>돌아가기</Button>
      </View>
    );
  }

  // 투표 전 - 투표하기 화면
  if (!poll.has_voted && poll.status === 'ACTIVE') {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 질문 */}
          <View style={styles.questionCard}>
            <Text style={styles.question}>{poll.question_text}</Text>
            <Text style={styles.timeRemaining}>
              ⏰ {timeRemaining}
            </Text>
          </View>

          {/* 멤버 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>친구를 선택해주세요</Text>
            <View style={styles.memberGrid}>
              {members?.map((member) => (
                <TouchableOpacity
                  key={member.user_id}
                  style={[
                    styles.memberCard,
                    selectedUserId === member.user_id && styles.memberCardSelected
                  ]}
                  onPress={() => setSelectedUserId(member.user_id)}
                >
                  <View style={styles.memberCardAvatar}>
                    <Text style={styles.memberCardEmoji}>{member.profile_emoji}</Text>
                  </View>
                  <Text style={styles.memberCardName} numberOfLines={1}>
                    {member.nickname || member.display_name || '익명'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 투표 버튼 */}
          <View style={styles.voteButtonContainer}>
            <Button
              onPress={handleVote}
              loading={voteMutation.isPending}
              disabled={!selectedUserId || voteMutation.isPending}
              fullWidth
            >
              투표하기
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 투표 후 - 결과 보기 화면
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 질문 */}
        <View style={styles.questionCard}>
          <Text style={styles.question}>{poll.question_text}</Text>
          <Text style={styles.resultStatus}>
            {poll.status === 'COMPLETED' ? '✅ 마감됨' : '📊 투표 완료'}
          </Text>
        </View>

        {/* 결과 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            결과 (총 {poll.vote_count}표)
          </Text>

          <View style={styles.resultList}>
            {poll.results?.map((result, index) => (
              <View key={result.user_id} style={styles.resultItem}>
                <View style={styles.resultRank}>
                  <Text style={styles.resultRankText}>
                    {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : `${result.rank}위`}
                  </Text>
                </View>

                <View style={styles.resultAvatar}>
                  <Text style={styles.resultEmoji}>{result.profile_emoji}</Text>
                </View>

                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {result.nickname || '익명'}
                  </Text>

                  {/* 득표율 바 (애니메이션) */}
                  <AnimatedResultBar percentage={result.vote_percentage} />
                </View>

                <View style={styles.resultStats}>
                  <Text style={styles.resultVotes}>{result.vote_count}표</Text>
                  <Text style={styles.resultPercentage}>
                    {result.vote_percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 공유 버튼 */}
        <View style={styles.shareSection}>
          <Button
            variant="secondary"
            onPress={handleShareResult}
            loading={isSharing}
            fullWidth
          >
            📤 결과 공유하기
          </Button>
        </View>
      </ScrollView>

      {/* 결과 카드 (화면 밖에 숨김 - 캡처용) */}
      <View style={styles.hiddenCard}>
        <ResultCard poll={poll} cardRef={resultCardRef} />
      </View>
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
  questionCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  question: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  timeRemaining: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.primary[600],
  },
  resultStatus: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.success[600],
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
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  memberCard: {
    width: '48%',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.neutral[200],
  },
  memberCardSelected: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[500],
  },
  memberCardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  memberCardEmoji: {
    fontSize: 40,
  },
  memberCardName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    textAlign: 'center',
  },
  voteButtonContainer: {
    marginTop: tokens.spacing.lg,
  },
  resultList: {
    gap: tokens.spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  resultRank: {
    width: 40,
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  resultRankText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  resultName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  resultBarContainer: {
    height: 8,
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  resultBar: {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 4,
  },
  resultStats: {
    alignItems: 'flex-end',
  },
  resultVotes: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
  },
  resultPercentage: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
  },
  shareSection: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
  hiddenCard: {
    position: 'absolute',
    left: -10000, // 화면 밖으로 숨김
    top: 0,
  },
});
