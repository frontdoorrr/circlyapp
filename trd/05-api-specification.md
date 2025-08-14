# API 명세서 (API Specification)

## 개요
Circly 백엔드 API의 상세 명세서입니다. RESTful API 설계 원칙을 따르며, 모든 엔드포인트는 JSON 형태로 데이터를 주고받습니다.

## 🌐 기본 정보

### Base URL
```
Production: https://api.circly.app/v1
Staging: https://staging-api.circly.app/v1
Development: http://localhost:8000/v1
```

### 인증 방식
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 공통 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔐 인증 API

### POST /auth/device-login
디바이스 기반 익명 로그인

**Request Body:**
```json
{
  "device_id": "uuid-string",
  "platform": "ios|android",
  "app_version": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_string",
    "refresh_token": "refresh_token_string",
    "expires_in": 604800,
    "user_id": "uuid-string"
  }
}
```

**Status Codes:**
- `200`: 성공
- `400`: 잘못된 요청 데이터
- `500`: 서버 에러

### POST /auth/refresh
토큰 갱신

**Request Body:**
```json
{
  "refresh_token": "refresh_token_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 604800
  }
}
```

## 👥 사용자 API

### GET /users/me
현재 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "device_id": "device-uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "last_active_at": "2024-01-15T15:45:00Z",
    "app_version": "1.0.0",
    "platform": "ios"
  }
}
```

### PUT /users/me
사용자 정보 업데이트

**Request Body:**
```json
{
  "push_token": "expo_push_token_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "updated_at": "2024-01-15T16:00:00Z"
  }
}
```

## 🎯 Circle API

### GET /circles
사용자가 속한 Circle 목록 조회

**Query Parameters:**
```
?status=active|inactive&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "circles": [
      {
        "id": "uuid-string",
        "name": "3학년 2반 친구들",
        "member_count": 25,
        "max_members": 50,
        "active_polls": 3,
        "role": "creator|member",
        "created_at": "2024-01-10T09:00:00Z",
        "expires_at": "2024-01-25T09:00:00Z",
        "is_active": true
      }
    ],
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /circles/{circle_id}
특정 Circle 상세 정보 조회

**Path Parameters:**
- `circle_id`: Circle UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "3학년 2반 친구들",
    "creator_id": "uuid-string",
    "invite_code": "A1B2C3",
    "invite_link_id": "unique-link-id",
    "member_count": 25,
    "max_members": 50,
    "poll_count": 12,
    "created_at": "2024-01-10T09:00:00Z",
    "expires_at": "2024-01-25T09:00:00Z",
    "is_active": true,
    "members": [
      {
        "id": "uuid-string",
        "nickname": "철수",
        "joined_at": "2024-01-10T10:30:00Z",
        "is_active": true
      }
    ]
  }
}
```

### POST /circles
새 Circle 생성

**Request Body:**
```json
{
  "name": "3학년 2반 친구들",
  "max_members": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "3학년 2반 친구들",
    "invite_code": "A1B2C3",
    "invite_link_id": "unique-link-id",
    "invite_link": "https://circly.app/join/unique-link-id",
    "max_members": 50,
    "expires_at": "2024-01-16T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /circles/{circle_id}
Circle 정보 수정 (생성자만 가능)

**Request Body:**
```json
{
  "name": "새로운 Circle 이름",
  "max_members": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "새로운 Circle 이름",
    "max_members": 30,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

### DELETE /circles/{circle_id}
Circle 삭제 (생성자만 가능)

**Response:**
```json
{
  "success": true,
  "message": "Circle deleted successfully"
}
```

### POST /circles/join
Circle 참여 (코드 또는 링크로)

**Request Body:**
```json
{
  "invite_code": "A1B2C3",
  "nickname": "영희"
}
// 또는
{
  "invite_link_id": "unique-link-id",
  "nickname": "영희"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "circle": {
      "id": "uuid-string",
      "name": "3학년 2반 친구들",
      "member_count": 26
    },
    "membership": {
      "id": "uuid-string",
      "nickname": "영희",
      "joined_at": "2024-01-15T11:30:00Z"
    }
  }
}
```

### POST /circles/{circle_id}/regenerate-invite
초대 코드/링크 재발급 (생성자만 가능)

**Response:**
```json
{
  "success": true,
  "data": {
    "invite_code": "X7Y8Z9",
    "invite_link_id": "new-unique-link-id",
    "invite_link": "https://circly.app/join/new-unique-link-id",
    "expires_at": "2024-01-16T11:30:00Z"
  }
}
```

### DELETE /circles/{circle_id}/members/{member_id}
멤버 강제 퇴출 (생성자만 가능)

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

## 📊 질문 템플릿 API

### GET /templates
질문 템플릿 목록 조회

**Query Parameters:**
```
?category=외모|성격|재능|특별한날&popular=true&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid-string",
        "category": "성격",
        "question_text": "가장 친절한 사람은?",
        "usage_count": 127,
        "is_popular": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /templates/{template_id}
