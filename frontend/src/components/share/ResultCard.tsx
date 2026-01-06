/**
 * Result Card Component
 *
 * 투표 결과를 1080x1920px 인스타그램 스토리 규격으로 표시하는 카드
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';
import { PollDetailResponse } from '../../types/poll';

interface ResultCardProps {
  poll: PollDetailResponse;
  cardRef?: React.RefObject<View | null>;
}

export function ResultCard({ poll, cardRef }: ResultCardProps) {
  // 상위 3명만 표시
  const topResults = poll.results.slice(0, 3);

  return (
    <View ref={cardRef} style={styles.card}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Circly</Text>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>{poll.question_text}</Text>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          {topResults.map((result, index) => (
            <View key={result.user_id} style={styles.resultItem}>
              <View style={styles.resultRank}>
                <Text style={styles.rankEmoji}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </Text>
              </View>

              <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>
                    {result.profile_emoji} {result.nickname || '익명'}
                  </Text>
                  <Text style={styles.resultVotes}>{result.vote_count}표</Text>
                </View>

                <View style={styles.resultBarContainer}>
                  <View
                    style={[
                      styles.resultBar,
                      { width: `${result.vote_percentage}%` },
                      index === 0 && styles.resultBarFirst,
                      index === 1 && styles.resultBarSecond,
                      index === 2 && styles.resultBarThird,
                    ]}
                  />
                </View>

                <Text style={styles.resultPercentage}>
                  {result.vote_percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerStats}>총 {poll.vote_count}명이 참여</Text>
          <Text style={styles.footerBrand}>circly.app</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 1080,
    height: 1920,
    backgroundColor: tokens.colors.white,
  },
  gradient: {
    flex: 1,
    padding: 80,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.white,
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  question: {
    fontSize: 80,
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.white,
    textAlign: 'center',
    lineHeight: 96,
  },
  resultsSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    padding: 40,
  },
  resultRank: {
    marginRight: 32,
  },
  rankEmoji: {
    fontSize: 80,
    lineHeight: 96,
    textAlign: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultName: {
    fontSize: 48,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.white,
  },
  resultVotes: {
    fontSize: 40,
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.white,
  },
  resultBarContainer: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  resultBar: {
    height: '100%',
    borderRadius: 12,
  },
  resultBarFirst: {
    backgroundColor: '#FFD700', // Gold
  },
  resultBarSecond: {
    backgroundColor: '#C0C0C0', // Silver
  },
  resultBarThird: {
    backgroundColor: '#CD7F32', // Bronze
  },
  resultPercentage: {
    fontSize: 36,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    alignItems: 'center',
    marginTop: 60,
  },
  footerStats: {
    fontSize: 40,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 36,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.white,
  },
});
