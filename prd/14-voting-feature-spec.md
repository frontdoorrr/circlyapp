# Circly 투표 참여 기능 상세 명세서

## 개요
디자인 시스템과 사용자 플로우 가이드를 기반으로 한 투표 참여 기능의 완전한 구현 명세서입니다. Gas 앱의 직관적인 투표 경험을 벤치마킹하여 Circly만의 독특하고 매끄러운 투표 시스템을 설계했습니다.

## 🎯 투표 참여 기능 구조

### 화면 구성 계층
```
Home 화면 → [투표하기] → 투표 화면 → 결과 화면 → 공유/홈 복귀
                ↓
            [건너뛰기] → Home 화면
                ↓  
            [섞기] → 선택지 재배열
```

### 상태 관리
```typescript
interface VotingState {
  question: Question;
  options: VoteOption[];
  selectedOption: VoteOption | null;
  isSubmitting: boolean;
  hasVoted: boolean;
  timeRemaining: number;
  participantCount: number;
}

interface VoteOption {
  id: string;
  name: string;
  isSelected: boolean;
  position: number; // 섞기 기능을 위한 위치
}
```

## 📱 투표 화면 상세 구현

### 1. 화면 레이아웃 (Mobile-First)
```jsx
// VotingScreen.tsx 구조
<SafeAreaView className="voting-screen">
  {/* Header */}
  <VotingHeader 
    onBack={() => navigation.goBack()}
    progress="1/1" 
    timeRemaining="12:23:45"
  />
  
  {/* Question Section */}
  <QuestionSection
    emoji="💖"
    text="가장 웃음이 예쁜 친구는?"
    category="외모"
  />
  
  {/* Voting Options */}
  <VotingOptions
    options={options}
    selectedOption={selectedOption}
    onSelect={handleOptionSelect}
    onShuffle={handleShuffle}
  />
  
  {/* Action Buttons */}
  <VotingActions
    onSkip={handleSkip}
    onShuffle={handleShuffle}
    onContinue={handleContinue}
    continueEnabled={!!selectedOption}
    isSubmitting={isSubmitting}
  />
</SafeAreaView>
```

### 2. CSS 스타일 구현

#### 메인 화면 스타일
```css
.voting-screen {
  min-height: 100vh;
  background: var(--gradient-bg-light);
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* Header */
.voting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  border: none;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:active {
  background: var(--gray-200);
  transform: scale(0.95);
}

.progress-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-600);
}

.time-remaining {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--warning-600);
}
```

