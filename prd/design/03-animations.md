# Circly 인터랙션 & 애니메이션 가이드

## 개요
Gas 앱의 매끄럽고 즐거운 인터랙션을 벤치마킹하여 Circly만의 독특하고 감성적인 애니메이션 시스템을 구축하는 가이드입니다.

## 🎭 핵심 애니메이션 철학

### 1. 감정적 연결 (Emotional Connection)
```
목표: 사용자가 앱과 감정적으로 연결되도록 하는 애니메이션
- 따뜻함과 친근함을 표현하는 부드러운 곡선
- 놀라움과 기쁨을 주는 예상치 못한 디테일
- 안전감을 주는 일관된 피드백
```

### 2. 스토리텔링 (Visual Storytelling)
```
목표: 각 인터랙션이 하나의 작은 이야기가 되도록
- 투표 → 하트 전달 → 상대방이 기뻐함 (이야기의 흐름)
- 기다림 → 새로운 질문 도착 → 설렘 (감정의 변화)
- 결과 확인 → 놀라움 → 공유 욕구 (자연스러운 다음 액션)
```

### 3. 놀이성 (Playfulness)
```
목표: 진지하지 않고 가벼우며 재미있는 경험
- 바운스와 스프링 효과로 생동감 표현
- 예상치 못한 이스터 에그와 서프라이즈
- 실패도 재미있게 만드는 유머러스한 피드백
```

## 📱 화면별 상세 애니메이션

### 1. 투표 선택 애니메이션

#### Gas 앱 레퍼런스
- 선택지 터치 시 즉각적 하이라이트
- 선택 후 Continue 버튼 등장
- 다음 질문으로 자연스러운 전환

#### Circly 구현
```javascript
// 선택지 터치 애니메이션
const optionSelectAnimation = {
  initial: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  pressed: { 
    scale: 0.96,
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
    transition: { duration: 0.1, ease: 'easeOut' }
  },
  selected: {
    scale: 1.02,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
    transition: { 
      duration: 0.3, 
      ease: 'backOut',
      delay: 0.05
    }
  }
};

// Continue 버튼 등장 애니메이션
const continueButtonAnimation = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    y: 20,
    rotateX: -15
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      delay: 0.2
    }
  }
};
```

### 2. 투표 결과 발표 애니메이션

#### 핵심 컨셉: "하트가 날아가는 이야기"
```javascript
// 하트 전달 애니메이션 시퀀스
const heartDeliverySequence = {
  // 1단계: 하트 생성
  heartBirth: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    rotate: [0, 10, 0],
    transition: {
      duration: 0.6,
      ease: 'backOut'
    }
  },
  
  // 2단계: 하트 날아가기
  heartFlight: {
    x: [0, 50, 100, 200],
    y: [0, -20, -10, -30],
    scale: [1, 0.8, 0.6, 0.3],
    opacity: [1, 0.8, 0.5, 0],
    rotate: [0, 360],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
      delay: 0.5
    }
  },
  
  // 3단계: 결과 그래프 등장
  resultReveal: {
    width: ['0%', '100%'],
    opacity: [0, 1],
    transition: {
      duration: 1.0,
      ease: 'easeOut',
      delay: 1.0
    }
  }
};
```

### 3. 실시간 결과 업데이트

#### 막대 그래프 애니메이션
```css
.result-bar {
  position: relative;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 100%);
}

.result-bar-fill {
  height: 100%;
  border-radius: 25px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* 새로운 투표 시 반짝임 효과 */
.result-bar-fill.new-vote {
  animation: pulse-glow 0.6s ease-out;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0.3);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 20px rgba(102, 126, 234, 0);
    transform: scale(1);
  }
}

/* 물결 효과 */
.result-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: wave 2s infinite;
}

@keyframes wave {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

### 4. 페이지 전환 애니메이션

#### 질문 간 전환 (Card Flip Effect)
```javascript
const questionTransition = {
  // 현재 질문 나가기
  exit: {
    rotateY: -90,
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  },
  
  // 새 질문 들어오기
  enter: {
    rotateY: [90, 0],
    opacity: [0, 1],
    scale: [0.8, 1],
    transition: {
      duration: 0.4,
      ease: 'backOut',
      delay: 0.1
    }
  }
};
```

#### 화면 간 네비게이션 (Slide & Fade)
```javascript
const screenTransitions = {
  // 메인 → 결과
  toResults: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-50%', opacity: 0 },
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 20,
      mass: 0.8
    }
  },
  
  // 결과 → 공유
  toShare: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
    transition: { 
      type: 'tween',
      ease: 'easeInOut',
      duration: 0.4
    }
  }
};
```

## 🎨 마이크로 인터랙션

### 1. 버튼 인터랙션

#### Primary 버튼
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  padding: 16px 32px;
  color: white;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transform: translateY(0);
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}
```