특정 템플릿 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "category": "성격",
    "question_text": "가장 친절한 사람은?",
    "usage_count": 127,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /templates/popular
인기 질문 템플릿 조회

**Query Parameters:**
```
?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid-string",
        "category": "성격",
        "question_text": "가장 친절한 사람은?",
        "usage_count": 234,
        "rank": 1
      }
    ]
  }
}
```

## 🗳️ 투표 API

### GET /polls
투표 목록 조회

**Query Parameters:**
```
?circle_id=uuid&status=active|completed&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "polls": [
      {
        "id": "uuid-string",
        "circle_id": "uuid-string",
        "creator_id": "uuid-string",
        "template_id": "uuid-string",
        "question_text": "가장 친절한 사람은?",
        "deadline": "2024-01-15T18:00:00Z",
        "total_votes": 15,
        "total_participants": 12,
        "is_active": true,
        "is_closed": false,
        "user_voted": false,
        "created_at": "2024-01-15T12:00:00Z"
      }
    ],
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /polls/{poll_id}
특정 투표 상세 정보 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "circle_id": "uuid-string",
    "creator_id": "uuid-string",
    "template_id": "uuid-string",
    "question_text": "가장 친절한 사람은?",
    "deadline": "2024-01-15T18:00:00Z",
    "is_anonymous": true,
    "total_votes": 15,
    "total_participants": 12,
    "is_active": true,
    "is_closed": false,
    "user_voted": true,
    "created_at": "2024-01-15T12:00:00Z",
    "options": [
      {
        "id": "uuid-string",
        "member_id": "uuid-string",
        "member_nickname": "철수",
        "display_order": 0,
        "vote_count": 8
      },
      {
        "id": "uuid-string",
        "member_id": "uuid-string",
        "member_nickname": "영희",
        "display_order": 1,
        "vote_count": 7
      }
    ]
  }
}
```

### POST /polls
새 투표 생성

**Request Body:**
```json
{
  "template_id": "uuid-string",
  "circle_id": "uuid-string",
  "deadline": "2024-01-15T18:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "circle_id": "uuid-string",
    "template_id": "uuid-string",
    "question_text": "가장 친절한 사람은?",
    "deadline": "2024-01-15T18:00:00Z",
    "total_participants": 0,
    "is_active": true,
    "created_at": "2024-01-15T12:00:00Z",
    "options": [
      {
        "id": "uuid-string",
        "member_nickname": "철수",
        "display_order": 0
      }
    ]
  }
}
```

### PUT /polls/{poll_id}
투표 정보 수정 (생성자만, 시작 전에만 가능)

**Request Body:**
```json
{
  "deadline": "2024-01-15T20:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "deadline": "2024-01-15T20:00:00Z",
    "updated_at": "2024-01-15T13:00:00Z"
  }
}
```

### DELETE /polls/{poll_id}
투표 삭제 (생성자만, 생성 후 24시간 이내)

**Response:**
```json
{
  "success": true,
  "message": "Poll deleted successfully"
}
```

### POST /polls/{poll_id}/vote
투표 참여

**Request Body:**
```json
{
  "option_id": "uuid-string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vote_id": "uuid-string",
    "poll_id": "uuid-string",
    "option_id": "uuid-string",
    "created_at": "2024-01-15T14:30:00Z"
  }
}
```

