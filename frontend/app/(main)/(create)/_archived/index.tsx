import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { TemplateCategory, CategoryInfo } from '../../../src/types/poll';
import { useCategories } from '../../../src/hooks/usePolls';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { SkeletonCard } from '../../../src/components/states/Skeleton';

/**
 * Create Tab - Main Screen (Category Exploration)
 *
 * 카테고리별로 투표 템플릿을 탐색하는 메인 화면
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.1
 */

// Fallback categories (API 실패 시 사용)
const FALLBACK_CATEGORIES: CategoryInfo[] = [
  {
    category: 'PERSONALITY',
    emoji: '😊',
    title: '성격 관련',
    question_count: 8,
  },
  {
    category: 'APPEARANCE',
    emoji: '✨',
    title: '외모 관련',
    question_count: 6,
  },
  {
    category: 'SPECIAL',
    emoji: '🎉',
    title: '특별한 날',
    question_count: 4,
  },
  {
    category: 'TALENT',
    emoji: '🏆',
    title: '능력 관련',
    question_count: 5,
  },
];

// 카테고리 카드 컴포넌트
interface CategoryCardProps {
  category: CategoryInfo;
  onPress: () => void;
  index: number;
}

function CategoryCard({ category, onPress, index }: CategoryCardProps) {
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
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(300)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${category.title}, ${category.question_count}개의 질문`}
        accessibilityHint="이 카테고리의 질문을 보려면 두 번 탭하세요"
      >
        <Animated.View style={[styles.categoryCard, shadowStyle, animatedStyle]}>
          <View style={styles.cardContent}>
            {/* 이모지 */}
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>

            {/* 텍스트 정보 */}
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryCount}>{category.question_count}개의 질문</Text>
            </View>

            {/* 화살표 */}
            <Text style={styles.arrow}>→</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: categories, isLoading, isError, refetch } = useCategories();

  // API에서 데이터를 가져오거나 fallback 사용
  const displayCategories = categories || FALLBACK_CATEGORIES;

  const handleCategoryPress = (category: TemplateCategory) => {
    // 질문 선택 화면으로 이동 (slide-right transition)
    router.push({
      pathname: '/(main)/(create)/select-template',
      params: { category },
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>새 투표 만들기</Text>
          <Text style={styles.subtitle}>질문을 선택해서 투표를 시작해보세요</Text>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  // Error State
  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>새 투표 만들기</Text>
          <Text style={styles.subtitle}>질문을 선택해서 투표를 시작해보세요</Text>
        </View>
        <View style={styles.errorContainer}>
          <EmptyState
            variant="network-error"
            onAction={() => refetch()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          {displayCategories.map((category, index) => (
            <CategoryCard
              key={category.category}
              category={category}
              index={index}
              onPress={() => handleCategoryPress(category.category as TemplateCategory)}
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
  loadingContainer: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm * 1.5,
  },
  errorContainer: {
    flex: 1,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 20,
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
    fontSize: 32,
    lineHeight: 40,  // fontSize * 1.25 (iOS 잘림 방지)
    textAlign: 'center',
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

  // 화살표
  arrow: {
    fontSize: 20,
    color: tokens.colors.neutral[300],
  },
});
