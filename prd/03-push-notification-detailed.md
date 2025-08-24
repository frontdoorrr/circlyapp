# 푸시 알림 - 상세 기능 기획서

## 기능 개요
투표 시작, 마감 임박, 결과 발표 시점에 적절한 푸시 알림을 전송하여 사용자 참여도를 높이고 실시간 FOMO를 유발하는 기능

## 상세 기능 명세

### 1. 푸시 알림 유형별 설계

#### 1.1 투표 시작 알림
**발송 대상**: Circle 참여자 전체 (투표 생성자 제외)
**발송 시점**: 투표 생성 즉시

**알림 내용**:
```
🗳️ 새로운 투표가 시작됐어요!
"{질문 내용 (최대 30자까지)}"
지금 바로 참여해보세요! 👆
```

**액션**: 앱 실행 → 해당 투표 화면으로 바로 이동

#### 1.2 마감 임박 알림 (1차)
**발송 대상**: 미참여자만
**발송 시점**: 투표 마감 1시간 전

**알림 내용**:
```
⏰ 투표 마감 1시간 전!
"{질문 내용}"
친구들이 기다리고 있어요 🔥
```

#### 1.3 마감 임박 알림 (2차)
**발송 대상**: 미참여자만 (1차 알림 후에도 미참여)
**발송 시점**: 투표 마감 10분 전

**알림 내용**:
```
🚨 마지막 기회!
"{질문 내용}" 투표 마감 10분 전
놓치면 후회할걸요? 😱
```

#### 1.4 결과 발표 알림
**발송 대상**: Circle 참여자 전체
**발송 시점**: 투표 마감 즉시

**알림 내용**:
```
🎉 투표 결과가 나왔어요!
"{질문 내용}"
궁금하지 않아? 결과 확인하러 가기 ✨
```

### 2. 개인화 푸시 알림

#### 2.1 닉네임 활용
- Circle 내에서 사용하는 닉네임 포함
- 예: "철수야, 새로운 투표가 시작됐어요!"

#### 2.2 투표 참여 패턴 기반
- 자주 참여하는 사용자: 친근한 톤
- 비활성 사용자: 호기심 유발 메시지
- 첫 참여자: 환영 메시지 포함

### 3. 알림 설정 및 개인화

#### 3.1 알림 설정 UI
**Profile 탭 → 알림 설정**
- 전체 알림 ON/OFF
- 투표 시작 알림 ON/OFF  
- 마감 임박 알림 ON/OFF
- 결과 발표 알림 ON/OFF
- 조용한 시간 설정 (22:00~08:00)

#### 3.2 스마트 알림 빈도 조절
- 하루 최대 알림 수 제한 (기본값: 10개)
- 짧은 시간 내 동일 Circle 알림 중복 방지
- 사용자가 알림 끄는 패턴 학습하여 발송 빈도 자동 조절

### 4. 기술적 구현사항

#### 4.1 푸시 알림 시스템 아키텍처
- **Frontend**: Expo Push Notifications SDK 사용
- **Backend**: FCM (Firebase Cloud Messaging) 또는 Expo Push Service
- **스케줄링**: Background job으로 마감 임박 알림 예약
- **개인화**: 사용자별 설정 및 행동 데이터 기반

#### 4.2 푸시 토큰 관리
- 앱 설치/실행 시 푸시 토큰 등록
- 토큰 갱신 자동 처리
- 앱 삭제 시 토큰 무효화 처리

#### 4.3 배치 발송 시스템
- Circle 멤버 수에 따른 배치 사이즈 최적화
- 대량 발송 시 Rate Limiting 고려
- 발송 실패 시 재시도 메커니즘

### 5. 딥링크 및 인앱 라우팅

#### 5.1 알림 터치 시 동작
- **투표 시작/마감 임박**: 해당 투표 상세 페이지
- **결과 발표**: 투표 결과 페이지
- **일반**: Home 탭

#### 5.2 딥링크 구조
```
circly://notification?type=poll&poll_id={id}&action={start|deadline|result}
```

### 6. 알림 성과 측정

#### 6.1 추적 이벤트
- 푸시 알림 발송 성공/실패
- 푸시 알림 오픈율 (클릭율)
- 알림을 통한 앱 실행 → 실제 투표 참여율
- 알림 설정 변경 패턴

#### 6.2 A/B 테스트 대상
- 알림 메시지 톤앤매너 (친근함 vs 호기심)
- 이모지 사용 유무
- 발송 타이밍 (즉시 vs 5분 후)
- 개인화 메시지 vs 일반 메시지

### 7. 사용자 경험 최적화