### GET /polls/{poll_id}/results
투표 결과 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "poll_id": "uuid-string",
    "question_text": "가장 친절한 사람은?",
    "total_votes": 20,
    "total_participants": 18,
    "is_closed": true,
    "results": [
      {
        "option_id": "uuid-string",
        "member_nickname": "철수",
        "vote_count": 12,
        "percentage": 60.0,
        "rank": 1
      },
      {
        "option_id": "uuid-string",
        "member_nickname": "영희",
        "vote_count": 8,
        "percentage": 40.0,
        "rank": 2
      }
    ],
    "winner": {
      "member_nickname": "철수",
      "vote_count": 12,
      "percentage": 60.0
    }
  }
}
```

## 🔔 알림 API

### GET /notifications
사용자 알림 목록 조회

**Query Parameters:**
```
?status=unread|read|all&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid-string",
        "type": "poll_start|poll_deadline|poll_result",
        "title": "새로운 투표가 시작됐어요!",
        "message": "가장 친절한 사람은? 투표에 참여해보세요!",
        "data": {
          "poll_id": "uuid-string",
          "circle_id": "uuid-string"
        },
        "is_read": false,
        "created_at": "2024-01-15T15:00:00Z"
      }
    ],
    "unread_count": 5,
    "total": 25
  }
}
```

### PUT /notifications/{notification_id}/read
알림 읽음 처리

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "is_read": true,
    "read_at": "2024-01-15T15:30:00Z"
  }
}
```

### PUT /notifications/read-all
모든 알림 읽음 처리

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### GET /notifications/settings
알림 설정 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "poll_start_enabled": true,
    "poll_deadline_enabled": true,
    "poll_result_enabled": true,
    "quiet_hours_enabled": false,
    "quiet_start_hour": 22,
    "quiet_end_hour": 8,
    "max_notifications_per_day": 20
  }
}
```

### PUT /notifications/settings
알림 설정 변경

**Request Body:**
```json
{
  "poll_start_enabled": false,
  "quiet_hours_enabled": true,
  "quiet_start_hour": 22,
  "quiet_end_hour": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poll_start_enabled": false,
    "poll_deadline_enabled": true,
    "poll_result_enabled": true,
    "quiet_hours_enabled": true,
    "quiet_start_hour": 22,
    "quiet_end_hour": 8,
    "updated_at": "2024-01-15T16:00:00Z"
  }
}
```

## 📊 통계 API

### GET /stats/user
개인 사용자 통계

**Response:**
```json
{
  "success": true,
  "data": {
    "total_polls_created": 15,
    "total_votes_cast": 45,
    "circles_joined": 3,
    "favorite_category": "성격",
    "most_active_hour": 21,
    "streak_days": 7,
    "achievements": [
      {
        "id": "compliment_master",
        "name": "칭찬왕",
        "description": "10번의 긍정적 투표 참여",
        "earned_at": "2024-01-10T00:00:00Z"
      }
    ]
  }
}
```

### GET /stats/circle/{circle_id}
Circle 통계 (멤버만 조회 가능)

**Response:**
```json
{
  "success": true,
  "data": {
    "circle_id": "uuid-string",
    "total_polls": 25,
    "total_votes": 380,
    "avg_participation_rate": 72.5,
    "most_popular_category": "성격",
    "most_active_members": [
      {
        "nickname": "철수",
        "polls_created": 8,
        "votes_cast": 22
      }
    ],
    "activity_trend": {
      "daily_polls": [2, 3, 1, 4, 2, 1, 3],
      "daily_votes": [15, 22, 8, 28, 18, 12, 21]
    }
  }
}
```

## 🚨 신고 API

### POST /reports
콘텐츠 신고

**Request Body:**
```json
{
  "type": "poll|circle|user",
  "target_id": "uuid-string",
  "reason": "bullying|inappropriate|spam|other",
  "description": "신고 상세 내용",
  "evidence": ["screenshot_url_1", "screenshot_url_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_id": "uuid-string",
    "status": "pending",
    "created_at": "2024-01-15T16:30:00Z",
    "message": "신고가 접수되었습니다. 검토 후 조치하겠습니다."
  }
}
```

### GET /reports/my
내가 제출한 신고 목록

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid-string",
        "type": "poll",
        "target_id": "uuid-string",
        "reason": "bullying",
        "status": "resolved|pending|rejected",
        "created_at": "2024-01-15T16:30:00Z",
        "resolved_at": "2024-01-16T10:00:00Z"
      }
    ]
  }
}
```

