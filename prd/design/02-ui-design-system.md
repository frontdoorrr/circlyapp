# Circly UI 컴포넌트 & 디자인 시스템

## 개요
Gas 앱의 깔끔하고 직관적인 UI를 벤치마킹하여 Circly만의 일관성 있고 확장 가능한 디자인 시스템을 구축하는 가이드입니다.

## 🎨 디자인 토큰 (Design Tokens)

### 1. 컬러 시스템

#### Primary Colors (Gas 앱 영감)
```css
:root {
  /* Brand Colors */
  --primary-50: #f3f4ff;
  --primary-100: #e8eaff;
  --primary-200: #d4d8ff;
  --primary-300: #b1b8ff;
  --primary-400: #8a92ff;
  --primary-500: #667eea; /* Main Brand */
  --primary-600: #5a6fd8;
  --primary-700: #4c5bc5;
  --primary-800: #3f4ba0;
  --primary-900: #36427d;

  /* Secondary Colors */  
  --secondary-50: #fdf2ff;
  --secondary-100: #fae8ff;
  --secondary-200: #f5d0fe;
  --secondary-300: #f0abfc;
  --secondary-400: #e879f9;
  --secondary-500: #764ba2; /* Secondary Brand */
  --secondary-600: #8b5cf6;
  --secondary-700: #7c3aed;
  --secondary-800: #6d28d9;
  --secondary-900: #5b21b6;
}
```

#### Semantic Colors
```css
:root {
  /* Success */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;

  /* Warning */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Error */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;

  /* Neutral (Gas 앱 스타일) */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;
}
```

#### Gradient System
```css
:root {
  /* Primary Gradients */
  --gradient-primary: linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%);
  --gradient-primary-soft: linear-gradient(135deg, var(--primary-100) 0%, var(--secondary-100) 100%);
  
  /* Emotion Gradients */
  --gradient-joy: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  --gradient-calm: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  --gradient-energy: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  --gradient-trust: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* Background Gradients */
  --gradient-bg-light: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
  --gradient-bg-dark: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}
```

### 2. 타이포그래피

#### Font Stack (한국어 최적화)
```css
:root {
  --font-family-primary: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  --font-family-mono: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
}
```

#### Type Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Font Weights */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --leading-loose: 2;
}
```

### 3. 간격 시스템 (Spacing)

#### 8pt Grid System
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
}
```

### 4. 반경 시스템 (Border Radius)

#### Gas 앱 스타일 라운드
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.375rem;   /* 6px */
  --radius-base: 0.5rem;   /* 8px */
  --radius-md: 0.75rem;    /* 12px */
  --radius-lg: 1rem;       /* 16px */
  --radius-xl: 1.25rem;    /* 20px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

### 5. 그림자 시스템 (Shadow / Elevation)

#### 기본 그림자
```css
:root {
  /* Neutral Shadows */
  --shadow-none: none;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-base: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 6px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.15);
  --shadow-2xl: 0 16px 32px rgba(0, 0, 0, 0.18);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);

  /* Brand Colored Shadows */
  --shadow-primary: 0 4px 14px rgba(102, 126, 234, 0.3);
  --shadow-primary-lg: 0 8px 25px rgba(102, 126, 234, 0.4);
  --shadow-secondary: 0 4px 14px rgba(118, 75, 162, 0.3);
  --shadow-success: 0 4px 14px rgba(34, 197, 94, 0.3);
  --shadow-error: 0 4px 14px rgba(239, 68, 68, 0.3);
}
```

#### Elevation 매핑 (React Native)
| Token | Elevation | 용도 |
|-------|-----------|------|
| `--shadow-none` | 0dp | 플랫 |
| `--shadow-xs` | 1dp | 미세 구분 |
| `--shadow-sm` | 2dp | 카드 기본 |
| `--shadow-base` | 4dp | 카드 호버 |
| `--shadow-md` | 6dp | 플로팅 요소 |
| `--shadow-lg` | 8dp | 모달, 드롭다운 |
| `--shadow-xl` | 12dp | 바텀시트 |
| `--shadow-2xl` | 16dp | 팝오버 |

### 6. Z-Index 스케일

```css
:root {
  --z-behind: -1;      /* 배경 요소 */
  --z-base: 0;         /* 기본 레이어 */
  --z-raised: 10;      /* 카드, 살짝 올라간 요소 */
  --z-dropdown: 100;   /* 드롭다운 메뉴 */
  --z-sticky: 200;     /* 고정 헤더/푸터 */
  --z-overlay: 300;    /* 오버레이 배경 */
  --z-modal: 400;      /* 모달 창 */
  --z-popover: 500;    /* 팝오버, 툴팁 */
  --z-toast: 600;      /* 토스트 알림 */
  --z-maximum: 9999;   /* 최상위 (로딩, 에러) */
}
```

### 7. 아이콘 사이즈 시스템

```css
:root {
  --icon-2xs: 12px;    /* 인라인 아이콘 */
  --icon-xs: 14px;     /* 작은 버튼 아이콘 */
  --icon-sm: 16px;     /* 리스트 아이콘 */
  --icon-base: 20px;   /* 기본 아이콘 */
  --icon-md: 24px;     /* 버튼/탭바 아이콘 */
  --icon-lg: 28px;     /* 강조 아이콘 */
  --icon-xl: 32px;     /* 빈 상태 아이콘 */
  --icon-2xl: 40px;    /* 큰 상태 아이콘 */
  --icon-3xl: 48px;    /* 히어로 아이콘 */
  --icon-4xl: 64px;    /* 온보딩 아이콘 */
}
```

### 8. 터치 타겟 & 접근성

```css
:root {
  /* 최소 터치 영역 (Apple HIG 기준) */
  --touch-min: 44px;
  --touch-comfortable: 48px;
  --touch-spacious: 56px;
}
```

#### 접근성 가이드라인
- 모든 인터랙티브 요소: 최소 44x44px 터치 영역
- 텍스트 색상 대비: 최소 4.5:1 (WCAG AA)
- 대형 텍스트 (18px+): 최소 3:1

## 🧱 기본 컴포넌트

### 1. 버튼 컴포넌트

#### Primary Button (Gas 앱 스타일)
```css
.btn-primary {
  /* Base Styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) var(--space-6);
  border: none;
  border-radius: var(--radius-xl);
  
  /* Typography */
  font-family: var(--font-family-primary);
  font-size: var(--text-base);
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
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: translateY(0);
}
```

#### Secondary Button (Skip, Shuffle 스타일)
```css
.btn-secondary {
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
}