#### 7.1 알림 피로도 방지
- 같은 투표에 대한 중복 알림 방지
- 사용자가 읽지 않은 알림 누적 시 발송 중단
- "너무 많은 알림" 피드백 수집 및 대응

#### 7.2 중요도 기반 우선순위
1. **High**: 결과 발표 (모든 사용자 관심)
2. **Medium**: 투표 시작 (새로운 콘텐츠)
3. **Low**: 마감 임박 (이미 2번 알림받은 경우)

### 8. 에러 케이스 및 예외 처리

#### 8.1 푸시 발송 실패
- **토큰 무효**: 다음 앱 실행 시 토큰 갱신
- **네트워크 오류**: 최대 3회 재시도
- **플랫폼 오류**: 대체 알림 수단 고려 (인앱 알림)

#### 8.2 사용자 권한 거부
- 푸시 권한 거부 시 인앱 알림 배너로 대체
- 권한 재요청 타이밍 최적화
- 알림 가치 설명하는 온보딩 개선

### 9. 국가별/시간대 고려사항

#### 9.1 한국 사용자 특성
- 학교 시간 (09:00~17:00) 알림 자제
- 늦은 시간 (22:00 이후) 조용한 알림
- 주말/공휴일 활성화 타이밍

#### 9.2 시간대 처리
- 사용자 디바이스 시간대 기준
- 서버 시간과 로컬 시간 동기화
- 해외 사용자 확장 시 다중 시간대 지원

## 개발 우선순위
1. **Phase 1**: 기본 3종 알림 (시작/마감임박/결과) 구현
2. **Phase 2**: 개인화 및 설정 기능
3. **Phase 3**: 스마트 빈도 조절 및 성과 측정
4. **Phase 4**: A/B 테스트 시스템 및 고도화

## 성공 지표
- 푸시 알림 오픈율: 15% 이상
- 알림을 통한 투표 참여율: 25% 이상
- 알림 끄는 사용자 비율: 10% 미만

---

# 📋 구현 세부사항 (Implementation Details)

## 🎯 현재 프로젝트 상황
**프로젝트 현황**: Phase 5 (투표 시스템) 90% 완료, Phase 6 진입
**기술 스택**: React Native + Expo, FastAPI + PostgreSQL + Redis

---

## 🏗️ Phase 1: 기본 푸시 알림 시스템 구현

### 10.1 기술 스택 및 아키텍처

#### 10.1.1 Frontend (React Native + Expo)
```typescript
// 주요 패키지
- expo-notifications: Expo 푸시 알림 SDK
- @react-native-async-storage/async-storage: 푸시 토큰 저장
- expo-linking: 딥링크 처리
- expo-constants: 디바이스 정보

// 구현할 컴포넌트/서비스
- NotificationService: 푸시 토큰 관리 및 수신 처리
- useNotifications Hook: 알림 상태 관리
- DeepLinkHandler: 알림 터치 시 라우팅
- NotificationSettingsScreen: 사용자 알림 설정
```

#### 10.1.2 Backend (FastAPI)
```python
# 주요 패키지
- httpx: Expo Push API 호출
- celery: Background job 스케줄링
- redis: 작업 큐 및 캐시
- pydantic: 알림 데이터 모델

# 구현할 모듈
- app/services/notification_service.py: 알림 발송 로직
- app/models/notification.py: 알림 관련 데이터베이스 모델
- app/tasks/notification_tasks.py: 백그라운드 알림 작업
- app/api/v1/notifications.py: 알림 관련 API 엔드포인트
```

### 10.2 데이터베이스 스키마 설계

#### 10.2.1 PushToken 모델
```sql
CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    expo_token VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255),
    platform VARCHAR(10), -- ios, android
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10.2.2 NotificationSetting 모델
```sql
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    all_notifications BOOLEAN DEFAULT TRUE,
    poll_start_notifications BOOLEAN DEFAULT TRUE,
    poll_deadline_notifications BOOLEAN DEFAULT TRUE,
    poll_result_notifications BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    max_daily_notifications INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10.2.3 NotificationLog 모델
```sql
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    poll_id VARCHAR(255) REFERENCES polls(id),
    notification_type VARCHAR(50), -- poll_start, poll_deadline, poll_result
    title VARCHAR(255),
    body TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20), -- sent, failed, clicked
    expo_receipt_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10.3 알림 유형별 구현 명세

#### 10.3.1 투표 시작 알림 (poll_start)
```python
# 발송 조건
- 투표 생성 즉시 (백엔드 투표 생성 API에서 트리거)
- 발송 대상: Circle 참여자 전체 (투표 생성자 제외)

