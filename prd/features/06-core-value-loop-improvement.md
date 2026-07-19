# 무료 핵심 가치 루프 개선 계획

> **작성일**: 2026-07-19  
> **상태**: 구현 대기  
> **우선순위**: P0  
> **관련 문서**: `prd/00-prd.md`, `prd/features/01-voting-spec.md`, `prd/features/02-circle-invite.md`, `prd/features/03-push-notification.md`, `prd/features/04-result-card.md`, `prd/design/04-user-flow.md`, `docs/DSL.md`

---

## 1. 목표

결제 기능보다 먼저 사용자가 아래 무료 핵심 루프를 실제로 끝낼 수 있게 한다.

```text
Circle 생성/참여
→ 친구 초대
→ 검수된 칭찬 라운드 열기
→ 4지선다 투표
→ 받은 하트 확인
→ 결과 공유 및 재초대
```

핵심 제품 지표는 `첫 하트를 받기까지 걸린 시간(Time to First Heart)`이다.

### 성공 기준

- 새 사용자가 초대 링크를 탭해 코드 재입력 없이 Circle 참여 화면에 도달한다.
- Circle 멤버가 5명 이상이면 OWNER/ADMIN이 한 번의 동작으로 칭찬 라운드를 열 수 있다.
- 라운드를 연 사용자도 다른 멤버의 투표 후보가 될 수 있다.
- 라운드 생성 후 Home에서 즉시 투표 세션을 시작할 수 있다.
- 마감 시간이 지나면 Worker의 단일 예약 작업 실패 여부와 관계없이 결과가 최종 확정된다.
- 최소 5개 계정으로 초대부터 받은 하트와 결과 공유까지 E2E가 통과한다.

---

## 2. 현재 구현에서 끊기는 지점

### 2.1 초대 공유

- `invite_link_id` 조회와 앱 딥링크 처리는 구현돼 있다.
- Circle 상세의 공유 메시지는 실제 링크 없이 6자리 코드만 전달한다.
- `docs/DSL.md`와 Frontend 타입에는 `invite_code_expires_at`이 있으나 Backend 모델/응답에는 없다.
- 사용자는 공유 메시지를 받은 뒤 앱을 열고 코드를 다시 입력해야 한다.

### 2.2 질문 공급

- 투표 참여, 서버 후보 생성, 투표 세션은 구현돼 있다.
- 일반 사용자용 자유 질문 생성은 안전 정책상 제한돼 있다.
- 운영자 Broadcast API는 있지만 새 Circle에 라운드를 자동 공급하는 사용자 흐름이 없다.
- 활성 Poll이 없는 Circle은 `이 Circle 투표하기`가 비활성화돼 첫 가치 경험에 도달할 수 없다.

### 2.3 후보 공정성

- 현재 후보 조회는 투표자와 Poll 생성자를 모두 제외한다.
- Circle OWNER가 라운드를 열고 Poll 생성자로 기록되면 OWNER는 모든 질문의 후보에서 제외될 수 있다.
- 서버가 검수된 템플릿만 공급하는 라운드에서는 시작한 사용자를 후보에서 제외할 제품적 이유가 없다.

### 2.4 결과 최종화

- Poll 생성 시 Celery ETA 작업으로 마감 알림과 결과 확정을 예약한다.
- Worker가 중단되거나 예약 작업이 유실됐을 때 만료된 ACTIVE Poll을 일괄 복구하는 경로가 없다.
- 결과 화면과 받은 하트 기능이 있어도 Poll 상태가 확정되지 않으면 보상 루프가 불안정하다.

---

## 3. MVP 제품 정책

### 3.1 초대 정책

- 기본 공유 수단: `https://circly.app/join/{invite_link_id}` 영구 링크
- 보조 수단: 6자리 초대 코드
- 초대 코드는 발급/재발급 시점부터 24시간 유효
- 코드 재발급은 기존 코드만 무효화하고 영구 링크는 유지한다.
- 영구 링크 가입은 만료 가능한 6자리 코드로 변환하지 않고 `invite_link_id`로 직접 처리한다.
- 공유 메시지에는 Circle 이름, 실제 초대 링크, 6자리 코드를 함께 표시한다.
- 앱 설치 사용자는 링크 탭 시 참여 화면으로 이동한다.
- 웹 랜딩 및 설치 후 deferred deep link는 스토어 배포 단계의 후속 작업으로 분리한다.

### 3.2 라운드 정책

- 최소 인원: Circle 멤버 5명
  - 현재 투표자 1명을 제외해도 후보 4명을 제공하기 위한 기준이다.
