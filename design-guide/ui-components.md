# UI Components Guide

Circly 앱의 주요 UI 컴포넌트들에 대한 상세 가이드입니다. 각 컴포넌트는 **Z세대 친화적**이고 **칭찬 문화**를 반영하도록 설계되었습니다.

## 🏠 Home Screen Components

### 1. Poll Card (투표 카드)
진행 중인 투표를 표시하는 메인 카드 컴포넌트입니다.

#### 구조
```
┌─────────────────────────────────────┐
│  🕒 2시간 남음              [진행중] │
│                                    │
│  가장 잘생긴 사람은? 👤             │
│                                    │
│  👥 총 12명 중 8명 참여              │
│  📊 ████████▒▒ 67%                │
│                                    │
│            [투표하기]              │
└─────────────────────────────────────┘
```

#### 상태별 디자인

**진행 중 투표**
- 배경: 밝은 그라데이션 (Purple → Pink)
- 테두리: 보라색 계열
- CTA 버튼: "투표하기" (핑크 그라데이션)

**완료된 투표**
- 배경: 중성 그라데이션 (Gray → White)
- 테두리: 회색 계열
- CTA 버튼: "결과 보기" (블루 그라데이션)

**내가 참여한 투표**
- 배경: 성공 그라데이션 (Green → Light Green)
- 좌상단에 체크마크 배지
- CTA 버튼: "결과 보기"

#### CSS Implementation
```css
.poll-card {
  background: var(--gradient-card);
  border: 1px solid var(--purple-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  position: relative;
  overflow: hidden;
  transition: var(--transition-normal);
}

.poll-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
}

.poll-card.completed {
  background: linear-gradient(135deg, var(--gray-50), white);
  border-color: var(--gray-300);
}

.poll-card.completed::before {
  background: var(--gray-400);
}

.poll-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.poll-question {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gray-900);
  margin: 0;
  line-height: var(--leading-tight);
}

.poll-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.poll-status {
  background: var(--purple-100);
  color: var(--purple-700);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.poll-status.completed {
  background: var(--gray-100);
  color: var(--gray-600);
}

.poll-time {
  font-size: var(--text-xs);
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
```

### 2. Empty State (빈 상태)
투표가 없을 때 표시되는 컴포넌트입니다.

#### 디자인
```
        🎉
    아직 투표가 없어요
   친구가 만든 투표를 기다리거나
   직접 투표를 만들어보세요!
   
      [투표 만들기]
```

#### CSS Implementation
```css
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  color: var(--gray-600);
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  display: block;
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-800);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}
```

## 🎯 Create Screen Components

### 3. Question Template Card
질문 템플릿을 선택하는 카드입니다.

#### 카테고리별 디자인

**외모 카테고리**
```
┌─────────────────────────────────────┐
│  ✨                          [외모] │
│  가장 잘생긴/예쁜 사람은?            │
│                                    │
│  💫 인기 질문  👥 127번 사용됨       │
└─────────────────────────────────────┘
```

**성격 카테고리**
```
┌─────────────────────────────────────┐
│  💝                          [성격] │
│  가장 친절한 사람은?                │
│                                    │
│  🔥 HOT!      👥 89번 사용됨        │
└─────────────────────────────────────┘
```

#### CSS Implementation
```css
.template-card {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
}

.template-card:hover {
  border-color: var(--purple-300);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.template-card.selected {
  border-color: var(--purple-500);
  background: var(--purple-50);
  box-shadow: var(--shadow-purple);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.template-icon {
  font-size: 1.5rem;
}

.template-category {
  background: var(--blue-100);
  color: var(--blue-700);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.template-question {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin-bottom: var(--space-4);
  line-height: var(--leading-normal);
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-popularity {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--orange-600);
  font-weight: var(--font-medium);
}

.template-usage {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--gray-500);
}
```

### 4. Deadline Selector
투표 마감 시간을 선택하는 컴포넌트입니다.

#### 디자인
```
┌─────────────────────────────────────┐
│  투표 마감 시간을 선택하세요 ⏰       │
│                                    │
│  ⭕ 1시간 후    ⚪ 3시간 후         │
│  ⚪ 6시간 후    ⚪ 24시간 후        │
└─────────────────────────────────────┘
```

#### CSS Implementation
```css
.deadline-selector {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}

.deadline-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gray-800);
  text-align: center;
  margin-bottom: var(--space-4);
}

.deadline-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.deadline-option {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: var(--font-medium);
}

.deadline-option:hover {
  border-color: var(--purple-300);
}

.deadline-option.selected {
  border-color: var(--purple-500);
  background: var(--purple-50);
  color: var(--purple-700);
}

.deadline-option-time {
  font-size: var(--text-sm);
  margin-bottom: var(--space-1);
}

.deadline-option-label {
  font-size: var(--text-xs);
  color: var(--gray-600);
}

.deadline-option.selected .deadline-option-label {
  color: var(--purple-600);
}
```

## 👤 Profile Screen Components

### 5. Circle List Item
사용자가 속한 Circle을 표시하는 리스트 아이템입니다.

#### 디자인
```
┌─────────────────────────────────────┐
│  👥 3학년 2반 친구들        [25/25] │
│      🎯 진행중인 투표 2개            │
│      ⏰ 3일 전 생성                  │
│                              [참여]  │
└─────────────────────────────────────┘
```

#### CSS Implementation
```css
.circle-item {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition-normal);
}

.circle-item:hover {
  border-color: var(--purple-300);
  box-shadow: var(--shadow-base);
}

.circle-info {
  flex: 1;
}

.circle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.circle-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.circle-count {
  font-size: var(--text-sm);
  color: var(--gray-500);
  font-weight: var(--font-medium);
}

.circle-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.circle-stat {
  font-size: var(--text-xs);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.circle-action {
  margin-left: var(--space-4);
}
```

