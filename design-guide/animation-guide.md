# Animation & Motion Guide

Circly의 애니메이션 시스템은 **즐거움과 생동감**을 제공하여 Z세대 사용자들에게 매력적인 경험을 선사합니다. 모든 모션은 **자연스럽고 의미있는** 방향으로 설계됩니다.

## 🎭 애니메이션 철학

### 핵심 원칙
- **즐거움(Delight)**: 사용자에게 기쁨과 놀라움을 제공
- **피드백(Feedback)**: 모든 인터랙션에 명확한 응답
- **방향성(Direction)**: 사용자의 시선을 자연스럽게 유도
- **성능(Performance)**: 60fps 부드러운 애니메이션 유지

### 모션 특성
- **이징**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
- **지속시간**: 빠름(150ms), 보통(300ms), 느림(500ms)
- **거리**: 짧은 거리는 빠르게, 긴 거리는 천천히
- **크기**: 작은 요소는 빠르게, 큰 요소는 느리게

## ⚡ Timing & Easing

### Duration Scale
```css
:root {
  --duration-fast: 150ms;      /* 마이크로 인터랙션 */
  --duration-normal: 300ms;    /* 일반적인 전환 */
  --duration-slow: 500ms;      /* 복잡한 애니메이션 */
  --duration-page: 400ms;      /* 페이지 전환 */
  --duration-modal: 350ms;     /* 모달 표시/숨김 */
}
```

### Easing Functions
```css
:root {
  /* Material Design Easing */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);     /* 표준 */
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);     /* 감속 */
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);     /* 가속 */
  --ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);        /* 날카로운 */
  
  /* Custom Circly Easing */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);  /* 탄성 */
  --ease-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);    /* 부드러운 */
  --ease-energetic: cubic-bezier(0.23, 1, 0.32, 1);       /* 활기찬 */
}
```

### Usage Guidelines
```css
/* 사용 용도별 이징 */
.button-hover {
  transition: transform var(--duration-fast) var(--ease-gentle);
}

.page-transition {
  transition: transform var(--duration-page) var(--ease-standard);
}

.modal-entrance {
  animation: slideUp var(--duration-modal) var(--ease-decelerate);
}

.success-feedback {
  animation: bounceIn var(--duration-normal) var(--ease-bounce);
}
```

## 🎪 Entrance Animations

### Page Enter
페이지나 화면이 나타날 때 사용하는 애니메이션입니다.

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 사용 예시 */
.page-enter {
  animation: fadeInUp var(--duration-page) var(--ease-decelerate);
}

.modal-enter {
  animation: scaleIn var(--duration-modal) var(--ease-standard);
}
```

### Card Reveal
카드들이 차례로 나타나는 애니메이션입니다.

```css
@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Staggered Animation */
.poll-card:nth-child(1) {
  animation: cardReveal var(--duration-normal) var(--ease-decelerate) 0ms;
}
.poll-card:nth-child(2) {
  animation: cardReveal var(--duration-normal) var(--ease-decelerate) 100ms;
}
.poll-card:nth-child(3) {
  animation: cardReveal var(--duration-normal) var(--ease-decelerate) 200ms;
}

/* JavaScript 구현 */
.stagger-item {
  animation: cardReveal var(--duration-normal) var(--ease-decelerate);
  animation-fill-mode: both;
  animation-delay: calc(var(--stagger-index, 0) * 100ms);
}
```

## 🎯 Interaction Animations

### Button Press
버튼 터치 시 피드백 애니메이션입니다.

```css
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.btn-primary:active {
  animation: buttonPress var(--duration-fast) var(--ease-sharp);
}