#### 질문 섹션 스타일
```css
.question-section {
  text-align: center;
  padding: var(--space-8) var(--space-5);
  background: white;
  margin: var(--space-4) var(--space-4) 0;
  border-radius: var(--radius-2xl);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.question-emoji {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  display: block;
  animation: gentle-bounce 2s infinite;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.question-text {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gray-900);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-2);
}

.question-category {
  font-size: var(--text-sm);
  color: var(--gray-500);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

#### 투표 옵션 카드 스타일
```css
.voting-options {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.vote-option-card {
  /* Base Styles - 디자인 시스템 기반 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-5);
  background: white;
  border: 2px solid var(--gray-100);
  border-radius: var(--radius-2xl);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  /* Typography */
  font-family: var(--font-family-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  
  /* Interaction */
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  min-height: 64px; /* 터치 영역 보장 */
}

/* Hover State */
.vote-option-card:hover {
  border-color: var(--primary-200);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: scale(1.01);
}

/* Active/Press State */
.vote-option-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

/* Selected State */
.vote-option-card.selected {
  background: var(--gradient-primary);
  border-color: var(--primary-500);
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transform: scale(1.02);
}

.vote-option-card.selected::after {
  content: '✓';
  position: absolute;
  right: var(--space-4);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

/* Shuffle Animation */
.vote-option-card.shuffling {
  animation: shuffle-card 0.4s ease-in-out;
}

@keyframes shuffle-card {
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-10px) rotate(-2deg); }
  50% { transform: translateX(10px) rotate(2deg); }
  75% { transform: translateX(-5px) rotate(-1deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
```

### 3. 액션 버튼 구현

#### 버튼 컨테이너 스타일
```css
.voting-actions {
  padding: var(--space-4) var(--space-5) var(--space-6);
  background: white;
  border-top: 1px solid var(--gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
}

.secondary-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.primary-action {
  width: 100%;
}
```

#### Skip 버튼 (Secondary Button)
```css
.btn-skip {
  /* 디자인 시스템 btn-secondary 기반 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--gray-600);
  font-family: var(--font-family-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-height: 48px;
}

.btn-skip:hover {
  border-color: var(--gray-300);
  background: var(--gray-50);
}

.btn-skip:active {
  transform: scale(0.97);
}
```

#### Shuffle 버튼
```css
.btn-shuffle {
  /* btn-skip과 동일한 기본 스타일 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border: 2px solid var(--primary-200);
  border-radius: var(--radius-lg);
  background: var(--primary-50);
  color: var(--primary-600);
  font-family: var(--font-family-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-height: 48px;
}

.btn-shuffle:hover {
  border-color: var(--primary-300);
  background: var(--primary-100);
}

.btn-shuffle:active {
  transform: scale(0.97);
}

.btn-shuffle.shuffling {
  animation: shuffle-button 0.4s ease-in-out;
}

@keyframes shuffle-button {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}
```

#### Continue 버튼 (Primary)
```css
.btn-continue {
  /* 디자인 시스템 btn-primary 기반 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) var(--space-6);
  border: none;
  border-radius: var(--radius-xl);
  
  /* Typography */
  font-family: var(--font-family-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  
  /* Colors */
  background: var(--gradient-primary);
  color: white;
  
  /* Effects */
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.3);
  cursor: pointer;
  user-select: none;
  
  /* Transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
  min-height: 56px;
  width: 100%;
}

.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.4);
}

.btn-continue:active {
  transform: translateY(0);
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.3);
}

.btn-continue:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: var(--gray-300);
}

.btn-continue.loading {
  position: relative;
  color: transparent;
}

.btn-continue.loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: button-spinner 1s linear infinite;
}

@keyframes button-spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## 🎭 인터랙션 및 애니메이션

### 1. 카드 선택 애니메이션
```typescript
// React Native Reanimated 기반
const handleOptionSelect = (option: VoteOption) => {
  // 햅틱 피드백
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  // 카드 선택 애니메이션
  const animatedValue = useSharedValue(1);
  
  animatedValue.value = withSequence(
    withTiming(0.95, { duration: 100 }),
    withSpring(1.02, { stiffness: 200, damping: 10 }),
    withTiming(1, { duration: 200 })
  );
  
  // 상태 업데이트
  setSelectedOption(option);
  
  // Continue 버튼 등장 애니메이션
  const continueButtonScale = useSharedValue(0);
  continueButtonScale.value = withSpring(1, {
    stiffness: 200,
    damping: 20,
    delay: 200
  });
};
```

### 2. 섞기 기능 구현
```typescript
const handleShuffle = async () => {
  // 햅틱 피드백
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  // 섞기 애니메이션 시작
  setIsShuffling(true);
  
  // 카드들에 셔플 애니메이션 적용
  const shuffleAnimations = options.map((_, index) => {
    const delay = index * 50; // 순차적 애니메이션
    return withDelay(delay, withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 200 })
    ));
  });
  
  // 새로운 순서로 재배열
  setTimeout(() => {
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);
    setSelectedOption(null); // 선택 초기화
    setIsShuffling(false);
  }, 300);
};
```

### 3. 투표 제출 프로세스
```typescript
const handleContinue = async () => {
  if (!selectedOption) return;
  
  setIsSubmitting(true);
  
  try {
    // 1. 투표 제출
    const result = await submitVote({
      pollId: poll.id,
      optionId: selectedOption.id,
      userId: currentUser.id
    });
    
    // 2. 성공 애니메이션 (하트 날아가기)
    await playHeartAnimation();
    
    // 3. 완료 메시지 표시
    setShowSuccessMessage(true);
    
    // 4. 2초 후 결과 화면으로 이동
    setTimeout(() => {
      navigation.replace('VoteResults', { 
        pollId: poll.id,
        justVoted: true 
      });
    }, 2000);
    
  } catch (error) {
    // 에러 처리
    setShowErrorToast(true);
    setErrorMessage('투표 중 오류가 발생했어요. 다시 시도해주세요.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## 🎉 투표 완료 화면

### 성공 애니메이션 구현
```css
.vote-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: success-fade-in 0.3s ease-out;
}

.success-content {
  text-align: center;
  color: white;
}

.success-emoji {
  font-size: 5rem;
  margin-bottom: var(--space-4);
  animation: success-bounce 0.8s ease-out;
}

.success-message {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-2);
}

.success-description {
  font-size: var(--text-base);
  opacity: 0.9;
}

@keyframes success-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes success-bounce {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

/* 하트 날아가기 애니메이션 */
.flying-heart {
  position: absolute;
  font-size: 2rem;
  color: #ff6b9d;
  pointer-events: none;
  animation: heart-flight 1.5s ease-out forwards;
}

@keyframes heart-flight {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translate(100px, -50px) scale(0.8) rotate(180deg);
    opacity: 0.8;
  }
  100% {
    transform: translate(300px, -100px) scale(0.3) rotate(360deg);
    opacity: 0;
  }
}
```

## 📱 반응형 및 접근성

### 1. 다양한 화면 크기 지원
```css
/* Small phones (320px - 375px) */
@media (max-width: 375px) {
  .question-emoji { font-size: 3rem; }
  .question-text { font-size: var(--text-xl); }
  .vote-option-card { padding: var(--space-5) var(--space-4); }
}

/* Large phones (414px+) */
@media (min-width: 414px) {
  .voting-options { 
    max-width: 400px; 
    margin: 0 auto;
  }
}

/* Tablet landscape */
@media (min-width: 768px) and (orientation: landscape) {
  .voting-screen {
    flex-direction: row;
    max-width: 768px;
    margin: 0 auto;
  }
  
  .question-section {
    flex: 1;
    margin-right: var(--space-4);
  }
  
  .voting-options {
    flex: 1;
  }
}
```

### 2. 접근성 지원
```jsx
// VoteOptionCard.tsx
<TouchableOpacity
  style={[styles.voteCard, isSelected && styles.selected]}
  onPress={() => onSelect(option)}
  accessibilityRole="button"
  accessibilityLabel={`${option.name}에게 투표하기`}
  accessibilityState={{ selected: isSelected }}
  accessibilityHint="이 친구를 선택하려면 두 번 탭하세요"
>
  <Text style={styles.optionText}>{option.name}</Text>
  {isSelected && (
    <Icon 
      name="check" 
      size={24} 
      color="white"
      accessibilityLabel="선택됨"
    />
  )}
</TouchableOpacity>
```

### 3. 다크 모드 지원
```css
/* 다크 모드 오버라이드 */
[data-theme="dark"] .voting-screen {
  background: var(--gradient-bg-dark);
}

[data-theme="dark"] .voting-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

[data-theme="dark"] .question-section {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

[data-theme="dark"] .vote-option-card {
  background: var(--card-bg);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .voting-actions {
  background: var(--bg-secondary);
  border-top-color: var(--border-primary);
}
```

## 🔧 성능 최적화

### 1. 메모이제이션
```typescript
// 옵션 카드 메모이제이션
const VoteOptionCard = React.memo(({ option, isSelected, onSelect }) => {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.selected]}
      onPress={() => onSelect(option)}
    >
      <Text>{option.name}</Text>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  return prevProps.isSelected === nextProps.isSelected &&
         prevProps.option.id === nextProps.option.id;
});
```

### 2. 애니메이션 최적화
```typescript
// GPU 가속 애니메이션 사용
const animatedStyle = useAnimatedStyle(() => {
  return {
    transform: [
      { scale: selectedScale.value },
      { translateZ: 0 } // GPU 레이어 생성
    ],
  };
});
```

## 📊 에러 처리 및 로딩 상태

### 1. 네트워크 에러 처리
```tsx
const ErrorToast = ({ message, onRetry, onClose }) => (
  <Animated.View style={[styles.toast, styles.error]}>
    <Icon name="alert-circle" size={24} color="#ef4444" />
    <View style={styles.toastContent}>
      <Text style={styles.toastMessage}>{message}</Text>
      <View style={styles.toastActions}>
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="x" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  </Animated.View>
);
```

### 2. 로딩 스켈레톤
```css
.voting-skeleton {
  padding: var(--space-4);
}

.skeleton-question {
  height: 200px;
  background: var(--gray-100);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--space-4);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-option {
  height: 64px;
  background: var(--gray-100);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--space-4);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-option:nth-child(2) { animation-delay: 0.1s; }
.skeleton-option:nth-child(3) { animation-delay: 0.2s; }
.skeleton-option:nth-child(4) { animation-delay: 0.3s; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

이 상세 명세서를 통해 개발팀은 Gas 앱의 직관적인 투표 경험을 능가하는 Circly만의 독특하고 매끄러운 투표 참여 기능을 구현할 수 있습니다! 🗳️✨