import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { TemplateCategory } from '../../../src/types/poll';

/**
 * Create Tab - Main Screen (Category Exploration)
 *
 * 카테고리별로 투표 템플릿을 탐색하는 메인 화면
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.1
 */

// 카테고리 정보 타입
interface CategoryInfo {
  category: TemplateCategory;
  emoji: string;
  title: string;
  questionCount: number;
}

// 카테고리 목록 (백엔드 API에서 가져올 수도 있지만, 현재는 하드코딩)
const CATEGORIES: CategoryInfo[] = [
  {
    category: 'PERSONALITY',
    emoji: '😊',
    title: '성격 관련',
    questionCount: 8,
  },
  {
    category: 'APPEARANCE',
    emoji: '✨',
    title: '외모 관련',
    questionCount: 6,
  },
  {
    category: 'SPECIAL',
    emoji: '🎉',
    title: '특별한 날',
    questionCount: 4,
  },
  {
    category: 'TALENT',
    emoji: '🏆',
    title: '능력 관련',
    questionCount: 5,
  },
];

// 카테고리 카드 컴포넌트
interface CategoryCardProps {
  category: CategoryInfo;
  onPress: () => void;
}

function CategoryCard({ category, onPress }: CategoryCardProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.05);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    // Press animation: scale 0.98 + shadow-lg
    scale.value = withSpring(0.98, {
      stiffness: 300,
      damping: 30,
    });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    // Restore original state
    scale.value = withSpring(1, {
      stiffness: 300,
      damping: 30,
    });
    shadowOpacity.value = withTiming(0.05, { duration: 150 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.categoryCard, shadowStyle, animatedStyle]}>
        <View style={styles.cardContent}>
          {/* 이모지 */}
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>

          {/* 텍스트 정보 */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryCount}>{category.questionCount}개의 질문</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CreateScreen() {
  const router = useRouter();

  const handleCategoryPress = (category: TemplateCategory) => {
    // 질문 선택 화면으로 이동 (slide-right transition)
    router.push({
      pathname: '/(main)/(create)/select-template',
      params: { category },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>새 투표 만들기</Text>
          <Text style={styles.subtitle}>질문을 선택해서 투표를 시작해보세요</Text>
        </View>

        {/* 카테고리 카드 리스트 */}
        <View style={styles.categoryList}>
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.category}
              category={category}
              onPress={() => handleCategoryPress(category.category)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xl * 2,
  },

  // 헤더
  header: {
    paddingTop: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'], // 24px
    fontWeight: tokens.typography.fontWeight.bold, // 700
    color: tokens.colors.neutral[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[500],
    textAlign: 'center',
    marginTop: tokens.spacing.xs, // 8px
  },

  // 카테고리 리스트
  categoryList: {
    paddingHorizontal: tokens.spacing.md, // 16px
    gap: tokens.spacing.sm * 1.5, // 12px
  },

  // 카테고리 카드
  categoryCard: {
    paddingHorizontal: tokens.spacing.xl, // 24px
    paddingVertical: tokens.spacing.xl, // 24px
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius['2xl'], // 20px
    // Shadow (shadow-sm)
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.neutral[900],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 이모지
  categoryEmoji: {
    fontSize: 32, // 32px
  },

  // 텍스트 정보
  categoryInfo: {
    marginLeft: tokens.spacing.sm * 1.5, // 12px
    flex: 1,
  },
  categoryTitle: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.neutral[900],
  },
  categoryCount: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[400],
    marginTop: 4, // 4px
  },
});
