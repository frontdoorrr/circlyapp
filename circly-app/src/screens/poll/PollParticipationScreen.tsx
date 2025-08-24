/**
 * 투표 참여 화면
 * PRD 01-anonymous-voting-detailed.md의 투표 참여 플로우 구현
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePoll, usePollParticipation, useVotePoll } from '../../hooks/usePolls';
import type { PollOption } from '../../types/poll';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  pollId: string; // UUID
  circleId: number;
  circleName: string;
}

export const PollParticipationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId, circleId, circleName } = route.params as RouteParams;

  // 상태 관리
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<PollOption[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [showingAnimation, setShowingAnimation] = useState(false);

  // 애니메이션 참조
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartTranslateX = useRef(new Animated.Value(0)).current;
  const heartTranslateY = useRef(new Animated.Value(0)).current;
  const heartRotate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // 데이터 페칭
  const { data: poll, isLoading: pollLoading, error: pollError } = usePoll(pollId);
  const { data: participation, isLoading: participationLoading } = usePollParticipation(pollId);
  
  // 투표 제출 mutation
  const voteMutation = useVotePoll();

  // 투표 마감 시간 확인
  const isExpired = poll?.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const canVote = poll?.is_active && !isExpired && !participation?.has_voted;

  // 옵션 섞기 함수
  const shuffleOptions = useCallback(() => {
    if (!poll?.options) return;
    const shuffled = [...poll.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
  }, [poll?.options]);

  // 초기 옵션 섞기
  React.useEffect(() => {
    if (poll?.options && shuffledOptions.length === 0) {
      setShuffledOptions(poll.options);
    }
  }, [poll?.options, shuffledOptions.length]);

  // Skip 함수 (다음 질문으로)
  const handleSkip = useCallback(() => {
    Alert.alert(
      '질문 건너뛰기',
      '이 질문을 건너뛰고 다른 질문으로 이동할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '건너뛰기',
          onPress: () => {
            // TODO: 다음 질문으로 이동하는 로직 구현
            navigation.goBack();
          }
        }
      ]
    );
  }, [navigation]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 선택지 선택 처리
  const handleOptionSelect = useCallback((optionId: number) => {
    if (!canVote) return;
    setSelectedOptionId(optionId);
  }, [canVote]);

  // 하트 애니메이션 실행
  const playHeartAnimation = useCallback(() => {
    setShowingAnimation(true);

    // 1단계: 하트 생성 (Scale + Opacity)
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.2,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // 2단계: 하트 정상 크기로
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
      
      // 3단계: 하트 날아가기
      Animated.parallel([
        Animated.timing(heartTranslateX, {
          toValue: screenWidth * 0.7,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(heartTranslateY, {
          toValue: -100,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(heartRotate, {
          toValue: 4, // 360도 * 4 = 1440도 회전
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 애니메이션 완료 후 결과 화면으로 이동
      setTimeout(() => {
        setShowingAnimation(false);
        navigation.navigate('PollResults', {
          pollId: poll!.id,
          circleId,
          circleName
        });
      }, 800);
    });
  }, [heartScale, heartOpacity, heartTranslateX, heartTranslateY, heartRotate, navigation, poll, circleId, circleName]);

  // 투표 제출
  const handleSubmitVote = useCallback(async () => {
    if (!selectedOptionId || !poll || isVoting) return;

    setIsVoting(true);
    
    // 카드 선택 애니메이션
    Animated.spring(cardScale, {
      toValue: 1.05,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    try {
      await voteMutation.mutateAsync({
        pollId: poll.id,
        voteData: { option_id: selectedOptionId }
      });

      // 성공 시 하트 애니메이션 실행
      playHeartAnimation();

    } catch (error) {
      setIsVoting(false);
      
      // 카드 원래 크기로 복구
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }).start();

      Alert.alert(
        '투표 실패',
        error instanceof Error ? error.message : '투표 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    }
  }, [selectedOptionId, poll, voteMutation, isVoting, cardScale, playHeartAnimation]);

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
        {/* Gas 앱 스타일 질문 섹션 */}
        <View style={styles.questionSection}>
          <View style={styles.questionEmojiContainer}>
            <Text style={styles.questionEmoji}>❓</Text>
          </View>
          <Text style={styles.questionTitle}>{poll.question_template}</Text>
          
          {/* 상태 및 시간 정보 */}
          <View style={styles.questionMeta}>
            {participation?.has_voted ? (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.statusText}>투표 완료</Text>
              </View>
            ) : isExpired ? (
              <View style={[styles.statusBadge, styles.expiredBadge]}>
                <Ionicons name="time-outline" size={16} color="#ef4444" />
                <Text style={[styles.statusText, styles.expiredText]}>투표 마감</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <Ionicons name="time-outline" size={16} color="#667eea" />
                <Text style={[styles.statusText, styles.activeText]}>
                  {formatTimeRemaining() || '진행 중'}
                </Text>
              </View>
            )}
            
            <Text style={styles.voteMetaText}>
              총 {poll.total_votes}표 · {poll.options.length}개 선택지
            </Text>
          </View>

          {/* Skip/Shuffle 버튼 (Gas 앱 스타일) */}
          {canVote && (
            <View style={styles.actionButtonsContainer}>
              <Pressable 
                style={styles.actionButton}
                onPress={handleSkip}
                android_ripple={{ color: 'rgba(102, 126, 234, 0.1)' }}
              >
                <Ionicons name="play-skip-forward" size={18} color="#667eea" />
                <Text style={styles.actionButtonText}>Skip</Text>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={shuffleOptions}
                android_ripple={{ color: 'rgba(102, 126, 234, 0.1)' }}
              >
                <Ionicons name="shuffle" size={18} color="#667eea" />
                <Text style={styles.actionButtonText}>Shuffle</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Gas 앱 스타일 옵션 카드 */}
        <View style={styles.optionsGrid}>
          {shuffledOptions.map((option: PollOption) => {
            const isSelected = selectedOptionId === option.id;
            const isUserVoted = participation?.has_voted && participation.selected_option_id === option.id;
            
            return (
              <Animated.View
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && { transform: [{ scale: cardScale }] }
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCardInner,
                    isSelected && styles.selectedCard,
                    isUserVoted && styles.votedCard,
                    !canVote && styles.disabledCard,
                    pressed && styles.pressedCard
                  ]}
                  onPress={() => handleOptionSelect(option.id)}
                  disabled={!canVote}
                  android_ripple={{ 
                    color: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(102, 126, 234, 0.1)',
                    borderless: false
                  }}
                >
                {/* 카드 그라디언트 배경 */}
                {isSelected && canVote && (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                
                {isUserVoted && (
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}

                <View style={styles.optionCardContent}>
                  {/* 옵션 텍스트 */}
                  <Text style={[
                    styles.optionCardText,
                    isSelected && canVote && styles.selectedCardText,
                    isUserVoted && styles.votedCardText,
                    !canVote && styles.disabledCardText
                  ]} numberOfLines={3}>
                    {option.text}
                  </Text>

                  {/* 선택/투표 상태 표시 */}
                  <View style={styles.cardStatusContainer}>
                    {isSelected && canVote && (
                      <View style={styles.cardSelectedIndicator}>
                        <Ionicons name="checkmark-circle" size={28} color="white" />
                      </View>
                    )}
                    
                    {isUserVoted && (
                      <View style={styles.cardVotedIndicator}>
                        <Ionicons name="checkmark-circle" size={28} color="white" />
                      </View>
                    )}

                    {/* 투표 수 (결과 공개 시) */}
                    {participation?.has_voted && (
                      <View style={styles.cardVoteCount}>
                        <Text style={styles.cardVoteCountText}>{option.vote_count}표</Text>
                      </View>
                    )}
                  </View>
                </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* 하트 애니메이션 오버레이 */}
      {showingAnimation && (
        <View style={styles.heartAnimationOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.heartContainer,
              {
                transform: [
                  { translateX: heartTranslateX },
                  { translateY: heartTranslateY },
                  { scale: heartScale },
                  {
                    rotate: heartRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: heartOpacity,
              },
            ]}
          >
            <Text style={styles.heartEmoji}>💖</Text>
          </Animated.View>
        </View>
      )}

      {/* 하단 액션 버튼 */}
      {canVote && selectedOptionId && (
        <View style={styles.bottomAction}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              voteMutation.isPending && styles.submitButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleSubmitVote}
            disabled={isVoting}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.submitButtonText}>
              {isVoting ? '투표 중...' : '투표하기'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
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
    backgroundColor: '#fafafa', // --gray-50
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5', // --gray-200
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
    color: '#171717', // --gray-900
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#525252', // --gray-600
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  
  // Gas 앱 스타일 질문 섹션
  questionSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24, // --radius-2xl
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questionEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4ff', // --primary-50
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionEmoji: {
    fontSize: 40,
  },
  questionTitle: {
    fontSize: 24, // --text-2xl
    fontWeight: '700', // --font-bold
    color: '#171717', // --gray-900
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  questionMeta: {
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, // --radius-full
    backgroundColor: '#f0fdf4', // --success-50
    gap: 6,
  },
  expiredBadge: {
    backgroundColor: '#fef2f2', // --error-50
  },
  activeBadge: {
    backgroundColor: '#f3f4ff', // --primary-50
  },
  statusText: {
    fontSize: 14, // --text-sm
    fontWeight: '600', // --font-semibold
    color: '#22c55e', // --success-500
  },
  expiredText: {
    color: '#ef4444', // --error-500
  },
  activeText: {
    color: '#667eea', // --primary-500
  },
  voteMetaText: {
    fontSize: 14, // --text-sm
    color: '#737373', // --gray-500
    fontWeight: '500', // --font-medium
  },
  
  // Skip/Shuffle 버튼
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16, // --radius-lg
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e5e5', // --gray-200
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14, // --text-sm
    fontWeight: '600', // --font-semibold
    color: '#667eea', // --primary-500
  },
  
  // 옵션 카드 그리드
  optionsGrid: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionCard: {
    width: (screenWidth - 48) / 2, // 2열 그리드
    minHeight: 140,
  },
  optionCardInner: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20, // --radius-xl
    borderWidth: 2,
    borderColor: '#e5e5e5', // --gray-200
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#667eea', // --primary-500
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  votedCard: {
    borderColor: '#22c55e', // --success-500
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
  },
  optionCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  optionCardText: {
    fontSize: 16, // --text-base
    fontWeight: '600', // --font-semibold
    color: '#171717', // --gray-900
    lineHeight: 22,
    textAlign: 'center',
    flex: 1,
  },
  selectedCardText: {
    color: 'white',
  },
  votedCardText: {
    color: 'white',
  },
  disabledCardText: {
    color: '#a3a3a3', // --gray-400
  },
  cardStatusContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  cardSelectedIndicator: {
    marginBottom: 4,
  },
  cardVotedIndicator: {
    marginBottom: 4,
  },
  cardVoteCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12, // --radius-md
  },
  cardVoteCountText: {
    fontSize: 12, // --text-xs
    fontWeight: '600', // --font-semibold
    color: 'white',
  },
  
  // 하트 애니메이션 스타일
  heartAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 60,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#525252', // --gray-600
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
    color: '#ef4444', // --error-500
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#f5f5f5', // --gray-100
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12, // --radius-md
  },
  backButtonText: {
    fontSize: 16,
    color: '#404040', // --gray-700
    fontWeight: '600',
  },
  bottomAction: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5', // --gray-200
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20, // --radius-xl
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700', // --font-bold
    color: 'white',
    marginRight: 8,
  },
  resultsButton: {
    backgroundColor: '#f5f5f5', // --gray-100
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20, // --radius-xl
    borderWidth: 2,
    borderColor: '#667eea', // --primary-500
  },
  resultsButtonText: {
    fontSize: 16,
    fontWeight: '700', // --font-bold
    color: '#667eea', // --primary-500
    marginRight: 8,
  },
});