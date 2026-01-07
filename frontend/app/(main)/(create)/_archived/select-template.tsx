import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/primitives/Text';
import { tokens } from '../../../src/theme';
import { usePollTemplates } from '../../../src/hooks/usePolls';
import { TemplateCategory } from '../../../src/types/poll';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';

/**
 * Select Template Screen - Swipe Card Interface
 *
 * Gas 앱 스타일의 스와이프 카드로 투표 질문 선택
 *
 * 참고: prd/design/05-complete-ui-specification.md#2.6.2
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 343;
const CARD_HEIGHT = 480;
const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

// 카테고리명 매핑
const CATEGORY_NAMES: Record<TemplateCategory, string> = {
  PERSONALITY: '성격 관련',
  APPEARANCE: '외모 관련',
  SPECIAL: '특별한 날',
  TALENT: '능력 관련',
};

// 카드 컴포넌트 (React.memo로 최적화)
interface CardProps {
  question: string;
  emoji: string | null;
  index: number; // 0 = 현재, 1 = 뒷카드1, 2 = 뒷카드2
  onSelect: () => void;
}

const QuestionCard = React.memo(({ question, emoji, index, onSelect }: CardProps) => {
  // 카드 스택 스타일 (뒷카드는 작고 아래에 배치)
  const offset = index * 8; // 8px씩 아래로
  const scale = 1 - index * 0.04; // 4%씩 작게
  const opacity = index === 0 ? 1 : index === 1 ? 0.7 : 0.4;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: offset }, { scale }],
          opacity,
          zIndex: 10 - index,
        },
      ]}
    >
      {/* 이모지 */}
      <Text style={styles.cardEmoji}>{emoji || '❓'}</Text>

      {/* 질문 텍스트 */}
      <Text style={styles.cardQuestion}>{question}</Text>

      {/* 선택 버튼 (현재 카드에만 표시) */}
      {index === 0 && (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={onSelect}
          accessibilityLabel={`질문 선택: ${question}`}
          accessibilityRole="button"
          accessibilityHint="이 질문을 선택하고 투표 설정으로 이동합니다"
        >
          <Text style={styles.selectButtonText}>선택하기</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

// 메인 화면
export default function SelectTemplateScreen() {
  const params = useLocalSearchParams<{ category: TemplateCategory }>();
  const category = params.category || 'PERSONALITY';

  // 템플릿 데이터 가져오기
  const { data: allTemplates, isLoading } = usePollTemplates();

  // 카테고리별 필터링
  const templates = allTemplates?.filter((t) => t.category === category) || [];

  // 현재 카드 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  // 힌트 텍스트 표시 여부 (3초 후 자동 숨김)
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 스와이프 애니메이션 값
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  // 다음 카드로 이동
  const goToNext = () => {
    if (currentIndex < templates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // 이전 카드로 이동
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // 질문 선택 및 다음 단계로
  const handleSelectQuestion = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const selectedTemplate = templates[currentIndex];
    router.push({
      pathname: '/(main)/(create)/configure',
      params: {
        templateId: selectedTemplate.id,
      },
    });
  };

  // 스와이프 제스처 (강화된 피드백)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // 카드 회전 효과 (좌우 스와이프 시)
      rotate.value = (event.translationX / SCREEN_WIDTH) * 20; // 최대 ±20도 회전
    })
    .onEnd((event) => {
      'worklet';
      const velocityX = event.velocityX;
      const velocityY = event.velocityY;

      // 좌측 스와이프: 다음 카드
      if (translateX.value < -SWIPE_THRESHOLD || velocityX < -500) {
        translateX.value = withSpring(-SCREEN_WIDTH, { stiffness: 300, damping: 30 }, () => {
          runOnJS(goToNext)();
          translateX.value = 0;
          rotate.value = 0;
        });
      }
      // 우측 스와이프: 이전 카드
      else if (translateX.value > SWIPE_THRESHOLD || velocityX > 500) {
        translateX.value = withSpring(SCREEN_WIDTH, { stiffness: 300, damping: 30 }, () => {
          runOnJS(goToPrevious)();
          translateX.value = 0;
          rotate.value = 0;
        });
      }
      // 위로 스와이프: 질문 선택
      else if (translateY.value < -SWIPE_UP_THRESHOLD || velocityY < -500) {
        translateY.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(handleSelectQuestion)();
        });
      }
      // 원위치
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  // 강화된 애니메이션 스타일 (회전 + 스케일)
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: translateY.value < 0 ? 1 - Math.abs(translateY.value) / 500 : 1 },
      ],
      opacity: translateY.value < 0 ? 1 - Math.abs(translateY.value) / 300 : 1,
    };
  });

  // 스와이프 방향 힌트 오버레이 스타일
  const overlayStyle = useAnimatedStyle(() => {
    'worklet';
    let backgroundColor = 'transparent';
    let opacity = 0;

    // 좌측 스와이프: 빨간색 (다음)
    if (translateX.value < -30) {
      backgroundColor = 'rgba(239, 68, 68, 0.1)'; // red-500 with 10% opacity
      opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 0.3);
    }
    // 우측 스와이프: 파란색 (이전)
    else if (translateX.value > 30) {
      backgroundColor = 'rgba(99, 102, 241, 0.1)'; // primary-500 with 10% opacity
      opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 0.3);
    }
    // 위로 스와이프: 초록색 (선택)
    else if (translateY.value < -30) {
      backgroundColor = 'rgba(34, 197, 94, 0.1)'; // green-500 with 10% opacity
      opacity = Math.min(Math.abs(translateY.value) / SWIPE_UP_THRESHOLD, 0.3);
    }

    return {
      backgroundColor,
      opacity,
    };
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>해당 카테고리에 질문이 없습니다</Text>
      </View>
    );
  }

  const currentTemplate = templates[currentIndex];
  const nextTemplate1 = templates[currentIndex + 1];
  const nextTemplate2 = templates[currentIndex + 2];

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerBackTitle: '닫기',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Text style={styles.headerBackText}>← 닫기</Text>
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>{CATEGORY_NAMES[category]}</Text>
          ),
          headerRight: () => (
            <Text style={styles.headerProgress}>
              {currentIndex + 1}/{templates.length}
            </Text>
          ),
        }}
      />

      <View style={styles.container}>
        {/* 카드 스택 */}
        <View style={styles.cardStack}>
          {/* 뒷카드 2 */}
          {nextTemplate2 && (
            <QuestionCard
              question={nextTemplate2.question_text}
              emoji={nextTemplate2.emoji}
              index={2}
              onSelect={() => {}}
            />
          )}

          {/* 뒷카드 1 */}
          {nextTemplate1 && (
            <QuestionCard
              question={nextTemplate1.question_text}
              emoji={nextTemplate1.emoji}
              index={1}
              onSelect={() => {}}
            />
          )}

          {/* 현재 카드 (제스처 가능) */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
              {/* 스와이프 방향 힌트 오버레이 */}
              <Animated.View style={[styles.swipeOverlay, overlayStyle]} />

              <QuestionCard
                question={currentTemplate.question_text}
                emoji={currentTemplate.emoji}
                index={0}
                onSelect={handleSelectQuestion}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* 액션 버튼 (접근성 개선) */}
        <View
          style={styles.actionButtons}
          accessible={true}
          accessibilityLabel="투표 질문 탐색 버튼"
        >
          {/* 이전 버튼 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonGray, styles.actionButtonSmall]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            accessibilityLabel="이전 질문"
            accessibilityRole="button"
            accessibilityHint="이전 투표 질문으로 이동합니다"
            accessibilityState={{ disabled: currentIndex === 0 }}
          >
            <Text style={styles.actionButtonIcon}>←</Text>
          </TouchableOpacity>

          {/* 건너뛰기 버튼 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonRed, styles.actionButtonMedium]}
            onPress={goToNext}
            disabled={currentIndex === templates.length - 1}
            accessibilityLabel="건너뛰기"
            accessibilityRole="button"
            accessibilityHint="이 질문을 건너뛰고 다음 질문으로 이동합니다"
            accessibilityState={{ disabled: currentIndex === templates.length - 1 }}
          >
            <Text style={styles.actionButtonIcon}>✕</Text>
          </TouchableOpacity>

          {/* 관심 표시 버튼 (메인) */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, styles.actionButtonLarge]}
            onPress={handleSelectQuestion}
            accessibilityLabel="이 질문으로 투표 만들기"
            accessibilityRole="button"
            accessibilityHint="현재 질문을 선택하고 투표 설정으로 이동합니다"
          >
            <Text style={styles.actionButtonIcon}>💖</Text>
          </TouchableOpacity>

          {/* 선택 버튼 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonBlue, styles.actionButtonMedium]}
            onPress={handleSelectQuestion}
            accessibilityLabel="질문 선택"
            accessibilityRole="button"
            accessibilityHint="현재 질문을 선택하고 투표 설정으로 이동합니다"
          >
            <Text style={styles.actionButtonIcon}>✓</Text>
          </TouchableOpacity>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonGray, styles.actionButtonSmall]}
            onPress={goToNext}
            disabled={currentIndex === templates.length - 1}
            accessibilityLabel="다음 질문"
            accessibilityRole="button"
            accessibilityHint="다음 투표 질문으로 이동합니다"
            accessibilityState={{ disabled: currentIndex === templates.length - 1 }}
          >
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 힌트 텍스트 */}
        {showHint && (
          <Animated.View
            style={[
              styles.hintContainer,
              {
                opacity: withTiming(showHint ? 1 : 0, { duration: 300 }),
              },
            ]}
            accessible={true}
            accessibilityLabel="카드를 좌우로 스와이프하면 다른 질문을 볼 수 있습니다"
            accessibilityRole="text"
          >
            <Text style={styles.hintText}>← 스와이프하여 넘기기 →</Text>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
  },

  // 헤더
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerBackText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.primary[500],
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg, // 18px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.neutral[900],
  },
  headerProgress: {
    fontSize: tokens.typography.fontSize.sm, // 14px
    fontWeight: tokens.typography.fontWeight.medium, // 500
    color: tokens.colors.neutral[500],
    paddingHorizontal: 16,
  },

  // 카드 스택
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // 카드
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: tokens.colors.white,
    borderRadius: 24, // 24px (3xl)
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
    // Shadow (shadow-2xl)
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.neutral[900],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardEmoji: {
    fontSize: 80,
    lineHeight: 96,  // fontSize * 1.2 (iOS 잘림 방지)
    marginTop: 40,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardQuestion: {
    fontSize: tokens.typography.fontSize['2xl'], // 24px
    fontWeight: tokens.typography.fontWeight.bold, // 700
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    lineHeight: 32,
  },
  selectButton: {
    position: 'absolute',
    bottom: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 12,
    // Shadow (shadow-primary)
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectButtonText: {
    fontSize: tokens.typography.fontSize.base, // 16px
    fontWeight: tokens.typography.fontWeight.semibold, // 600
    color: tokens.colors.white,
  },

  // 액션 버튼
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 60,
  },
  actionButton: {
    borderRadius: 9999, // full
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  actionButtonSmall: {
    width: 48,
    height: 48,
  },
  actionButtonMedium: {
    width: 56,
    height: 56,
  },
  actionButtonLarge: {
    width: 64,
    height: 64,
    // Shadow (shadow-lg)
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonGray: {
    backgroundColor: tokens.colors.neutral[100],
    borderColor: tokens.colors.neutral[200],
  },
  actionButtonRed: {
    backgroundColor: tokens.colors.red[50],
    borderColor: '#fecaca', // red-200
  },
  actionButtonPrimary: {
    backgroundColor: tokens.colors.primary[500],
    borderColor: tokens.colors.primary[500],
  },
  actionButtonBlue: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[200],
  },
  actionButtonIcon: {
    fontSize: 24,
  },

  // 스와이프 오버레이
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    pointerEvents: 'none',
    zIndex: 1,
  },

  // 힌트 텍스트
  hintContainer: {
    position: 'absolute',
    bottom: 60,
  },
  hintText: {
    fontSize: tokens.typography.fontSize.xs, // 12px
    fontWeight: tokens.typography.fontWeight.normal, // 400
    color: tokens.colors.neutral[400],
    textAlign: 'center',
  },
});
