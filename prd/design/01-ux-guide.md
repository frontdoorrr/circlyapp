# Circly 핵심 UX 가이드

## 개요
Gas 앱 리서치를 바탕으로 한 Circly의 핵심 사용자 경험 설계 가이드입니다. 익명 투표 플랫폼에서 중요한 UX 원칙과 구체적인 구현 방안을 다룹니다.

## 🎯 핵심 UX 원칙

### 1. 즉각적 만족감 (Instant Gratification)
**Gas 벤치마킹**: 투표 즉시 피드백, 받은 반응을 모아보는 보상 시스템
```
원칙: 모든 액션은 0.5초 이내 피드백 제공
- 투표 선택 → 즉시 하이라이트 + 햅틱 피드백
- 투표 완료 → 실시간 결과 그래프 업데이트
- 선택받은 사용자 → 받은하트 탭 배지/알림으로 즉시 보상감 제공
```

### 2. 심리적 안전감 (Psychological Safety)
**Gas 벤치마킹**: 완전 익명성, 긍정적 질문만 제공
```
원칙: 사용자가 심리적 부담 없이 참여할 수 있는 환경
- 투표자 신원 절대 노출 금지
- Skip/Shuffle 기능으로 선택권 보장
- 외모/호감/크러시 질문은 허용하되, 선택받은 사람이 기분 좋아지는 긍정형 템플릿만 제공
- Orb Mode는 실명 공개가 아니라 단계형 안전 힌트로 제한
```

### 3. FOMO 기반 참여 유도 (FOMO-driven Engagement)
**Gas 벤치마킹**: 시간제 라운드, 실시간 알림
```
원칙: 놓치면 아쉬운 경험 설계
- 투표 마감 임박 알림 (1시간 전, 10분 전)
- 실시간 참여자 수 표시
- 결과 발표 시점 예고
```

### 4. 바이럴 친화적 설계 (Viral-friendly Design)
**Gas 벤치마킹**: 결과 카드 공유, 초대 링크 시스템
```
원칙: 자연스러운 공유 유도
- Instagram 스토리 최적화된 결과 카드
- 1클릭 공유 기능
- 초대 링크 생성 간소화
```

## 📱 화면별 UX 설계

### 1. 메인 투표 화면 (Core Voting Experience)

#### Gas 앱 레퍼런스 분석
- **레이아웃**: 중앙 질문 + 4개 카드형 선택지
- **인터랙션**: 터치 → 하이라이트 → Continue 버튼
- **보조 기능**: Skip, Shuffle 버튼

#### Circly 적용 방안
```javascript
// 투표 화면 구조
const VotingScreen = {
  header: {
    progressBar: "현재 질문 / 전체 질문",
    timer: "남은 시간 표시"
  },
  content: {
    question: {
      text: "가장 친절한 친구는?",
      emoji: "😊",
      category: "성격"
    },
    options: [
      { name: "김민수", selected: false },
      { name: "이지은", selected: false },
      { name: "박서준", selected: false },
      { name: "최하늘", selected: false }
    ]
  },
  controls: {
    skip: "이 질문 건너뛰기",
    shuffle: "선택지 섞기",
    continue: "다음으로" // 선택 후 활성화
  }
}
```

### 1-1. Home Play Lobby

#### Gas 앱 레퍼런스 분석
- **첫 화면 역할**: 정보 탐색보다 바로 질문을 풀게 만드는 시작점
- **CTA 집중**: 사용자가 해야 할 다음 행동을 하나로 좁힘
- **상태 전환**: 진행 가능, 쿨다운, 후보 부족 상태가 명확히 갈림

#### Circly 적용 방안
```javascript
const HomePlayLobby = {
  primaryAction: "투표 시작 / 이어하기",
  states: {
    ready: "오늘의 질문 세션 시작",
    cooldown: "다음 라운드까지 남은 시간 + 알림 CTA",
    notEnoughCandidates: "친구 초대 우선 화면",
    noCircle: "Circle 생성/초대 코드 입력"
  },
  secondary: {
    circleSwitcher: "Circle 전환",
    receivedHeartBadge: "받은하트 새 알림 요약"
  }
}
```

Home은 피드/대시보드가 아니라 Play Lobby로 설계한다. 사용자가 앱을 열었을 때 가장 먼저 보여야 하는 것은 통계나 긴 목록이 아니라 현재 바로 할 수 있는 투표 세션이다.

#### 인터랙션 플로우
```
1. 질문 카드 진입 (페이드 인 애니메이션)
2. 선택지 터치 (하이라이트 + 햅틱)
3. Continue 버튼 활성화 (부드러운 등장)
4. 다음 질문으로 전환 (슬라이드 애니메이션)
```

### 2. 투표 결과 화면 (Results & Feedback)