.btn-secondary:hover {
  border-color: var(--primary-300);
  color: var(--primary-600);
  background: var(--primary-50);
}
```

### 2. 카드 컴포넌트

#### Vote Option Card (Gas 앱 레퍼런스)
```css
.vote-card {
  /* Layout */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  
  /* Appearance */
  background: white;
  border: 2px solid var(--gray-100);
  border-radius: var(--radius-2xl);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  user-select: none;
}

.vote-card:hover {
  border-color: var(--primary-200);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: scale(1.01);
}

.vote-card.selected {
  background: var(--gradient-primary);
  color: white;
  border-color: var(--primary-500);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transform: scale(1.02);
}

.vote-card.selected .vote-card-name {
  color: white;
}
```

#### Result Card
```css
.result-card {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: var(--space-4);
}

.result-bar-container {
  position: relative;
  height: 50px;
  background: var(--gray-100);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin: var(--space-3) 0;
}

.result-bar-fill {
  height: 100%;
  background: var(--gradient-joy);
  border-radius: var(--radius-xl);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.result-percentage {
  position: absolute;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  font-weight: var(--font-bold);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

### 3. 입력 컴포넌트

#### Text Input (닉네임 입력)
```css
.input-field {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  font-family: var(--font-family-primary);
  font-size: var(--text-base);
  color: var(--gray-900);
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: var(--gray-400);
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-field.error {
  border-color: var(--error-500);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.input-field.success {
  border-color: var(--success-500);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}
```

### 4. 모달 컴포넌트

#### Bottom Sheet (모바일 최적화)
```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
  padding: var(--space-6);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--gray-300);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-4);
}
```

## 📱 모바일 특화 컴포넌트

### 1. Tab Bar (Gas 앱 스타일)

#### 3-Tab Navigation
```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: white;
  border-top: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  color: var(--gray-400);
  transition: color 0.2s ease;
  text-decoration: none;
  min-width: 60px;
}

.tab-item.active {
  color: var(--primary-500);
}

.tab-icon {
  font-size: 24px;
  margin-bottom: var(--space-1);
}

.tab-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

### 2. Progress Indicator

#### Question Progress (Gas 앱 스타일)
```css
.progress-container {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-600);
  white-space: nowrap;
}
```

### 3. Notification Toast

#### Success/Error Feedback
```css
.toast {
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transform: translateY(-100px);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.toast.show {
  transform: translateY(0);
}

.toast.success {
  border-left: 4px solid var(--success-500);
}

.toast.error {
  border-left: 4px solid var(--error-500);
}

.toast.warning {
  border-left: 4px solid var(--warning-500);
}
```

## 🌙 다크 모드 지원

### Dark Theme Variables
```css
[data-theme="dark"] {
  /* Background Colors */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #404040;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #e5e5e5;
  --text-tertiary: #a3a3a3;
  
  /* Border Colors */
  --border-primary: #404040;
  --border-secondary: #525252;
  
  /* Component Overrides */
  --card-bg: var(--bg-secondary);
  --input-bg: var(--bg-tertiary);
}

/* Dark mode specific styles */
[data-theme="dark"] .vote-card {
  background: var(--card-bg);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .input-field {
  background: var(--input-bg);
  border-color: var(--border-primary);
  color: var(--text-primary);
}
```

## 📐 레이아웃 시스템

### 1. Container System
```css
.container {
  width: 100%;
  max-width: 480px; /* 모바일 최적화 */
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-fluid {
  width: 100%;
  padding: 0 var(--space-4);
}
```

### 2. Grid System (모바일 우선)
```css
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

/* 반응형 그리드 */
@media (min-width: 640px) {
  .sm\\:grid-2 { grid-template-columns: repeat(2, 1fr); }
  .sm\\:grid-3 { grid-template-columns: repeat(3, 1fr); }
}
```

### 3. Safe Area (iOS 최적화)
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-full {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## 🔧 유틸리티 클래스

### 1. 텍스트 유틸리티
```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-thin { font-weight: var(--font-thin); }
.font-normal { font-weight: var(--font-normal); }
.font-medium { font-weight: var(--font-medium); }
.font-bold { font-weight: var(--font-bold); }

.text-primary { color: var(--primary-500); }
.text-secondary { color: var(--gray-600); }
.text-success { color: var(--success-500); }
.text-error { color: var(--error-500); }
```

### 2. 간격 유틸리티
```css
.m-0 { margin: 0; }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-4 { margin: var(--space-4); }

.mt-0 { margin-top: 0; }
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }

.p-0 { padding: 0; }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-4 { padding: var(--space-4); }
```

### 3. 디스플레이 유틸리티
```css
.hidden { display: none; }
.block { display: block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }

.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
```

이 디자인 시스템을 통해 Circly는 Gas 앱의 깔끔한 UI를 바탕으로 더욱 세련되고 일관성 있는 사용자 인터페이스를 구축할 수 있습니다! 🎨