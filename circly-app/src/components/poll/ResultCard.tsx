/**
 * 투표 결과 카드 컴포넌트
 * TRD 07-sharing-system.md의 결과 카드 요구사항 기반
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { PollResponse, VoteResult } from '../../types/poll';

const { width: screenWidth } = Dimensions.get('window');
const CARD_RATIO = 9 / 16; // Instagram story 비율
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = CARD_WIDTH / CARD_RATIO;

interface ResultCardProps {
  poll: PollResponse;
  results: VoteResult[];
  circleName: string;
  onShare?: () => void;
  onSave?: () => void;
  style?: any;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  poll,
  results,
  circleName,
  onShare,
  onSave,
  style,
}) => {
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 우승 옵션 찾기
  const winnerResult = results.reduce((prev, current) => 
    prev.vote_count > current.vote_count ? prev : current
  );

  const winnerOption = poll.options.find(opt => opt.id === winnerResult.option_id);

  // 카드 캡처 및 공유
  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsCapturing(true);

    try {
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        width: CARD_WIDTH * 2, // 고해상도
        height: CARD_HEIGHT * 2,
      });

      if (Platform.OS === 'ios') {
        await Share.share({
          url: uri,
          message: `"${poll.title}" 투표 결과 🗳️\n서클: ${circleName}\n\nCircly에서 확인하기 ➡️`,
        });
      } else {
        await Share.share({
          url: uri,
          title: '투표 결과 공유',
          message: `"${poll.title}" 투표 결과 🗳️\n서클: ${circleName}\n\nCircly에서 확인하기 ➡️`,
        });
      }

      onShare?.();
    } catch (error) {
      console.error('Failed to share result card:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  // 카드 저장
  const handleSave = async () => {
    if (!cardRef.current) return;

    setIsCapturing(true);

    try {
      // 미디어 라이브러리 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Media library permission denied');
        return;
      }

      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        width: CARD_WIDTH * 2,
        height: CARD_HEIGHT * 2,
      });

      // 파일 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Circly', asset, false);

      onSave?.();
    } catch (error) {
      console.error('Failed to save result card:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View ref={cardRef} style={styles.card}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Circly</Text>
              <Ionicons name="ballot" size={20} color="#FFF" />
            </View>
            <Text style={styles.circleName}>{circleName}</Text>
          </View>

          {/* 투표 제목 */}
          <View style={styles.titleSection}>
            <Text style={styles.pollTitle}>{poll.title}</Text>
            {poll.description && (
              <Text style={styles.pollDescription}>{poll.description}</Text>
            )}
          </View>

          {/* 우승자 강조 */}
          <View style={styles.winnerSection}>
            <View style={styles.winnerBadge}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.winnerLabel}>1위</Text>
            </View>
            <Text style={styles.winnerText}>{winnerOption?.text}</Text>
            <Text style={styles.winnerVotes}>
              {winnerResult.vote_count}표 ({winnerResult.percentage.toFixed(1)}%)
            </Text>
          </View>

          {/* 전체 결과 */}
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>전체 결과</Text>
            {results.map((result, index) => {
              const option = poll.options.find(opt => opt.id === result.option_id);
              if (!option) return null;

              const isWinner = result.option_id === winnerResult.option_id;

              return (
                <View key={option.id} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.optionText, isWinner && styles.winnerOptionText]}>
                      {option.text}
                    </Text>
                    <Text style={[styles.voteCount, isWinner && styles.winnerVoteCount]}>
                      {result.vote_count}표
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${result.percentage}%` },
                        isWinner && styles.winnerProgressBar,
                      ]}
                    />
                  </View>
                  <Text style={[styles.percentage, isWinner && styles.winnerPercentage]}>
                    {result.percentage.toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 통계 정보 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color="#FFF" />
              <Text style={styles.statText}>총 {poll.total_votes}명 참여</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#FFF" />
              <Text style={styles.statText}>
                {new Date(poll.created_at).toLocaleDateString('ko-KR')}
              </Text>
            </View>
            {poll.is_anonymous && (
              <View style={styles.statItem}>
                <Ionicons name="eye-off" size={16} color="#FFF" />
                <Text style={styles.statText}>익명 투표</Text>
              </View>
            )}
          </View>

          {/* 하단 로고 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>앱에서 더 많은 투표를 만나보세요</Text>
            <View style={styles.footerLogo}>
              <Text style={styles.footerLogoText}>Circly</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 액션 버튼들 */}
      <View style={styles.actions}>
        <View style={styles.actionButton} onTouchEnd={handleShare}>
          <Ionicons 
            name="share" 
            size={20} 
            color={isCapturing ? "#999" : "#007AFF"} 
          />
          <Text style={[styles.actionText, isCapturing && styles.disabledText]}>
            공유하기
          </Text>
        </View>
        <View style={styles.actionButton} onTouchEnd={handleSave}>
          <Ionicons 
            name="download" 
            size={20} 
            color={isCapturing ? "#999" : "#007AFF"} 
          />
          <Text style={[styles.actionText, isCapturing && styles.disabledText]}>
            저장하기
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  circleName: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  pollTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  pollDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  winnerSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 6,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  winnerVotes: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  resultsSection: {
    flex: 1,
    marginVertical: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    marginRight: 12,
  },
  winnerOptionText: {
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  winnerVoteCount: {
    fontWeight: '600',
    opacity: 1,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
    opacity: 0.8,
  },
  winnerProgressBar: {
    backgroundColor: '#FFD700',
    opacity: 1,
  },
  percentage: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.7,
    textAlign: 'right',
  },
  winnerPercentage: {
    fontWeight: '600',
    opacity: 1,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#FFF',
    marginLeft: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  footerLogo: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  footerLogoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  disabledText: {
    color: '#999',
  },
});

export default ResultCard;