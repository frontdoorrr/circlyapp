import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tokens, animations } from '../../theme';
import { Text } from '../primitives/Text';
import { useHaptics } from '../../hooks';

// ============================================================================
// Types
// ============================================================================

export interface VoteOption {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface VoteCardProps {
  question: string;
  options: VoteOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

// ============================================================================
// VoteCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * VoteCard Component
 *
 * 투표 카드 컴포넌트 - 4명 선택지 레이아웃
 *
 * @param question - 투표 질문
 * @param options - 투표 옵션 배열 (최대 4개)
 * @param selectedId - 선택된 옵션 ID
 * @param onSelect - 선택 핸들러
 * @param disabled - 비활성화 상태
 *
 * @example
 * <VoteCard
 *   question="가장 친절한 친구는?"
 *   options={[
 *     { id: '1', name: '김철수', avatarUrl: '...' },
 *     { id: '2', name: '이영희', avatarUrl: '...' },
 *     { id: '3', name: '박민수', avatarUrl: '...' },
 *     { id: '4', name: '최지은', avatarUrl: '...' },
 *   ]}
 *   selectedId={selectedId}
 *   onSelect={setSelectedId}
 * />
 */
export function VoteCard({
  question,
  options,
  selectedId,
  onSelect,
  disabled = false,
}: VoteCardProps) {
  const haptics = useHaptics();

  const handleSelect = (optionId: string) => {
    if (disabled) return;

    haptics.selection();
    onSelect(optionId);
  };

  return (
    <View style={styles.container}>
      {/* Question */}
      <Text variant="xl" weight="bold" style={styles.question}>
        {question}
      </Text>

      {/* Options Grid (2x2) */}
      <View style={styles.optionsGrid}>
        {options.slice(0, 4).map((option, index) => (
          <VoteOption
            key={option.id}
            option={option}
            isSelected={option.id === selectedId}
            onPress={() => handleSelect(option.id)}
            disabled={disabled}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// VoteOption Component
// ============================================================================

interface VoteOptionProps {
  option: VoteOption;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

function VoteOption({
  option,
  isSelected,
  onPress,
  disabled,
  index,
}: VoteOptionProps) {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 3 : 1);
  const borderColor = useSharedValue(
    isSelected ? tokens.colors.primary[500] : tokens.colors.neutral[200]
  );

  // 선택 상태가 변경되면 애니메이션
  React.useEffect(() => {
    borderWidth.value = withSpring(
      isSelected ? 3 : 1,
      animations.spring.responsive
    );
    borderColor.value = withTiming(
      isSelected ? tokens.colors.primary[500] : tokens.colors.neutral[200],
      { duration: animations.duration.fast }
    );
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
    borderColor: borderColor.value as string,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95, animations.spring.responsive);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, animations.spring.responsive);
  };

  // 스태거 애니메이션을 위한 초기 지연
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  if (!isVisible) {
    return <View style={styles.optionPlaceholder} />;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.option, animatedStyle]}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {option.avatarUrl ? (
          <Image source={{ uri: option.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text variant="2xl" weight="bold" color={tokens.colors.neutral[400]}>
              {option.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text
        variant="base"
        weight="semibold"
        align="center"
        numberOfLines={2}
        style={styles.name}
        color={isSelected ? tokens.colors.primary[600] : tokens.colors.neutral[900]}
      >
        {option.name}
      </Text>

      {/* Selected Indicator */}
      {isSelected && (
        <View style={styles.selectedBadge}>
          <View style={styles.checkmark} />
        </View>
      )}
    </AnimatedPressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: tokens.spacing.lg,
  },
  question: {
    marginBottom: tokens.spacing.xl,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  option: {
    width: '48%',
    aspectRatio: 0.85,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.md,
  },
  optionPlaceholder: {
    width: '48%',
    aspectRatio: 0.85,
  },
  avatarContainer: {
    marginBottom: tokens.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.neutral[100],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: tokens.spacing.xs,
  },
  selectedBadge: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 12,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: tokens.colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
});