# 알림 내용 템플릿
title = "🗳️ 새로운 투표가 시작됐어요!"
body = f'"{poll.question_text[:30]}{"..." if len(poll.question_text) > 30 else ""}\n지금 바로 참여해보세요! 👆'

# 딥링크
data = {
    "type": "poll_start",
    "poll_id": poll.id,
    "circle_id": poll.circle_id,
    "action_url": f"circly://poll-participation/{poll.id}"
}
```

#### 10.3.2 마감 임박 알림 (poll_deadline)
```python
# 발송 조건
- 투표 마감 1시간 전 (Celery 스케줄링)
- 발송 대상: 미참여자만 (voted=False)

# 1차 알림 (1시간 전)
title = "⏰ 투표 마감 1시간 전!"
body = f'"{poll.question_text[:30]}"\n친구들이 기다리고 있어요 🔥'

# 2차 알림 (10분 전) - 여전히 미참여자만
title = "🚨 마지막 기회!"
body = f'"{poll.question_text[:20]}" 투표 마감 10분 전\n놓치면 후회할걸요? 😱'
```

#### 10.3.3 결과 발표 알림 (poll_result)
```python
# 발송 조건
- 투표 마감 즉시 (poll.deadline 도달 시점, Celery 스케줄링)
- 발송 대상: Circle 참여자 전체

# 알림 내용
title = "🎉 투표 결과가 나왔어요!"
body = f'"{poll.question_text[:30]}"\n궁금하지 않아? 결과 확인하러 가기 ✨'

# 딥링크
data = {
    "type": "poll_result", 
    "poll_id": poll.id,
    "action_url": f"circly://poll-results/{poll.id}"
}
```

### 10.4 Frontend 구현 명세

#### 10.4.1 NotificationService 구현
```typescript
// src/services/notifications/NotificationService.ts
class NotificationService {
  // 푸시 권한 요청
  async requestPermissions(): Promise<boolean>
  
  // 푸시 토큰 등록
  async registerPushToken(): Promise<string | null>
  
  // 알림 수신 리스너 설정
  setupNotificationListeners(): void
  
  // 딥링크 처리
  handleNotificationReceived(notification: any): void
  
  // 알림 설정 가져오기/업데이트
  async getNotificationSettings(): Promise<NotificationSettings>
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>
}
```

#### 10.4.2 useNotifications Hook
```typescript
// src/hooks/useNotifications.ts
export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  
  // 푸시 토큰 초기화
  const initializePushNotifications = async () => { ... }
  
  // 알림 설정 업데이트
  const updateSettings = async (settings: Partial<NotificationSettings>) => { ... }
  
  return {
    expoPushToken,
    notificationSettings,
    initializePushNotifications,
    updateSettings,
  };
}
```

#### 10.4.3 NotificationSettingsScreen 구현
```typescript
// src/screens/settings/NotificationSettingsScreen.tsx
// Profile 탭에서 접근 가능한 알림 설정 화면
- 전체 알림 ON/OFF 토글
- 알림 유형별 ON/OFF 설정
- 조용한 시간 설정 (시간 선택기)
- 최대 일일 알림 수 설정 (슬라이더)
```

### 10.5 Backend 구현 명세

#### 10.5.1 Notification Service
```python
# app/services/notification_service.py
class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.expo_client = httpx.AsyncClient()
    
    async def send_poll_start_notification(self, poll_id: str) -> bool:
        """투표 시작 알림 발송"""
        
    async def schedule_poll_deadline_notifications(self, poll_id: str) -> None:
        """투표 마감 알림 스케줄링"""
        
    async def send_poll_result_notification(self, poll_id: str) -> bool:
        """투표 결과 알림 발송"""
        
    async def send_expo_push_notification(
        self, 
        tokens: List[str], 
        title: str, 
        body: str, 
        data: dict
    ) -> List[str]:
        """Expo Push API를 통한 실제 알림 발송"""
```

#### 10.5.2 Background Tasks (Celery)
```python
# app/tasks/notification_tasks.py
@celery.task
def send_poll_deadline_notification_1h(poll_id: str):
    """투표 마감 1시간 전 알림"""
    
@celery.task  
def send_poll_deadline_notification_10m(poll_id: str):
    """투표 마감 10분 전 알림"""
    
@celery.task
def send_poll_result_notification(poll_id: str):
    """투표 결과 발표 알림"""
```

#### 10.5.3 API 엔드포인트
```python
# app/api/v1/notifications.py
@router.post("/push-tokens")
async def register_push_token(token_data: PushTokenCreate) -> PushTokenResponse:
    """푸시 토큰 등록"""