## 📁 파일 업로드 API

### POST /upload/image
이미지 업로드 (결과 카드용)

**Request:** `multipart/form-data`
```
file: image file
type: result_card|profile_image
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file_id": "uuid-string",
    "url": "https://cdn.circly.app/images/uuid.jpg",
    "filename": "result_card.jpg",
    "size": 1024000,
    "content_type": "image/jpeg",
    "uploaded_at": "2024-01-15T17:00:00Z"
  }
}
```

## 🏥 헬스체크 API

### GET /health
서비스 상태 확인

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T17:30:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### GET /health/detailed
상세 서비스 상태 확인

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T17:30:00Z",
  "services": {
    "database": {"status": "ok", "response_time": "15ms"},
    "redis": {"status": "ok", "response_time": "5ms"},
    "storage": {"status": "ok", "response_time": "120ms"}
  },
  "metrics": {
    "active_connections": 45,
    "cpu_usage": 35.2,
    "memory_usage": 68.5
  }
}
```

## 🔍 에러 코드

### 클라이언트 에러 (4xx)
```javascript
const clientErrors = {
  400: {
    "VALIDATION_ERROR": "요청 데이터가 유효하지 않습니다",
    "MISSING_REQUIRED_FIELD": "필수 필드가 누락되었습니다",
    "INVALID_FORMAT": "데이터 형식이 올바르지 않습니다"
  },
  401: {
    "UNAUTHORIZED": "인증이 필요합니다",
    "INVALID_TOKEN": "유효하지 않은 토큰입니다",
    "TOKEN_EXPIRED": "토큰이 만료되었습니다"
  },
  403: {
    "FORBIDDEN": "접근 권한이 없습니다",
    "NOT_CIRCLE_MEMBER": "Circle 멤버가 아닙니다",
    "NOT_POLL_CREATOR": "투표 생성자가 아닙니다"
  },
  404: {
    "NOT_FOUND": "요청한 리소스를 찾을 수 없습니다",
    "CIRCLE_NOT_FOUND": "Circle을 찾을 수 없습니다",
    "POLL_NOT_FOUND": "투표를 찾을 수 없습니다"
  },
  409: {
    "ALREADY_EXISTS": "이미 존재하는 리소스입니다",
    "ALREADY_VOTED": "이미 투표에 참여했습니다",
    "CIRCLE_FULL": "Circle 정원이 찼습니다"
  },
  429: {
    "RATE_LIMIT_EXCEEDED": "요청 한도를 초과했습니다",
    "TOO_MANY_POLLS": "투표 생성 한도를 초과했습니다"
  }
};
```

### 서버 에러 (5xx)
```javascript
const serverErrors = {
  500: {
    "INTERNAL_ERROR": "서버 내부 오류가 발생했습니다",
    "DATABASE_ERROR": "데이터베이스 연결 오류입니다"
  },
  502: {
    "BAD_GATEWAY": "게이트웨이 오류입니다"
  },
  503: {
    "SERVICE_UNAVAILABLE": "서비스를 사용할 수 없습니다",
    "MAINTENANCE_MODE": "서비스 점검 중입니다"
  }
};
```

## 📋 API 사용 가이드

### Rate Limiting
```
- 인증 API: 10 requests/minute per IP
- 일반 API: 100 requests/minute per user
- 투표 생성: 10 polls/hour per user
- 파일 업로드: 20 uploads/hour per user
```

### Pagination
```
기본값: limit=20, offset=0
최대값: limit=100
```

### Filtering & Sorting
```
?status=active&sort=created_at&order=desc
?category=성격&popular=true
```

### 날짜 형식
```
ISO 8601 형식: "2024-01-15T10:30:00Z"
타임존: UTC 기준
```

이 API 명세서를 통해 Circly 백엔드와의 **모든 상호작용**을 체계적으로 구현할 수 있습니다! 🚀