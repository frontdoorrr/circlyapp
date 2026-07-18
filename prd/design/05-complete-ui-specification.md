# Circly Complete UI Specification

> **목적**: 프론트엔드 구현을 위한 **화면별 픽셀 단위 상세 정의서**
> **기준 해상도**: iPhone 14 Pro (393 x 852pt, @3x = 1179 x 2556px)

---

## 1. Design Tokens 참조

> **📌 Single Source of Truth**: Design Tokens는 아래 문서들에서 정의됩니다.

### 참조 문서

| 토큰 카테고리 | 참조 문서 | 섹션 |
|--------------|----------|------|
| Color System | [`02-ui-design-system.md`](./02-ui-design-system.md) | 1. 컬러 시스템 |
| Gradient System | [`02-ui-design-system.md`](./02-ui-design-system.md) | Gradient System |
| Typography | [`02-ui-design-system.md`](./02-ui-design-system.md) | 2. 타이포그래피 |
| Spacing | [`02-ui-design-system.md`](./02-ui-design-system.md) | 3. 간격 시스템 |
| Border Radius | [`02-ui-design-system.md`](./02-ui-design-system.md) | 4. 반경 시스템 |
| Shadow / Elevation | [`02-ui-design-system.md`](./02-ui-design-system.md) | 5. 그림자 시스템 |
| Z-Index | [`02-ui-design-system.md`](./02-ui-design-system.md) | 6. Z-Index 스케일 |
| Icon Sizes | [`02-ui-design-system.md`](./02-ui-design-system.md) | 7. 아이콘 사이즈 |
| Touch Targets | [`02-ui-design-system.md`](./02-ui-design-system.md) | 8. 터치 타겟 |
| Duration | [`03-animations.md`](./03-animations.md) | Motion Design Tokens |
| Easing Curves | [`03-animations.md`](./03-animations.md) | Motion Design Tokens |
| Spring Config | [`03-animations.md`](./03-animations.md) | Motion Design Tokens |

### 이 문서의 범위

**이 문서에서 정의하는 내용:**
- 화면별 레이아웃 구조 (ASCII 다이어그램)
- 각 요소의 픽셀 단위 위치/크기 스펙
- 컴포넌트 상태별 스타일 (기본/호버/선택/비활성)
- Empty States & Error States
- Loading States
- Haptic Feedback 매핑

**다른 문서에서 정의하는 내용:**
- Design Tokens (컬러, 타이포, 간격 등) → `02-ui-design-system.md`
- Animation Keyframes & 인터랙션 → `03-animations.md`
- 사용자 플로우 & 화면 전환 → `04-user-flow.md`

---

## 2. Screen-by-Screen UI Specification

### 2.1 온보딩 - 초대 코드 입력 화면

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px on iPhone 14 Pro)   │
├─────────────────────────────────────────┤
│                                         │
│           [Back Button]                 │  ← 좌측 16px, 상단 8px
│                                         │
│                                         │
│              🎯 (64px)                  │  ← 이모지 아이콘
│                                         │
│         "Circle에 참여하기"             │  ← text-2xl, semibold
│                                         │
│    "친구에게 받은 초대 코드를            │  ← text-base, gray-500
│       입력해주세요"                     │
│                                         │
│    ┌─────────────────────────┐          │
│    │    [6자리 코드 입력]    │          │  ← 입력 필드
│    └─────────────────────────┘          │
│                                         │
│    "코드는 6자리 영문+숫자예요"         │  ← text-sm, gray-400
│                                         │
│                                         │
│                                         │
│    ┌─────────────────────────┐          │
│    │       참여하기          │          │  ← Primary Button
│    └─────────────────────────┘          │
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**헤더 영역**
- Safe Area Top: 59px (iPhone 14 Pro Dynamic Island)
- 뒤로가기 버튼: 44x44px, 좌측 여백 16px, 상단 여백 8px
- 아이콘: SF Symbol "chevron.left", 24px, gray-700

**콘텐츠 영역**
- 좌우 패딩: 24px
- 이모지: 64x64px, 상단 여백 48px
- 제목: "Circle에 참여하기"
  - Font: text-2xl (24px), font-semibold (600)
  - Color: gray-900
  - 상단 여백: 24px
- 설명: "친구에게 받은 초대 코드를 입력해주세요"
  - Font: text-base (16px), font-normal (400)
  - Color: gray-500
  - 상단 여백: 8px
  - Line height: 24px

**코드 입력 필드**
- 상단 여백: 32px
- 높이: 56px
- 배경: white
- 테두리: 2px solid gray-200
- Border Radius: 12px (radius-lg)
- 패딩: 16px 20px
- 플레이스홀더: "ABC123", gray-400
- 입력 텍스트: text-xl (20px), font-medium (500), gray-900
- 문자 간격: 8px (letter-spacing: 0.5em for 각 글자 분리 효과)
- 포커스 상태:
  - 테두리: 2px solid primary-500
  - 그림자: 0 0 0 4px rgba(139, 92, 246, 0.1)
  - 애니메이션: duration-fast, ease-out

**힌트 텍스트**
- 상단 여백: 8px
- Font: text-sm (14px), font-normal (400)
- Color: gray-400

