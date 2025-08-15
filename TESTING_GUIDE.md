# Circly 테스트 코드 작성 지침서

## 📋 개요

이 문서는 Circly 프로젝트의 **모든 테스트 코드 작성**을 위한 종합 가이드입니다. 백엔드(Python/FastAPI)와 프론트엔드(React Native/TypeScript) 모든 영역을 다룹니다.

## 🎯 테스트 철학

### 테스트 피라미드
```
    🔺 E2E Tests (10%)
   🔺🔺 Integration Tests (20%)
  🔺🔺🔺 Unit Tests (70%)
```

### 핵심 원칙
1. **테스트 우선 개발** (TDD) 권장
2. **빠르고 신뢰성 있는 테스트**
3. **읽기 쉽고 유지보수 가능한 테스트**
4. **비즈니스 로직에 집중**
5. **실제 사용자 시나리오 기반**

---

## 🐍 백엔드 테스트 가이드 (Python/FastAPI)

### 테스트 구조
```
backend/
├── tests/
│   ├── conftest.py           # 전역 픽스처
│   ├── unit/                 # 단위 테스트
│   │   ├── test_services/
│   │   ├── test_utils/
│   │   └── test_models/
│   ├── integration/          # 통합 테스트
│   │   ├── test_api/
│   │   └── test_database/
│   ├── e2e/                  # E2E 테스트
│   └── fixtures/             # 테스트 데이터
```

### 테스트 설정 (conftest.py)
```python
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.config import settings

# 테스트용 DB 설정
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """이벤트 루프 픽스처"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session():
    """테스트용 DB 세션"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
def client(db_session):
    """테스트 클라이언트"""
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """인증된 사용자 헤더"""
    # 테스트용 사용자 생성 및 토큰 발급
    response = client.post("/v1/auth/device-login", json={
        "device_id": "test-device-123",
        "platform": "ios",
        "app_version": "1.0.0"
    })
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### 1. 단위 테스트 (Unit Tests)

#### 서비스 레이어 테스트 예시
```python
# tests/unit/test_services/test_poll_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime, timedelta

from app.services.poll_service import PollService
from app.schemas.poll import PollCreate, PollResponse
from app.models.poll import Poll

class TestPollService:
    """투표 서비스 단위 테스트"""
    
    @pytest.fixture
    def mock_db(self):
        return AsyncMock()
    
    @pytest.fixture
    def poll_service(self, mock_db):
        return PollService(mock_db)
    
    @pytest.mark.asyncio
    async def test_create_poll_success(self, poll_service, mock_db):
        """투표 생성 성공 테스트"""
        # Given
        poll_data = PollCreate(
            template_id="template-123",
            circle_id="circle-123",
            deadline=datetime.now() + timedelta(hours=24)
        )
        
        mock_poll = Poll(
            id="poll-123",
            template_id=poll_data.template_id,
            circle_id=poll_data.circle_id,
            deadline=poll_data.deadline
        )
        
        mock_db.execute.return_value.scalar_one.return_value = mock_poll
        
        # When
        result = await poll_service.create_poll(poll_data, user_id="user-123")
        
        # Then
        assert result.id == "poll-123"
        assert result.template_id == poll_data.template_id
        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_poll_invalid_deadline(self, poll_service):
        """유효하지 않은 마감시간으로 투표 생성 실패 테스트"""
        # Given
        poll_data = PollCreate(
            template_id="template-123",
            circle_id="circle-123",
            deadline=datetime.now() - timedelta(hours=1)  # 과거 시간
        )
        
        # When & Then
        with pytest.raises(ValueError, match="마감시간은 현재 시간 이후여야 합니다"):
            await poll_service.create_poll(poll_data, user_id="user-123")
    
    @pytest.mark.asyncio
    async def test_vote_duplicate_prevention(self, poll_service, mock_db):
        """중복 투표 방지 테스트"""
        # Given
        mock_db.execute.return_value.scalar_one_or_none.return_value = Mock()  # 기존 투표 존재
        
        # When & Then
        with pytest.raises(ValueError, match="이미 투표에 참여했습니다"):
            await poll_service.cast_vote("poll-123", "option-123", "user-123")
```

#### 유틸리티 함수 테스트 예시
```python
# tests/unit/test_utils/test_security.py
import pytest
from jose import jwt
from datetime import datetime, timedelta

from app.utils.security import create_access_token, verify_token
from app.config import settings