@router.get("/settings")  
async def get_notification_settings() -> NotificationSettingsResponse:
    """사용자 알림 설정 조회"""

@router.put("/settings")
async def update_notification_settings(settings: NotificationSettingsUpdate) -> NotificationSettingsResponse:
    """사용자 알림 설정 업데이트"""

@router.get("/logs")
async def get_notification_history() -> List[NotificationLogResponse]:
    """알림 발송 내역 조회 (디버깅용)"""
```

---

## 🔄 구현 단계별 계획

### Step 1: 기본 인프라 구축 (2-3일)
```bash
# 백엔드
1. 데이터베이스 모델 생성 (PushToken, NotificationSettings, NotificationLog)
2. Alembic 마이그레이션 파일 생성 및 적용
3. 기본 API 엔드포인트 구현 (토큰 등록, 설정 조회/업데이트)
4. Expo Push API 클라이언트 구현

# 프론트엔드  
1. expo-notifications 패키지 설치 및 설정
2. NotificationService 클래스 구현
3. 푸시 권한 요청 및 토큰 등록 로직
```

### Step 2: 알림 발송 로직 구현 (2-3일)
```bash
# 백엔드
1. NotificationService의 알림 발송 메서드 구현
2. 투표 생성 시 poll_start 알림 트리거 추가
3. Celery Task로 deadline/result 알림 스케줄링
4. 에러 핸들링 및 재시도 로직

# 프론트엔드
1. 알림 수신 리스너 구현
2. 딥링크 라우팅 처리
3. 포그라운드/백그라운드 알림 처리
```

### Step 3: 사용자 설정 UI 구현 (1-2일)
```bash
# 프론트엔드
1. NotificationSettingsScreen 구현
2. Profile 탭에 알림 설정 메뉴 추가
3. 토글, 시간 선택기, 슬라이더 컴포넌트
4. 설정 변경 시 API 연동
```

### Step 4: 테스트 및 최적화 (1-2일)
```bash
# 통합 테스트
1. 실제 디바이스에서 알림 수신 테스트
2. 다양한 시나리오별 알림 발송 테스트
3. 딥링크 동작 검증
4. 성능 테스트 (대량 발송)

# 에러 케이스 처리
1. 토큰 무효화 처리
2. 네트워크 오류 시 재시도
3. 권한 거부 시 대체 처리
```

---

## 🧪 테스트 계획

### Backend Tests
```python
# tests/services/test_notification_service.py
- 알림 발송 성공/실패 테스트
- 배치 발송 성능 테스트
- 스케줄링 정확성 테스트

# tests/api/test_notifications.py  
- API 엔드포인트 동작 테스트
- 권한 검증 테스트
- 입력 데이터 유효성 테스트
```

### Frontend Tests
```typescript
// __tests__/services/NotificationService.test.ts
- 푸시 토큰 등록/갱신 테스트
- 알림 수신 처리 테스트
- 딥링크 라우팅 테스트

// __tests__/hooks/useNotifications.test.tsx
- 알림 설정 상태 관리 테스트
- 권한 요청 플로우 테스트
```

---

## 📊 성과 측정 및 모니터링

### KPI 모니터링 대시보드
```sql
-- 알림 발송 현황
SELECT 
  notification_type,
  DATE(sent_at),
  COUNT(*) as sent_count,
  COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_count,
  ROUND(COUNT(CASE WHEN status = 'clicked' THEN 1 END) * 100.0 / COUNT(*), 2) as open_rate
FROM notification_logs 
GROUP BY notification_type, DATE(sent_at);

-- 사용자별 알림 설정 현황  
SELECT
  COUNT(CASE WHEN all_notifications = true THEN 1 END) as enabled_users,
  COUNT(CASE WHEN all_notifications = false THEN 1 END) as disabled_users,
  ROUND(COUNT(CASE WHEN all_notifications = false THEN 1 END) * 100.0 / COUNT(*), 2) as disable_rate
FROM notification_settings;
```

---

## 🔐 보안 및 개인정보 고려사항

### 데이터 보호
- 푸시 토큰 암호화 저장
- 알림 내용 개인정보 최소화 
- 로그 데이터 자동 삭제 (30일 후)

### 권한 관리
- 사용자 명시적 동의 후 알림 발송
- 알림 설정 변경 권한 보장
- 언제든 수신 거부 가능

---

## 📋 Phase 2 고도화 계획

Phase 1 완료 후 진행할 고도화 기능:
- 개인화 메시지 (닉네임, 참여 패턴 기반)
- 스마트 빈도 조절 (AI 기반)
- A/B 테스트 시스템
- 성과 분석 대시보드