**참여하기 버튼**
- 하단 고정, Safe Area Bottom 위 16px
- 좌우 여백: 24px
- 높이: 56px
- 배경: gradient-primary
- Border Radius: 16px (radius-xl)
- 텍스트: "참여하기"
  - Font: text-lg (18px), font-semibold (600)
  - Color: white
- 그림자: shadow-primary
- 비활성 상태:
  - 배경: gray-200
  - 텍스트: gray-400
  - 그림자: none

---

### 2.2 Home - 진행 중인 투표 화면

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  🔔  "Circle 이름"              👤      │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  진행 중인 투표 (3)                     │  ← 섹션 제목
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  😊 가장 친절한 사람은?           │  │  ← 투표 카드
│  │                                   │  │
│  │  ⏰ 2시간 23분 남음   👥 12명 참여 │  │
│  │                                   │  │
│  │  ████████████░░░░░░░░░   75%      │  │  ← 참여율 바
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  ✨ 가장 잘생긴/예쁜 사람은?      │  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🎨 가장 창의적인 사람은?         │  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  🏠      💖      👥      👤              │  ← 탭바
│  Home   받은하트  Circle  Profile        │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**헤더**
- 높이: 56px (Safe Area 제외)
- 배경: white
- 좌측: 알림 아이콘
  - 크기: 24px
  - 여백: 16px
  - 알림 뱃지: 8px 빨간 원, 우측 상단 -2px
- 중앙: Circle 이름
  - Font: text-lg (18px), font-semibold (600)
  - Color: gray-900
- 우측: Profile 아이콘
  - 크기: 32px
  - Border Radius: full
  - 여백: 16px

**섹션 제목**
- 좌측 여백: 20px
- 상단 여백: 16px
- Font: text-base (16px), font-semibold (600)
- Color: gray-700
- 숫자 뱃지:
  - 배경: primary-500
  - 텍스트: white, text-xs (12px), font-medium
  - 크기: 20px
  - Border Radius: full
  - 여백: 왼쪽 8px

**투표 카드**
- 좌우 여백: 16px
- 카드 간 간격: 12px
- 패딩: 20px
- 배경: white
- Border Radius: 20px (radius-2xl)
- 그림자: shadow-sm
- 터치 시:
  - 그림자: shadow-md
  - Scale: 0.98
  - Duration: 100ms

**카드 내부 - 질문**
- 이모지: 24px
- 질문 텍스트:
  - Font: text-lg (18px), font-semibold (600)
  - Color: gray-900
  - 상단 여백: 4px

**카드 내부 - 메타 정보**
- 상단 여백: 12px
- 아이콘: 16px, gray-400
- 텍스트: text-sm (14px), gray-500
- 간격: 16px

**카드 내부 - 참여율 바**
- 상단 여백: 12px
- 높이: 6px
- 배경: gray-100
- 진행 바: gradient-primary
- Border Radius: full
- 퍼센트 텍스트: text-sm, font-medium, primary-600

**탭바**
- 구성: 플로팅 글래스 캡슐 안의 Home/받은하트/Circle/Profile 4개 메뉴 + 우측 투표 세션 퀵 액션
- 위치: 화면 좌우 12px, Safe Area 하단에서 최소 16px 위
- 배경: thick glass surface. 다크 모드에서는 보라색 계열 tint와 반투명 흰색 테두리 사용
- 메뉴: 4개 균등 분배, 아이콘 22px, 라벨 text-xs
- 비활성: outline 아이콘 + `textSecondary`
- 활성: filled 아이콘 + 흰색, 라벨은 primary 색상 및 semibold
- 활성 인디케이터:
  - 36x36px 원형
  - 선택 탭의 아이콘 뒤에 배치
  - 탭 변경 시 `spring-stiff` 프리셋으로 좌우 슬라이드
- 받은하트 unread badge: 9 초과 시 `9+`로 표시
- 탭 선택 시 selection haptic 제공
- 본문 전환:
  - 위치 이동 없는 150ms cross-fade
  - 시스템 모션 감소 설정 활성화 시 애니메이션 없이 즉시 전환
- 퀵 액션: 세션 가능 시 sparkles, 쿨다운 시 hourglass. 비활성 상태에서는 탭할 수 없음

---

### 2.2A Inbox - 받은 하트 화면

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  받은 하트                       🔔     │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  오늘 받은 하트                         │
│  ┌───────────────────────────────────┐  │
│  │  💖 3                             │  │
│  │  친구들이 나를 선택했어요          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  최근 받은 하트                         │
│  ┌───────────────────────────────────┐  │
│  │  ✨ 우리 Circle 대표 고양이상은?   │  │
│  │  3명이 선택했어요 · 12분 전        │  │
│  │  3-2반 친구들                     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  💘 첫인상이 제일 설레는 사람은?   │  │
│  │  1명이 선택했어요 · 3시간 전       │  │
│  │  동아리 친구들                    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  🏠      💖      👥      👤              │
│  Home   받은하트  Circle  Profile        │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**목적**
- 받은 하트/칭찬을 Profile 하위가 아닌 1급 탭으로 노출한다.
- 사용자가 "누가 나를 선택했지?"보다 먼저 "어떤 칭찬을 받았는지"를 확인하게 한다.
- Orb Mode 진입은 상세 화면 또는 결과 화면의 보조 CTA로 둔다.