class TestSecurity:
    """보안 유틸리티 테스트"""
    
    def test_create_access_token_success(self):
        """액세스 토큰 생성 성공 테스트"""
        # Given
        data = {"sub": "user-123", "device_id": "device-123"}
        
        # When
        token = create_access_token(data)
        
        # Then
        assert isinstance(token, str)
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert decoded["sub"] == "user-123"
        assert decoded["device_id"] == "device-123"
        assert "exp" in decoded
    
    def test_verify_token_valid(self):
        """유효한 토큰 검증 테스트"""
        # Given
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        # When
        payload = verify_token(token)
        
        # Then
        assert payload["sub"] == "user-123"
    
    def test_verify_token_expired(self):
        """만료된 토큰 검증 테스트"""
        # Given
        data = {"sub": "user-123"}
        expired_token = jwt.encode(
            {**data, "exp": datetime.utcnow() - timedelta(hours=1)},
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        # When & Then
        with pytest.raises(jwt.ExpiredSignatureError):
            verify_token(expired_token)
```

### 2. 통합 테스트 (Integration Tests)

#### API 엔드포인트 테스트 예시
```python
# tests/integration/test_api/test_poll_api.py
import pytest
from datetime import datetime, timedelta

class TestPollAPI:
    """투표 API 통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_create_poll_end_to_end(self, client, auth_headers, db_session):
        """투표 생성 API 전체 플로우 테스트"""
        # Given - Circle과 Template 미리 생성
        circle_response = client.post("/v1/circles", 
            json={"name": "테스트 Circle", "max_members": 25},
            headers=auth_headers
        )
        circle_id = circle_response.json()["data"]["id"]
        
        # When - 투표 생성
        poll_data = {
            "template_id": "existing-template-id",
            "circle_id": circle_id,
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        response = client.post("/v1/polls", 
            json=poll_data, 
            headers=auth_headers
        )
        
        # Then
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["circle_id"] == circle_id
        assert data["is_active"] is True
        assert len(data["options"]) > 0  # Circle 멤버들이 선택지로 생성됨
    
    @pytest.mark.asyncio
    async def test_vote_anonymity(self, client, auth_headers):
        """투표 익명성 보장 테스트"""
        # Given - 투표 생성
        poll_response = client.post("/v1/polls", 
            json={"template_id": "template-123", "circle_id": "circle-123"},
            headers=auth_headers
        )
        poll_id = poll_response.json()["data"]["id"]
        option_id = poll_response.json()["data"]["options"][0]["id"]
        
        # When - 투표 참여
        vote_response = client.post(f"/v1/polls/{poll_id}/vote",
            json={"option_id": option_id},
            headers=auth_headers
        )
        
        # Then - 투표자 정보가 노출되지 않음
        assert vote_response.status_code == 200
        vote_data = vote_response.json()["data"]
        assert "voter_id" not in vote_data
        assert "voter_info" not in vote_data
        
        # 결과 조회 시에도 익명성 보장
        results_response = client.get(f"/v1/polls/{poll_id}/results")
        results_data = results_response.json()["data"]
        for result in results_data["results"]:
            assert "voters" not in result
            assert "voter_list" not in result
```

#### 데이터베이스 테스트 예시
```python
# tests/integration/test_database/test_poll_queries.py
import pytest
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.models.poll import Poll, Vote, PollOption
from app.models.circle import Circle, CircleMember

class TestPollDatabaseQueries:
    """투표 관련 DB 쿼리 테스트"""
    
    @pytest.mark.asyncio
    async def test_poll_result_aggregation(self, db_session):
        """투표 결과 집계 정확성 테스트"""
        # Given - 테스트 데이터 생성
        circle = Circle(id="circle-123", name="테스트 Circle")
        poll = Poll(
            id="poll-123",
            circle_id="circle-123",
            template_id="template-123",
            deadline=datetime.now() + timedelta(hours=24)
        )
        
        option1 = PollOption(id="option-1", poll_id="poll-123", member_id="member-1")
        option2 = PollOption(id="option-2", poll_id="poll-123", member_id="member-2")
        
        # 5표 vs 3표
        votes = [
            Vote(poll_id="poll-123", option_id="option-1", voter_id=f"voter-{i}")
            for i in range(5)
        ] + [
            Vote(poll_id="poll-123", option_id="option-2", voter_id=f"voter-{i}")
            for i in range(5, 8)
        ]
        
        db_session.add_all([circle, poll, option1, option2] + votes)
        await db_session.commit()
        
        # When - 투표 결과 집계 쿼리
        result = await db_session.execute(
            select(PollOption.id, func.count(Vote.id).label('vote_count'))
            .outerjoin(Vote, PollOption.id == Vote.option_id)
            .where(PollOption.poll_id == "poll-123")
            .group_by(PollOption.id)
        )
        
        vote_counts = {row.id: row.vote_count for row in result}
        
        # Then
        assert vote_counts["option-1"] == 5
        assert vote_counts["option-2"] == 3
    
    @pytest.mark.asyncio
    async def test_vote_uniqueness_constraint(self, db_session):
        """사용자당 투표 중복 방지 제약조건 테스트"""
        # Given
        poll = Poll(id="poll-123", circle_id="circle-123", template_id="template-123")
        option = PollOption(id="option-1", poll_id="poll-123", member_id="member-1")
        vote1 = Vote(poll_id="poll-123", option_id="option-1", voter_id="user-123")
        
        db_session.add_all([poll, option, vote1])
        await db_session.commit()
        
        # When & Then - 같은 사용자의 중복 투표 시도
        vote2 = Vote(poll_id="poll-123", option_id="option-1", voter_id="user-123")
        db_session.add(vote2)
        
        with pytest.raises(Exception):  # UniqueConstraint 위반
            await db_session.commit()
```

### 3. E2E 테스트 (End-to-End Tests)

```python
# tests/e2e/test_complete_voting_flow.py
import pytest
from datetime import datetime, timedelta

class TestCompleteVotingFlow:
    """완전한 투표 플로우 E2E 테스트"""
    
    @pytest.mark.asyncio
    async def test_full_voting_scenario(self, client):
        """Circle 생성부터 투표 완료까지 전체 시나리오"""
        # Step 1: 사용자 로그인
        auth_response = client.post("/v1/auth/device-login", json={
            "device_id": "test-device-123",
            "platform": "ios",
            "app_version": "1.0.0"
        })
        assert auth_response.status_code == 200
        headers = {"Authorization": f"Bearer {auth_response.json()['data']['access_token']}"}
        
        # Step 2: Circle 생성
        circle_response = client.post("/v1/circles",
            json={"name": "테스트 친구들", "max_members": 25},
            headers=headers
        )
        assert circle_response.status_code == 201
        circle_id = circle_response.json()["data"]["id"]
        invite_code = circle_response.json()["data"]["invite_code"]
        
        # Step 3: 다른 사용자들이 Circle 참여
        participants = []
        for i in range(5):
            # 새 사용자 로그인
            new_user_response = client.post("/v1/auth/device-login", json={
                "device_id": f"device-{i}",
                "platform": "ios",
                "app_version": "1.0.0"
            })
            new_headers = {"Authorization": f"Bearer {new_user_response.json()['data']['access_token']}"}
            
            # Circle 참여
            join_response = client.post("/v1/circles/join",
                json={"invite_code": invite_code, "nickname": f"친구{i}"},
                headers=new_headers
            )
            assert join_response.status_code == 200
            participants.append(new_headers)
        
        # Step 4: 투표 생성
        poll_response = client.post("/v1/polls",
            json={
                "template_id": "kindest-person-template",
                "circle_id": circle_id,
                "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
            },
            headers=headers
        )
        assert poll_response.status_code == 201
        poll_id = poll_response.json()["data"]["id"]
        options = poll_response.json()["data"]["options"]
        
        # Step 5: 모든 참여자가 투표
        for i, participant_headers in enumerate(participants):
            vote_response = client.post(f"/v1/polls/{poll_id}/vote",
                json={"option_id": options[i % len(options)]["id"]},
                headers=participant_headers
            )
            assert vote_response.status_code == 200
        
        # Step 6: 투표 결과 확인
        results_response = client.get(f"/v1/polls/{poll_id}/results", headers=headers)
        assert results_response.status_code == 200
        results_data = results_response.json()["data"]
        
        assert results_data["total_votes"] == 5
        assert len(results_data["results"]) == len(options)
        assert results_data["winner"] is not None
        
        # Step 7: 결과 카드 생성
        card_response = client.post(f"/v1/polls/{poll_id}/result-card",
            json={"template": "classic"},
            headers=headers
        )
        assert card_response.status_code == 200
        assert "image_url" in card_response.json()["data"]
```

---

## ⚛️ 프론트엔드 테스트 가이드 (React Native/TypeScript)

### 테스트 구조
```
circly-app/
├── __tests__/
│   ├── components/           # 컴포넌트 테스트
│   ├── screens/             # 스크린 테스트
│   ├── services/            # API 서비스 테스트
│   ├── utils/               # 유틸리티 테스트
│   ├── hooks/               # 커스텀 훅 테스트
│   └── __mocks__/           # 모킹 파일들
├── e2e/                     # E2E 테스트
└── jest.config.js           # Jest 설정
```

### Jest 설정
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 테스트 설정 파일
```typescript
// __tests__/setup.ts
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Global test utilities
global.testUtils = {
  mockNavigation: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  },
};
```

### 1. 컴포넌트 테스트

#### 기본 컴포넌트 테스트 예시
```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '@/components/common/Button';

describe('Button Component', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>테스트 버튼</Button>
    );
    
    expect(getByText('테스트 버튼')).toBeTruthy();
  });
  
  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress}>클릭하기</Button>
    );
    
    fireEvent.press(getByText('클릭하기'));
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state correctly', () => {
    const { getByTestId, queryByText } = render(
      <Button onPress={() => {}} loading>
        제출하기
      </Button>
    );
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
    expect(queryByText('제출하기')).toBeNull();
  });
  
  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress} disabled>
        비활성 버튼
      </Button>
    );
    
    const button = getByText('비활성 버튼');
    fireEvent.press(button);
    
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
```

#### 복잡한 컴포넌트 테스트 예시
```typescript
// __tests__/components/PollCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PollCard } from '@/components/poll/PollCard';
import { Poll } from '@/types/poll';

const mockPoll: Poll = {
  id: 'poll-123',
  question_text: '가장 친절한 사람은?',
  deadline: new Date('2024-12-31T23:59:59Z'),
  total_votes: 10,
  user_voted: false,
  options: [
    { id: 'option-1', member_nickname: '철수', vote_count: 6 },
    { id: 'option-2', member_nickname: '영희', vote_count: 4 },
  ],
};

describe('PollCard Component', () => {
  const mockOnVote = jest.fn();
  const mockOnViewResults = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('displays poll information correctly', () => {
    const { getByText } = render(
      <PollCard 
        poll={mockPoll}
        onVote={mockOnVote}
        onViewResults={mockOnViewResults}
      />
    );
    
    expect(getByText('가장 친절한 사람은?')).toBeTruthy();
    expect(getByText('철수')).toBeTruthy();
    expect(getByText('영희')).toBeTruthy();
    expect(getByText('10명 참여')).toBeTruthy();
  });
  
  it('handles vote action correctly', async () => {
    const { getByText } = render(
      <PollCard 
        poll={mockPoll}
        onVote={mockOnVote}
        onViewResults={mockOnViewResults}
      />
    );
    
    fireEvent.press(getByText('철수'));
    
    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith('option-1');
    });
  });
  
  it('shows results when poll is completed', () => {
    const completedPoll = { ...mockPoll, user_voted: true };
    const { getByText } = render(
      <PollCard 
        poll={completedPoll}
        onVote={mockOnVote}
        onViewResults={mockOnViewResults}
      />
    );
    
    expect(getByText('60%')).toBeTruthy(); // 철수 득표율
    expect(getByText('40%')).toBeTruthy(); // 영희 득표율
  });
  
  it('displays time remaining correctly', () => {
    const now = new Date('2024-12-30T12:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);
    
    const { getByText } = render(
      <PollCard 
        poll={mockPoll}
        onVote={mockOnVote}
        onViewResults={mockOnViewResults}
      />
    );
    
    expect(getByText(/1일 11시간 남음/)).toBeTruthy();
    
    jest.useRealTimers();
  });
});
```

### 2. 스크린 테스트

```typescript
// __tests__/screens/HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { useAuthStore } from '@/store/authStore';
import { usePollStore } from '@/store/pollStore';

// Zustand 스토어 모킹
jest.mock('@/store/authStore');
jest.mock('@/store/pollStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUsePollStore = usePollStore as jest.MockedFunction<typeof usePollStore>;

describe('HomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    setOptions: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-123', device_id: 'device-123' },
      isAuthenticated: true,
    });
    
    mockUsePollStore.mockReturnValue({
      polls: [
        {
          id: 'poll-1',
          question_text: '가장 재미있는 사람은?',
          deadline: new Date(),
          user_voted: false,
        },
      ],
      loading: false,
      fetchPolls: jest.fn(),
    });
  });
  
  it('renders polls list correctly', async () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('가장 재미있는 사람은?')).toBeTruthy();
    });
  });
  
  it('navigates to poll creation when FAB is pressed', () => {
    const { getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    fireEvent.press(getByTestId('create-poll-fab'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreatePoll');
  });
  
  it('shows empty state when no polls exist', () => {
    mockUsePollStore.mockReturnValue({
      polls: [],
      loading: false,
      fetchPolls: jest.fn(),
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByText('아직 투표가 없어요')).toBeTruthy();
    expect(getByText('첫 번째 투표를 만들어보세요!')).toBeTruthy();
  });
  
  it('shows loading state correctly', () => {
    mockUsePollStore.mockReturnValue({
      polls: [],
      loading: true,
      fetchPolls: jest.fn(),
    });
    
    const { getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### 3. 서비스/API 테스트

```typescript
// __tests__/services/api/pollApi.test.ts
import { pollApi } from '@/services/api/pollApi';
import { apiClient } from '@/services/api/client';

// API 클라이언트 모킹
jest.mock('@/services/api/client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Poll API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createPoll', () => {
    it('creates poll successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'poll-123',
            question_text: '가장 친절한 사람은?',
            options: [
              { id: 'option-1', member_nickname: '철수' },
            ],
          },
        },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const pollData = {
        template_id: 'template-123',
        circle_id: 'circle-123',
        deadline: new Date(),
      };
      
      const result = await pollApi.createPoll(pollData);
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/polls', pollData);
      expect(result.id).toBe('poll-123');
      expect(result.question_text).toBe('가장 친절한 사람은?');
    });
    
    it('handles API error correctly', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '유효하지 않은 데이터입니다',
            },
          },
        },
      };
      
      mockApiClient.post.mockRejectedValue(mockError);
      
      const pollData = {
        template_id: '',
        circle_id: 'circle-123',
        deadline: new Date(),
      };
      
      await expect(pollApi.createPoll(pollData)).rejects.toThrow(
        '유효하지 않은 데이터입니다'
      );
    });
  });
  
  describe('castVote', () => {
    it('casts vote successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            vote_id: 'vote-123',
            poll_id: 'poll-123',
            option_id: 'option-1',
          },
        },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const result = await pollApi.castVote('poll-123', 'option-1');
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/polls/poll-123/vote',
        { option_id: 'option-1' }
      );
      expect(result.vote_id).toBe('vote-123');
    });
    
    it('handles duplicate vote error', async () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            success: false,
            error: {
              code: 'ALREADY_VOTED',
              message: '이미 투표에 참여했습니다',
            },
          },
        },
      };
      
      mockApiClient.post.mockRejectedValue(mockError);
      
      await expect(pollApi.castVote('poll-123', 'option-1')).rejects.toThrow(
        '이미 투표에 참여했습니다'
      );
    });
  });
});
```

### 4. 커스텀 훅 테스트

```typescript
// __tests__/hooks/usePollTimer.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { usePollTimer } from '@/hooks/usePollTimer';

describe('usePollTimer Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('calculates time remaining correctly', () => {
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2시간 후
    const { result } = renderHook(() => usePollTimer(deadline));
    
    expect(result.current.timeRemaining).toBe('2시간 0분 남음');
    expect(result.current.isExpired).toBe(false);
  });
  
  it('updates timer every minute', () => {
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const { result } = renderHook(() => usePollTimer(deadline));
    
    expect(result.current.timeRemaining).toBe('2시간 0분 남음');
    
    act(() => {
      jest.advanceTimersByTime(60 * 1000); // 1분 경과
    });
    
    expect(result.current.timeRemaining).toBe('1시간 59분 남음');
  });
  
  it('marks as expired when deadline passes', () => {
    const deadline = new Date(Date.now() + 1000); // 1초 후
    const { result } = renderHook(() => usePollTimer(deadline));
    
    expect(result.current.isExpired).toBe(false);
    
    act(() => {
      jest.advanceTimersByTime(2000); // 2초 경과
    });
    
    expect(result.current.isExpired).toBe(true);
    expect(result.current.timeRemaining).toBe('투표 종료');
  });
});
```

### 5. E2E 테스트 (Detox)

```typescript
// e2e/voting-flow.e2e.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Voting Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should complete full voting flow', async () => {
    // 1. 앱 실행 및 자동 로그인 확인
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    
    // 2. Circle 생성
    await element(by.id('create-circle-button')).tap();
    await element(by.id('circle-name-input')).typeText('테스트 친구들');
    await element(by.id('create-circle-submit')).tap();
    
    // 3. Circle 생성 완료 확인
    await detoxExpect(element(by.text('Circle이 생성되었습니다'))).toBeVisible();
    await detoxExpect(element(by.id('invite-code'))).toBeVisible();
    
    // 4. 투표 생성
    await element(by.id('create-poll-fab')).tap();
    await element(by.id('template-kindest')).tap();
    await element(by.id('deadline-24hours')).tap();
    await element(by.id('create-poll-submit')).tap();
    
    // 5. 투표 생성 완료 및 홈 화면 이동
    await detoxExpect(element(by.text('투표가 생성되었습니다'))).toBeVisible();
    await element(by.id('go-to-home')).tap();
    
    // 6. 생성된 투표 확인
    await detoxExpect(element(by.text('가장 친절한 사람은?'))).toBeVisible();
    
    // 7. 다른 사용자 시뮬레이션 (Circle 참여)
    // 실제로는 여러 디바이스나 사용자 전환이 필요하지만,
    // 여기서는 UI 플로우만 테스트
    
    // 8. 투표 참여
    await element(by.text('가장 친절한 사람은?')).tap();
    await element(by.id('poll-option-0')).tap();
    await element(by.id('confirm-vote')).tap();
    
    // 9. 투표 완료 확인
    await detoxExpect(element(by.text('투표가 완료되었습니다'))).toBeVisible();
    
    // 10. 결과 확인
    await element(by.id('view-results')).tap();
    await detoxExpect(element(by.id('poll-results'))).toBeVisible();
    await detoxExpect(element(by.text('1표'))).toBeVisible();
  });
  
  it('should handle offline scenarios', async () => {
    // 1. 네트워크 연결 해제
    await device.setNetworkConnection('off');
    
    // 2. 오프라인 상태 UI 확인
    await detoxExpect(element(by.text('인터넷 연결을 확인해주세요'))).toBeVisible();
    
    // 3. 캐시된 데이터로 기본 기능 동작 확인
    await detoxExpect(element(by.id('cached-polls-list'))).toBeVisible();
    
    // 4. 네트워크 연결 복구
    await device.setNetworkConnection('on');
    
    // 5. 자동 동기화 확인
    await detoxExpect(element(by.text('동기화 완료'))).toBeVisible();
  });
});
```

---

## 🛡️ 보안 테스트 가이드

### 인증/인가 테스트
```python
# tests/security/test_auth_security.py
import pytest
from jose import jwt
from datetime import datetime, timedelta

class TestAuthSecurity:
    """인증 보안 테스트"""
    
    def test_jwt_token_tampering_detection(self, client):
        """JWT 토큰 변조 탐지 테스트"""
        # Given - 정상 토큰 발급
        response = client.post("/v1/auth/device-login", json={
            "device_id": "test-device",
            "platform": "ios"
        })
        token = response.json()["data"]["access_token"]
        
        # When - 토큰 변조
        tampered_token = token[:-5] + "XXXXX"  # 마지막 5자리 변조
        
        # Then - 변조된 토큰으로 요청 시 실패
        response = client.get("/v1/users/me", 
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert response.status_code == 401
        assert "INVALID_TOKEN" in response.json()["error"]["code"]
    
    def test_expired_token_handling(self, client):
        """만료된 토큰 처리 테스트"""
        # Given - 만료된 토큰 생성
        expired_payload = {
            "sub": "user-123",
            "exp": datetime.utcnow() - timedelta(hours=1)
        }
        expired_token = jwt.encode(expired_payload, "secret", algorithm="HS256")
        
        # When & Then
        response = client.get("/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
        assert "TOKEN_EXPIRED" in response.json()["error"]["code"]
    
    def test_unauthorized_access_protection(self, client):
        """미인증 접근 차단 테스트"""
        protected_endpoints = [
            "/v1/users/me",
            "/v1/circles",
            "/v1/polls"
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401
            assert "UNAUTHORIZED" in response.json()["error"]["code"]
```

### 데이터 프라이버시 테스트
```python
# tests/security/test_data_privacy.py
class TestDataPrivacy:
    """데이터 프라이버시 테스트"""
    
    @pytest.mark.asyncio
    async def test_vote_anonymity_enforcement(self, client, auth_headers):
        """투표 익명성 강제 보장 테스트"""
        # Given - 투표 생성 및 참여
        poll_response = client.post("/v1/polls", 
            json={"template_id": "template-123", "circle_id": "circle-123"},
            headers=auth_headers
        )
        poll_id = poll_response.json()["data"]["id"]
        
        vote_response = client.post(f"/v1/polls/{poll_id}/vote",
            json={"option_id": "option-123"},
            headers=auth_headers
        )
        
        # When - 데이터베이스에서 직접 조회
        # (실제로는 관리자 API나 직접 DB 접근으로 테스트)
        
        # Then - 투표자 정보가 해시화되어 저장되어야 함
        # 원본 사용자 ID가 평문으로 저장되면 안됨
        assert vote_response.status_code == 200
        # 추가 DB 검증 로직...
    
    def test_personal_data_deletion(self, client, auth_headers):
        """개인정보 삭제 프로세스 테스트"""
        # Given - 사용자 데이터 생성
        user_response = client.get("/v1/users/me", headers=auth_headers)
        user_id = user_response.json()["data"]["id"]
        
        # When - 계정 삭제 요청
        delete_response = client.delete("/v1/users/me", headers=auth_headers)
        
        # Then - 모든 개인 식별 정보가 삭제되어야 함
        assert delete_response.status_code == 200
        
        # 삭제 후 접근 시도 시 실패해야 함
        access_response = client.get("/v1/users/me", headers=auth_headers)
        assert access_response.status_code == 401
```

---

## 📊 성능 테스트 가이드

### 백엔드 성능 테스트
```python
# tests/performance/test_api_performance.py
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

class TestAPIPerformance:
    """API 성능 테스트"""
    
    def test_vote_endpoint_response_time(self, client, auth_headers):
        """투표 API 응답 시간 테스트"""
        # Given
        poll_response = client.post("/v1/polls", 
            json={"template_id": "template-123", "circle_id": "circle-123"},
            headers=auth_headers
        )
        poll_id = poll_response.json()["data"]["id"]
        
        # When
        start_time = time.time()
        response = client.post(f"/v1/polls/{poll_id}/vote",
            json={"option_id": "option-123"},
            headers=auth_headers
        )
        end_time = time.time()
        
        # Then
        assert response.status_code == 200
        assert (end_time - start_time) < 0.5  # 500ms 이내 응답
    
    def test_concurrent_voting_performance(self, client):
        """동시 투표 성능 테스트"""
        # Given - 100명의 동시 투표 시뮬레이션
        def vote_request(user_index):
            headers = self.create_user_headers(f"user-{user_index}")
            return client.post("/v1/polls/poll-123/vote",
                json={"option_id": "option-123"},
                headers=headers
            )
        
        # When
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(vote_request, i) for i in range(100)]
            results = [future.result() for future in futures]
        end_time = time.time()
        
        # Then
        successful_votes = sum(1 for r in results if r.status_code == 200)
        assert successful_votes >= 95  # 95% 이상 성공
        assert (end_time - start_time) < 10  # 10초 이내 완료
```

### 프론트엔드 성능 테스트
```typescript
// __tests__/performance/ListPerformance.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PollList } from '@/components/poll/PollList';

describe('PollList Performance', () => {
  it('renders large list efficiently', () => {
    // Given - 1000개 투표 데이터
    const polls = Array.from({ length: 1000 }, (_, i) => ({
      id: `poll-${i}`,
      question_text: `투표 질문 ${i}`,
      deadline: new Date(),
      user_voted: false,
    }));
    
    // When
    const startTime = performance.now();
    const { getByTestId } = render(<PollList polls={polls} />);
    const endTime = performance.now();
    
    // Then
    expect(getByTestId('poll-list')).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(100); // 100ms 이내 렌더링
  });
  
  it('handles scroll performance with large dataset', () => {
    // FlatList virtualization 성능 테스트
    // 메모리 사용량 및 스크롤 성능 검증
  });
});
```

---

## 🔧 테스트 유틸리티 및 헬퍼

### 공통 테스트 헬퍼
```python
# tests/utils/test_helpers.py
from datetime import datetime, timedelta
from typing import Dict, Any

class TestDataFactory:
    """테스트 데이터 생성 팩토리"""
    
    @staticmethod
    def create_user_data(override: Dict[str, Any] = None) -> Dict[str, Any]:
        """사용자 테스트 데이터 생성"""
        default_data = {
            "device_id": "test-device-123",
            "platform": "ios",
            "app_version": "1.0.0"
        }
        if override:
            default_data.update(override)
        return default_data
    
    @staticmethod
    def create_circle_data(override: Dict[str, Any] = None) -> Dict[str, Any]:
        """Circle 테스트 데이터 생성"""
        default_data = {
            "name": "테스트 Circle",
            "max_members": 25
        }
        if override:
            default_data.update(override)
        return default_data
    
    @staticmethod
    def create_poll_data(circle_id: str = None, override: Dict[str, Any] = None) -> Dict[str, Any]:
        """투표 테스트 데이터 생성"""
        default_data = {
            "template_id": "kindest-person-template",
            "circle_id": circle_id or "circle-123",
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        if override:
            default_data.update(override)
        return default_data

class TestAPIClient:
    """테스트용 API 클라이언트 헬퍼"""
    
    def __init__(self, client):
        self.client = client
        self._auth_headers = None
    
    def authenticate(self, device_id: str = "test-device") -> Dict[str, str]:
        """인증 헤더 생성"""
        response = self.client.post("/v1/auth/device-login", 
            json=TestDataFactory.create_user_data({"device_id": device_id})
        )
        token = response.json()["data"]["access_token"]
        self._auth_headers = {"Authorization": f"Bearer {token}"}
        return self._auth_headers
    
    def create_full_voting_scenario(self) -> Dict[str, Any]:
        """완전한 투표 시나리오 생성"""
        # Circle 생성
        circle_response = self.client.post("/v1/circles",
            json=TestDataFactory.create_circle_data(),
            headers=self._auth_headers
        )
        circle_id = circle_response.json()["data"]["id"]
        
        # 투표 생성
        poll_response = self.client.post("/v1/polls",
            json=TestDataFactory.create_poll_data(circle_id),
            headers=self._auth_headers
        )
        
        return {
            "circle": circle_response.json()["data"],
            "poll": poll_response.json()["data"]
        }
```

### React Native 테스트 헬퍼
```typescript
// __tests__/utils/testHelpers.tsx
import React from 'react';
import { render as rtlRender } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 테스트용 Provider 래퍼
interface WrapperProps {
  children: React.ReactNode;
}

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

// 커스텀 render 함수
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options });
};

// 테스트 데이터 팩토리
export const TestDataFactory = {
  poll: (overrides = {}) => ({
    id: 'poll-123',
    question_text: '가장 친절한 사람은?',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    total_votes: 0,
    user_voted: false,
    is_active: true,
    options: [
      { id: 'option-1', member_nickname: '철수', vote_count: 0 },
      { id: 'option-2', member_nickname: '영희', vote_count: 0 },
    ],
    ...overrides,
  }),
  
  circle: (overrides = {}) => ({
    id: 'circle-123',
    name: '테스트 Circle',
    member_count: 5,
    max_members: 25,
    role: 'creator',
    is_active: true,
    ...overrides,
  }),
  
  user: (overrides = {}) => ({
    id: 'user-123',
    device_id: 'device-123',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

// 테스트용 Navigation Mock
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

// 비동기 작업 대기 헬퍼
export const waitForAsyncUpdates = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};
```

---

## 📝 테스트 체크리스트

### 기능 개발 시 필수 테스트 항목

#### ✅ 백엔드 (각 기능당)
- [ ] **단위 테스트 (90% 커버리지)**
  - [ ] 서비스 레이어 핵심 로직
  - [ ] 유틸리티 함수
  - [ ] 검증/변환 로직
  - [ ] 에러 처리

- [ ] **통합 테스트**
  - [ ] API 엔드포인트 정상 케이스
  - [ ] API 엔드포인트 에러 케이스
  - [ ] 데이터베이스 상호작용
  - [ ] 외부 서비스 연동

- [ ] **보안 테스트**
  - [ ] 인증/인가 검증
  - [ ] 입력값 검증
  - [ ] SQL Injection 방어
  - [ ] 개인정보 보호

#### ✅ 프론트엔드 (각 기능당)
- [ ] **컴포넌트 테스트 (80% 커버리지)**
  - [ ] 렌더링 정상성
  - [ ] Props 전달 및 처리
  - [ ] 사용자 인터랙션
  - [ ] 조건부 렌더링

- [ ] **통합 테스트**
  - [ ] 화면 단위 플로우
  - [ ] API 연동 시나리오
  - [ ] 상태 관리 검증
  - [ ] 네비게이션 동작

- [ ] **성능 테스트**
  - [ ] 렌더링 성능
  - [ ] 메모리 사용량
  - [ ] 애니메이션 성능

#### ✅ E2E 테스트
- [ ] **핵심 사용자 플로우**
  - [ ] 회원가입/로그인
  - [ ] Circle 생성/참여
  - [ ] 투표 생성/참여
  - [ ] 결과 확인/공유

- [ ] **크로스 플랫폼**
  - [ ] iOS 동작 검증
  - [ ] Android 동작 검증

---

## 🚀 지속적 통합(CI) 테스트 설정

### GitHub Actions 워크플로우
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests with coverage
      run: |
        cd backend
        pytest --cov=app --cov-report=xml --cov-fail-under=90
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: circly-app/package-lock.json
    
    - name: Install dependencies
      run: |
        cd circly-app
        npm ci
    
    - name: Run tests
      run: |
        cd circly-app
        npm run test -- --coverage --watchAll=false
    
    - name: Run E2E tests
      run: |
        cd circly-app
        npm run e2e:ci

  quality-checks:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Backend linting
      run: |
        cd backend
        pip install black flake8 mypy
        black --check .
        flake8 .
        mypy app/
    
    - name: Frontend linting
      run: |
        cd circly-app
        npm ci
        npm run lint
        npm run type-check
```

이 테스트 지침서를 따라 개발하면 **높은 품질의 안정적인 Circly 앱**을 만들 수 있습니다! 🚀