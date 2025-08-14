# Circly Design System

Circly는 중·고등학생을 위한 익명 칭찬 투표 플랫폼으로, **건전하고 긍정적인 Z세대 문화**를 반영하는 디자인 시스템을 가지고 있습니다.

## 📱 디자인 철학

### 핵심 가치
- **친근함**: 부드럽고 따뜻한 느낌으로 접근성 높이기
- **젊음**: Z세대가 선호하는 트렌디하고 세련된 감각
- **긍정성**: 밝고 희망적인 컬러와 표현으로 건전한 문화 조성
- **간결함**: 직관적이고 이해하기 쉬운 인터페이스

### 디자인 원칙
1. **Mobile First**: 스마트폰 사용에 최적화된 디자인
2. **Thumb-Friendly**: 엄지 영역 내 주요 버튼 배치
3. **Feedback Rich**: 모든 인터랙션에 즉각적인 피드백 제공
4. **Accessibility**: 색맹, 시각장애 등을 고려한 접근성 확보

## 🎨 컬러 시스템

### Primary Colors (주요 브랜드 컬러)
```css
--purple-500: #a855f7    /* Main Brand - 신뢰감과 창의성 */
--purple-600: #9333ea    /* Pressed State */
--purple-400: #c084fc    /* Hover State */
--purple-100: #f3e8ff    /* Background Light */
--purple-50: #faf5ff     /* Background Ultra Light */
```

### Secondary Colors (보조 컬러)
```css
--pink-500: #ec4899      /* Accent - 따뜻함과 친근함 */
--pink-400: #f472b6      /* Hover State */
--pink-100: #fce7f3      /* Background Light */
--pink-50: #fdf2f8       /* Background Ultra Light */

--blue-400: #60a5fa      /* Support - 신뢰감과 안정감 */
--blue-100: #dbeafe      /* Background Light */
--blue-50: #eff6ff       /* Background Ultra Light */
```

### Neutral Colors (중성 컬러)
```css
--gray-900: #111827      /* Headlines, Strong Text */
--gray-800: #1f2937      /* Body Text */
--gray-600: #4b5563      /* Secondary Text */
--gray-400: #9ca3af      /* Disabled Text */
--gray-200: #e5e7eb      /* Borders */
--gray-100: #f3f4f6      /* Background */
--gray-50: #f9fafb       /* Cards, Containers */
--white: #ffffff         /* Pure White */
```

### Status Colors (상태 컬러)
```css
--success: #10b981       /* 성공, 완료 상태 */
--warning: #f59e0b       /* 주의, 경고 상태 */
--error: #ef4444         /* 오류, 실패 상태 */
--info: #3b82f6          /* 정보, 안내 상태 */
```

### Gradient System (그라데이션)
```css
--gradient-primary: linear-gradient(135deg, #a855f7, #ec4899)
--gradient-secondary: linear-gradient(135deg, #ec4899, #f472b6)
--gradient-background: linear-gradient(135deg, #faf5ff, #fce7f3, #eff6ff)
--gradient-card: linear-gradient(135deg, #ffffff, #f9fafb)
```

### Color Usage Guidelines

#### Primary Usage
- **Purple**: 주요 액션 버튼, 브랜딩, 네비게이션 활성 상태
- **Pink**: 보조 액션, 좋아요/하트, 강조 포인트
- **Blue**: 링크, 정보성 버튼, 보조 CTA

#### Semantic Usage
- **투표 생성**: Purple Gradient
- **투표 참여**: Pink Gradient  
- **결과 확인**: Blue Gradient
- **Circle 초대**: Pink Solid

## ✍️ 타이포그래피

### Font Family
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

**선택 이유**: Pretendard는 한글과 영문이 모두 아름다운 현대적 폰트로, Z세대가 선호하는 깔끔하고 세련된 느낌을 제공합니다.