**헤더**
- 높이: 56px
- 좌측 제목: "받은 하트", text-xl, font-bold, gray-900
- 우측 알림 아이콘: 44x44px 터치 영역

**요약 카드**
- 좌우 여백: 16px
- 높이: 96px
- 배경: gradient-joy 또는 primary-50
- Border Radius: 20px
- 주요 숫자: text-4xl, font-bold
- 설명: text-sm, gray-600

**받은 하트 row**
- 좌우 여백: 16px
- 패딩: 18px
- 카드 간 간격: 12px
- 배경: white
- Border Radius: 16px
- unread 상태:
  - 좌측 6px primary-500 인디케이터
  - 질문 텍스트 font-semibold
- read 상태:
  - 인디케이터 없음
  - 메타 텍스트 gray-400

**row 탭 동작**
- 해당 투표 결과 화면으로 이동한다.
- 무료 상태에서는 보낸 사람 실명 대신 Circle명/시간대 힌트만 표시한다.
- Orb Mode CTA는 "힌트 더 보기" 수준으로 표현하고, 기본 UX를 가리지 않는다.

**Empty State**
```
┌─────────────────────────────────────────┐
│                                         │
│                💖                       │
│                                         │
│        아직 받은 하트가 없어요          │
│     투표에 참여하면 친구들도            │
│        나를 선택할 수 있어요            │
│                                         │
│    ┌─────────────────────────┐          │
│    │      투표하러 가기       │          │
│    └─────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

### 2.3 투표 - 질문 화면

#### 레이아웃 구조

#### 후보 부족 상태

투표 세션에서 서버 후보 API가 `NOT_ENOUGH_CANDIDATES`를 반환하면 질문 카드를 보여주지 않고 초대 우선 Empty State를 표시한다.

```
┌─────────────────────────────────────────┐
│                                         │
│        선택할 친구가 부족해요           │
│                                         │
│   4지선다 투표를 만들려면 이 Circle에   │
│        후보가 더 필요해요               │
│                                         │
│    ┌─────────────────────────┐          │
│    │      Circle 초대하기     │          │  ← primary
│    └─────────────────────────┘          │
│    ┌─────────────────────────┐          │
│    │    이 질문 건너뛰기      │          │  ← secondary
│    └─────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

동작:
- `Circle 초대하기`: 현재 Poll의 Circle 상세/초대 화면으로 이동한다.
- `이 질문 건너뛰기`: 현재 질문을 세션 큐에서 넘기고 다음 질문으로 이동한다.
- 후보 부족 화면에서는 빈 투표 카드, 비활성 후보 버튼, 로컬 임의 후보 보충을 사용하지 않는다.

#### 세션 완료/cooldown 상태

투표 세션이 마지막 질문까지 진행되면 서버가 `next_session_at`을 저장한다. 화면은 완료 피드백과 다음 행동을 함께 제공한다.

```
┌─────────────────────────────────────────┐
│                                         │
│                  ✓                      │
│                                         │
│        오늘 라운드는 여기까지           │
│                                         │
│   다음 세션까지 58분 남았어요           │
│   친구가 새로 참여하면 바로 열려요      │
│                                         │
│    ┌─────────────────────────┐          │
│    │      친구 초대하기       │          │  ← primary
│    └─────────────────────────┘          │
│    ┌─────────────────────────┐          │
│    │       알림 켜기          │          │  ← secondary
│    └─────────────────────────┘          │
│    ┌─────────────────────────┐          │
│    │       홈으로 가기        │          │  ← ghost
│    └─────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

동작:
- `친구 초대하기`: 세션이 특정 Circle에서 시작된 경우 해당 Circle 상세/초대 화면으로, 전체 세션이면 Circle 탭으로 이동한다.
- `알림 켜기`: OS 푸시 권한을 요청하고 발급된 Expo Push Token을 서버에 등록한다.
- `홈으로 가기`: Home 탭으로 이동한다.
- 쿨다운이 없거나 초대 성공으로 해제된 경우 설명은 "바로 다음 라운드를 시작할 수 있어요"로 바뀌고 Primary CTA는 `다음 세션 시작`으로 표시할 수 있다.

```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  ←  [닫기]              3/12            │  ← 헤더
│                                         │
│  ████████████████░░░░░░░░░░░░░░░░░░░   │  ← 진행바
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│               😊                        │  ← 이모지 (80px)
│                                         │
│       가장 친절한 사람은?               │  ← 질문 (text-2xl)
│                                         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │           김민수               │    │  ← 선택지 카드 1
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           이지은               │    │  ← 선택지 카드 2
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           박서준               │    │  ← 선택지 카드 3
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           최하늘               │    │  ← 선택지 카드 4
│  └─────────────────────────────────┘    │
│                                         │
│        [Skip]    [Shuffle]              │  ← 보조 버튼
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**헤더**
- 높이: 52px
- 닫기 버튼: 좌측 16px
  - 아이콘: "xmark", 24px
  - 터치 영역: 44x44px
- 진행 표시: 우측 16px
  - Font: text-base (16px), font-medium (500)
  - Color: gray-600

**진행 바**
- 상단 여백: 8px
- 좌우 여백: 16px
- 높이: 4px
- 배경: gray-200
- 진행: gradient-primary
- Border Radius: full
- 애니메이션:
  - Duration: 300ms
  - Easing: ease-out

