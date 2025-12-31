# State Management - Zustand Stores

Circly 프론트엔드는 **클라이언트 상태 관리**를 위해 Zustand를 사용합니다.

## 아키텍처 원칙

### 1. 상태 분리 전략

- **서버 상태**: React Query (`@tanstack/react-query`)
  - API 데이터 캐싱, 자동 재시도, 백그라운드 업데이트
  - 예: 투표 목록, Circle 정보, 사용자 프로필

- **클라이언트 상태**: Zustand (`zustand`)
  - 인증 토큰, UI 상태, 폼 데이터
  - 예: 로그인 토큰, 투표 생성 플로우 상태

### 2. Store 구조

```
src/stores/
├── auth.ts          # 인증 상태 (토큰, 사용자 정보)
├── pollCreate.ts    # 투표 생성 플로우 상태
└── README.md        # 이 문서
```

## Store 가이드

### pollCreate Store

투표 생성 플로우 전체에서 사용되는 상태를 관리합니다.

**사용 화면**:
1. `app/(main)/(create)/select-template.tsx` - 질문 선택
2. `app/(main)/(create)/configure.tsx` - 투표 설정
3. `app/(main)/(create)/preview.tsx` - 미리보기
4. `app/(main)/(create)/success.tsx` - 완료 (reset)

**상태**:
```typescript
{
  selectedCategory: string | null;        // 선택된 카테고리
  selectedTemplate: SelectedTemplate | null; // 선택된 질문
  settings: PollSettings;                 // 투표 설정 (duration, target, notification)
  circleId: string | null;                // 투표를 생성할 Circle ID
}
```

**Actions**:
```typescript
setCategory(category: string): void
setTemplate(template: SelectedTemplate): void
setSettings(settings: Partial<PollSettings>): void
setCircleId(circleId: string): void
reset(): void
isComplete(): boolean  // 모든 필수 정보 입력 완료 여부
```

**사용 예시**:
```typescript
import { usePollCreateStore } from '@/stores/pollCreate';

function ConfigureScreen() {
  const { settings, setSettings } = usePollCreateStore();

  const handleDurationSelect = (duration: PollDuration) => {
    setSettings({ duration });
  };

  return (
    <DurationChip
      selected={settings.duration === '6H'}
      onPress={() => handleDurationSelect('6H')}
    />
  );
}
```

### 타입 정의

**PollDuration**: `'1H' | '3H' | '6H' | '24H'`
- 투표 기간 옵션

**PollTarget**: `'all' | 'selected'`
- `all`: Circle 전체 참여
- `selected`: 일부 멤버만 선택

**NotificationTiming**: `'immediate' | 'scheduled'`
- `immediate`: 즉시 알림 발송
- `scheduled`: 예약 발송

## React Query 통합

### API 연동 패턴

1. **Mutation Hook 생성** (`src/hooks/useCreatePoll.ts`)
```typescript
export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, duration, circleId }) => {
      return await apiClient.post(`/circles/${circleId}/polls`, {
        template_id: templateId,
        duration_hours: durationToHours[duration],
      });
    },

    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['polls'] });

      // Navigate to success screen
      router.push('/create/success');
    },
  });
};
```

2. **컴포넌트에서 사용**
```typescript
function PreviewScreen() {
  const { selectedTemplate, settings, circleId } = usePollCreateStore();
  const createPoll = useCreatePoll();

  const handleStartPoll = async () => {
    await createPoll.mutateAsync({
      templateId: selectedTemplate.id,
      duration: settings.duration,
      circleId,
    });
  };

  return (
    <Button
      onPress={handleStartPoll}
      loading={createPoll.isPending}
    />
  );
}
```

## 상태 초기화

### 플로우 완료 시 자동 초기화

성공 화면에서 3초 후 홈으로 이동하면서 자동으로 store를 초기화합니다:

```typescript
// app/(main)/(create)/success.tsx
function SuccessScreen() {
  const { reset } = usePollCreateStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      reset();  // Store 초기화
      router.replace('/(main)/(home)');
    }, 3000);

    return () => clearTimeout(timer);
  }, [reset]);
}
```

### 수동 초기화

사용자가 뒤로가기나 취소를 누른 경우:

```typescript
function ConfigureScreen() {
  const { reset } = usePollCreateStore();

  const handleCancel = () => {
    reset();
    router.back();
  };
}
```

## Best Practices

### 1. Store는 최소한으로 유지

- 서버에서 가져올 수 있는 데이터는 React Query로 관리
- UI 상태나 폼 데이터만 Zustand에 저장

### 2. Computed Values 활용

```typescript
// Store 내부에 computed 함수 추가
export const usePollCreateStore = create<PollCreateState>((set, get) => ({
  // ... state

  isComplete: () => {
    const state = get();
    return state.selectedTemplate !== null &&
           state.circleId !== null;
  },
}));

// 컴포넌트에서 사용
const { isComplete } = usePollCreateStore();
if (!isComplete()) {
  Alert.alert('필수 정보를 입력해주세요');
}
```

### 3. Partial Updates 활용

전체 객체를 교체하지 말고 필요한 필드만 업데이트:

```typescript
// ✅ Good
setSettings({ duration: '6H' });

// ❌ Bad
setSettings({
  duration: '6H',
  target: settings.target,  // 불필요한 중복
  notificationTiming: settings.notificationTiming,
});
```

### 4. TypeScript 타입 안전성

모든 store는 완전히 타입이 정의되어 있어야 합니다:

```typescript
interface PollCreateState {
  // State
  selectedTemplate: SelectedTemplate | null;

  // Actions (명시적 타입)
  setTemplate: (template: SelectedTemplate) => void;
  reset: () => void;

  // Computed
  isComplete: () => boolean;
}
```

## 참고 문서

- **Zustand 공식 문서**: https://github.com/pmndrs/zustand
- **React Query 공식 문서**: https://tanstack.com/query/latest
- **프로젝트 아키텍처**: `trd/08-frontend-implementation-spec.md`