- 시작 권한: Circle `OWNER` 또는 `ADMIN`
- 질문 수: 라운드당 5개
- 기본 마감: 6시간
- 질문: 활성화된 검수 완료 칭찬 템플릿에서 서버가 자동 선택
- 카테고리: 같은 카테고리 편중을 피하고 최근 사용 질문을 우선 제외
- 자유 텍스트 질문과 성별/나이 직접 필터는 제공하지 않는다.
- Circle에 ACTIVE Poll이 하나라도 있으면 새 라운드를 열 수 없다.
- 같은 요청이 중복 전송되어도 라운드는 한 번만 생성돼야 한다.
- 라운드를 시작한 사용자도 후보가 될 수 있고, 각 투표에서는 현재 투표자 자신만 제외한다.

### 3.3 결과 정책

- 예약된 마감 작업을 1차 경로로 사용한다.
- 주기적인 만료 Poll 복구 작업을 2차 경로로 사용한다.
- Poll 최종화는 idempotent해야 하며 결과/알림이 중복 생성되지 않아야 한다.
- 마감 전에는 투표한 사용자만 중간 결과를 보고, 마감 후에는 Circle 멤버가 최종 결과를 볼 수 있다.
- 받은 하트는 결제와 무관하게 질문, 받은 수, Circle명, 시간 맥락을 무료 제공한다.

---

## 4. 목표 사용자 플로우

### 4.1 Circle 생성자

```text
Circle 만들기
→ 초대 링크 공유
→ 멤버 5명 미만: "첫 라운드까지 N명 더 필요해요" + 초대 CTA
→ 멤버 5명 이상: "첫 라운드 열기" CTA
→ 서버가 검수 질문 5개 생성
→ "라운드가 열렸어요" 완료 상태
→ Home의 "투표 시작"
```

### 4.2 초대받은 사용자

```text
초대 링크 탭
→ Circle 정보 확인
→ 로그인/가입이 필요하면 초대 컨텍스트 보존
→ Circle 닉네임 입력
→ 참여 완료
→ 활성 라운드가 있으면 Home "투표 시작"
→ 없으면 "친구를 더 초대해 첫 라운드를 열어보세요"
```

### 4.3 보상 루프

```text
질문 5개 투표
→ 세션 완료
→ 받은 하트 배지/알림
→ 받은 하트에서 질문과 받은 수 확인
→ 최종 결과 확인
→ 결과 카드 공유 또는 Circle 초대
```

---

## 5. API 및 데이터 계약 초안

최종 타입과 경로는 구현 전 `docs/DSL.md`에 먼저 확정한다.

### 5.1 Circle 응답 정합성

Backend `Circle` 모델과 응답에 다음 필드를 DSL과 일치시킨다.

```text
invite_code_expires_at: DateTime
invite_link_id: UUID
```

코드 생성 및 재발급 시 `invite_code_expires_at = now + 24h`로 갱신한다.

영구 링크 조회와 가입은 다음 계약을 사용한다.

```http
GET  /api/v1/circles/invite-links/{invite_link_id}
POST /api/v1/circles/join/link/{invite_link_id}

{
  "nickname": "Circle 닉네임"
}
```

- 조회 API는 로그인 전 Circle 이름/현재 인원/정원을 확인하는 용도다.
- 가입 API는 활성 Circle과 정원을 검증하고 코드 만료 여부와 무관하게 가입시킨다.
- iOS Associated Domains와 AASA, Android intent filter와 `assetlinks.json`을 함께 설정한다.

### 5.2 라운드 생성

```http
POST /api/v1/polls/circles/{circle_id}/rounds
Authorization: Bearer <token>

{
  "duration": "6H"
}
```

응답 초안:

```json
{
  "circle_id": "uuid",
  "created_count": 5,
  "polls": [],
  "ends_at": "ISO-8601"
}
```

오류 계약:

- `FORBIDDEN`: OWNER/ADMIN이 아님
- `NOT_ENOUGH_MEMBERS`: Circle 멤버가 5명 미만
- `ROUND_ALREADY_ACTIVE`: 활성 Poll 존재
- `NOT_ENOUGH_TEMPLATES`: 사용 가능한 검수 템플릿 부족
- `CIRCLE_NOT_FOUND`: Circle이 없거나 비활성

### 5.3 결과 복구

```text
PollService.finalizeDuePolls(now, limit) -> finalizedCount
```

- `status=ACTIVE AND ends_at<=now`를 작은 batch로 조회한다.
- 각 Poll에 기존 `closePoll()`의 idempotent 경로를 적용한다.
- Celery Beat가 1분 주기로 실행한다.
- 운영 상태 점검에서 Worker/Beat heartbeat와 overdue ACTIVE Poll 수를 확인한다.

---

## 6. 최소 실행단위

### 19.1 초대 계약 복구 (P0)

- Backend TDD: 초대 코드 만료, 재발급, 영구 링크 해석
- DB migration: `invite_code_expires_at`
- Backend schema와 Frontend 타입 정합성 복구
- `POST /circles/join/link/{invite_link_id}` 직접 가입 API 구현
- Circle 공유 메시지에 실제 영구 링크 포함
- iOS Universal Link/Android App Link 연결 및 도메인 association 파일 준비
- 로그인 전 딥링크 컨텍스트 보존 테스트