**질문 영역**
- 이모지: 80x80px
- 상단 여백: 48px
- 질문 텍스트:
  - 상단 여백: 16px
  - Font: text-2xl (24px), font-bold (700)
  - Color: gray-900
  - Text Align: center
  - 좌우 패딩: 32px

**선택지 카드**
- 좌우 여백: 20px
- 카드 간 간격: 12px
- 높이: 64px
- 배경: white
- 테두리: 2px solid gray-200
- Border Radius: 20px (radius-2xl)
- 그림자: shadow-xs

**선택지 상태**
```
기본 상태:
- 배경: white
- 테두리: 2px solid gray-200
- 텍스트: gray-900

호버/터치 상태:
- 배경: primary-50
- 테두리: 2px solid primary-300
- Scale: 1.01
- Duration: 100ms

선택됨 상태:
- 배경: gradient-primary
- 테두리: 2px solid primary-500
- 텍스트: white
- 그림자: shadow-primary-lg
- Scale: 1.02
- Duration: 300ms, ease-bounce
```

**선택지 텍스트**
- Font: text-lg (18px), font-semibold (600)
- Text Align: center

**보조 버튼 영역**
- 하단 여백: Safe Area + 16px
- 버튼 간격: 12px
- 중앙 정렬

**Skip 버튼**
- 크기: auto x 44px
- 패딩: 0 24px
- 배경: transparent
- 테두리: 2px solid gray-300
- Border Radius: full
- 텍스트: "Skip", text-sm, font-medium, gray-600

**Shuffle 버튼**
- 크기: auto x 44px
- 패딩: 0 24px
- 배경: transparent
- 테두리: 2px solid gray-300
- Border Radius: full
- 아이콘: "shuffle", 16px
- 텍스트: "Shuffle", text-sm, font-medium, gray-600

---

### 2.4 투표 완료 - 축하 화면

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│               🎉                        │  ← 축하 이모지 (120px)
│                                         │
│           투표 완료!                    │  ← 제목
│                                         │
│     당신의 마음이 전달되었어요          │  ← 설명
│                                         │
│           💖 → → → 👤                  │  ← 하트 애니메이션
│                                         │
│                                         │
│                                         │
│    ┌─────────────────────────────┐      │
│    │       결과 보기             │      │  ← Primary Button
│    └─────────────────────────────┘      │
│                                         │
│    ┌─────────────────────────────┐      │
│    │      다른 투표 하기         │      │  ← Secondary Button
│    └─────────────────────────────┘      │
│                                         │
│ Safe Area Bottom                        │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**배경**
- 전체: gradient-bg-light 또는 gradient-trust (subtle)

**축하 이모지**
- 크기: 120x120px
- 위치: 상단에서 30% 지점
- 애니메이션:
  - 등장: scale 0 → 1.2 → 1
  - Duration: 600ms
  - Easing: ease-bounce
  - Delay: 200ms

**제목**
- 상단 여백: 24px
- Font: text-3xl (30px), font-bold (700)
- Color: gray-900
- Text Align: center

**설명**
- 상단 여백: 12px
- Font: text-base (16px), font-normal (400)
- Color: gray-500
- Text Align: center

**하트 애니메이션**
- 상단 여백: 40px
- 하트 크기: 32px
- 애니메이션:
  1. 하트 생성 (scale 0 → 1, 200ms)
  2. 이동 (x: 0 → 100px, 800ms)
  3. 도착 시 pulse 효과

**버튼 영역**
- 하단 고정: Safe Area + 16px
- 좌우 여백: 24px
- 버튼 간격: 12px

**결과 보기 버튼**
- 높이: 56px
- 배경: gradient-primary
- Border Radius: 16px
- 그림자: shadow-primary
- 텍스트: "결과 보기", text-lg, font-semibold, white

**다른 투표 버튼**
- 높이: 56px
- 배경: white
- 테두리: 2px solid gray-200
- Border Radius: 16px
- 텍스트: "다른 투표 하기", text-lg, font-medium, gray-600

---

### 2.5 결과 화면

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  ←           결과              [공유]   │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│            😊 가장 친절한               │  ← 질문
│               사람은?                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  1위  김민수                      │  │
│  │  ██████████████████████   45%    │  │  ← 1위 결과 바
│  │                                   │  │
│  │  2위  이지은                      │  │
│  │  ████████████████░░░░░░   32%    │  │  ← 2위 결과 바
│  │                                   │  │
│  │  3위  박서준                      │  │
│  │  ████████░░░░░░░░░░░░░░   15%    │  │
│  │                                   │  │
│  │  4위  최하늘                      │  │
│  │  ████░░░░░░░░░░░░░░░░░░    8%    │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│        총 12명 참여 · 마감됨            │  ← 메타 정보
│                                         │
│    ┌─────────────────────────────┐      │
│    │    📷  결과 카드 공유하기   │      │  ← 공유 버튼
│    └─────────────────────────────┘      │
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

#### 상세 스펙

**헤더**
- 높이: 56px
- 뒤로가기: 좌측 16px, 24px 아이콘
- 제목: "결과", text-lg, font-semibold, gray-900, 중앙
- 공유: 우측 16px, 24px 아이콘