#### Gas 앱 레퍼런스 분석
- **즉시 피드백**: 투표 완료 즉시 축하 화면
- **보상 시스템**: 선택받은 반응을 아이콘/점수로 누적 표시
- **결과 시각화**: 실시간 그래프 업데이트

#### Circly 적용 방안
```javascript
const ResultScreen = {
  immediate: {
    celebration: "🎉 투표 완료!",
    feedback: "선택한 친구에게 하트가 전달되었어요",
    animation: "하트 날아가는 애니메이션"
  },
  results: {
    chart: "실시간 막대 그래프",
    percentages: "득표율 표시",
    totalVotes: "총 투표 수"
  },
  actions: {
    share: "결과 카드 공유하기",
    nextVote: "다른 투표 참여하기",
    createVote: "새 투표 만들기"
  }
}
```

### 3. 알림 및 피드백 시스템

#### Gas 앱 레퍼런스 분석
- **받은 반응 알림**: 선택받은 사람에게 즉시 알림
- **누적 표시**: Inbox에서 받은 반응 모아보기
- **궁금증 루프**: 어떤 맥락에서 선택받았는지 궁금하게 만들되, 안전한 범위 안에서 힌트 제공

#### Circly 적용 방안
```javascript
const NotificationSystem = {
  received: {
    type: "heart",
    message: "누군가 당신을 선택했어요! 💖",
    hint: "같은 Circle · 어제 저녁",
    destination: "InboxTab"
  },
  inbox: {
    dailyHearts: "오늘 받은 하트 수",
    unreadBadge: "새로 받은 하트 수",
    history: "받은 하트 히스토리"
  },
  premium: {
    mode: "Orb Mode",
    policy: "실명 공개 대신 단계형 안전 힌트",
    examples: ["Circle 힌트", "시간대 힌트", "이니셜 등 안전 검토된 힌트"]
  }
}
```

받은하트는 Profile 하위 기능이 아니라 4탭 구조의 독립 화면으로 둔다. 성별 색상 같은 민감한 추론 힌트는 기본 UX에서 제외하고, 성별/나이 등 선택 프로필 값은 공개 표시가 아니라 후보 로직에만 사용할 수 있다.

### 4. 대기 및 쿨다운 화면

#### Gas 앱 레퍼런스 분석
- **시간제 제한**: 1시간마다 새 질문 세트
- **카운트다운**: 다음 라운드까지 남은 시간 표시
- **초대 유도**: 대기 시간 중 친구 초대 독려

#### Circly 적용 방안
```javascript
const WaitingScreen = {
  status: {
    message: "다음 투표까지",
    countdown: "23:45",
    description: "새로운 질문이 곧 도착해요!"
  },
  alternatives: {
    invite: {
      title: "친구를 초대하면 더 재미있어요",
      action: "초대 링크 공유하기",
      benefit: "참여자가 많을수록 정확한 결과!"
    },
    explore: {
      title: "다른 Circle 둘러보기",
      action: "새로운 Circle 찾기"
    }
  },
  preview: {
    upcomingQuestions: "다음 질문 미리보기",
    newFeatures: "새로운 기능 소개"
  }
}
```

## 🎨 인터랙션 및 애니메이션

> **📌 Single Source of Truth**: 상세 애니메이션 정의 및 CSS 코드는 [`03-animations.md`](./03-animations.md)를 참조하세요.

### 핵심 애니메이션 원칙 (UX 관점)

**1. 마이크로 인터랙션**
- **터치 피드백**: 0.2s 내 즉각적 반응
- **선택 상태**: scale(1.02)로 선택됨 강조
- **로딩 상태**: shimmer 효과로 대기 상태 표현

**2. 화면 전환**
- **슬라이드 전환**: spring 효과로 자연스러운 이동
- **페이드 스케일**: 모달/오버레이 등장 시 사용

**3. 결과 표시**
- **막대 그래프**: 1s cubic-bezier로 부드러운 증가
- **실시간 업데이트**: shine 효과로 새로운 투표 강조

## 🎭 감정적 디자인 요소

### 1. 색상 시스템

> **📌 Single Source of Truth**: 상세 디자인 토큰은 [`02-ui-design-system.md`](./02-ui-design-system.md)를 참조하세요.

**핵심 감정 컬러 (UX 관점)**:
- **Primary Gradient**: 신뢰와 친근함을 전달 (`--gradient-primary`)
- **Heart Pink**: 칭찬과 따뜻함을 표현 (`--heart-pink: #ff6b9d`)
- **Joy Orange**: 기쁨과 활력을 표현 (`--joy-orange: #ffa726`)

### 2. 타이포그래피

