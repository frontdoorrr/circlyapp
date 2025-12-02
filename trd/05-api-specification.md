# API 명세서 (API Specification)

> **Note**: 이 문서는 `docs/DSL.md`를 기반으로 작성되었습니다.
> API 설계의 Single Source of Truth는 DSL.md입니다.

## 개요

Circly 백엔드 API의 상세 명세서입니다. RESTful API 설계 원칙을 따르며, 모든 엔드포인트는 JSON 형태로 데이터를 주고받습니다.

## 기본 정보

### Base URL
```
Production: https://api.circly.app/api/v1
Staging: https://staging-api.circly.app/api/v1
Development: http://localhost:8000/api/v1
```

### 인증 방식
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 공통 응답 형식 (DSL.md 섹션 9 기준)
```json
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "투표가 완료되었습니다"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "ALREADY_VOTED",
    "message": "이미 투표에 참여하셨습니다"
  }
}

// 목록 응답
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "hasMore": true
  }
}
```

---

## Auth API (DSL.md 섹션 3.1)

### POST /api/v1/auth/register
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "홍길동"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "username": "홍길동",
      "displayName": null,
      "profileEmoji": "😊",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "accessToken": "jwt_token_string",
    "tokenType": "bearer"
  }
}
```

### POST /api/v1/auth/login
로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_string",
    "tokenType": "bearer"
  }
}
```

### POST /api/v1/auth/logout
로그아웃

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

### GET /api/v1/auth/me
현재 사용자 정보 조회

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "홍길동",
    "displayName": "길동이",
    "profileEmoji": "😊",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T15:45:00Z"
  }
}
```

### PUT /api/v1/auth/me
프로필 업데이트

**Request Body:**
```json
{
  "username": "새이름",
  "displayName": "새 표시 이름",
  "profileEmoji": "🎉"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "새이름",
    "displayName": "새 표시 이름",
    "profileEmoji": "🎉",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T16:00:00Z"
  }
}
```

### POST /api/v1/auth/push-token
푸시 토큰 등록

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxx]"
}
```

**Response:**
```json
{
  "success": true,
  "message": "푸시 토큰이 등록되었습니다"
}
```

---

## Circle API (DSL.md 섹션 3.2)

### POST /api/v1/circles
Circle 생성

**Request Body:**
```json
{
  "name": "3학년 2반 친구들",
  "description": "우리 반 친구들 모임",
  "maxMembers": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "3학년 2반 친구들",
    "description": "우리 반 친구들 모임",
    "inviteCode": "A1B2C3",
    "inviteLinkId": "uuid-string",
    "ownerId": "uuid-string",
    "maxMembers": 50,
    "memberCount": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /api/v1/circles
사용자 Circle 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "3학년 2반 친구들",
      "memberCount": 25,
      "activePollCount": 3,
      "myRole": "OWNER"
    }
  ]
}
```

