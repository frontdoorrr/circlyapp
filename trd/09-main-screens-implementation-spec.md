# Circly 메인 화면 3개 구현 기획서

> **작성일**: 2024-12-28
> **버전**: 1.0.0
> **목적**: Home, Create, Profile 화면 상세 구현 가이드

---

## 📋 목차

1. [Home 화면 (Circle 목록 및 진행 중 투표)](#1-home-화면)
2. [Create 화면 (투표 생성)](#2-create-화면)
3. [Profile 화면 (사용자 정보 및 설정)](#3-profile-화면)
4. [공통 컴포넌트](#4-공통-컴포넌트)
5. [API 연동](#5-api-연동)
6. [상태 관리](#6-상태-관리)

---

## 1. Home 화면

**파일**: `app/(main)/(home)/index.tsx`

### 1.1 화면 구조

```
┌─────────────────────────────────────────┐
│ Safe Area Top                            │
├─────────────────────────────────────────┤
│                                         │
│  Circly                        🔔  👤  │  ← Header
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  내 Circle 목록                         │  ← Section Header
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎯 3-2반 친구들                   │  │
│  │ 👥 15명 · 📊 진행 중 2개          │  │  ← Circle Card
│  │ ⏰ 12시간 23분 남음                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🏀 농구부                         │  │
│  │ 👥 8명 · 📊 진행 중 1개           │  │
│  │ ⏰ 2일 5시간 남음                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ➕ Circle 참여하기                │  │  ← Join Button
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ [Home]      [Create]      [Profile]     │  ← Tab Bar
└─────────────────────────────────────────┘
```

### 1.2 주요 기능

#### A. Circle 목록 표시
```typescript
// useMyCircles 훅 사용
const { data: circles, isLoading, error } = useMyCircles();

// Circle 데이터 구조
interface CircleCardData {
  id: string;
  name: string;
  emoji?: string;
  memberCount: number;
  activePollCount: number;
  nextPollEndsAt?: string; // 가장 빨리 끝나는 투표 마감 시간
}
```

**표시 정보**:
- Circle 이름 (이모지 포함 가능)
- 멤버 수
- 진행 중인 투표 개수
- 가장 빠른 투표 마감 시간

**인터랙션**:
- 카드 탭 → Circle 상세 화면 이동 (`/circle/[id]`)
- 길게 누르기 → 빠른 액션 (Circle 나가기, 초대 코드 복사)

#### B. Circle 참여하기
```typescript
interface JoinCircleModalState {
  isOpen: boolean;
  inviteCode: string;
  nickname: string;
  isSubmitting: boolean;
}

const handleJoinCircle = async () => {
  await joinCircleMutation.mutateAsync({
    invite_code: inviteCode,
    nickname: nickname,
  });
  // 성공 시 Circle 목록 새로고침
};
```

**플로우**:
1. [➕ Circle 참여하기] 버튼 탭
2. Bottom Sheet 모달 표시
   - 초대 코드 입력 (6자리)
   - Circle 내 닉네임 입력
3. [참여하기] 버튼 탭
4. API 호출 → 성공 시 목록 갱신

#### C. Empty State
```typescript
// Circle이 하나도 없을 때
<EmptyState
  icon="😊"
  title="아직 참여한 Circle이 없어요"
  description="친구에게 초대 코드를 받아 참여하거나,\n새로운 Circle을 만들어보세요!"
  primaryAction={{
    label: "초대 코드 입력",
    onPress: openJoinModal
  }}
  secondaryAction={{
    label: "Circle 만드는 법 보기",
    onPress: openGuide
  }}
/>
```

### 1.3 컴포넌트 구조

```
HomeScreen
├── Header
│   ├── Logo
│   ├── NotificationBell (뱃지 포함)
│   └── ProfileAvatar
│
├── CircleList
│   ├── SectionHeader ("내 Circle 목록")
│   ├── CircleCard[] (map)
│   │   ├── CircleIcon (이모지)
│   │   ├── CircleName
│   │   ├── CircleStats (멤버 수, 투표 수)
│   │   └── NextPollTimer (가장 빠른 마감 시간)
│   │
│   └── JoinCircleButton
│
└── EmptyState (circles.length === 0)
```

**컴포넌트 파일 구조**:
```
src/components/home/
├── CircleCard.tsx
├── CircleList.tsx
├── JoinCircleModal.tsx
└── HomeEmptyState.tsx
```

### 1.4 API 연동

```typescript
// useMyCircles 훅 사용
const { data: circles, isLoading, isError, refetch } = useMyCircles();

// 각 Circle의 진행 중 투표 개수는 별도 API 필요
const { data: activePolls } = useActivePolls(circleId);

// 또는 백엔드에서 Circle 목록 API에 포함
// GET /api/v1/circles?include=active_polls_count
```

### 1.5 상태 관리

```typescript
// 로컬 상태
const [isJoinModalOpen, setJoinModalOpen] = useState(false);
const [selectedCircle, setSelectedCircle] = useState<string | null>(null);

// React Query 상태
const circles = useMyCircles(); // 자동 캐싱, 재요청
const joinMutation = useJoinCircle(); // 참여 뮤테이션
```

### 1.6 엣지 케이스

| 상황 | 처리 방법 |
|-----|----------|
| Circle 없음 | Empty State 표시 |
| 네트워크 에러 | 에러 메시지 + 재시도 버튼 |
| 로딩 중 | Skeleton UI 표시 |
| 초대 코드 만료 | "초대 코드가 만료되었습니다" 에러 |
| Circle 정원 초과 | "Circle이 가득 찼습니다" 에러 |
| 이미 참여한 Circle | "이미 참여 중인 Circle입니다" 에러 |

### 1.7 애니메이션

```typescript
// Circle 카드 진입 애니메이션
const fadeIn = useAnimatedStyle(() => ({
  opacity: withTiming(1, { duration: 300 }),
  transform: [
    { translateY: withSpring(0, animations.spring.responsive) }
  ]
}));

// 새로고침 애니메이션 (Pull to Refresh)
const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};
```

---

## 2. Create 화면

**파일**: `app/(main)/(create)/index.tsx`

### 2.1 화면 구조

```
┌─────────────────────────────────────────┐
│ Safe Area Top                            │
├─────────────────────────────────────────┤
│                                         │
│  투표 만들기                    [도움말] │  ← Header
│                                         │
├─────────────────────────────────────────┤
│ 1️⃣ Circle 선택                          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎯 3-2반 친구들              [✓]  │  │  ← Circle 선택
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ 2️⃣ 투표 질문 선택                       │
│                                         │
│  [외모] [성격] [재능] [특별]           │  ← 카테고리 탭
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💖 가장 웃음이 예쁜 친구는?        │  │
│  │ 사용 142회                         │  │  ← 템플릿 카드
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 😊 가장 밝은 친구는?              │  │
│  │ 사용 98회                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✏️ 직접 질문 작성하기             │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ 3️⃣ 투표 마감 시간                       │
│                                         │
│  [ 1시간 ] [ 3시간 ] [ 6시간 ] [24시간]│  ← Duration 선택
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │       투표 시작하기               │  │  ← Primary Button
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ [Home]      [Create]      [Profile]     │
└─────────────────────────────────────────┘
```

### 2.2 주요 기능

#### A. Circle 선택
```typescript
interface CreatePollState {
  selectedCircleId: string | null;
  selectedTemplateId: string | null;
  customQuestion: string | null;
  duration: PollDuration;
}

// Circle 선택 드롭다운
const { data: circles } = useMyCircles();
```

**플로우**:
1. 드롭다운 탭 → Circle 목록 표시
2. Circle 선택 → 선택 표시 (✓)
3. Circle 선택 후에만 다음 단계 활성화

#### B. 투표 템플릿 선택
```typescript
// 카테고리별 템플릿 조회
const { data: templates } = usePollTemplates(selectedCategory);

// 카테고리 타입
type TemplateCategory = 'APPEARANCE' | 'PERSONALITY' | 'TALENT' | 'SPECIAL';

// 템플릿 선택 처리
const handleSelectTemplate = (templateId: string) => {
  setSelectedTemplateId(templateId);
  setCustomQuestion(null); // 템플릿 선택 시 커스텀 질문 초기화
};
```

**카테고리**:
- 외모 (APPEARANCE): 💖, 😊, ✨
- 성격 (PERSONALITY): 🌟, 💪, 🎉
- 재능 (TALENT): 🎨, 🎵, ⚽
- 특별 (SPECIAL): 🏆, 🎁, 💝

**직접 질문 작성**:
```typescript
const handleCustomQuestion = () => {
  setShowCustomInput(true);
  setSelectedTemplateId(null);
};

// 커스텀 질문 입력 모달
<CustomQuestionModal
  isOpen={showCustomInput}
  value={customQuestion}
  onSubmit={(text) => {
    setCustomQuestion(text);
    setShowCustomInput(false);
  }}
  onClose={() => setShowCustomInput(false)}
/>
```

#### C. 마감 시간 선택
```typescript
type PollDuration = '1H' | '3H' | '6H' | '24H';

const DURATION_OPTIONS = [
  { value: '1H', label: '1시간' },
  { value: '3H', label: '3시간' },
  { value: '6H', label: '6시간' },
  { value: '24H', label: '24시간' },
];

// 선택된 duration 스타일 변경
const getDurationButtonStyle = (duration: PollDuration) => ({
  ...styles.durationButton,
  ...(selectedDuration === duration && styles.durationButtonActive)
});
```

#### D. 투표 생성
```typescript
const createPollMutation = useCreatePoll();

const handleCreatePoll = async () => {
  if (!selectedCircleId || (!selectedTemplateId && !customQuestion)) {
    Alert.alert('입력 오류', '모든 항목을 선택해주세요');
    return;
  }

  try {
    await createPollMutation.mutateAsync({
      circleId: selectedCircleId,
      data: {
        template_id: selectedTemplateId,
        question_text: customQuestion,
        duration: selectedDuration,
      }
    });

    // 성공 시 Home으로 이동
    router.replace('/(main)/(home)');

    // 성공 토스트
    Toast.show({
      type: 'success',
      text1: '투표가 시작되었어요!',
      text2: '친구들에게 알림이 전송되었습니다',
    });
  } catch (error) {
    // 에러 처리
  }
};
```

### 2.3 컴포넌트 구조

```
CreateScreen
├── Header
│   ├── Title ("투표 만들기")
│   └── HelpButton
│
├── CircleSelector
│   └── CircleDropdown
│
├── TemplateSelector
│   ├── CategoryTabs
│   │   └── CategoryTab[] (APPEARANCE, PERSONALITY, etc.)
│   │
│   ├── TemplateList
│   │   └── TemplateCard[]
│   │
│   └── CustomQuestionButton
│
├── DurationSelector
│   └── DurationButton[] (1H, 3H, 6H, 24H)
│
└── CreateButton
```

**컴포넌트 파일 구조**:
```
src/components/create/
├── CircleSelector.tsx
├── CategoryTabs.tsx
├── TemplateCard.tsx
├── TemplateList.tsx
├── DurationSelector.tsx
└── CustomQuestionModal.tsx
```

### 2.4 API 연동

```typescript
// Circle 목록
const { data: circles } = useMyCircles();

// 템플릿 목록 (카테고리별)
const { data: templates } = usePollTemplates(category);

// 투표 생성
const createMutation = useCreatePoll();
```

### 2.5 유효성 검증

```typescript
// 버튼 활성화 조건
const isCreateEnabled =
  !!selectedCircleId &&
  (!!selectedTemplateId || !!customQuestion?.trim()) &&
  !!selectedDuration;

// 커스텀 질문 검증
const validateCustomQuestion = (text: string) => {
  if (text.length < 5) {
    return '질문은 최소 5자 이상이어야 합니다';
  }
  if (text.length > 50) {
    return '질문은 최대 50자까지 가능합니다';
  }
  return null;
};
```

### 2.6 엣지 케이스

| 상황 | 처리 방법 |
|-----|----------|
| Circle 없음 | "먼저 Circle에 참여하세요" 메시지 |
| 템플릿 로딩 실패 | 기본 템플릿 표시 + 재시도 |
| 중복 투표 생성 시도 | "이미 진행 중인 투표가 있습니다" 경고 |
| 네트워크 에러 | "투표 생성 실패" + 재시도 |
| Circle 권한 없음 | "투표를 만들 수 없는 Circle입니다" |

### 2.7 애니메이션

```typescript
// 스텝별 진입 애니메이션
const stepAnimation = useAnimatedStyle(() => ({
  opacity: withTiming(1, { duration: 300 }),
  transform: [{ scale: withSpring(1, animations.spring.responsive) }]
}));

// 템플릿 카드 선택 애니메이션
const cardPressAnimation = {
  scale: withSpring(0.95),
  // 선택 시 하이라이트
};
```

---

## 3. Profile 화면

**파일**: `app/(main)/(profile)/index.tsx`

### 3.1 화면 구조

```
┌─────────────────────────────────────────┐
│ Safe Area Top                            │
├─────────────────────────────────────────┤
│                                         │
│  Profile                        [편집]   │  ← Header
│                                         │
├─────────────────────────────────────────┤
│                                         │
│           ┌─────────┐                   │
│           │   😊    │                   │  ← Profile Emoji
│           └─────────┘                   │
│                                         │
│           김철수                         │  ← Display Name
│           @chulsoo                      │  ← Username
│                                         │
├─────────────────────────────────────────┤
│ 내 Circle                               │
│                                         │
│  🎯 3-2반 친구들 (15명)                 │
│  🏀 농구부 (8명)                        │
│  🎨 미술부 (12명)                       │
│                                         │
│  총 3개 Circle 참여 중                  │
│                                         │
├─────────────────────────────────────────┤
│ 설정                                    │
│                                         │
│  🔔 알림 설정                  [>]      │
│  🌙 다크 모드                  [토글]   │
│  ℹ️  앱 정보                   [>]      │
│  📧 문의하기                   [>]      │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │       로그아웃                    │  │  ← Logout Button
│  └───────────────────────────────────┘  │
│                                         │
│  계정 삭제                              │  ← Delete Account
│                                         │
├─────────────────────────────────────────┤
│ [Home]      [Create]      [Profile]     │
└─────────────────────────────────────────┘
```

### 3.2 주요 기능

#### A. 사용자 정보 표시
```typescript
// 현재 사용자 조회
const { data: user, isLoading } = useCurrentUser();

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  circles_count: number;
}
```

**표시 정보**:
- Profile 이모지
- 표시 이름 (display_name 또는 username)
- 사용자명 (@username)
- 참여 중인 Circle 수

#### B. Profile 편집
```typescript
const [isEditing, setIsEditing] = useState(false);
const updateProfileMutation = useUpdateProfile();

const handleUpdateProfile = async (data: UserUpdate) => {
  try {
    await updateProfileMutation.mutateAsync({
      username: data.username,
      display_name: data.display_name,
      profile_emoji: data.profile_emoji,
    });

    setIsEditing(false);
    Toast.show({
      type: 'success',
      text1: 'Profile이 업데이트되었습니다',
    });
  } catch (error) {
    // 에러 처리
  }
};
```

**편집 모달**:
```typescript
<ProfileEditModal
  isOpen={isEditing}
  initialData={{
    username: user?.username,
    display_name: user?.display_name,
    profile_emoji: user?.profile_emoji,
  }}
  onSubmit={handleUpdateProfile}
  onClose={() => setIsEditing(false)}
/>
```

#### C. Circle 목록
```typescript
// 내 Circle 목록 표시
const { data: circles } = useMyCircles();

// Circle 간단 정보
const CircleListItem = ({ circle }) => (
  <TouchableOpacity onPress={() => navigateToCircle(circle.id)}>
    <View style={styles.circleItem}>
      <Text>{circle.name}</Text>
      <Text>{circle.member_count}명</Text>
    </View>
  </TouchableOpacity>
);
```

#### D. 로그아웃
```typescript
const logoutMutation = useLogout();

const handleLogout = () => {
  Alert.alert(
    '로그아웃',
    '정말 로그아웃하시겠습니까?',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logoutMutation.mutateAsync();
          router.replace('/(auth)/login');
        }
      }
    ]
  );
};
```

#### E. 설정 메뉴
```typescript
// 알림 설정
const handleNotificationSettings = () => {
  router.push('/settings/notifications');
};

// 다크 모드 토글
const { toggleTheme, isDark } = useTheme();

// 앱 정보
const handleAppInfo = () => {
  router.push('/settings/about');
};

// 문의하기
const handleSupport = async () => {
  const email = 'support@circly.app';
  const subject = '문의사항';
  const url = `mailto:${email}?subject=${subject}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  }
};
```

### 3.3 컴포넌트 구조

```
ProfileScreen
├── Header
│   ├── Title ("Profile")
│   └── EditButton
│
├── ProfileInfo
│   ├── EmojiAvatar
│   ├── DisplayName
│   └── Username
│
├── CircleSection
│   ├── SectionHeader ("내 Circle")
│   ├── CircleListItem[]
│   └── CircleCount
│
├── SettingsSection
│   ├── SectionHeader ("설정")
│   ├── NotificationSetting
│   ├── DarkModeToggle
│   ├── AppInfoButton
│   └── SupportButton
│
├── LogoutButton
│
└── DeleteAccountButton
```

**컴포넌트 파일 구조**:
```
src/components/profile/
├── ProfileHeader.tsx
├── ProfileInfo.tsx
├── ProfileEditModal.tsx
├── CircleListItem.tsx
├── SettingItem.tsx
└── LogoutButton.tsx
```

### 3.4 API 연동

```typescript
// 사용자 정보 조회
const { data: user } = useCurrentUser();

// Profile 수정
const updateMutation = useUpdateProfile();

// Circle 목록
const { data: circles } = useMyCircles();

// 로그아웃
const logoutMutation = useLogout();
```

### 3.5 상태 관리

```typescript
// 로컬 상태
const [isEditing, setIsEditing] = useState(false);
const [editedProfile, setEditedProfile] = useState<UserUpdate>({});

// React Query 상태 (자동 동기화)
const user = useCurrentUser();
const circles = useMyCircles();

// Zustand 인증 상태
const { user: authUser, logout } = useAuthStore();
```

### 3.6 엣지 케이스

| 상황 | 처리 방법 |
|-----|----------|
| 사용자 정보 로딩 실패 | 재시도 버튼 표시 |
| Circle 없음 | "참여한 Circle이 없습니다" 메시지 |
| Profile 수정 실패 | 에러 메시지 + 재시도 |
| 네트워크 끊김 | 캐시된 데이터 표시 + 오프라인 표시 |
| 로그아웃 실패 | 강제 로컬 로그아웃 + 재로그인 유도 |

### 3.7 애니메이션

```typescript
// Profile 이모지 애니메이션
const emojiScale = useSharedValue(1);

useEffect(() => {
  emojiScale.value = withSequence(
    withSpring(1.2),
    withSpring(1)
  );
}, [user]);

// 설정 메뉴 진입 애니메이션
const slideIn = useAnimatedStyle(() => ({
  transform: [
    { translateX: withSpring(0, animations.spring.responsive) }
  ]
}));
```

---

## 4. 공통 컴포넌트

### 4.1 EmptyState
```typescript
// src/components/states/EmptyState.tsx
interface EmptyStateProps {
  icon: string; // 이모지
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}
```

### 4.2 LoadingSpinner
```typescript
// src/components/states/LoadingSpinner.tsx
// 이미 구현되어 있음
```

### 4.3 ErrorView
```typescript
// src/components/states/ErrorView.tsx
interface ErrorViewProps {
  title: string;
  message: string;
  onRetry?: () => void;
}
```

### 4.4 BottomSheet
```typescript
// src/components/primitives/BottomSheet.tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: string[];
}
```

---

## 5. API 연동

### 5.1 Home 화면

```typescript
// Circle 목록
GET /api/v1/circles
Response: CircleResponse[]

// 각 Circle의 진행 중 투표 개수 (백엔드 수정 필요)
GET /api/v1/circles?include=active_polls_count

// Circle 참여
POST /api/v1/circles/join/code
Request: { invite_code, nickname }
Response: CircleResponse
```

### 5.2 Create 화면

```typescript
// 템플릿 목록
GET /api/v1/polls/templates?category={APPEARANCE|PERSONALITY|TALENT|SPECIAL}
Response: PollTemplateResponse[]

// 투표 생성
POST /api/v1/polls/circles/{circle_id}/polls
Request: { template_id, duration, question_text? }
Response: PollResponse
```

### 5.3 Profile 화면

```typescript
// 현재 사용자 정보
GET /api/v1/auth/me
Response: UserResponse

// Profile 수정
PUT /api/v1/auth/me
Request: { username?, display_name?, profile_emoji? }
Response: UserResponse
```

---

## 6. 상태 관리

### 6.1 React Query 캐시 전략

```typescript
// Home 화면
useMyCircles: staleTime: 2분, refetchOnMount: true

// Create 화면
usePollTemplates: staleTime: 10분 (템플릿은 자주 변경 안됨)

// Profile 화면
useCurrentUser: staleTime: 5분
```

### 6.2 낙관적 업데이트

```typescript
// Circle 참여 시
const joinMutation = useJoinCircle({
  onMutate: async (newCircle) => {
    // 기존 캐시 취소
    await queryClient.cancelQueries(['circles', 'my']);

    // 이전 값 저장
    const previousCircles = queryClient.getQueryData(['circles', 'my']);

    // 낙관적 업데이트
    queryClient.setQueryData(['circles', 'my'], (old) =>
      [...old, newCircle]
    );

    return { previousCircles };
  },
  onError: (err, newCircle, context) => {
    // 에러 시 롤백
    queryClient.setQueryData(['circles', 'my'], context.previousCircles);
  },
  onSettled: () => {
    // 완료 후 재검증
    queryClient.invalidateQueries(['circles', 'my']);
  }
});
```

---

## 7. 구현 순서

### Phase 1: 기본 화면 (1-2일)
1. ✅ Home 화면 - 기본 구조, Circle 목록
2. ✅ Profile 화면 - 사용자 정보, 로그아웃
3. ✅ Create 화면 - 기본 구조, Circle 선택

### Phase 2: 기능 완성 (2-3일)
1. Home - Circle 참여 기능
2. Create - 템플릿 선택, 투표 생성
3. Profile - Profile 수정

### Phase 3: 세부 기능 (1-2일)
1. Empty States
2. Error States
3. Loading States
4. 애니메이션

### Phase 4: 테스트 및 최적화 (1일)
1. 엣지 케이스 테스트
2. 성능 최적화
3. 접근성 개선

---

## 8. 체크리스트

### Home 화면
- [ ] Circle 목록 표시
- [ ] Circle 카드 디자인
- [ ] Circle 참여 모달
- [ ] Empty State
- [ ] Pull to Refresh
- [ ] 로딩 상태
- [ ] 에러 처리

### Create 화면
- [ ] Circle 선택 드롭다운
- [ ] 카테고리 탭
- [ ] 템플릿 목록
- [ ] 커스텀 질문 입력
- [ ] 마감 시간 선택
- [ ] 투표 생성 버튼
- [ ] 유효성 검증
- [ ] 성공/실패 처리

### Profile 화면
- [ ] 사용자 정보 표시
- [ ] Profile 수정 모달
- [ ] Circle 목록
- [ ] 설정 메뉴
- [ ] 다크 모드 토글
- [ ] 로그아웃 확인
- [ ] 계정 삭제 (추후)

---

## 9. 참고 문서

- **DSL**: `docs/DSL.md`
- **UI 디자인**: `prd/design/05-complete-ui-specification.md`
- **사용자 플로우**: `prd/design/04-user-flow.md`
- **디자인 시스템**: `prd/design/02-ui-design-system.md`
- **애니메이션**: `prd/design/03-animations.md`
- **프론트엔드 구현**: `trd/08-frontend-implementation-spec.md`
