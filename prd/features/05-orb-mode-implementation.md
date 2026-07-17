# Orb Mode 구현 계획

> **작성일**: 2025-01-11
> **상태**: 진행 예정
> **예상 기간**: 5-7일

---

## 1. 개요

### 1.1 목표
Circly Orb Mode (유료화) MVP 완성 - RevenueCat 결제 시스템 연동

### 1.2 현재 상태
- **완료율**: 85%
- **핵심 기능**: 구현됨 (받은 하트 안전 힌트 로직)
- **미완료**: 결제 시스템 연동, Subscription UI

### 1.3 MVP 범위
- 실명/계정 직접 공개 대신 안전한 단계형 힌트 시스템을 기본 계약으로 사용
- 무료: Circle/시간대 힌트
- Orb Mode: 이니셜/앱 내 표시명 기반 고급 힌트
- 법적 실명, 연락처, 계정 식별자, 민감 개인정보 공개 금지

---

## 2. 현재 구현 상태

### 2.1 완료 항목 (85%)

| 영역 | 항목 | 파일 위치 |
|------|------|----------|
| Backend | Vote.voter_id 컬럼 | `backend/app/modules/polls/models.py` |
| Backend | User.is_orb_mode 필드 | `backend/app/modules/auth/models.py` |
| Backend | GET /polls/{id}/hints API | `backend/app/modules/polls/router.py` |
| Backend | 안전 힌트 조회 서비스 | `backend/app/modules/polls/service.py` |
| Backend | 안전 힌트 생성용 쿼리 | `backend/app/modules/polls/repository.py` |
| Frontend | VoteHintResponse 타입 | `frontend/src/types/poll.ts` |
| Frontend | is_orb_mode 타입 정의 | `frontend/src/types/auth.ts` |
| Frontend | getMyVoteHints() API 함수 | `frontend/src/api/poll.ts` |
| Frontend | useMyVoteHints() React Query 훅 | `frontend/src/hooks/usePolls.ts` |
| Frontend | 안전 힌트 화면 | `frontend/app/results/[id]/hints.tsx` |
| Frontend | 구독 유도 모달 (Alert) | `frontend/app/results/[id].tsx` |

### 2.2 미완료 항목 (15%)

1. **Backend 테스트 코드** - Orb Mode 권한 검증 테스트
2. **RevenueCat 연동** - 결제 시스템 (Backend Webhook + Frontend SDK)
3. **Subscription 화면** - Paywall UI

---

## 3. 구현 계획

### Phase A: Backend 테스트 (1일)

**목표**: 기존 Orb Mode 기능 안정화

#### 작업 내용

1. **테스트 파일 생성**: `backend/tests/modules/polls/test_orb_mode.py`

2. **테스트 케이스**:
   - `test_get_hints_orb_mode_enabled` - 구독자 안전 힌트 접근 허용
   - `test_get_hints_orb_mode_disabled` - 비구독자 잠금/제한 응답
   - `test_get_hints_poll_not_found` - 존재하지 않는 Poll
   - `test_get_hints_not_circle_member` - 비멤버 접근 거부

3. **conftest.py 헬퍼 추가**:
   ```python
   @pytest.fixture
   async def enable_orb_mode_for_user(db_session):
       """사용자 Orb Mode 활성화 헬퍼."""
   ```

#### 검증
```bash
uv run pytest tests/modules/polls/test_orb_mode.py -v
```

---

### Phase B: RevenueCat 설정 (1일) - 외부 작업

**목표**: RevenueCat 대시보드 및 스토어 설정

#### B1. RevenueCat 계정 생성
1. https://app.revenuecat.com 가입
2. 새 프로젝트 생성: "Circly"

#### B2. App Store Connect 설정 (iOS)
1. In-App Purchase 상품 생성:
   - `orb_mode_monthly`: $4.99/월 자동갱신 구독
   - `orb_mode_annual`: $49.99/년 자동갱신 구독
2. Sandbox 테스터 계정 생성

#### B3. Google Play Console 설정 (Android)
1. 구독 상품 생성 (동일 ID)
2. 라이선스 테스터 추가

