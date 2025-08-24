/**
 * 표준화된 Vote Card 컴포넌트
 * 디자인 토큰 기반 Gas 앱 스타일 투표 카드
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../styles/tokens';

export type VoteCardState = 'default' | 'selected' | 'voted' | 'disabled';

interface VoteCardProps {
  /** 표시할 텍스트 (일반적으로 사용자 닉네임) */
  text: string;
  /** 카드 선택 상태 */
  state?: VoteCardState;
  /** 투표 수 (결과 표시 시) */
  voteCount?: number;
  /** 선택 시 콜백 */
  onPress?: () => void;
  /** 애니메이션 값 (선택 시 스케일 등) */
  animatedScale?: Animated.Value;
  /** 커스텀 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
  /** 접근성 레이블 */
  accessibilityLabel?: string;
}

export const VoteCard: React.FC<VoteCardProps> = ({
  text,
  state = 'default',
  voteCount,
  onPress,
  animatedScale,
  style,
  testID,
  accessibilityLabel,
}) => {
  const isInteractive = state !== 'disabled' && onPress;
  const showCheckmark = state === 'selected' || state === 'voted';
  const showVoteCount = voteCount !== undefined && voteCount > 0;

  const cardStyle = [
    styles.base,
    styles[state],
    animatedScale && { transform: [{ scale: animatedScale }] },
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${state}Text` as keyof typeof styles],
  ];

  const renderContent = () => (
    <>
      {/* 그라디언트 배경 (선택/투표 상태일 때) */}
      {state === 'selected' && (
        <LinearGradient
          colors={tokens.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      {state === 'voted' && (
        <LinearGradient
          colors={tokens.gradients.joy}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={styles.content}>
        {/* 메인 텍스트 */}
        <Text 
          style={textStyle} 
          numberOfLines={3}
          textBreakStrategy="highQuality"
        >
          {text}
        </Text>

        {/* 상태 표시 영역 */}
        <View style={styles.statusContainer}>
          {/* 체크마크 (선택/투표 상태) */}
          {showCheckmark && (
            <View style={styles.checkmarkContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={28} 
                color={tokens.colors.white}
                style={styles.checkmark}
              />
            </View>
          )}

          {/* 투표 수 표시 */}
          {showVoteCount && (
            <View style={styles.voteCountContainer}>
              <Text style={styles.voteCountText}>
                {voteCount}표
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );

  if (!isInteractive) {
    return (
      <View style={cardStyle} testID={testID}>
        {renderContent()}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      accessibilityLabel={accessibilityLabel || `${text} 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected' }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.xl,
    borderWidth: 2,
    borderColor: tokens.colors.gray[100],
    overflow: 'hidden',
    minHeight: 140,
    ...tokens.shadows.base,
  },

  // States
  default: {
    // 기본 상태는 base 스타일만 사용
  },
  selected: {
    borderColor: tokens.colors.primary[500],
    ...tokens.shadows.primary,
    transform: [{ scale: 1.02 }],
  },
  voted: {
    borderColor: tokens.colors.success[500],
    ...tokens.shadows.success,
  },
  disabled: {
    opacity: 0.6,
  },

  // Content Layout
  content: {
    flex: 1,
    padding: tokens.spacing[5],
    justifyContent: 'space-between',
  },

  // Text Styles
  text: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.primary,
    color: tokens.colors.gray[900],
    lineHeight: 22,
    textAlign: 'center',
    flex: 1,
  },

  // Text State Variants
  defaultText: {
    // 기본 텍스트 스타일
  },
  selectedText: {
    color: tokens.colors.white,
  },
  votedText: {
    color: tokens.colors.white,
  },
  disabledText: {
    color: tokens.colors.gray[400],
  },

  // Status Container
  statusContainer: {
    alignItems: 'center',
    marginTop: tokens.spacing[3],
    gap: tokens.spacing[2],
  },

  // Checkmark
  checkmarkContainer: {
    // 체크마크 컨테이너는 별도 스타일 없음
  },
  checkmark: {
    // 아이콘 자체 스타일 조정 가능
  },

  // Vote Count
  voteCountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.borderRadius.md,
  },
  voteCountText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
    fontFamily: tokens.typography.fontFamily.primary,
  },
});

// 기존 호환성을 위한 default export
export default VoteCard;