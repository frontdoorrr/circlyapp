/**
 * 투표 참여 화면
 * PRD 01-anonymous-voting-detailed.md의 투표 참여 플로우 구현
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePoll, usePollParticipation, useVotePoll } from '../../hooks/usePolls';
import type { PollOption } from '../../types/poll';

interface RouteParams {
  pollId: number;
  circleId: number;
  circleName: string;
}

export const PollParticipationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId, circleId, circleName } = route.params as RouteParams;

  // 상태 관리
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  // 데이터 페칭
  const { data: poll, isLoading: pollLoading, error: pollError } = usePoll(pollId);
  const { data: participation, isLoading: participationLoading } = usePollParticipation(pollId);
  
  // 투표 제출 mutation
  const voteMutation = useVotePoll();

  // 투표 마감 시간 확인
  const isExpired = poll?.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const canVote = poll?.is_active && !isExpired && !participation?.has_voted;

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 선택지 선택 처리
  const handleOptionSelect = useCallback((optionId: number) => {
    if (!canVote) return;
    setSelectedOptionId(optionId);
  }, [canVote]);

  // 투표 제출
  const handleSubmitVote = useCallback(async () => {
    if (!selectedOptionId || !poll) return;

    try {
      await voteMutation.mutateAsync({
        pollId: poll.id,
        voteData: { option_id: selectedOptionId }
      });

      Alert.alert(
        '투표 완료',
        '투표가 성공적으로 제출되었습니다!',
        [
          {
            text: '결과 보기',
            onPress: () => navigation.navigate('PollResults', {
              pollId: poll.id,
              circleId,
              circleName
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        '투표 실패',
        error instanceof Error ? error.message : '투표 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    }
  }, [selectedOptionId, poll, voteMutation, navigation, circleId, circleName]);

  // 결과 보기
  const handleViewResults = useCallback(() => {
    if (!poll) return;
    
    navigation.navigate('PollResults', {
      pollId: poll.id,
      circleId,
      circleName
    });
  }, [poll, navigation, circleId, circleName]);

  // 로딩 상태
  if (pollLoading || participationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>투표를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (pollError || !poll) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>투표를 불러올 수 없습니다.</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 시간 포맷팅
  const formatTimeRemaining = () => {
    if (!poll.expires_at || isExpired) return null;
    
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 남음`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 남음`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분 남음`;
    } else {
      return '곧 마감';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.headerButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>투표 참여</Text>
          <Text style={styles.headerSubtitle}>{circleName}</Text>
        </View>

        {participation?.has_voted && (
          <TouchableOpacity 
            onPress={handleViewResults}
            style={styles.headerButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="bar-chart" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 투표 정보 */}
        <View style={styles.pollInfo}>
          <Text style={styles.pollTitle}>{poll.title}</Text>
          {poll.description && (
            <Text style={styles.pollDescription}>{poll.description}</Text>
          )}
        </View>

        {/* 질문 */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{poll.question_template}</Text>
        </View>

        {/* 상태 정보 */}
        <View style={styles.statusContainer}>
          {participation?.has_voted ? (
            <View style={styles.votedStatus}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.votedText}>투표 완료</Text>
            </View>
          ) : isExpired ? (
            <View style={styles.expiredStatus}>
              <Ionicons name="time-outline" size={20} color="#DC3545" />
              <Text style={styles.expiredText}>투표 마감</Text>
            </View>
          ) : (
            <View style={styles.activeStatus}>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
              <Text style={styles.activeText}>
                {formatTimeRemaining() || '진행 중'}
              </Text>
            </View>
          )}

          <View style={styles.statsInfo}>
            <Text style={styles.statsText}>
              총 {poll.total_votes}표 · {poll.options.length}개 선택지
            </Text>
            {poll.is_anonymous && (
              <Text style={styles.anonymousText}>익명 투표</Text>
            )}
          </View>
        </View>

        {/* 선택지 */}
        <View style={styles.optionsContainer}>
          {poll.options.map((option: PollOption) => {
            const isSelected = selectedOptionId === option.id;
            const isUserVoted = participation?.has_voted && participation.selected_option_id === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  isSelected && styles.selectedOption,
                  isUserVoted && styles.userVotedOption,
                  !canVote && styles.disabledOption
                ]}
                onPress={() => handleOptionSelect(option.id)}
                disabled={!canVote}
                activeOpacity={0.8}
              >
                {isSelected && canVote && (
                  <LinearGradient
                    colors={['rgba(0, 122, 255, 0.1)', 'rgba(0, 122, 255, 0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                
                {isUserVoted && (
                  <LinearGradient
                    colors={['rgba(40, 167, 69, 0.1)', 'rgba(40, 167, 69, 0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}

                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    isSelected && canVote && styles.selectedOptionText,
                    isUserVoted && styles.userVotedOptionText,
                    !canVote && styles.disabledOptionText
                  ]}>
                    {option.text}
                  </Text>

                  {/* 선택 표시 */}
                  {isSelected && canVote && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    </View>
                  )}
                  
                  {/* 사용자 투표 표시 */}
                  {isUserVoted && (
                    <View style={styles.votedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color="#28A745" />
                    </View>
                  )}

                  {/* 투표 수 (결과 공개 시) */}
                  {participation?.has_voted && (
                    <View style={styles.voteCount}>
                      <Text style={styles.voteCountText}>{option.vote_count}표</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      {canVote && selectedOptionId && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              voteMutation.isPending && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitVote}
            disabled={voteMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {voteMutation.isPending ? '투표 중...' : '투표하기'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 결과 보기 버튼 (투표 완료 시) */}
      {participation?.has_voted && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.resultsButton}
            onPress={handleViewResults}
            activeOpacity={0.8}
          >
            <Text style={styles.resultsButtonText}>투표 결과 보기</Text>
            <Ionicons name="bar-chart" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  pollInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pollTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  pollDescription: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
    lineHeight: 24,
  },
  questionContainer: {
    backgroundColor: '#F8F9FA',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    lineHeight: 26,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  votedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  votedText: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },
  expiredStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiredText: {
    fontSize: 14,
    color: '#DC3545',
    fontWeight: '600',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  statsInfo: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  anonymousText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 2,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: '#007AFF',
  },
  userVotedOption: {
    borderColor: '#28A745',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginRight: 12,
  },
  selectedOptionText: {
    color: '#007AFF',
  },
  userVotedOptionText: {
    color: '#28A745',
  },
  disabledOptionText: {
    color: '#ADB5BD',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  votedIndicator: {
    marginLeft: 8,
  },
  voteCount: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  voteCountText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },
  bottomAction: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  resultsButton: {
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  resultsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
});