#### B4. RevenueCat 대시보드 설정
1. iOS/Android 앱 연결
2. Products 등록
3. Entitlement 생성: `orb_mode`
4. Webhook URL 설정 (Phase D 완료 후)

---

### Phase C: Frontend RevenueCat 연동 (2일)

**목표**: SDK 설치 및 Development Build 생성

> **중요**: RevenueCat은 Expo Go에서 작동하지 않음. Development Build 필수!

#### C1. 패키지 설치
```bash
cd frontend
npx expo install react-native-purchases expo-dev-client
npm install -g eas-cli
eas login
```

#### C2. EAS Build 설정
```bash
eas build:configure
```

**eas.json 생성**:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

#### C3. app.json 수정
```json
{
  "expo": {
    "plugins": [
      ["react-native-purchases", {
        "ios_api_key": "appl_xxxxx"
      }]
    ]
  }
}
```

#### C4. RevenueCat 서비스 모듈 생성

**파일**: `frontend/src/services/subscription/revenuecat.ts`

**함수**:
- `initializePurchases(userId)` - SDK 초기화
- `getSubscriptionStatus(): boolean` - 구독 상태 확인
- `getOfferings(): Package[]` - 상품 목록 조회
- `purchasePackage(pkg): CustomerInfo` - 구매 처리
- `restorePurchases(): CustomerInfo` - 구매 복원

#### C5. Development Build 생성
```bash
# iOS (시뮬레이터용)
eas build --profile development --platform ios

# 또는 로컬 빌드
npx expo run:ios
```

#### 검증
- Development Build 앱에서 RevenueCat 초기화 확인
- `getOfferings()` 호출 시 상품 목록 반환 확인

---

### Phase D: Backend Webhook (1-2일)

**목표**: 구독 상태 동기화

#### D1. Subscription 모듈 구조
```
backend/app/modules/subscription/
├── __init__.py
├── models.py      # WebhookEvent (idempotency)
├── schemas.py     # RevenueCatWebhookPayload
├── service.py     # process_webhook()
└── router.py      # POST /webhooks/revenuecat
```

#### D2. WebhookEvent 모델
```python
class WebhookEvent(BaseModel):
    event_id: str  # RevenueCat event ID (idempotency key)
    event_type: str
    app_user_id: str
    processed_at: datetime
```

#### D3. Webhook 엔드포인트
```python
@router.post("/webhooks/revenuecat")
async def handle_webhook(request: Request):
    # 1. 서명 검증 (Authorization 헤더)
    # 2. Idempotency 확인 (중복 이벤트 방지)
    # 3. 이벤트 처리
    #    - INITIAL_PURCHASE → is_orb_mode=True
    #    - RENEWAL → is_orb_mode=True (갱신)
    #    - CANCELLATION/EXPIRATION → is_orb_mode=False
    # 4. 200 반환
```

#### D4. 환경 변수
```bash
# .env
REVENUECAT_WEBHOOK_SECRET=whsec_xxxxx
```

#### D5. 마이그레이션
```bash
uv run alembic revision --autogenerate -m "add webhook_events table"
uv run alembic upgrade head
```

#### 검증
```bash
# ngrok으로 로컬 테스트
ngrok http 8000

# curl로 Webhook 테스트
curl -X POST https://xxx.ngrok.io/webhooks/revenuecat \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"INITIAL_PURCHASE","app_user_id":"test"}}'
```

---

### Phase E: Subscription 화면 (1일)

**목표**: Paywall UI 구현

#### E1. 화면 생성

**파일**: `frontend/app/subscription/index.tsx`

**UI 구성**:
- 헤더: 이모지 (🔮) + 타이틀 + 설명
- 기능 목록:
  - 👀 받은 하트의 안전한 단계형 힌트
  - 🔓 받은 하트의 고급 안전 힌트
  - 💜 프리미엄 배지 획득
- 가격 카드: 월간/연간 옵션 (선택 가능)
- CTA 버튼: "구독하기"
- 복원 링크: "구매 내역 복원"
- 법적 안내: 가격, 취소 정책