#### Ghost 버튼 (Skip, Shuffle)
```css
.btn-ghost {
  background: transparent;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  padding: 12px 24px;
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.btn-ghost::after {
  content: '';
  position: absolute;
  width: 0;
  height: 100%;
  top: 0;
  left: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: inherit;
  transition: all 0.3s ease;
  z-index: -1;
}

.btn-ghost:hover {
  color: white;
  border-color: #667eea;
}

.btn-ghost:hover::after {
  width: 100%;
  left: 0;
}
```

### 2. 입력 필드 인터랙션

#### 닉네임 입력
```css
.input-nickname {
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 16px 20px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
  position: relative;
}

.input-nickname:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: scale(1.02);
}

.input-nickname.valid {
  border-color: #4caf50;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
}

.input-nickname.invalid {
  border-color: #f44336;
  background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

### 3. 로딩 애니메이션

#### 투표 처리 중
```css
.loading-vote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  animation: loading-bounce 1.2s infinite ease-in-out;
}

.loading-dot:nth-child(2) { animation-delay: -1.1s; }
.loading-dot:nth-child(3) { animation-delay: -1.0s; }
.loading-dot:nth-child(4) { animation-delay: -0.9s; }

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
```

#### 결과 로딩 (스켈레톤)
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-bar {
  height: 50px;
  border-radius: 25px;
  margin-bottom: 16px;
}

.skeleton-text {
  height: 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## 🎪 특별 효과 및 이스터 에그

### 1. 연속 투표 시 콤보 효과
```javascript
const comboEffects = {
  // 3연속 투표
  combo3: {
    particles: '⭐⭐⭐',
    message: 'Great!',
    color: '#ffa726',
    duration: 1000
  },
  
  // 5연속 투표  
  combo5: {
    particles: '🔥🔥🔥',
    message: 'Amazing!',
    color: '#ff5722',
    duration: 1500
  },
  
  // 10연속 투표
  combo10: {
    particles: '🎉🎊🎆',
    message: 'Incredible!',
    color: '#9c27b0',
    duration: 2000,
    screenEffect: 'confetti'
  }
};
```

### 2. 시간대별 특별 효과
```javascript
const timeBasedEffects = {
  morning: {
    particles: '🌅☀️',
    greeting: '좋은 아침이에요!',
    theme: 'warm'
  },
  
  afternoon: {
    particles: '😊🌤️',
    greeting: '즐거운 오후!',
    theme: 'bright'
  },
  
  evening: {
    particles: '🌙⭐',
    greeting: '편안한 저녁!',
    theme: 'calm'
  }
};
```

### 3. 특별한 날 이벤트
```javascript
const specialEvents = {
  birthday: {
    animation: 'birthday-celebration',
    particles: '🎂🎉🎈',
    message: '생일 축하해요!',
    duration: 3000
  },
  
  valentine: {
    animation: 'heart-rain',
    particles: '💖💝💕',
    message: '사랑이 가득한 하루!',
    duration: 2000
  },
  
  christmas: {
    animation: 'snow-fall',
    particles: '🎄❄️🎅',
    message: '메리 크리스마스!',
    duration: 2500
  }
};
```

## 📱 반응형 및 접근성

### 1. 터치 타겟 크기
```css
/* 최소 터치 영역 44x44px 보장 */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 엄지 영역 최적화 */
.thumb-zone {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  padding: 20px;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.95)
  );
}
```

### 2. 모션 감소 설정 지원
```css
/* 사용자가 모션 감소를 선호하는 경우 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* 핵심 피드백만 유지 */
  .essential-feedback {
    animation-duration: 0.2s !important;
    transition-duration: 0.1s !important;
  }
}
```

### 3. 햅틱 피드백 (React Native)
```javascript
import { Haptics } from 'expo-haptics';

const hapticFeedback = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
};

// 사용 예시
const handleVoteSelection = () => {
  hapticFeedback.medium(); // 선택 시
  // ... 투표 로직
  hapticFeedback.success(); // 완료 시
};
```

## 🔧 성능 최적화

### 1. 애니메이션 최적화
```javascript
// GPU 가속 활용
const optimizedAnimation = {
  transform: 'translateZ(0)', // GPU 레이어 생성
  willChange: 'transform, opacity', // 브라우저 최적화 힌트
  backfaceVisibility: 'hidden' // 플리커 방지
};

// 애니메이션 완료 후 정리
const cleanupAnimation = (element) => {
  element.style.willChange = 'auto';
  element.style.transform = '';
};
```

### 2. 메모리 관리
```javascript
// 애니메이션 인스턴스 관리
class AnimationManager {
  constructor() {
    this.activeAnimations = new Set();
  }
  
  startAnimation(animation) {
    this.activeAnimations.add(animation);
    animation.onComplete(() => {
      this.activeAnimations.delete(animation);
    });
  }
  
  cleanup() {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }
}
```

이 가이드를 통해 Circly는 Gas 앱의 매끄러운 인터랙션을 능가하는 더욱 감성적이고 즐거운 사용자 경험을 제공할 수 있습니다! ✨