### Typography Scale
```css
/* Display */
--text-5xl: 3rem      /* 48px - 메인 헤딩 */
--text-4xl: 2.25rem   /* 36px - 서브 헤딩 */
--text-3xl: 1.875rem  /* 30px - 섹션 제목 */

/* Headings */
--text-2xl: 1.5rem    /* 24px - 카드 제목 */
--text-xl: 1.25rem    /* 20px - 컴포넌트 제목 */
--text-lg: 1.125rem   /* 18px - 중요한 텍스트 */

/* Body */
--text-base: 1rem     /* 16px - 기본 본문 */
--text-sm: 0.875rem   /* 14px - 보조 텍스트 */
--text-xs: 0.75rem    /* 12px - 캡션, 라벨 */
```

### Font Weights
```css
--font-light: 300     /* 가벼운 텍스트 */
--font-normal: 400    /* 기본 본문 */
--font-medium: 500    /* 중간 강조 */
--font-semibold: 600  /* 버튼, 링크 */
--font-bold: 700      /* 제목, 강조 */
--font-extrabold: 800 /* 메인 헤딩 */
```

### Line Heights
```css
--leading-none: 1      /* 제목용 (압축된 느낌) */
--leading-tight: 1.25  /* 서브 헤딩 */
--leading-normal: 1.5  /* 기본 본문 */
--leading-relaxed: 1.625 /* 긴 텍스트 */
```

### Typography Usage
```css
/* 예시 클래스들 */
.heading-1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

.body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-800);
}

.caption {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}
```

## 📐 Spacing & Layout

### Spacing Scale
```css
--space-px: 1px
--space-0: 0
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
```

### Container Sizes
```css
--container-sm: 640px   /* Small devices */
--container-md: 768px   /* Medium devices */
--container-lg: 1024px  /* Large devices */
--container-xl: 1280px  /* Extra large devices */

/* Circly는 모바일 앱이므로 주로 480px 이하 사용 */
--app-max-width: 480px
--app-min-width: 320px
```

### Grid System
```css
/* 12-column grid for larger layouts */
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### Safe Areas (모바일 최적화)
```css
/* iOS Safe Area 대응 */
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }

/* Thumb Zone (엄지 영역) */
.thumb-zone {
  margin-bottom: var(--space-16); /* 하단 64px 여백 확보 */
}
```

## 🔲 Component System

### Border Radius
```css
--radius-none: 0
--radius-sm: 0.125rem   /* 2px - 작은 요소 */
--radius-base: 0.25rem  /* 4px - 기본 */
--radius-md: 0.375rem   /* 6px - 입력 필드 */
--radius-lg: 0.5rem     /* 8px - 카드 */
--radius-xl: 0.75rem    /* 12px - 큰 카드 */
--radius-2xl: 1rem      /* 16px - 모달, 버튼 */
--radius-full: 9999px   /* 원형 */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

/* Colored Shadows */
--shadow-purple: 0 10px 15px -3px rgba(168, 85, 247, 0.2)
--shadow-pink: 0 10px 15px -3px rgba(236, 72, 153, 0.2)
--shadow-blue: 0 10px 15px -3px rgba(96, 165, 250, 0.2)
```

### Transitions
```css
--transition-fast: 150ms ease-out
--transition-normal: 300ms ease-out
--transition-slow: 500ms ease-out

/* Component Specific */
--transition-button: all 200ms ease-out
--transition-modal: all 300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-page: all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

## 🎭 Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-2xl);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-button);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--purple-600);
  border: 2px solid var(--purple-200);
  border-radius: var(--radius-2xl);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-button);
}

.btn-secondary:hover {
  background: var(--purple-50);
  border-color: var(--purple-300);
}
```

#### Vote Button
```css
.btn-vote {
  background: var(--gradient-secondary);
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-button);
  width: 100%;
}
```

### Cards

#### Poll Card
```css
.poll-card {
  background: var(--gradient-card);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-base);
  transition: var(--transition-normal);
  backdrop-filter: blur(10px);
}

.poll-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

#### Circle Card
```css
.circle-card {
  background: linear-gradient(135deg, var(--purple-50), var(--pink-50));
  border: 1px solid var(--purple-200);
  border-radius: var(--radius-2xl);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: var(--transition-normal);
}
```

### Forms

#### Input Fields
```css
.input-field {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  font-size: var(--text-base);
  color: var(--gray-800);
  transition: var(--transition-normal);
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
```

### Modals
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--space-6);
  width: 100%;
  max-width: var(--app-max-width);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp var(--transition-modal);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