### 6. Settings Section
설정 섹션 컴포넌트입니다.

#### 디자인
```
┌─────────────────────────────────────┐
│  🔔 알림 설정                       │
│                                    │
│  투표 시작 알림        [●─────] ON  │
│  마감 임박 알림        [●─────] ON  │
│  결과 발표 알림        [──────○] OFF│
│                                    │
│  📵 조용한 시간                     │
│  22:00 ~ 08:00         [──○───] ON  │
└─────────────────────────────────────┘
```

#### CSS Implementation
```css
.settings-section {
  background: white;
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-4);
  overflow: hidden;
  border: 1px solid var(--gray-200);
}

.settings-header {
  background: var(--gray-50);
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.settings-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.settings-item {
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: var(--text-sm);
  color: var(--gray-800);
  font-weight: var(--font-medium);
}

.setting-description {
  font-size: var(--text-xs);
  color: var(--gray-600);
  margin-top: var(--space-1);
}
```

## 🎨 Result Components

### 7. Result Chart
투표 결과를 표시하는 차트 컴포넌트입니다.

#### 디자인
```
┌─────────────────────────────────────┐
│  👑 김철수                     35%  │
│  ████████████████████▒▒▒▒▒▒▒▒▒▒▒   │
│                                    │
│  🥈 박영희                     28%  │
│  ██████████████████▒▒▒▒▒▒▒▒▒▒▒▒▒   │
│                                    │
│  🥉 이민수                     20%  │
│  ██████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   │
│                                    │
│  총 15명 참여                      │
└─────────────────────────────────────┘
```

#### CSS Implementation
```css
.result-chart {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  border: 1px solid var(--gray-200);
}

.chart-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
  gap: var(--space-3);
}

.chart-item:last-child {
  margin-bottom: 0;
}

.chart-rank {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

.chart-rank.first {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.chart-rank.second {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: var(--gray-700);
}

.chart-rank.third {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: var(--orange-800);
}

.chart-rank.other {
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: var(--text-xs);
}

.chart-info {
  flex: 1;
  min-width: 0;
}

.chart-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin-bottom: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.chart-name.winner {
  color: var(--purple-700);
}

.bar-container {
  height: 0.5rem;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.bar.first {
  background: var(--gradient-primary);
}

.bar.second {
  background: linear-gradient(135deg, var(--blue-400), var(--blue-500));
}

.bar.third {
  background: linear-gradient(135deg, var(--orange-400), var(--orange-500));
}

.bar.other {
  background: var(--gray-400);
}

.chart-percentage {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-700);
  flex-shrink: 0;
  width: 3rem;
  text-align: right;
}

.chart-footer {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--gray-600);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
}
```

### 8. Share Card Preview
공유용 결과 카드 미리보기입니다.

#### 디자인 (Instagram Story Size)
```
┌─────────────────────┐
│      Circly         │ 
│                     │
│   가장 친절한 사람은? │
│                     │
│   👑 김철수    35%   │
│   ████████████▒▒▒   │
│                     │
│   🥈 박영희    28%   │
│   ████████▒▒▒▒▒▒▒   │
│                     │
│   🥉 이민수    20%   │
│   ██████▒▒▒▒▒▒▒▒▒   │
│                     │
│   총 15명 참여       │
│                     │
│   circly.app        │
└─────────────────────┘
```

## 🎭 Interactive Components

### 9. Vote Option Button
투표 선택지 버튼입니다.

#### 상태별 디자인
```css
.vote-option {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  position: relative;
  overflow: hidden;
}

.vote-option:hover {
  border-color: var(--purple-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-base);
}

.vote-option.selected {
  border-color: var(--purple-500);
  background: var(--purple-50);
  box-shadow: var(--shadow-purple);
}

.vote-option.selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
}

.option-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.option-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--gray-800);
}

.vote-option.selected .option-name {
  color: var(--purple-700);
  font-weight: var(--font-semibold);
}

.option-check {
  margin-left: auto;
  color: var(--purple-500);
  font-size: 1.25rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.vote-option.selected .option-check {
  opacity: 1;
}
```

### 10. Tab Navigation
하단 탭 네비게이션입니다.

#### CSS Implementation
```css
.tab-navigation {
  background: white;
  border-top: 1px solid var(--gray-200);
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  color: var(--gray-600);
  text-decoration: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  min-width: 4rem;
}

.tab-item:hover {
  background: var(--gray-50);
  color: var(--gray-800);
}

.tab-item.active {
  color: var(--purple-600);
  background: var(--purple-50);
}

.tab-icon {
  font-size: 1.5rem;
  position: relative;
}

.tab-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.notification-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: var(--pink-500);
  color: white;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: var(--font-bold);
  animation: pulse 2s infinite;
}
```

## 🎨 Usage Guidelines

### Component Spacing
- 카드 간격: `var(--space-4)` (16px)
- 섹션 간격: `var(--space-6)` (24px)
- 요소 내부 패딩: `var(--space-5)` (20px)

### Interactive Feedback
- Hover: 2px translateY + shadow 증가
- Active: scale(0.95) 효과
- Focus: outline + 확대 효과

### Color Usage by Component
- **Poll Cards**: Purple 계열
- **Vote Buttons**: Pink 계열
- **Results**: Multi-color (Gold, Silver, Bronze)
- **Settings**: Blue/Gray 계열

이 컴포넌트 가이드를 통해 일관되고 직관적인 Circly 사용자 경험을 구현할 수 있습니다! ✨