#### E2. 결과 화면 수정

**파일**: `frontend/app/results/[id].tsx`

```tsx
const handleOrbMode = () => {
  if (isOrbMode) {
    router.push(`/results/${id}/hints`);
  } else {
    router.push('/subscription');  // Alert 대신 화면 이동
  }
};
```

#### E3. AppInitializer 수정

```tsx
// RevenueCat 초기화 추가
useEffect(() => {
  if (user?.id) {
    initializePurchases(user.id);
  }
}, [user?.id]);
```

#### 검증
- Sandbox 환경에서 구매 테스트
- 구독 후 `is_orb_mode` 변경 확인
- 안전 힌트 화면 접근 확인

---

## 4. 수정 파일 목록

### Backend (신규)
| 파일 | 설명 |
|------|------|
| `backend/tests/modules/polls/test_orb_mode.py` | Orb Mode 테스트 |
| `backend/tests/conftest.py` | 헬퍼 fixture 추가 |
| `backend/app/modules/subscription/__init__.py` | 모듈 초기화 |
| `backend/app/modules/subscription/models.py` | WebhookEvent 모델 |
| `backend/app/modules/subscription/schemas.py` | Webhook 페이로드 스키마 |
| `backend/app/modules/subscription/service.py` | Webhook 처리 로직 |
| `backend/app/modules/subscription/router.py` | Webhook 엔드포인트 |
| `backend/app/main.py` | 라우터 등록 (수정) |

### Frontend (신규)
| 파일 | 설명 |
|------|------|
| `frontend/src/services/subscription/revenuecat.ts` | RevenueCat SDK 래퍼 |
| `frontend/app/subscription/index.tsx` | Paywall 화면 |
| `frontend/app.json` | RevenueCat 플러그인 추가 (수정) |
| `frontend/eas.json` | EAS Build 설정 |
| `frontend/src/providers/AppInitializer.tsx` | SDK 초기화 (수정) |
| `frontend/app/results/[id].tsx` | 구독 화면 연결 (수정) |

---

## 5. E2E 검증 시나리오

### 정상 플로우
1. Sandbox 테스터 계정으로 앱 로그인
2. Circle 가입 및 투표 참여
3. 결과 화면에서 "받은 하트 힌트 보기" 탭
4. Subscription 화면 진입
5. 구독 구매 (Sandbox)
6. Webhook 수신 → `is_orb_mode=True` 설정
7. 안전 힌트 화면 접근 성공
8. 무료/Orb 힌트 티어 정상 표시

### 에러 케이스
- 비구독자가 고급 힌트에 접근 → 잠금 상태 반환 또는 403 에러
- 결제 실패 → 에러 메시지 표시, 재시도 가능
- Webhook 중복 → Idempotency로 무시

---

## 6. 리스크 및 완화

| 리스크 | 완화 방안 |
|--------|----------|
| Expo Go 미지원 | Development Build 필수 (설정 가이드 포함) |
| RevenueCat 설정 복잡 | 단계별 체크리스트 제공 |
| Webhook 누락 | 앱 시작 시 SDK로 상태 재확인 |
| 청소년 과금 UX | 명확한 가격 표시 + 취소 안내 |

---

## 7. 다음 단계 (Phase 2 - 선택)

MVP 완료 후 추가 구현 가능:

| 기능 | 설명 |
|------|------|
| 단계별 힌트 시스템 | 무료 Circle/시간대 → Orb Mode 이니셜/앱 내 표시명 |
| 동적 가격 / A/B 테스트 | 시간대별, 사용자별 가격 최적화 |
| 번들 패키지 | 3개 힌트 30% 할인 등 |
| 프리미엄 배지/아이콘 | Orb Mode 구독자 전용 UI |

---

## 참고 문서

- `prd/business/01-business-model.md` - Orb Mode 비즈니스 모델
- `docs/DSL.md` - Vote 모델, 보안 정책
- [RevenueCat Docs](https://www.revenuecat.com/docs) - SDK 및 Webhook 문서
- [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) - EAS Build 가이드