### GET /api/v1/circles/{id}
Circle 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "circle": {
      "id": "uuid-string",
      "name": "3학년 2반 친구들",
      "description": "우리 반 친구들 모임",
      "inviteCode": "A1B2C3",
      "inviteLinkId": "uuid-string",
      "ownerId": "uuid-string",
      "maxMembers": 50,
      "memberCount": 25,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "members": [
      {
        "userId": "uuid-string",
        "nickname": "철수",
        "profileEmoji": "😎",
        "role": "OWNER",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "activePolls": [...],
    "myRole": "OWNER"
  }
}
```

### PUT /api/v1/circles/{id}
Circle 정보 수정 (Owner만 가능)

**Request Body:**
```json
{
  "name": "새로운 Circle 이름",
  "description": "새로운 설명",
  "maxMembers": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "새로운 Circle 이름",
    "description": "새로운 설명",
    "maxMembers": 30,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### DELETE /api/v1/circles/{id}
Circle 삭제 (Owner만 가능)

**Response:**
```json
{
  "success": true,
  "message": "Circle이 삭제되었습니다"
}
```

### POST /api/v1/circles/join/code
초대 코드로 Circle 참여

**Request Body:**
```json
{
  "code": "A1B2C3",
  "nickname": "영희"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "circleId": "uuid-string",
    "userId": "uuid-string",
    "role": "MEMBER",
    "nickname": "영희",
    "joinedAt": "2024-01-15T11:30:00Z"
  }
}
```

### POST /api/v1/circles/join/link/{linkId}
초대 링크로 Circle 참여

**Request Body:**
```json
{
  "nickname": "영희"
}
```

**Response:** (동일)

### POST /api/v1/circles/{id}/leave
Circle 탈퇴

**Response:**
```json
{
  "success": true,
  "message": "Circle에서 탈퇴했습니다"
}
```

### DELETE /api/v1/circles/{id}/members/{userId}
멤버 강제 퇴출 (Owner만 가능)

**Response:**
```json
{
  "success": true,
  "message": "멤버가 퇴출되었습니다"
}
```

### POST /api/v1/circles/{id}/regenerate-code
초대 코드 재발급 (Owner만 가능)

**Response:**
```json
{
  "success": true,
  "data": {
    "inviteCode": "X7Y8Z9"
  }
}
```

### GET /api/v1/circles/{id}/members
Circle 멤버 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid-string",
      "nickname": "철수",
      "profileEmoji": "😎",
      "role": "OWNER",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Poll API (DSL.md 섹션 3.3)

### GET /api/v1/polls/templates
질문 템플릿 목록 조회

**Query Parameters:**
- `category`: APPEARANCE | PERSONALITY | TALENT | SPECIAL

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "category": "PERSONALITY",
      "questionText": "가장 친절한 사람은?",
      "emoji": "😊",
      "isActive": true,
      "usageCount": 127,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/v1/circles/{circleId}/polls
투표 생성

**Request Body:**
```json
{
  "templateId": "uuid-string",
  "duration": "3H"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "circleId": "uuid-string",
    "templateId": "uuid-string",
    "creatorId": "uuid-string",
    "questionText": "가장 친절한 사람은?",
    "status": "ACTIVE",
    "endsAt": "2024-01-15T15:00:00Z",
    "voteCount": 0,
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

### GET /api/v1/circles/{circleId}/polls
Circle 투표 목록 조회

**Query Parameters:**
- `status`: ACTIVE | COMPLETED | CANCELLED

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "questionText": "가장 친절한 사람은?",
      "emoji": "😊",
      "status": "ACTIVE",
      "voteCount": 15,
      "endsAt": "2024-01-15T18:00:00Z",
      "hasVoted": false
    }
  ]
}
```

### GET /api/v1/polls/{id}
투표 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": "uuid-string",
      "circleId": "uuid-string",
      "templateId": "uuid-string",
      "creatorId": "uuid-string",
      "questionText": "가장 친절한 사람은?",
      "status": "ACTIVE",
      "endsAt": "2024-01-15T18:00:00Z",
      "voteCount": 15,
      "createdAt": "2024-01-15T12:00:00Z"
    },
    "template": {
      "id": "uuid-string",
      "category": "PERSONALITY",
      "questionText": "가장 친절한 사람은?",
      "emoji": "😊"
    },
    "options": [
      {
        "userId": "uuid-string",
        "nickname": "철수",
        "profileEmoji": "😎"
      },
      {
        "userId": "uuid-string",
        "nickname": "영희",
        "profileEmoji": "🌟"
      }
    ],
    "hasVoted": false,
    "results": null,
    "timeRemaining": 21600
  }
}
```

### DELETE /api/v1/polls/{id}
투표 취소 (생성자만, ACTIVE 상태에서만)

**Response:**
```json
{
  "success": true,
  "message": "투표가 취소되었습니다"
}
```

### POST /api/v1/polls/{id}/vote
투표 참여

**Request Body:**
```json
{
  "votedForId": "uuid-string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "results": [
      {
        "userId": "uuid-string",
        "nickname": "철수",
        "profileEmoji": "😎",
        "voteCount": 8,
        "votePercentage": 53.3,
        "rank": 1
      },
      {
        "userId": "uuid-string",
        "nickname": "영희",
        "profileEmoji": "🌟",
        "voteCount": 7,
        "votePercentage": 46.7,
        "rank": 2
      }
    ],
    "message": "투표가 완료되었습니다"
  }
}
```

### GET /api/v1/polls/{id}/has-voted
투표 참여 여부 확인

**Response:**
```json
{
  "success": true,
  "data": {
    "hasVoted": true
  }
}
```

### GET /api/v1/polls/{id}/results
투표 결과 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid-string",
      "nickname": "철수",
      "profileEmoji": "😎",
      "voteCount": 12,
      "votePercentage": 60.0,
      "rank": 1
    },
    {
      "userId": "uuid-string",
      "nickname": "영희",
      "profileEmoji": "🌟",
      "voteCount": 8,
      "votePercentage": 40.0,
      "rank": 2
    }
  ]
}
```

---

## Notification API (DSL.md 섹션 3.4)

### GET /api/v1/notifications
알림 목록 조회

