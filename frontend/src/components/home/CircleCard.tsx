/**
 * Circle Card Component
 *
 * Circle 목록에 표시되는 카드
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CircleResponse } from '../../types/circle';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';

interface CircleCardProps {
  circle: CircleResponse;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CircleCard({ circle, onPress, index = 0 }: CircleCardProps) {
  // 진입 애니메이션
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(1, { damping: 20 }),
    transform: [
      { translateY: withSpring(0, { damping: 20 }) },
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // 이모지 추출 (이름에서 첫 이모지 찾기 또는 기본 이모지)
  const getCircleEmoji = () => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const match = circle.name.match(emojiRegex);
    return match ? match[0] : '🎯';
  };

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Circle 아이콘 */}
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{getCircleEmoji()}</Text>
      </View>

      {/* Circle 정보 */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {circle.name}
        </Text>

        <View style={styles.stats}>
          <Text style={styles.statText}>
            👥 {circle.member_count}명
          </Text>
          {/* TODO: active_polls_count가 백엔드에 추가되면 활성화 */}
          {/* <Text style={styles.statText}>
            📊 진행 중 {circle.active_polls_count || 0}개
          </Text> */}
        </View>

        {/* 초대 코드 만료 시간 표시 */}
        {circle.invite_code_expires_at && (
          <Text style={styles.expiryText} numberOfLines={1}>
            ⏰ 초대 코드 만료: {formatExpiryTime(circle.invite_code_expires_at)}
          </Text>
        )}
      </View>

      {/* 화살표 아이콘 */}
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </AnimatedTouchable>
  );
}

// 만료 시간 포맷팅 (예: "12시간 23분 남음")
function formatExpiryTime(expiryDate: string): string {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return '만료됨';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 남음`;
  }

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 남음`;
  }

  return `${minutes}분 남음`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  emoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  statText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
  },
  expiryText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500],
    marginTop: tokens.spacing.xs,
  },
  arrowContainer: {
    marginLeft: tokens.spacing.sm,
  },
  arrow: {
    fontSize: 24,
    color: tokens.colors.neutral[400],
  },
});