/* Hover Effect */
.btn-primary {
  transition: all var(--duration-fast) var(--ease-gentle);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Vote Selection
투표 옵션 선택 시 애니메이션입니다.

```css
@keyframes voteSelect {
  0% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
  }
  70% { 
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(168, 85, 247, 0);
  }
  100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
  }
}

.vote-option.selected {
  animation: voteSelect var(--duration-normal) var(--ease-standard);
}

/* Checkmark 애니메이션 */
@keyframes checkmarkAppear {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-45deg);
  }
  50% {
    transform: scale(1.1) rotate(-45deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.vote-option.selected .checkmark {
  animation: checkmarkAppear var(--duration-normal) var(--ease-bounce);
}
```

### Tab Switch
탭 전환 애니메이션입니다.

```css
.tab-content {
  transition: opacity var(--duration-normal) var(--ease-standard);
}

.tab-content.entering {
  animation: slideInUp var(--duration-normal) var(--ease-decelerate);
}

.tab-content.exiting {
  animation: slideOutDown var(--duration-normal) var(--ease-accelerate);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
```

## 📊 Data Visualization Animations

### Chart Bar Growth
결과 차트의 막대가 자라나는 애니메이션입니다.

```css
@keyframes barGrowth {
  from {
    width: 0;
    opacity: 0.7;
  }
  to {
    width: var(--target-width);
    opacity: 1;
  }
}

.result-bar {
  animation: barGrowth var(--duration-slow) var(--ease-decelerate);
  animation-delay: calc(var(--bar-index, 0) * 150ms);
  animation-fill-mode: both;
}

/* JavaScript 구현 예시 */
function animateChart(chartData) {
  chartData.forEach((item, index) => {
    const bar = document.querySelector(`[data-bar="${index}"]`);
    bar.style.setProperty('--target-width', `${item.percentage}%`);
    bar.style.setProperty('--bar-index', index);
    bar.classList.add('animate');
  });
}
```

### Counter Animation
숫자 카운팅 애니메이션입니다.

```css
@keyframes countUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.counter-digit {
  display: inline-block;
  overflow: hidden;
  height: 1.5em;
}

.counter-digit span {
  display: block;
  animation: countUp var(--duration-slow) var(--ease-decelerate);
  animation-delay: calc(var(--digit-index, 0) * 50ms);
}
```

## 🎉 Feedback Animations

### Success Celebration
성공 시 축하 애니메이션입니다.

```css
@keyframes celebrate {
  0% { 
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% { 
    transform: scale(1.2) rotate(-90deg);
    opacity: 1;
  }
  100% { 
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.success-icon {
  animation: celebrate var(--duration-slow) var(--ease-bounce);
}

.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--purple-500);
  animation: confetti 3s var(--ease-standard) forwards;
  animation-delay: var(--delay, 0ms);
}
```

### Loading States
로딩 상태 애니메이션입니다.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes dots {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-pulse {
  animation: pulse 2s var(--ease-standard) infinite;
}

.loading-dots span:nth-child(1) {
  animation: dots 1.4s infinite 0s;
}
.loading-dots span:nth-child(2) {
  animation: dots 1.4s infinite 0.2s;
}
.loading-dots span:nth-child(3) {
  animation: dots 1.4s infinite 0.4s;
}

.loading-spinner {
  animation: spinner 1s linear infinite;
}
```

## 🌊 Continuous Animations

### Background Elements
배경에서 지속적으로 움직이는 요소들입니다.

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes drift {
  0% { transform: translateX(0px); }
  100% { transform: translateX(100vw); }
}

@keyframes glow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.floating-element {
  animation: float 4s var(--ease-gentle) infinite;
  animation-delay: var(--delay, 0s);
}

.drifting-element {
  animation: drift 15s linear infinite;
}

.glowing-element {
  animation: glow 3s var(--ease-standard) infinite;
}
```

### Notification Badge
알림 배지의 펄스 애니메이션입니다.

```css
@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.notification-badge {
  animation: badgePulse 2s var(--ease-standard) infinite;
}

.notification-badge.new {
  animation: badgePulse 1s var(--ease-standard) 3;
}
```

## 📱 Mobile-Specific Animations

### Pull to Refresh
당겨서 새로고침 애니메이션입니다.

```css
@keyframes pullIndicator {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(180deg); }
}

@keyframes refreshSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pull-indicator {
  transition: transform var(--duration-normal) var(--ease-standard);
}

.pull-indicator.flipped {
  animation: pullIndicator var(--duration-normal) var(--ease-standard);
}

.refresh-spinner {
  animation: refreshSpin 1s linear infinite;
}
```

### Swipe Feedback
스와이프 제스처 피드백입니다.

```css
@keyframes swipeReveal {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.swipe-action {
  animation: swipeReveal var(--duration-normal) var(--ease-decelerate);
}
```

## 🎮 Interactive Playground

### Hover Magnification
마우스 오버 시 확대 효과입니다.

```css
.interactive-element {
  transition: transform var(--duration-normal) var(--ease-gentle);
  cursor: pointer;
}

.interactive-element:hover {
  transform: scale(1.05);
}

.interactive-element:active {
  transform: scale(0.98);
}
```

### Magnetic Effect
마우스를 따라가는 자기장 효과입니다.

```css
.magnetic-button {
  transition: transform var(--duration-fast) var(--ease-standard);
}

/* JavaScript로 구현 */
function magneticEffect(element, event) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const deltaX = (event.clientX - centerX) * 0.1;
  const deltaY = (event.clientY - centerY) * 0.1;
  
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
}
```

## 🎨 Implementation Helpers

### CSS Animation Utils
```css
/* Animation Control */
.animate-none { animation: none !important; }
.animate-pause { animation-play-state: paused; }
.animate-running { animation-play-state: running; }

/* Animation Delays */
.delay-75 { animation-delay: 75ms; }
.delay-100 { animation-delay: 100ms; }
.delay-150 { animation-delay: 150ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-500 { animation-delay: 500ms; }

/* Animation Fill Modes */
.fill-none { animation-fill-mode: none; }
.fill-forwards { animation-fill-mode: forwards; }
.fill-backwards { animation-fill-mode: backwards; }
.fill-both { animation-fill-mode: both; }

/* Animation Durations */
.duration-75 { animation-duration: 75ms; }
.duration-100 { animation-duration: 100ms; }
.duration-150 { animation-duration: 150ms; }
.duration-200 { animation-duration: 200ms; }
.duration-300 { animation-duration: 300ms; }
.duration-500 { animation-duration: 500ms; }
.duration-700 { animation-duration: 700ms; }
.duration-1000 { animation-duration: 1000ms; }
```

### JavaScript Animation Helper
```javascript
// Animation utility class
class AnimationUtils {
  static animate(element, keyframes, options = {}) {
    const defaultOptions = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'both'
    };
    
    return element.animate(keyframes, { ...defaultOptions, ...options });
  }
  
  static fadeIn(element, duration = 300) {
    return this.animate(element, [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration });
  }
  
  static scaleIn(element, duration = 300) {
    return this.animate(element, [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration });
  }
  
  static slideUp(element, duration = 300) {
    return this.animate(element, [
      { transform: 'translateY(100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration });
  }
}

// Usage
AnimationUtils.fadeIn(document.querySelector('.poll-card'));
```

## 🚀 Performance Guidelines

### GPU Acceleration
```css
/* GPU 가속 속성들 */
.hardware-accelerated {
  transform: translateZ(0); /* 또는 will-change: transform; */
  backface-visibility: hidden;
  perspective: 1000px;
}

/* 애니메이션되는 요소에 적용 */
.animated-element {
  will-change: transform, opacity;
}

.animated-element.animation-complete {
  will-change: auto; /* 애니메이션 완료 후 제거 */
}
```

### Reduce Motion Support
```css
/* 접근성: 모션 감소 설정 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* 중요한 애니메이션만 유지 */
@media (prefers-reduced-motion: reduce) {
  .critical-animation {
    animation: none;
  }
  
  .loading-spinner {
    animation: spinner 1s linear infinite; /* 로딩은 유지 */
  }
}
```

## 📋 Animation Checklist

### 구현 체크리스트
- [ ] 모든 interactive 요소에 hover/active 상태
- [ ] 페이지 전환 애니메이션
- [ ] 모달 entrance/exit 애니메이션  
- [ ] 투표 선택 피드백
- [ ] 결과 차트 성장 애니메이션
- [ ] 로딩 상태 애니메이션
- [ ] 성공/실패 피드백
- [ ] 스크롤 기반 애니메이션 (선택사항)

### 성능 체크리스트
- [ ] `will-change` 적절히 사용/제거
- [ ] 60fps 유지 확인
- [ ] GPU 가속 속성 사용
- [ ] `prefers-reduced-motion` 지원
- [ ] 메모리 누수 방지
- [ ] 배터리 사용량 최적화

이 애니메이션 가이드를 통해 Circly만의 **생동감 있고 즐거운** 사용자 경험을 만들 수 있습니다! 🎭✨