**질문 영역**
- 상단 여백: 24px
- 이모지: 48px
- 질문:
  - Font: text-xl (20px), font-bold (700)
  - Color: gray-900
  - Text Align: center
  - 상단 여백: 12px

**결과 카드**
- 좌우 여백: 16px
- 상단 여백: 24px
- 패딩: 20px
- 배경: white
- Border Radius: 24px
- 그림자: shadow-base

**결과 항목**
- 항목 간 간격: 16px

**순위 뱃지**
- 1위: gradient-primary 배경, white 텍스트
- 2~4위: gray-100 배경, gray-600 텍스트
- 크기: 32px width, 24px height
- Border Radius: 6px
- Font: text-xs, font-bold

**이름**
- 좌측 여백: 12px
- Font: text-base (16px), font-semibold (600)
- Color: gray-900

**결과 바**
- 상단 여백: 8px
- 높이: 32px
- 배경: gray-100
- 진행 바:
  - 1위: gradient-joy (핑크)
  - 2~4위: gradient-calm (민트)
- Border Radius: full
- 애니메이션:
  - Width: 0% → 실제값
  - Duration: 800ms
  - Easing: ease-out
  - Stagger: 각 항목 100ms 딜레이

**퍼센트 텍스트**
- 바 우측 내부 또는 외부 (공간에 따라)
- Font: text-sm, font-bold
- Color: 바 내부시 white, 외부시 gray-600

**메타 정보**
- 상단 여백: 20px
- Font: text-sm (14px), font-normal (400)
- Color: gray-400
- Text Align: center

**공유 버튼**
- 상단 여백: 24px
- 좌우 여백: 24px
- 높이: 56px
- 배경: gradient-primary
- Border Radius: 16px
- 그림자: shadow-primary
- 아이콘: 카메라, 20px, 우측 여백 8px
- 텍스트: "결과 카드 공유하기", text-base, font-semibold, white

---

### 2.6 Create Tab - 투표 생성

> **UX 철학**: Gas 앱의 스와이프 카드 스타일을 적용하여 직관적이고 재미있는 투표 생성 경험 제공

#### 2.6.1 메인 화면 (카테고리 탐색)

##### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│         새 투표 만들기                  │  ← 제목 (text-2xl)
│                                         │
│    질문을 선택해서 투표를 시작해보세요   │  ← 부제 (text-sm)
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  😊 성격 관련                     │  │  ← 카테고리 카드 1
│  │  8개의 질문                       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  ✨ 외모 관련                     │  │  ← 카테고리 카드 2
│  │  6개의 질문                       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🎉 특별한 날                     │  │  ← 카테고리 카드 3
│  │  4개의 질문                       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🏆 능력 관련                     │  │  ← 카테고리 카드 4
│  │  5개의 질문                       │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  🏠        ➕        👤                 │  ← 탭바
│  Home       만들기    Profile              │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

##### 상세 스펙

**헤더**
- 상단 여백: 24px
- 제목: "새 투표 만들기"
  - Font: text-2xl (24px), font-bold (700)
  - Color: gray-900
  - Text Align: center
- 부제: "질문을 선택해서 투표를 시작해보세요"
  - Font: text-sm (14px), font-normal (400)
  - Color: gray-500
  - 상단 여백: 8px
  - Text Align: center

**카테고리 카드**
- 좌우 여백: 16px
- 카드 간 간격: 12px
- 패딩: 24px
- 배경: white
- Border Radius: 20px (radius-2xl)
- 그림자: shadow-sm
- 터치 시:
  - 그림자: shadow-lg
  - Scale: 0.98
  - Duration: --duration-fast (150ms)
  - Haptic: selection

**카드 내부**
- 이모지: 32px, 왼쪽 정렬
- 제목:
  - Font: text-lg (18px), font-semibold (600)
  - Color: gray-900
  - 왼쪽 여백: 12px (이모지 우측)
- 질문 개수:
  - Font: text-sm (14px), font-normal (400)
  - Color: gray-400
  - 상단 여백: 4px

**인터랙션**
- 카드 탭 → 2.6.2 질문 카드 스택 화면으로 슬라이드 전환
- 전환 애니메이션: slide-right, duration-normal (200ms)

---

#### 2.6.2 질문 선택 화면 (스와이프 카드)

> **Gas 앱 스타일**: Tinder처럼 카드를 스와이프하여 질문 탐색

##### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  ← [닫기]       성격 관련       [3/8]   │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│     ┌───────────────────────────┐       │
│     │                           │       │  ← 카드 스택 (뒷카드 2장 보임)
│   ┌─┼───────────────────────────┼─┐     │
│   │ │                           │ │     │
│ ┌─┼─┼───────────────────────────┼─┼─┐   │
│ │ │ │          😊               │ │ │   │
│ │ │ │                           │ │ │   │  ← 현재 카드 (최상단)
│ │ │ │   가장 친절한 친구는?     │ │ │   │
│ │ │ │                           │ │ │   │
│ │ │ │                           │ │ │   │
│ │ │ │      [선택하기]           │ │ │   │
│ └─┼─┼───────────────────────────┼─┼─┘   │
│   └─┼───────────────────────────┼─┘     │
│     └───────────────────────────┘       │
│                                         │
│                                         │
│         ⬅️  ❌  💖  ✅  ➡️            │  ← 액션 버튼
│                                         │
│                                         │
│  (← 스와이프하여 넘기기)                 │  ← 힌트 텍스트
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

