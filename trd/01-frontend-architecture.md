# Frontend Architecture - 기술 구현 상세서

## React Native (Expo) 프론트엔드 아키텍처

### 1. 프로젝트 설정 및 의존성

#### 1.1 Expo SDK 버전
- **Expo SDK 49+** 사용 (React Native 0.72+)
- **TypeScript** 필수 적용
- **EAS Build** 활용한 네이티브 빌드

#### 1.2 핵심 의존성 패키지
```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react-native": "0.72.4",
    "typescript": "^5.1.3",
    "@expo/vector-icons": "^13.0.0",
    "react-navigation": "^6.0.0",
    "react-native-paper": "^5.0.0",
    "zustand": "^4.4.0",
    "react-query": "@tanstack/react-query",
    "axios": "^1.5.0",
    "react-native-svg": "13.4.0",
    "expo-notifications": "~0.20.0",
    "expo-linking": "~5.0.0",
    "expo-clipboard": "~4.3.0",
    "expo-sharing": "~11.5.0"
  }
}
```

### 2. 폴더 구조 및 파일 조직

```
src/
├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── common/          # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx  
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── poll/           # 투표 관련 컴포넌트
│   │   ├── PollCard.tsx
│   │   ├── PollCreator.tsx
│   │   ├── VoteOptions.tsx
│   │   └── ResultChart.tsx
│   └── circle/         # 서클 관련 컴포넌트
│       ├── InviteCard.tsx
│       ├── MemberList.tsx
│       └── CircleHeader.tsx
├── screens/            # 화면 컴포넌트
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── NicknameSetupScreen.tsx
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── PollDetailScreen.tsx
│   ├── create/
│   │   └── CreatePollScreen.tsx
│   └── profile/
│       ├── ProfileScreen.tsx
│       └── SettingsScreen.tsx
├── services/           # API 및 외부 서비스
│   ├── api/
│   │   ├── client.ts   # Axios 설정
│   │   ├── poll.ts     # 투표 API
│   │   ├── circle.ts   # 서클 API
│   │   └── user.ts     # 사용자 API
│   ├── notifications/
│   │   └── pushNotifications.ts
│   └── storage/
│       └── localStorage.ts
├── store/              # 상태 관리 (Zustand)
│   ├── authStore.ts
│   ├── pollStore.ts
│   └── circleStore.ts
├── types/              # TypeScript 타입 정의
│   ├── poll.ts
│   ├── circle.ts
│   ├── user.ts
│   └── api.ts
├── utils/              # 유틸리티 함수
│   ├── constants.ts
│   ├── helpers.ts
│   ├── validation.ts
│   └── dateUtils.ts
├── hooks/              # 커스텀 훅
│   ├── useAuth.ts
│   ├── usePoll.ts
│   └── useNotifications.ts
└── navigation/         # 네비게이션 설정
    ├── AppNavigator.tsx
    ├── AuthNavigator.tsx
    └── TabNavigator.tsx
```

### 3. 상태 관리 아키텍처 (Zustand)

#### 3.1 Auth Store 구조
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  nickname: string;
  currentCircle: Circle | null;
  
  // Actions
  login: (nickname: string) => Promise<void>;
  logout: () => void;
  joinCircle: (circleId: string, nickname: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
}
```

#### 3.2 Poll Store 구조
```typescript
interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  isLoading: boolean;
  
  // Actions
  fetchPolls: (circleId: string) => Promise<void>;
  createPoll: (pollData: CreatePollRequest) => Promise<void>;
  votePoll: (pollId: string, optionId: string) => Promise<void>;
  fetchPollResults: (pollId: string) => Promise<void>;
}
```

### 4. API 클라이언트 설계

#### 4.1 Axios 설정
```typescript
// services/api/client.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - 인증 토큰 추가
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      authStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

#### 4.2 React Query 통합
```typescript
// hooks/usePoll.ts
export const usePolls = (circleId: string) => {
  return useQuery({
    queryKey: ['polls', circleId],
    queryFn: () => pollApi.getPolls(circleId),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
};

export const useCreatePoll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: pollApi.createPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });
};
```

### 5. 네비게이션 구조

#### 5.1 Tab Navigator 설정
```typescript
// navigation/TabNavigator.tsx
const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreatePollScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

### 6. 컴포넌트 설계 패턴

#### 6.1 Compound Component 패턴
```typescript
// components/poll/PollCard.tsx
interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
}

export const PollCard = ({ poll, onVote }: PollCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  return (
    <Card style={styles.container}>
      <PollCard.Header poll={poll} />
      <PollCard.Question question={poll.question} />
      <PollCard.Options 
        options={poll.options} 
        selectedOption={selectedOption}
        onSelect={setSelectedOption}
      />
      <PollCard.Actions 
        onVote={() => onVote?.(selectedOption!)}
        disabled={!selectedOption}
      />
    </Card>
  );
};

PollCard.Header = ({ poll }) => (
  <View style={styles.header}>
    <Text style={styles.timeRemaining}>
      {getTimeRemaining(poll.deadline)}
    </Text>
  </View>
);
```

### 7. 성능 최적화 전략

#### 7.1 React.memo 적용
```typescript
export const PollCard = React.memo<PollCardProps>(({ poll, onVote }) => {
  // 컴포넌트 구현
}, (prevProps, nextProps) => {
  return prevProps.poll.id === nextProps.poll.id &&
         prevProps.poll.updatedAt === nextProps.poll.updatedAt;
});
```

#### 7.2 이미지 최적화
```typescript
// components/common/OptimizedImage.tsx
import { Image } from 'expo-image';

export const OptimizedImage = ({ source, ...props }) => {
  return (
    <Image
      source={source}
      placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
      contentFit="cover"
      transition={200}
      {...props}
    />
  );
};
```

### 8. 에러 처리 및 디버깅

#### 8.1 Error Boundary 구현
```typescript
// components/common/ErrorBoundary.tsx
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 서비스로 전송
    analytics.logError('ErrorBoundary', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

#### 8.2 개발 도구 설정
- **Flipper** 통합으로 네트워크 및 상태 디버깅
- **React Native Debugger** 설정
- **Sentry** 프로덕션 에러 모니터링

### 9. 테스트 전략

#### 9.1 Unit Testing (Jest)
```typescript
// __tests__/components/PollCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { PollCard } from '../components/poll/PollCard';

describe('PollCard', () => {
  const mockPoll = {
    id: '1',
    question: 'Test question?',
    options: [
      { id: '1', text: 'Option 1' },
      { id: '2', text: 'Option 2' }
    ]
  };

  it('renders poll question correctly', () => {
    const { getByText } = render(<PollCard poll={mockPoll} />);
    expect(getByText('Test question?')).toBeTruthy();
  });

  it('calls onVote when vote button is pressed', () => {
    const onVoteMock = jest.fn();
    const { getByText } = render(<PollCard poll={mockPoll} onVote={onVoteMock} />);
    
    fireEvent.press(getByText('Option 1'));
    fireEvent.press(getByText('투표하기'));
    
    expect(onVoteMock).toHaveBeenCalledWith('1');
  });
});
```

### 10. 빌드 및 배포 설정

#### 10.1 EAS Build 설정
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 개발 우선순위
1. **Phase 1**: 기본 네비게이션 및 API 클라이언트 설정
2. **Phase 2**: 핵심 컴포넌트 (PollCard, CreatePoll) 구현  
3. **Phase 3**: 상태 관리 및 실시간 업데이트
4. **Phase 4**: 성능 최적화 및 테스트 코드