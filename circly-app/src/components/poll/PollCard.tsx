/**
 * 투표 카드 컴포넌트
 * PRD 01-anonymous-voting-detailed.md의 투표 표시 UI 구현
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PollResponse } from '../../types/poll';

interface PollCardProps {
  poll: PollResponse;
  onPress: (poll: PollResponse) => void;
  showStatus?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onPress,
  showStatus = true
}) => {
  // 투표 마감 시간 확인
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const isActive = poll.is_active && !isExpired;

  // 투표 상태에 따른 색상
  const getStatusColor = () => {
    if (poll.user_voted) return '#28A745'; // 참여 완료 - 초록색
    if (!isActive) return '#6C757D'; // 비활성/마감 - 회색
    return '#007AFF'; // 활성/참여 가능 - 파란색
  };

  // 투표 상태 텍스트
  const getStatusText = () => {
    if (poll.user_voted) return '참여 완료';
    if (!isActive && isExpired) return '마감됨';
    if (!isActive) return '비활성';
    return '참여 가능';
  };

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
    <TouchableOpacity
      style={[
        styles.container,
        !isActive && styles.inactiveContainer,
        poll.user_voted && styles.votedContainer
      ]}
      onPress={() => onPress(poll)}
      activeOpacity={0.8}
      disabled={!isActive && !poll.user_voted} // 비활성이고 투표하지 않았으면 비활성화
    >
      {/* 배경 그라데이션 (참여 완료시) */}
      {poll.user_voted && (
        <LinearGradient
          colors={['rgba(40, 167, 69, 0.1)', 'rgba(40, 167, 69, 0.05)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title,
              !isActive && styles.inactiveText
            ]}>
              {poll.title}
            </Text>
            {poll.description && (
              <Text style={[
                styles.description,
                !isActive && styles.inactiveText
              ]}>
                {poll.description}
              </Text>
            )}
          </View>

          {/* 상태 배지 */}
          {showStatus && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>

        {/* 질문 템플릿 */}
        <View style={styles.questionContainer}>
          <Text style={[
            styles.questionText,
            !isActive && styles.inactiveText
          ]}>
            {poll.question_template}
          </Text>
        </View>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          {/* 투표 통계 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons 
                name="people-outline" 
                size={16} 
                color={!isActive ? '#ADB5BD' : '#6C757D'} 
              />
              <Text style={[
                styles.statText,
                !isActive && styles.inactiveText
              ]}>
                {poll.total_votes}표
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons 
                name="options-outline" 
                size={16} 
                color={!isActive ? '#ADB5BD' : '#6C757D'} 
              />
              <Text style={[
                styles.statText,
                !isActive && styles.inactiveText
              ]}>
                {poll.options.length}개 선택지
              </Text>
            </View>

            {poll.is_anonymous && (
              <View style={styles.statItem}>
                <Ionicons 
                  name="eye-off-outline" 
                  size={16} 
                  color={!isActive ? '#ADB5BD' : '#6C757D'} 
                />
                <Text style={[
                  styles.statText,
                  !isActive && styles.inactiveText
                ]}>
                  익명
                </Text>
              </View>
            )}
          </View>

          {/* 시간 정보 */}
          <View style={styles.timeInfo}>
            {formatTimeRemaining() && isActive && (
              <Text style={styles.timeText}>
                {formatTimeRemaining()}
              </Text>
            )}
            
            {isExpired && (
              <Text style={styles.expiredText}>
                마감됨
              </Text>
            )}
          </View>
        </View>

        {/* 참여 완료 표시 */}
        {poll.user_voted && (
          <View style={styles.votedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#28A745" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inactiveContainer: {
    opacity: 0.7,
  },
  votedContainer: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  content: {
    padding: 20,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  inactiveText: {
    color: '#ADB5BD',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  expiredText: {
    fontSize: 12,
    color: '#DC3545',
    fontWeight: '600',
  },
  votedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});