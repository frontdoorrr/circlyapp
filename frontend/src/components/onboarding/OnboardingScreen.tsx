/**
 * Onboarding Screen
 *
 * 첫 앱 실행 시 표시되는 온보딩 화면
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { tokens } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@circly:onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '🎉',
    title: '친구들과\n익명으로 칭찬해요',
    description: '서로 솔직한 마음을 전하고\n따뜻한 칭찬을 나눠보세요',
  },
  {
    emoji: '⏰',
    title: '실시간으로\n결과를 확인해요',
    description: '투표와 동시에 업데이트되는\n실시간 결과를 확인하세요',
  },
  {
    emoji: '🔒',
    title: '완전한 익명이\n보장돼요',
    description: '누가 누구에게 투표했는지\n절대 알 수 없어요',
  },
  {
    emoji: '🎨',
    title: '예쁜 카드로\n추억을 남겨요',
    description: '인스타그램 스토리에\n공유하고 추억을 저장하세요',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentSlide + 1),
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {!isLastSlide && (
          <>
            <Button
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            >
              건너뛰기
            </Button>
            <Button
              onPress={handleNext}
              style={styles.nextButton}
            >
              다음
            </Button>
          </>
        )}

        {isLastSlide && (
          <Button
            onPress={handleGetStarted}
            fullWidth
          >
            시작하기
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 120,
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
    lineHeight: 40,
  },
  description: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 28,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.neutral[300],
  },
  dotActive: {
    width: 24,
    backgroundColor: tokens.colors.primary[500],
  },
  buttons: {
    flexDirection: 'row',
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