완료 조건:

- 링크를 탭하면 코드 수동 입력 없이 해당 Circle 참여 플로우로 이동한다.
- 만료 코드는 거부되지만 유효한 영구 링크는 계속 가입에 사용할 수 있다.

### 19.2 안전한 Circle 라운드 생성 (P0)

- DSL에 Round 생성 타입/API/오류 코드 정의
- Backend TDD: 권한, 최소 5명, 중복 방지, 템플릿 선택, 트랜잭션
- OWNER/ADMIN 한 번의 요청으로 5개 Poll 생성
- 후보 정책을 현재 투표자만 제외하도록 정리
- Circle 상세 CTA를 인원/활성 라운드 상태에 맞게 표시

완료 조건:

- 5명 Circle에서 라운드 시작 후 모든 멤버가 4명의 후보를 받는다.
- 라운드를 연 사용자도 다른 멤버의 후보에 포함될 수 있다.
- 중복 탭 또는 재시도에서 Poll 5개를 초과 생성하지 않는다.

### 19.3 Home 첫 가치 상태 연결 (P0)

- `no-circle`, `needs-members`, `can-open-round`, `ready`, `cooldown`, `empty` 상태 계약 정리
- OWNER/ADMIN은 라운드 열기 CTA, MEMBER는 친구 초대/대기 CTA 표시
- 라운드 생성 성공 시 Circle/Home/투표 세션 query invalidate
- 후보 부족과 라운드 없음의 안내 문구를 분리

완료 조건:

- 사용자가 현재 무엇을 해야 하는지 주 CTA 하나로 이해할 수 있다.
- 라운드 생성 직후 앱 재실행 없이 `투표 시작` 상태가 보인다.

### 19.4 결과 최종화 신뢰성 (P0)

- Backend TDD: 예약 마감, 중복 마감, 만료 Poll sweep, 알림 중복 방지
- `finalizeDuePolls()`와 Celery Beat 주기 작업 추가
- Worker/Beat 배포 및 health check 문서화
- 만료 ACTIVE Poll 운영 지표 추가

완료 조건:

- 예약 작업 하나를 강제로 실패시켜도 다음 sweep에서 결과가 확정된다.
- 동일 Poll이 여러 번 처리돼도 결과와 알림이 한 번만 반영된다.

### 19.5 무료 핵심 루프 E2E (P0)

- 최소 5개 사용자 계정과 1개 Circle 준비
- 초대 링크 → 가입/로그인 → 닉네임 → 라운드 시작
- 각 사용자 투표 → 마감 → 받은 하트 → 결과 카드 공유
- iOS 실기기/시뮬레이터에서 딥링크, 공유 시트, 푸시 확인
- 실패 지점과 소요 시간을 기록

완료 조건:

- 결제 없이 전체 루프가 한 번 이상 완주된다.
- 차단 오류 없이 최소 한 사용자가 받은 하트를 확인한다.

### 19.6 핵심 퍼널 계측 (P1)

- `invite_shared`
- `invite_opened`
- `circle_joined`
- `circle_minimum_members_reached`
- `round_started`
- `first_vote_cast`
- `first_heart_viewed`
- `result_shared`

초기 핵심 지표:

- 초대 링크 열기 → Circle 참여 전환율
- Circle 생성 → 5명 도달률
- 5명 도달 → 첫 라운드 시작률
- 라운드 시작 → 첫 투표 완료율
- 가입 → 첫 하트 확인까지 걸린 시간

---

## 7. 구현 순서

```text
19.1 초대 계약 복구
→ 19.2 안전한 Circle 라운드 생성
→ 19.3 Home 첫 가치 상태 연결
→ 19.4 결과 최종화 신뢰성
→ 19.5 무료 핵심 루프 E2E
→ 19.6 핵심 퍼널 계측
```

각 단계는 별도 커밋으로 완료하고 Backend 변경은 실패 테스트부터 작성한다.

---

## 8. 이번 Phase에서 제외

- RevenueCat, App Store Connect, Google Play 결제 설정
- Orb Mode 유료 힌트 고도화
- 자유 텍스트 질문
- 코인, 스트릭, 레벨, 랭킹
- 결과 카드 다중 테마/커스터마이징
- Storybook과 가로 모드
- 웹 초대 랜딩 및 앱 설치 후 deferred deep link의 프로덕션 배포

---

## 9. 출시 게이트

- Backend 전체 테스트, Ruff, mypy 통과
- Frontend typecheck, lint, Jest, iOS export 통과
- 5계정 E2E 증거 기록
- 만료 Poll 복구 테스트 통과
- 초대 링크에서 Circle 참여까지 실기기 검증
- `docs/DSL.md`, 초대/투표/푸시 기획서, 사용자 플로우와 실제 계약 동기화