## 📱 Mobile-Specific Guidelines

### Touch Targets
- **최소 터치 영역**: 44x44px (Apple HIG 권장)
- **편안한 터치 영역**: 48x48px 이상
- **주요 버튼**: 최소 56px 높이

### Gesture Support
```css
/* Swipe Gestures */
.swipeable {
  touch-action: pan-y;
  overscroll-behavior: none;
}

/* Pull to Refresh */
.pull-to-refresh {
  overscroll-behavior-y: contain;
}
```

### Safe Area Handling
```css
/* Bottom Navigation */
.bottom-nav {
  padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
}

/* Modal Bottom Spacing */
.modal-content {
  padding-bottom: max(var(--space-6), calc(env(safe-area-inset-bottom) + var(--space-4)));
}
```

## 🎨 Animation System

### Micro-interactions
```css
/* Tap Feedback */
@keyframes tapFeedback {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.interactive:active {
  animation: tapFeedback 150ms ease-out;
}

/* Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Page Transitions
```css
/* Slide Navigation */
.page-enter {
  transform: translateX(100%);
}

.page-enter-active {
  transform: translateX(0);
  transition: transform var(--transition-page);
}

.page-exit {
  transform: translateX(0);
}

.page-exit-active {
  transform: translateX(-100%);
  transition: transform var(--transition-page);
}
```

## 🌐 Responsive Breakpoints

```css
/* Mobile First Approach */
/* xs: 0px - 375px (Small phones) */
@media (max-width: 375px) {
  .container {
    padding: var(--space-4);
  }
}

/* sm: 376px - 480px (Regular phones) */
@media (min-width: 376px) and (max-width: 480px) {
  .container {
    padding: var(--space-5);
  }
}

/* md: 481px+ (Tablets and larger) */
@media (min-width: 481px) {
  .container {
    max-width: var(--app-max-width);
    margin: 0 auto;
    padding: var(--space-6);
  }
}
```

## ♿ Accessibility Guidelines

### Color Contrast
- **Normal text**: 최소 4.5:1 대비율
- **Large text**: 최소 3:1 대비율
- **Interactive elements**: 최소 3:1 대비율

### Focus Management
```css
/* Focus Outline */
.focusable:focus {
  outline: 2px solid var(--purple-500);
  outline-offset: 2px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--purple-600);
  color: white;
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 2000;
}

.skip-link:focus {
  top: 6px;
}
```

### Screen Reader Support
```css
/* Visually Hidden */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 🎯 Usage Examples

### Vote Button Implementation
```html
<button class="btn-vote" aria-label="김철수에게 투표하기">
  <span class="vote-target">김철수</span>
  <span class="vote-action">투표하기</span>
</button>
```

### Poll Card Implementation
```html
<article class="poll-card" role="article">
  <header class="poll-header">
    <h3 class="poll-question">가장 친절한 사람은?</h3>
    <div class="poll-meta">
      <span class="poll-status">진행중</span>
      <span class="poll-time">2시간 남음</span>
    </div>
  </header>
  <div class="poll-options">
    <!-- Options here -->
  </div>
</article>
```

## 📋 Implementation Checklist

### 필수 구현사항
- [ ] CSS Custom Properties 설정
- [ ] 기본 타이포그래피 스타일
- [ ] 버튼 컴포넌트 (Primary, Secondary, Vote)
- [ ] 카드 컴포넌트 (Poll, Circle, Result)
- [ ] 모달 시스템
- [ ] 폼 요소들
- [ ] 반응형 그리드
- [ ] 애니메이션 시스템

### 접근성 구현사항
- [ ] Focus Management
- [ ] ARIA Labels
- [ ] Color Contrast 확인
- [ ] Screen Reader 테스트
- [ ] Keyboard Navigation

### 성능 최적화
- [ ] Critical CSS 인라인화
- [ ] 사용하지 않는 스타일 제거
- [ ] 애니메이션 GPU 가속
- [ ] 압축 및 최적화

---

이 디자인 시스템을 통해 Circly의 **건전하고 긍정적인 Z세대 문화**를 반영하는 일관되고 아름다운 사용자 경험을 만들 수 있습니다. 🎨✨