##### 상세 스펙

**헤더**
- 높이: 56px
- 좌측: 뒤로가기 버튼
  - 아이콘: chevron-left, 24px
  - 터치 영역: 44x44px
  - 여백: 16px
- 중앙: 카테고리 이름
  - Font: text-lg (18px), font-semibold (600)
  - Color: gray-900
- 우측: 진행 표시 (3/8)
  - Font: text-sm (14px), font-medium (500)
  - Color: gray-500
  - 여백: 16px

**카드 스택**
- 중앙 정렬 (수평/수직)
- 최대 3장 표시 (현재 + 뒤 2장)
- 뒷카드 1: 8px 아래, 8px 작게, opacity 0.7
- 뒷카드 2: 16px 아래, 16px 작게, opacity 0.4

**현재 카드**
- 크기: 343px × 480px (기준: 393pt 화면)
- 배경: white
- Border Radius: 24px (radius-3xl)
- 그림자: shadow-2xl
- 패딩: 32px

**카드 내부**
- 이모지: 80px, 중앙 정렬, 상단 여백 40px
- 질문 텍스트:
  - Font: text-2xl (24px), font-bold (700)
  - Color: gray-900
  - Text Align: center
  - 상단 여백: 24px
  - Line height: 32px
- [선택하기] 버튼:
  - 하단 고정 (카드 내부 하단 32px)
  - 패딩: 16px 32px
  - 배경: gradient-primary
  - Border Radius: 12px
  - Font: text-base (16px), font-semibold (600)
  - Color: white
  - 그림자: shadow-primary

**스와이프 제스처**
- **좌측 스와이프 (←)**: 다음 질문으로 (카드가 왼쪽으로 사라짐)
  - 임계값: 100px
  - 애니메이션: spring, stiffness 300, damping 30
  - Haptic: impact-light
- **우측 스와이프 (→)**: 이전 질문으로 (첫 카드면 무시)
  - 임계값: 100px
  - Haptic: impact-light
- **위로 스와이프 (↑)**: 질문 선택 및 다음 단계로
  - 임계값: 80px
  - 애니메이션: scale + fade-out
  - Haptic: impact-medium

**액션 버튼**
- 버튼 간 간격: 12px
- 터치 영역: 48x48px
- 하단 여백: 40px

**버튼 상세:**
1. **⬅️ 이전 (회색)**
   - 아이콘: chevron-left, 24px
   - 배경: gray-100
   - Border: 2px solid gray-200
   - Border Radius: full
   - 탭 시: 이전 카드로

2. **❌ 건너뛰기 (빨강)**
   - 아이콘: xmark, 20px
   - 배경: red-50
   - Border: 2px solid red-200
   - Border Radius: full
   - 크기: 56px
   - 탭 시: 다음 카드로 (좌측 스와이프와 동일)

3. **💖 관심 표시 (분홍)**
   - 아이콘: heart-fill, 28px
   - 배경: gradient-primary (pink)
   - Border Radius: full
   - 크기: 64px (메인 버튼)
   - 그림자: shadow-lg
   - 탭 시: 질문 선택 + 다음 단계로
   - Haptic: impact-medium

4. **✅ 선택 (파랑)**
   - 아이콘: checkmark, 20px
   - 배경: primary-50
   - Border: 2px solid primary-200
   - Border Radius: full
   - 크기: 56px
   - 탭 시: 질문 선택 + 다음 단계로

5. **➡️ 다음 (회색)**
   - 아이콘: chevron-right, 24px
   - 배경: gray-100
   - Border: 2px solid gray-200
   - Border Radius: full
   - 탭 시: 다음 카드로

**힌트 텍스트**
- Font: text-xs (12px), font-normal (400)
- Color: gray-400
- Text Align: center
- 하단 여백: 20px
- Fade 애니메이션: 3초 후 자동 숨김

---

#### 2.6.3 투표 설정 화면

##### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  ← [뒤로]        투표 설정              │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📝 선택한 질문                         │
│  "😊 가장 친절한 친구는?"               │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ⏰ 투표 기간                           │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 1시간│ │ 3시간│ │ 6시간│ │ 24시간│  │  ← 선택 칩
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🎯 참여 대상                           │
│                                         │
│  ◉ Circle 전체 (15명)                  │  ← 라디오 옵션
│  ◯ 일부만 선택하기                     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📢 알림 설정                           │
│                                         │
│  ◉ 즉시 알림 보내기                    │  ← 라디오 옵션
│  ◯ 예약 발송                           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│    ┌─────────────────────────┐          │
│    │       미리보기           │          │  ← Primary Button
│    └─────────────────────────┘          │
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

##### 상세 스펙

**섹션 구분**
- 배경: gray-50
- 패딩: 16px 20px
- Border Bottom: 1px solid gray-100

**섹션 타이틀**
- 아이콘: 20px, 왼쪽 여백 0
- 텍스트:
  - Font: text-base (16px), font-semibold (600)
  - Color: gray-700
  - 왼쪽 여백: 8px (아이콘 우측)

