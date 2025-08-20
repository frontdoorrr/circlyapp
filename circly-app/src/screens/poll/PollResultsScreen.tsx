/**
 * 투표 결과 화면
 * PRD 01-anonymous-voting-detailed.md의 투표 결과 표시 UI 구현
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePoll, usePollParticipation, useVoteResults } from '../../hooks/usePolls';
import type { PollOption, VoteResult } from '../../types/poll';

interface RouteParams {
  pollId: number;
  circleId: number;
  circleName: string;
}

interface AnimatedBarProps {
  percentage: number;
  color: string;
  delay?: number;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({ 
  percentage, 
  color, 
  delay = 0 
}) => {
  const animatedWidth = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 1000,
      delay,
      useNativeDriver: false,
    }).start();
  }, [percentage, delay]);

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[
        styles.progressBar,
        {
          backgroundColor: color,
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }
      ]} />
    </View>
  );
};

export const PollResultsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId, circleId, circleName } = route.params as RouteParams;

  // 데이터 페칭
  const { data: poll, isLoading: pollLoading, error: pollError } = usePoll(pollId);
  const { data: participation, isLoading: participationLoading } = usePollParticipation(pollId);
  const { data: voteResults = [], isLoading: resultsLoading } = useVoteResults(pollId);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 공유하기 (추후 구현)
  const handleShare = useCallback(() => {
    // TODO: 결과 카드 생성 및 공유 기능 구현
    console.log('Share poll results');
  }, []);

  // 로딩 상태
  if (pollLoading || participationLoading || resultsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>결과를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (pollError || !poll) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>결과를 불러올 수 없습니다.</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 결과 데이터 처리
  const processedOptions = poll.options.map((option: PollOption) => {
    const result = voteResults.find(r => r.option_id === option.id);
    return {
      ...option,
      vote_count: result?.vote_count || option.vote_count || 0,
      percentage: result?.percentage || 0,
    };
  });

  // 가장 많이 받은 투표 수
  const maxVotes = Math.max(...processedOptions.map(o => o.vote_count));

  // 색상 배열
  const colors = ['#007AFF', '#28A745', '#FF6B6B', '#FFC107', '#17A2B8', '#6F42C1'];

  // 투표 마감 시간 확인
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const isActive = poll.is_active && !isExpired;

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
          <Text style={styles.headerTitle}>투표 결과</Text>
          <Text style={styles.headerSubtitle}>{circleName}</Text>
        </View>

        <TouchableOpacity 
          onPress={handleShare}
          style={styles.headerButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
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

        {/* 투표 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{poll.total_votes}</Text>
            <Text style={styles.statLabel}>총 투표수</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{poll.options.length}</Text>
            <Text style={styles.statLabel}>선택지</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[
              styles.statNumber,
              { color: isActive ? '#28A745' : '#DC3545' }
            ]}>
              {isActive ? '진행중' : '마감'}
            </Text>
            <Text style={styles.statLabel}>상태</Text>
          </View>
        </View>

        {/* 결과 목록 */}
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>투표 결과</Text>
          
          {processedOptions.map((option, index) => {
            const isUserVoted = participation?.selected_option_id === option.id;
            const isWinner = option.vote_count === maxVotes && maxVotes > 0;
            const color = colors[index % colors.length];

            return (
              <View 
                key={option.id} 
                style={[
                  styles.resultItem,
                  isUserVoted && styles.userVotedResult,
                  isWinner && styles.winnerResult
                ]}
              >
                {/* 배경 그라데이션 (사용자 투표 시) */}
                {isUserVoted && (
                  <LinearGradient
                    colors={['rgba(40, 167, 69, 0.1)', 'rgba(40, 167, 69, 0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}

                {/* 우승자 배경 */}
                {isWinner && !isUserVoted && (
                  <LinearGradient
                    colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}

                <View style={styles.resultHeader}>
                  <View style={styles.resultInfo}>
                    <Text style={[
                      styles.optionText,
                      isUserVoted && styles.userVotedOptionText,
                      isWinner && styles.winnerOptionText
                    ]}>
                      {option.text}
                    </Text>
                    
                    <View style={styles.resultStats}>
                      <Text style={styles.voteCount}>
                        {option.vote_count}표
                      </Text>
                      <Text style={styles.percentage}>
                        ({option.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                  </View>

                  {/* 표시 아이콘 */}
                  <View style={styles.indicators}>
                    {isWinner && (
                      <View style={styles.winnerBadge}>
                        <Ionicons name="trophy" size={16} color="#FFD700" />
                      </View>
                    )}
                    
                    {isUserVoted && (
                      <View style={styles.userVoteBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#28A745" />
                      </View>
                    )}
                  </View>
                </View>

                {/* 진행률 바 */}
                <AnimatedBar
                  percentage={option.percentage}
                  color={color}
                  delay={index * 200}
                />
              </View>
            );
          })}
        </View>

        {/* 투표 정보 */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#6C757D" />
            <Text style={styles.infoText}>
              {new Date(poll.created_at).toLocaleString('ko-KR')} 시작
            </Text>
          </View>
          
          {poll.expires_at && (
            <View style={styles.infoItem}>
              <Ionicons name="alarm-outline" size={16} color="#6C757D" />
              <Text style={styles.infoText}>
                {new Date(poll.expires_at).toLocaleString('ko-KR')} 마감
              </Text>
            </View>
          )}
          
          {poll.is_anonymous && (
            <View style={styles.infoItem}>
              <Ionicons name="eye-off-outline" size={16} color="#6C757D" />
              <Text style={styles.infoText}>익명 투표</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  userVotedResult: {
    borderColor: '#28A745',
  },
  winnerResult: {
    borderColor: '#FFD700',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  userVotedOptionText: {
    color: '#28A745',
  },
  winnerOptionText: {
    color: '#FF8C00',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
  },
  percentage: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerBadge: {
    backgroundColor: '#FFF8DC',
    padding: 6,
    borderRadius: 12,
  },
  userVoteBadge: {
    padding: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
});