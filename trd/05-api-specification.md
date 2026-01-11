# Circly Backend API 명세서

> **문서 정보**
> - **최종 업데이트**: 2024-12-29
> - **API 버전**: v1
> - **단일 진실 출처 (Single Source of Truth)**: `docs/DSL.md`
> - **대상 독자**: 프론트엔드 개발자

이 문서는 Circly 백엔드 API의 완전한 엔드포인트 레퍼런스를 제공합니다. 모든 API는 FastAPI 기반으로 구현되었으며 RESTful 설계 원칙을 따릅니다.

## 📋 목차

1. [기본 정보](#기본-정보)
2. [Auth API](#auth-api)
3. [Circle API](#circle-api)
4. [Poll API](#poll-api)
5. [Notification API](#notification-api)
6. [Report API](#report-api)
7. [에러 처리](#에러-처리)
8. [데이터 타입 참조](#데이터-타입-참조)

---

## 기본 정보

### Base URL

| 환경 | URL |
|------|-----|
| Production | `https://api.circly.app/api/v1` |
| Staging | `https://staging-api.circly.app/api/v1` |
| Development | `http://localhost:8000/api/v1` |

### 인증 방식

모든 인증이 필요한 엔드포인트는 JWT Bearer Token을 사용합니다:

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 공통 응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "작업이 완료되었습니다"
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## Auth API

인증 관련 API 엔드포인트입니다. 회원가입, 로그인, Profile 관리 기능을 제공합니다.

### POST /auth/register

새 사용자 계정을 생성합니다.

**엔드포인트:** `POST /api/v1/auth/register`
**인증 필요:** ❌ 없음

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `email` | string | ✅ | 이메일 주소 | 유효한 이메일 형식 |
| `password` | string | ✅ | 비밀번호 | 최소 8자, 최대 100자 |
| `username` | string | ❌ | 사용자 이름 | 최소 2자, 최대 50자 |
| `display_name` | string | ❌ | 표시 이름 | 최대 100자 |

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "홍길동",
  "display_name": "길동이"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "홍길동",
    "display_name": "길동이",
    "profile_emoji": "😊",
    "role": "USER",
    "is_active": true,
    "created_at": "2024-12-29T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**에러 응답:**
- `400 Bad Request`: 이메일이 이미 등록되어 있음
- `422 Unprocessable Entity`: 유효하지 않은 입력 데이터

---

### POST /auth/login

이메일과 비밀번호로 로그인합니다.

**엔드포인트:** `POST /api/v1/auth/login`
**인증 필요:** ❌ 없음

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | string | ✅ | 이메일 주소 |
| `password` | string | ✅ | 비밀번호 |

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "홍길동",
    "display_name": "길동이",
    "profile_emoji": "😊",
    "role": "USER",
    "is_active": true,
    "created_at": "2024-12-29T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**에러 응답:**
- `401 Unauthorized`: 잘못된 이메일 또는 비밀번호
- `401 Unauthorized`: 비활성화된 계정

---

### GET /auth/me

현재 로그인한 사용자 정보를 조회합니다.

**엔드포인트:** `GET /api/v1/auth/me`
**인증 필요:** ✅ JWT Token

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "username": "홍길동",
  "display_name": "길동이",
  "profile_emoji": "😊",
  "role": "USER",
  "is_active": true,
  "created_at": "2024-12-29T10:30:00Z"
}
```

**에러 응답:**
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰

---

### PUT /auth/me

현재 사용자 Profile을 업데이트합니다.

**엔드포인트:** `PUT /api/v1/auth/me`
**인증 필요:** ✅ JWT Token

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `username` | string | ❌ | 사용자 이름 | 최소 2자, 최대 50자 |
| `display_name` | string | ❌ | 표시 이름 | 최대 100자 |
| `profile_emoji` | string | ❌ | Profile 이모지 | 최대 10자 |

**Request Example:**
```json
{
  "username": "새이름",
  "display_name": "새 표시 이름",
  "profile_emoji": "🎉"
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "username": "새이름",
  "display_name": "새 표시 이름",
  "profile_emoji": "🎉",
  "role": "USER",
  "is_active": true,
  "created_at": "2024-12-29T10:30:00Z"
}
```

**에러 응답:**
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `422 Unprocessable Entity`: 유효하지 않은 입력 데이터

---

## Circle API

Circle(그룹) 관련 API 엔드포인트입니다. Circle 생성, 참여, 멤버 관리 기능을 제공합니다.

**CircleResponse 공통 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | Circle 고유 ID |
| `name` | string | Circle 이름 |
| `description` | string\|null | Circle 설명 |
| `invite_code` | string | 6자리 초대 코드 (24시간 유효) |
| `invite_link_id` | UUID\|null | 초대 링크 ID (영구 사용 가능) |
| `owner_id` | UUID | Circle 소유자 ID |
| `max_members` | number | 최대 멤버 수 |
| `member_count` | number | 현재 멤버 수 |
| `is_active` | boolean | 활성 상태 |
| `created_at` | string | 생성 일시 (ISO 8601) |
| `updated_at` | string | 수정 일시 (ISO 8601) |

---

### POST /circles

새 Circle을 생성합니다. 생성자는 자동으로 OWNER가 됩니다.

**엔드포인트:** `POST /api/v1/circles`
**인증 필요:** ✅ JWT Token

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `name` | string | ✅ | Circle 이름 | 최소 1자, 최대 100자 |
| `description` | string | ❌ | Circle 설명 | 최대 1000자 |
| `max_members` | number | ❌ | 최대 멤버 수 | 기본값: 50, 범위: 2-100 |

**Request Example:**
```json
{
  "name": "3학년 2반 친구들",
  "description": "우리 반 친구들 모임",
  "max_members": 50
}
```

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "3학년 2반 친구들",
  "description": "우리 반 친구들 모임",
  "invite_code": "A1B2C3",
  "invite_link_id": "xyz123...",
  "owner_id": "user-id",
  "max_members": 50,
  "member_count": 1,
  "is_active": true,
  "created_at": "2024-12-29T10:30:00Z",
  "updated_at": "2024-12-29T10:30:00Z"
}
```

---

### GET /circles

현재 사용자가 속한 모든 Circle 목록을 조회합니다.

**엔드포인트:** `GET /api/v1/circles`
**인증 필요:** ✅ JWT Token

**Response (200 OK):**
```json
[
  {
    "id": "circle-id-1",
    "name": "3학년 2반 친구들",
    "description": "우리 반 친구들 모임",
    "invite_code": "A1B2C3",
    "invite_link_id": "xyz123...",
    "owner_id": "user-id",
    "max_members": 50,
    "member_count": 25,
    "is_active": true,
    "created_at": "2024-12-29T10:30:00Z",
    "updated_at": "2024-12-29T10:30:00Z"
  }
]
```

---

### GET /circles/{circle_id}

Circle 상세 정보 및 멤버 목록을 조회합니다.

**엔드포인트:** `GET /api/v1/circles/{circle_id}`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `circle_id` (UUID): Circle ID

**Response (200 OK):**
```json
{
  "id": "circle-id",
  "name": "3학년 2반 친구들",
  "description": "우리 반 친구들 모임",
  "invite_code": "A1B2C3",
  "invite_link_id": "xyz123...",
  "owner_id": "user-id",
  "max_members": 50,
  "member_count": 25,
  "is_active": true,
  "created_at": "2024-12-29T10:30:00Z",
  "updated_at": "2024-12-29T10:30:00Z",
  "members": [
    {
      "id": "membership-id",
      "user_id": "user-id",
      "role": "OWNER",
      "nickname": "철수",
      "joined_at": "2024-12-29T10:30:00Z",
      "username": "chulsoo",
      "display_name": "철수",
      "profile_emoji": "😎"
    }
  ]
}
```

**에러 응답:**
- `403 Forbidden`: Circle 멤버가 아님
- `404 Not Found`: Circle을 찾을 수 없음

---

### POST /circles/join/code

초대 코드로 Circle에 참여합니다.

**엔드포인트:** `POST /api/v1/circles/join/code`
**인증 필요:** ✅ JWT Token

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `invite_code` | string | ✅ | 6자리 초대 코드 | 영대문자+숫자 |
| `nickname` | string | ❌ | Circle 내 닉네임 | 최소 1자, 최대 50자 |

**Request Example:**
```json
{
  "invite_code": "A1B2C3",
  "nickname": "영희"
}
```

**Response (200 OK):**
```json
{
  "id": "circle-id",
  "name": "3학년 2반 친구들",
  "description": "우리 반 친구들 모임",
  "invite_code": "A1B2C3",
  "invite_link_id": "xyz123...",
  "owner_id": "owner-user-id",
  "max_members": 50,
  "member_count": 26,
  "is_active": true,
  "created_at": "2024-12-29T10:30:00Z",
  "updated_at": "2024-12-29T10:30:00Z"
}
```

**에러 응답:**
- `400 Bad Request`: 유효하지 않은 초대 코드
- `400 Bad Request`: Circle 정원 초과
- `409 Conflict`: 이미 가입된 Circle

---

### POST /circles/{circle_id}/leave

Circle에서 탈퇴합니다. (OWNER는 탈퇴 불가)

**엔드포인트:** `POST /api/v1/circles/{circle_id}/leave`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `circle_id` (UUID): Circle ID

**Response (204 No Content)**

**에러 응답:**
- `400 Bad Request`: OWNER는 탈퇴할 수 없음
- `403 Forbidden`: Circle 멤버가 아님
- `404 Not Found`: Circle을 찾을 수 없음

---

### GET /circles/{circle_id}/members

Circle 멤버 목록을 조회합니다.

**엔드포인트:** `GET /api/v1/circles/{circle_id}/members`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `circle_id` (UUID): Circle ID

**Response (200 OK):**
```json
[
  {
    "id": "membership-id",
    "user_id": "user-id",
    "role": "OWNER",
    "nickname": "철수",
    "joined_at": "2024-12-29T10:30:00Z",
    "username": "chulsoo",
    "display_name": "철수",
    "profile_emoji": "😎"
  }
]
```

**에러 응답:**
- `403 Forbidden`: Circle 멤버가 아님
- `404 Not Found`: Circle을 찾을 수 없음

---

### POST /circles/{circle_id}/regenerate-code

초대 코드를 재발급합니다. (OWNER만 가능)

**엔드포인트:** `POST /api/v1/circles/{circle_id}/regenerate-code`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `circle_id` (UUID): Circle ID

**Response (200 OK):**
```json
{
  "invite_code": "X7Y8Z9",
  "message": "Invite code regenerated successfully"
}
```

**에러 응답:**
- `403 Forbidden`: OWNER가 아님
- `404 Not Found`: Circle을 찾을 수 없음

---

## Poll API

투표 관련 API 엔드포인트입니다. 템플릿 조회, 투표 생성, 투표 참여 기능을 제공합니다.

### GET /polls/templates

투표 질문 템플릿 목록을 조회합니다.

**엔드포인트:** `GET /api/v1/polls/templates`
**인증 필요:** ✅ JWT Token

**Query Parameters:**
- `category` (optional): 카테고리 필터 (`APPEARANCE`, `PERSONALITY`, `TALENT`, `SPECIAL`)

**Response (200 OK):**
```json
[
  {
    "id": "template-id",
    "category": "PERSONALITY",
    "question_text": "가장 친절한 사람은?",
    "emoji": "😊",
    "usage_count": 127
  }
]
```

---

### POST /polls/circles/{circle_id}/polls

Circle에서 새 투표를 생성합니다.

**엔드포인트:** `POST /api/v1/polls/circles/{circle_id}/polls`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `circle_id` (UUID): Circle ID

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 가능한 값 |
|------|------|------|------|----------|
| `template_id` | UUID | ✅ | 템플릿 ID | - |
| `duration` | string | ✅ | 투표 기간 | `1H`, `3H`, `6H`, `24H` |

**Request Example:**
```json
{
  "template_id": "template-uuid",
  "duration": "3H"
}
```

**Response (201 Created):**
```json
{
  "id": "poll-id",
  "circle_id": "circle-id",
  "template_id": "template-id",
  "creator_id": "user-id",
  "question_text": "가장 친절한 사람은?",
  "status": "ACTIVE",
  "ends_at": "2024-12-29T15:00:00Z",
  "vote_count": 0,
  "created_at": "2024-12-29T12:00:00Z",
  "updated_at": "2024-12-29T12:00:00Z"
}
```

**에러 응답:**
- `400 Bad Request`: 동시 진행 투표 수 초과 (최대 3개)
- `403 Forbidden`: Circle 멤버가 아님
- `404 Not Found`: Circle 또는 템플릿을 찾을 수 없음

---

### POST /polls/{poll_id}/vote

투표에 참여합니다.

**엔드포인트:** `POST /api/v1/polls/{poll_id}/vote`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `poll_id` (UUID): Poll ID

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `voted_for_id` | UUID | ✅ | 투표할 사용자 ID |

**Request Example:**
```json
{
  "voted_for_id": "user-id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "user_id": "user-id",
      "nickname": "철수",
      "profile_emoji": "😎",
      "vote_count": 8,
      "vote_percentage": 53.3,
      "rank": 1
    }
  ],
  "message": "투표가 완료되었습니다"
}
```

**에러 응답:**
- `400 Bad Request`: 투표가 종료됨
- `400 Bad Request`: 자기 자신에게 투표 불가
- `403 Forbidden`: Circle 멤버가 아님
- `404 Not Found`: Poll 또는 투표 대상을 찾을 수 없음
- `409 Conflict`: 이미 투표에 참여함

---

## Notification API

알림 관련 API 엔드포인트입니다. 알림 조회 및 읽음 처리 기능을 제공합니다.

### GET /notifications

사용자 알림 목록을 조회합니다.

**엔드포인트:** `GET /api/v1/notifications`
**인증 필요:** ✅ JWT Token

**Query Parameters:**
- `limit` (optional): 조회 개수 (1-100, 기본값: 20)
- `offset` (optional): 오프셋 (기본값: 0)

**Response (200 OK):**
```json
[
  {
    "id": "notification-id",
    "user_id": "user-id",
    "type": "POLL_STARTED",
    "title": "새로운 투표가 시작됐어요!",
    "body": "가장 친절한 사람은? 투표에 참여해보세요!",
    "data": {
      "poll_id": "poll-id",
      "circle_id": "circle-id"
    },
    "is_read": false,
    "sent_at": "2024-12-29T15:00:00Z",
    "created_at": "2024-12-29T15:00:00Z"
  }
]
```

---

### GET /notifications/unread-count

읽지 않은 알림 개수를 조회합니다.

**엔드포인트:** `GET /api/v1/notifications/unread-count`
**인증 필요:** ✅ JWT Token

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

### PUT /notifications/{notification_id}/read

특정 알림을 읽음으로 표시합니다.

**엔드포인트:** `PUT /api/v1/notifications/{notification_id}/read`
**인증 필요:** ✅ JWT Token

**Path Parameters:**
- `notification_id` (UUID): Notification ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "Notification marked as read"
}
```

**에러 응답:**
- `403 Forbidden`: 본인의 알림이 아님
- `404 Not Found`: 알림을 찾을 수 없음

---

### PUT /notifications/read-all

모든 알림을 읽음으로 표시합니다.

**엔드포인트:** `PUT /api/v1/notifications/read-all`
**인증 필요:** ✅ JWT Token

**Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "All notifications marked as read"
}
```

---

### POST /notifications/register-token

푸시 알림 토큰을 등록하거나 업데이트합니다.

**엔드포인트:** `POST /api/v1/notifications/register-token`
**인증 필요:** ✅ JWT Token

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|----------|
| `expo_push_token` | string | ✅ | Expo 푸시 토큰 | 최소 1자, 최대 500자 |

**Request Example:**
```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "Push token registered successfully"
}
```

**에러 응답:**
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `404 Not Found`: 사용자를 찾을 수 없음

---

### DELETE /notifications/unregister-token

푸시 알림 토큰을 삭제합니다 (로그아웃 시 호출).

**엔드포인트:** `DELETE /api/v1/notifications/unregister-token`
**인증 필요:** ✅ JWT Token

**Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "Push token unregistered successfully"
}
```

**에러 응답:**
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `404 Not Found`: 사용자를 찾을 수 없음

---

## Report API

신고 관련 API 엔드포인트입니다. 부적절한 콘텐츠나 행동을 신고할 수 있습니다.

### POST /reports

새 신고를 접수합니다.

**엔드포인트:** `POST /api/v1/reports`
**인증 필요:** ✅ JWT Token

**Request Body:**

| 필드 | 타입 | 필수 | 설명 | 가능한 값 |
|------|------|------|------|----------|
| `target_type` | string | ✅ | 신고 대상 타입 | `USER`, `CIRCLE`, `POLL` |
| `target_id` | UUID | ✅ | 신고 대상 ID | - |
| `reason` | string | ✅ | 신고 사유 | `INAPPROPRIATE`, `SPAM`, `HARASSMENT`, `OTHER` |
| `description` | string | ❌ | 상세 설명 | 최대 1000자 |

**Request Example:**
```json
{
  "target_type": "USER",
  "target_id": "user-id",
  "reason": "HARASSMENT",
  "description": "부적절한 닉네임 사용"
}
```

**Response (201 Created):**
```json
{
  "id": "report-id",
  "reporter_id": "reporter-user-id",
  "target_type": "USER",
  "target_id": "user-id",
  "reason": "HARASSMENT",
  "description": "부적절한 닉네임 사용",
  "status": "PENDING",
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2024-12-29T16:30:00Z"
}
```

**에러 응답:**
- `400 Bad Request`: 자기 자신을 신고할 수 없음
- `404 Not Found`: 신고 대상을 찾을 수 없음

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | OK - 요청 성공 |
| 201 | Created - 리소스 생성 성공 |
| 204 | No Content - 요청 성공, 응답 본문 없음 |
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 필요 |
| 403 | Forbidden - 권한 없음 |
| 404 | Not Found - 리소스를 찾을 수 없음 |
| 409 | Conflict - 리소스 충돌 (중복 등) |
| 422 | Unprocessable Entity - 유효하지 않은 입력 데이터 |
| 500 | Internal Server Error - 서버 오류 |

### 에러 응답 형식

```json
{
  "detail": "에러 상세 메시지"
}
```

또는 유효성 검사 에러의 경우:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## 데이터 타입 참조

### Enum 타입

**UserRole:**
- `USER`: 일반 사용자
- `ADMIN`: 관리자

**MemberRole:**
- `OWNER`: Circle 소유자
- `ADMIN`: Circle 관리자
- `MEMBER`: 일반 멤버

**TemplateCategory:**
- `APPEARANCE`: 외모
- `PERSONALITY`: 성격
- `TALENT`: 재능
- `SPECIAL`: 특별

**PollStatus:**
- `ACTIVE`: 진행 중
- `COMPLETED`: 완료됨
- `CANCELLED`: 취소됨

**PollDuration:**
- `1H`: 1시간
- `3H`: 3시간
- `6H`: 6시간
- `24H`: 24시간

**NotificationType:**
- `POLL_STARTED`: 투표 시작
- `POLL_REMINDER`: 투표 리마인드
- `POLL_ENDED`: 투표 종료
- `VOTE_RECEIVED`: 투표 받음
- `CIRCLE_INVITE`: Circle 초대

**ReportTargetType:**
- `USER`: 사용자
- `CIRCLE`: Circle
- `POLL`: 투표

**ReportReason:**
- `INAPPROPRIATE`: 부적절한 콘텐츠
- `SPAM`: 스팸
- `HARASSMENT`: 괴롭힘
- `OTHER`: 기타

**ReportStatus:**
- `PENDING`: 대기 중
- `REVIEWED`: 검토됨
- `RESOLVED`: 해결됨
- `DISMISSED`: 기각됨

---

## Rate Limiting

| 엔드포인트 카테고리 | 제한 |
|-------------------|------|
| 인증 API (login, register) | 10 requests/minute per IP |
| 일반 API | 100 requests/minute per user |
| 투표 생성 | 5 requests/hour per user (최대 3개 동시 진행) |

---

## 추가 참고사항

### JWT Token
- **만료 시간**: 24시간
- **알고리즘**: HS256
- **Refresh 토큰**: 현재 미지원 (단순화)

### Circle 초대 방식

**초대 코드 (invite_code):**
- **형식**: 6자리 영대문자 + 숫자 (예: `A1B2C3`)
- **유효 기간**: 생성 후 24시간
- **재발급**: OWNER만 가능
- **사용법**: `/circles/join/code` 엔드포인트에 코드 입력

**초대 링크 (invite_link_id):**
- **형식**: UUID
- **특징**: 영구적으로 사용 가능 (만료되지 않음)
- **사용법**: `/circles/join/link/{linkId}` 엔드포인트로 직접 참여
- **생성**: Circle 생성 시 자동 생성
- **공유**: 딥링크 또는 URL로 공유 가능 (예: `circly://join/circle/{linkId}`)

### 투표 익명성
- 투표자 ID는 직접 저장되지 않음
- `voter_hash = SHA-256(voter_id + poll_id + salt)` 형식으로 해시하여 저장
- 결과에서 투표자 정보는 절대 노출되지 않음

### Pagination
- **기본값**: `limit=20`, `offset=0`
- **최대값**: `limit=100`

---

**문서 버전**: 2.0.0
**마지막 업데이트**: 2024-12-29
**출처**: `docs/DSL.md` 및 실제 구현 코드