**선택한 질문 (읽기 전용)**
- 배경: white
- 패딩: 16px
- Border Radius: 12px
- Font: text-lg (18px), font-medium (500)
- Color: gray-900
- 상단 여백: 12px

**투표 기간 선택 칩**
- 상단 여백: 16px
- 칩 간 간격: 8px
- 패딩: 12px 20px
- Border Radius: 12px
- Font: text-sm (14px), font-medium (500)
- 비선택:
  - 배경: white
  - 테두리: 1.5px solid gray-200
  - 텍스트: gray-600
- 선택:
  - 배경: primary-50
  - 테두리: 2px solid primary-500
  - 텍스트: primary-700
  - Haptic: selection

**라디오 옵션**
- 상단 여백: 16px
- 옵션 간 간격: 12px
- 패딩: 16px
- 배경: white
- Border Radius: 12px
- 터치 영역: 전체 행

**라디오 버튼**
- 크기: 20px
- 비선택: 테두리 2px solid gray-300, 배경 white
- 선택: 테두리 2px solid primary-500, 내부 점 12px primary-500
- Haptic: selection

**미리보기 버튼**
- 하단 고정, Safe Area Bottom 위 16px
- 좌우 여백: 20px
- 높이: 56px
- 배경: gradient-primary
- Border Radius: 16px
- 그림자: shadow-primary
- Font: text-lg (18px), font-semibold (600)
- Color: white

---

#### 2.6.4 미리보기 화면

##### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│  ← [뒤로]        미리보기               │  ← 헤더
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  투표가 이렇게 보여요                   │  ← 안내 텍스트
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │           😊                    │    │  ← 실제 투표 화면 프리뷰
│  │                                 │    │  (2.3 투표 질문 화면과 동일)
│  │     가장 친절한 친구는?         │    │
│  │                                 │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │       김민수              │  │    │
│  │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │       이지은              │  │    │
│  │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │       박서준              │  │    │
│  │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │       최하늘              │  │    │
│  │  └───────────────────────────┘  │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  ⏰ 6시간 후 마감                       │  ← 메타 정보
│  👥 Circle 전체 (15명)                 │
│  📢 즉시 알림 발송                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  수정하기   │  │  투표 시작  │      │  ← 액션 버튼
│  └─────────────┘  └─────────────┘      │
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

##### 상세 스펙

**안내 텍스트**
- Font: text-sm (14px), font-normal (400)
- Color: gray-500
- Text Align: center
- 상단 여백: 16px
- 하단 여백: 16px

**프리뷰 컨테이너**
- 좌우 여백: 20px
- 배경: gray-50
- Border Radius: 16px
- 패딩: 16px
- 내부: 2.3 투표 질문 화면의 축소판 (70% 스케일)

**메타 정보**
- 배경: white
- 패딩: 16px 20px
- Border Top/Bottom: 1px solid gray-100
- 아이콘: 16px
- Font: text-sm (14px), font-normal (400)
- Color: gray-600
- 줄 간격: 8px

**액션 버튼**
- 좌우 여백: 20px
- 버튼 간 간격: 12px
- 높이: 56px
- 하단 여백: Safe Area + 16px

**수정하기 버튼 (Secondary)**
- 배경: white
- 테두리: 2px solid gray-200
- Border Radius: 16px
- Font: text-lg (18px), font-semibold (600)
- Color: gray-700

**투표 시작 버튼 (Primary)**
- 배경: gradient-primary
- Border Radius: 16px
- 그림자: shadow-primary
- Font: text-lg (18px), font-semibold (600)
- Color: white
- Haptic: impact-medium

---

#### 2.6.5 발행 완료 화면

##### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ Safe Area Top (59px)                    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│                                         │
│              🎉                         │  ← 애니메이션 이모지 (120px)
│           (폭죽 터짐)                    │
│                                         │
│        투표가 시작되었어요!             │  ← Success 메시지
│                                         │
│                                         │
│       15명의 친구에게                   │  ← 상세 정보
│       알림을 보냈어요                   │
│                                         │
│                                         │
│          ████████                       │  ← 로딩 바 (3초)
│                                         │
│                                         │
│                                         │
│                                         │
│ Safe Area Bottom (34px)                 │
└─────────────────────────────────────────┘
```

##### 상세 스펙

**Success 애니메이션**
- 이모지: 🎉, 120px
- 애니메이션: scale bounce + rotate
  - From: scale 0.5, rotate -15deg
  - To: scale 1.2 → 1.0, rotate 15deg → 0deg
  - Duration: 600ms
  - Easing: spring (stiffness 200, damping 15)
- 중앙 정렬 (수평/수직)
- 주변 파티클 효과 (confetti)

**Success 메시지**
- Font: text-2xl (24px), font-bold (700)
- Color: gray-900
- Text Align: center
- 상단 여백: 32px

**상세 정보**
- Font: text-base (16px), font-normal (400)
- Color: gray-500
- Text Align: center
- 상단 여백: 12px
- Line height: 24px

**로딩 바 (자동 전환 표시)**
- 너비: 80px
- 높이: 4px
- 배경: gray-100
- 진행 바: gradient-primary
- Border Radius: full
- 중앙 정렬
- 상단 여백: 40px
- 애니메이션: 0% → 100% in 3초

**자동 전환**
- 3초 후 자동으로 Home 화면으로 전환
- 전환 애니메이션: fade-out (500ms)
- Haptic: notification-success

---

## 3. Animation Keyframes 참조

> **📌 Single Source of Truth**: 애니메이션 Keyframes 및 인터랙션 정의는 [`03-animations.md`](./03-animations.md)를 참조하세요.

**03-animations.md에서 정의하는 내용:**
- 🎯 Motion Design Tokens (Duration, Easing, Spring Config)
- 🎭 핵심 애니메이션 철학
- 📱 화면별 상세 애니메이션 (투표 선택, 결과 발표, 실시간 업데이트)
- 🎨 마이크로 인터랙션 (버튼, 입력 필드, 로딩)
- 🎪 특별 효과 및 이스터 에그
- 📱 반응형 및 접근성 (모션 감소 설정 지원)
- 🔧 성능 최적화 가이드

---

## 4. Haptic Feedback Map

| 인터랙션 | 햅틱 타입 | 용도 |
|---------|----------|------|
| 버튼 탭 | Impact Light | 일반 버튼 클릭 |
| 카드 선택 | Impact Medium | 투표 선택 |
| 스와이프 | Selection | 목록 스크롤 |
| 투표 완료 | Notification Success | 완료 축하 |
| 오류 발생 | Notification Error | 실패 알림 |
| 토글 변경 | Impact Light | 설정 변경 |
| 당겨서 새로고침 | Impact Heavy | 새로고침 시작 |
| 길게 누르기 | Impact Medium | 컨텍스트 메뉴 |

---

## 5. React Native / Expo 구현 가이드

> **참고**: 상세 토큰 값은 [`02-ui-design-system.md`](./02-ui-design-system.md)를 참조하세요.

### 5.1 테마 파일 구조

```
src/theme/
├── tokens.ts          # 디자인 토큰 (02-ui-design-system.md 기반)
├── animations.ts      # 애니메이션 설정 (03-animations.md 기반)
└── index.ts           # 통합 export
```

### 5.2 Reanimated 애니메이션 훅 예시

```typescript
// hooks/useVoteCardAnimation.ts
import { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated';

export function useVoteCardAnimation() {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 }); // --duration-faster
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 }); // spring-stiff
  };

  const onSelect = () => {
    scale.value = withSpring(1.02, { damping: 12, stiffness: 180 }); // spring-bouncy
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, onSelect, animatedStyle };
}
```

### 5.3 권장 파일 구조

```
src/
├── theme/              # 디자인 토큰
├── components/
│   ├── primitives/     # Button, Card, Input, Text
│   ├── patterns/       # VoteCard, ResultBar, ProgressBar
│   └── screens/        # 화면별 컴포넌트
├── hooks/
│   ├── useAnimation.ts
│   └── useTheme.ts
└── utils/
    ├── haptics.ts
    └── responsive.ts
```

---

## 6. Empty States

### 진행 중인 투표 없음

```
┌─────────────────────────────────────────┐
│                                         │
│               🗳️ (64px)                 │
│                                         │
│        진행 중인 투표가 없어요          │  ← text-lg, font-semibold, gray-700
│                                         │
│     새로운 투표를 만들거나               │  ← text-sm, gray-500
│     친구들이 투표를 시작하면             │
│        여기에 표시돼요!                 │
│                                         │
│    ┌─────────────────────────┐          │
│    │     투표 만들기          │          │  ← gradient-primary, 160x48px
│    └─────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

### 네트워크 오류

```
┌─────────────────────────────────────────┐
│                                         │
│               📡 (64px)                 │  ← warning-500
│                                         │
│        연결이 불안정해요                │
│                                         │
│     인터넷 연결을 확인하고              │
│        다시 시도해주세요                │
│                                         │
│    ┌─────────────────────────┐          │
│    │      다시 시도           │          │  ← gray-100 배경, gray-700 텍스트
│    └─────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. Loading States

### 스켈레톤 로딩

참고: 스켈레톤 애니메이션은 [`03-animations.md`](./03-animations.md)의 shimmer keyframe 사용

### 스피너 크기

| Size | Pixels | 용도 |
|------|--------|------|
| sm | 16px | 버튼 내부 |
| base | 24px | 일반 |
| lg | 32px | 페이지 로딩 |
| xl | 48px | 전체 화면 로딩 |

---

## 8. Accessibility Guidelines

### 터치 영역
- 모든 인터랙티브 요소: 최소 44x44px (`--touch-min`)
- 권장 터치 영역: 48x48px (`--touch-comfortable`)

### 색상 대비
- 텍스트: 최소 4.5:1 (WCAG AA)
- 대형 텍스트 (18px+): 최소 3:1
- UI 컴포넌트: 최소 3:1

### 모션 감소 지원

```typescript
import { useReducedMotion } from 'react-native-reanimated';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 200; // --duration-normal
  // ...
}
```

### 스크린 리더 지원
- 모든 이미지: `accessibilityLabel` 필수
- 버튼: `accessibilityRole="button"`
- 상태 변경: `accessibilityLiveRegion="polite"`

---

> **문서 버전**: 1.0.0
> **최종 수정**: 2024-12-19
> **작성자**: Design System Team