> **📌 Single Source of Truth**: 폰트 스케일 및 CSS 정의는 [`02-ui-design-system.md`](./02-ui-design-system.md)를 참조하세요.

**UX 관점의 타이포 원칙**:
- **축하 메시지**: 그라디언트 텍스트로 특별함 표현
- **일반 텍스트**: 부드럽고 읽기 쉬운 스타일
- **한국어 최적화**: Pretendard Variable 사용

### 3. 이모지 및 아이콘 사용

#### 감정 표현을 위한 아이콘 시스템
```javascript
const emotionIcons = {
  voting: {
    heart: '💖',
    star: '⭐',
    thumbsUp: '👍',
    clap: '👏',
    fire: '🔥'
  },
  categories: {
    personality: '😊',
    appearance: '✨',
    talent: '🎨',
    friendship: '🤝',
    humor: '😄'
  },
  feedback: {
    celebration: '🎉',
    success: '✅',
    waiting: '⏰',
    notification: '🔔'
  }
};
```

## 📊 사용자 플로우 최적화

> **📌 Single Source of Truth**: 상세 화면별 플로우 및 버튼 액션은 [`04-user-flow.md`](./04-user-flow.md)를 참조하세요.

### 핵심 플로우 원칙 (UX 관점)

**1. 투표 참여**: 3단계, 6초 이내 완료
- 질문 확인 → 선택지 터치 → 결과 확인

**2. 받은하트 확인**: 2단계, 5초 이내 완료
- 받은하트 탭 진입 → 질문/무료 힌트 확인

**3. 라운드 완료/쿨다운**: 다음 행동을 1개 이상 제안
- 친구 초대 → 알림 허용 → 받은하트 확인

**4. 투표 생성/템플릿 관리**: 일반 사용자 핵심 탭에서 제외
- MVP는 관리자/검증된 템플릿 중심으로 운영한다. 사용자에게 노출되는 생성 진입점은 제한적으로 제공한다.

### 에러 상태 (UX 메시지)

| 상태 | 메시지 | 액션 |
|------|--------|------|
| 네트워크 오류 | "잠시 인터넷이 불안정해요" | 다시 시도하기 |
| 투표 마감 | "이 투표는 마감되었어요" | 다른 투표 보기 |
| 중복 투표 | "이미 투표했어요!" | 결과 확인하기 |

## 🚀 성능 및 최적화

### 1. 로딩 최적화

#### 콘텐츠 우선순위
```javascript
const loadingPriority = {
  critical: [
    'current_question',
    'vote_options',
    'user_vote_status'
  ],
  important: [
    'vote_results',
    'next_question_preview'
  ],
  optional: [
    'user_statistics',
    'sharing_options'
  ]
};
```

### 2. 오프라인 지원

#### 오프라인 상태 처리
```javascript
const offlineStrategy = {
  caching: {
    questions: '최근 질문 3개 캐시',
    results: '내 투표 결과 로컬 저장',
    profile: 'Profile 정보 캐시'
  },
  queueing: {
    votes: '투표는 온라인 상태에서 전송',
    shares: '공유 요청 대기열 관리'
  },
  feedback: {
    message: '오프라인 상태예요. 연결되면 자동 동기화할게요!',
    indicator: '상단 오프라인 배너 표시'
  }
};
```

이 UX 가이드를 통해 Gas 앱의 성공 요소를 벤치마킹하면서도 Circly의 안전한 칭찬 투표 경험을 유지합니다.

# 📱 Gas 앱 User Flow 스토리보드

## 1. Onboarding
- 화면: 학교 선택 / 연락처 접근 허용
- 액션: [내 학교 찾기], [연락처 동기화]
- 전환: → 메인 질문 화면

## 2. 메인 질문 화면
- 화면: 질문(긍정적 프롬프트) + 4명 카드 버튼
- 액션: [친구 선택], [Skip], [Shuffle]
- 전환: 선택 시 → 피드백 화면

## 3. 투표 피드백
- 화면: 하트 전달 피드백
- 액션: 자동 진행 또는 [Continue]
- 전환: → 다음 질문 OR 라운드 완료/쿨다운 화면

## 4. 받은하트
- 화면: "누군가 당신을 선택했어요" + 질문/서클/시간 힌트
- 액션: [확인], [Orb 힌트 보기]
- 전환: → 받은하트 상세 화면

## 5. 라운드 완료 / 쿨다운
- 화면: 다음 라운드까지 남은 시간, 초대 CTA, 알림 CTA
- 액션: [친구 초대], [알림 받기], [받은하트 보기]
- 전환: → 초대 공유 OR Inbox

## 6. Orb Mode (프리미엄)
- 화면: 받은하트 상세에서 안전 힌트 CTA
- 액션: [힌트 열기]
- 전환: → 단계형 힌트 제공 화면