**Query Parameters:**
- `limit`: 개수 (기본 20)
- `offset`: 오프셋 (기본 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "userId": "uuid-string",
      "type": "POLL_STARTED",
      "title": "새로운 투표가 시작됐어요!",
      "body": "가장 친절한 사람은? 투표에 참여해보세요!",
      "data": {
        "pollId": "uuid-string",
        "circleId": "uuid-string"
      },
      "isRead": false,
      "sentAt": "2024-01-15T15:00:00Z",
      "createdAt": "2024-01-15T15:00:00Z"
    }
  ]
}
```

### GET /api/v1/notifications/unread-count
읽지 않은 알림 개수

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### PUT /api/v1/notifications/{id}/read
알림 읽음 처리

**Response:**
```json
{
  "success": true,
  "message": "알림을 읽음 처리했습니다"
}
```

### PUT /api/v1/notifications/read-all
모든 알림 읽음 처리

**Response:**
```json
{
  "success": true,
  "message": "모든 알림을 읽음 처리했습니다"
}
```

---

## Report API (DSL.md 섹션 3.5)

### POST /api/v1/reports
신고 접수

**Request Body:**
```json
{
  "targetType": "USER",
  "targetId": "uuid-string",
  "reason": "HARASSMENT",
  "description": "부적절한 닉네임 사용"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "reporterId": "uuid-string",
    "targetType": "USER",
    "targetId": "uuid-string",
    "reason": "HARASSMENT",
    "description": "부적절한 닉네임 사용",
    "status": "PENDING",
    "createdAt": "2024-01-15T16:30:00Z"
  }
}
```

### GET /api/v1/admin/reports
신고 목록 조회 (Admin만 가능)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "reporterId": "uuid-string",
      "targetType": "USER",
      "targetId": "uuid-string",
      "reason": "HARASSMENT",
      "status": "PENDING",
      "createdAt": "2024-01-15T16:30:00Z"
    }
  ]
}
```

### PUT /api/v1/admin/reports/{id}/review
신고 처리 (Admin만 가능)

**Request Body:**
```json
{
  "action": "RESOLVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "RESOLVED",
    "reviewedBy": "uuid-string",
    "reviewedAt": "2024-01-16T10:00:00Z"
  }
}
```

---

## Share API (DSL.md 섹션 3.6)

### POST /api/v1/polls/{id}/share/card
결과 카드 생성

**Request Body:**
```json
{
  "template": "default",
  "options": {
    "backgroundColor": "#FFFFFF",
    "showBranding": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.circly.app/cards/uuid.png",
    "expiresAt": "2024-01-22T10:00:00Z"
  }
}
```

### GET /api/v1/share/templates
카드 템플릿 목록

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "default",
      "name": "기본",
      "previewUrl": "https://storage.circly.app/templates/default.png",
      "isPremium": false
    }
  ]
}
```

---

## Health Check API

### GET /api/v1/health
서비스 상태 확인

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T17:30:00Z",
  "version": "1.0.0"
}
```

---

## 에러 코드 (DSL.md 섹션 9 기준)

### Auth 에러
| 코드 | HTTP Status | 메시지 |
|------|-------------|--------|
| AUTH_REQUIRED | 401 | 인증이 필요합니다 |
| INVALID_CREDENTIALS | 401 | 잘못된 인증 정보입니다 |
| TOKEN_EXPIRED | 401 | 토큰이 만료되었습니다 |

### Circle 에러
| 코드 | HTTP Status | 메시지 |
|------|-------------|--------|
| CIRCLE_NOT_FOUND | 404 | Circle을 찾을 수 없습니다 |
| INVALID_INVITE_CODE | 400 | 유효하지 않은 초대 코드입니다 |
| CIRCLE_FULL | 400 | Circle 멤버 수가 초과되었습니다 |
| ALREADY_MEMBER | 409 | 이미 가입된 Circle입니다 |

### Poll 에러
| 코드 | HTTP Status | 메시지 |
|------|-------------|--------|
| POLL_NOT_FOUND | 404 | 투표를 찾을 수 없습니다 |
| POLL_ENDED | 400 | 투표가 종료되었습니다 |
| ALREADY_VOTED | 409 | 이미 투표에 참여하셨습니다 |
| SELF_VOTE_NOT_ALLOWED | 400 | 자기 자신에게 투표할 수 없습니다 |
| MAX_POLLS_EXCEEDED | 400 | 동시 진행 가능한 투표 수를 초과했습니다 |

### 일반 에러
| 코드 | HTTP Status | 메시지 |
|------|-------------|--------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| NOT_FOUND | 404 | 리소스를 찾을 수 없습니다 |
| FORBIDDEN | 403 | 접근 권한이 없습니다 |
| INTERNAL_ERROR | 500 | 서버 오류가 발생했습니다 |

---

## Rate Limiting

```
인증 API: 10 requests/minute per IP
일반 API: 100 requests/minute per user
투표 생성: 5 requests/hour per user (최대 3개 동시 진행)
```

## Pagination

```
기본값: limit=20, offset=0
최대값: limit=100
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Updated | 2024-12-02 |
| Source of Truth | docs/DSL.md |
