# Circly - 익명 칭찬 투표 플랫폼 DSL

## 1. 시스템 아키텍처

```dsl
system Architecture {
    version: "2.0.0"
    name: "Circly"
    description: "중·고등학생을 위한 익명 칭찬 투표 플랫폼"

    frontend: React Native (Expo)
    backend: FastAPI (Python 3.13)
    database: PostgreSQL (Supabase)
    cache: Redis
    storage: Supabase Storage
    structure: Modular Monolithic

    modules: [
        Auth,
        Circle,
        Poll,
        Notification,
        Report,
        Analytics,
        Share
    ]

    external_services: [
        ExpoPushService,    // 푸시 알림
        RevenueCat,         // 결제 (Orb Mode)
        Sentry,             // 에러 모니터링
        FirebaseAnalytics   // 사용자 분석
    ]
}
```

## 2. 데이터베이스 스키마

```dsl
database Schema {

    // 사용자 테이블
    table users {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        email: VARCHAR(255) UNIQUE
        hashed_password: VARCHAR(255)
        username: VARCHAR(50)
        display_name: VARCHAR(100)
        profile_emoji: VARCHAR(10) DEFAULT '😊'
        gender: user_gender DEFAULT 'UNSPECIFIED'  // 선택 입력, 기본 비공개
        age_group: user_age_group DEFAULT 'UNSPECIFIED'  // 선택 입력, 기본 비공개
        profile_visibility: JSONB DEFAULT '{"gender":"private","ageGroup":"private"}'
        role: user_role DEFAULT 'USER'  // USER, ADMIN
        is_active: BOOLEAN DEFAULT TRUE
        push_token: TEXT
        next_session_at: TIMESTAMPTZ  // 투표 세션 완료 후 다음 세션 가능 시각
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // Circle (그룹) 테이블
    table circles {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        name: VARCHAR(100) NOT NULL
        description: TEXT
        invite_code: VARCHAR(6) UNIQUE NOT NULL
        invite_code_expires_at: TIMESTAMPTZ NOT NULL  // 초대 코드 만료 시간 (생성 후 24시간)
        invite_link_id: UUID UNIQUE
        owner_id: UUID FOREIGN KEY -> users(id)
        max_members: INTEGER DEFAULT 50
        member_count: INTEGER DEFAULT 0
        is_active: BOOLEAN DEFAULT TRUE
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // Circle 멤버십 테이블
    table circle_members {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        circle_id: UUID FOREIGN KEY -> circles(id)
        user_id: UUID FOREIGN KEY -> users(id)
        role: member_role DEFAULT 'MEMBER'  // OWNER, ADMIN, MEMBER
        nickname: VARCHAR(50)
        joined_at: TIMESTAMPTZ DEFAULT NOW()

        UNIQUE(circle_id, user_id)
    }

    // 투표 템플릿 테이블
    table poll_templates {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        category: template_category NOT NULL  // APPEARANCE, CRUSH, PERSONALITY, TALENT, SPECIAL
        question_text: TEXT NOT NULL
        emoji: VARCHAR(10)
        safety_category: template_safety_category DEFAULT 'COMPLIMENT'
        review_status: template_review_status DEFAULT 'APPROVED'
        allowed_candidate_filters: JSONB DEFAULT '{}'
        is_active: BOOLEAN DEFAULT TRUE
        usage_count: INTEGER DEFAULT 0
        created_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 투표 테이블
    table polls {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        circle_id: UUID FOREIGN KEY -> circles(id)
        template_id: UUID FOREIGN KEY -> poll_templates(id)
        creator_id: UUID FOREIGN KEY -> users(id)
        question_text: TEXT NOT NULL
        status: poll_status DEFAULT 'ACTIVE'  // ACTIVE, COMPLETED, CANCELLED
        candidate_filter: JSONB DEFAULT '{}'
        ends_at: TIMESTAMPTZ NOT NULL
        vote_count: INTEGER DEFAULT 0
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 투표 참여 테이블 (Orb Mode용 voter_id 포함)
    table votes {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        poll_id: UUID FOREIGN KEY -> polls(id)
        voter_id: UUID FOREIGN KEY -> users(id)  // Orb Mode에서 공개
        voter_hash: VARCHAR(64) NOT NULL  // SHA-256(voter_id + poll_id + salt), 중복 투표 방지용
        voted_for_id: UUID FOREIGN KEY -> users(id)
        created_at: TIMESTAMPTZ DEFAULT NOW()

        UNIQUE(poll_id, voter_hash)
    }

    // 받은 하트 읽음 상태 테이블
    table received_heart_reads {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id)
        poll_id: UUID FOREIGN KEY -> polls(id)
        read_at: TIMESTAMPTZ DEFAULT NOW()

        UNIQUE(user_id, poll_id)
    }

    // 받은 하트/Orb Mode 힌트 테이블
    table vote_hints {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        vote_id: UUID FOREIGN KEY -> votes(id)
        user_id: UUID FOREIGN KEY -> users(id)  // 힌트를 받는 사용자
        tier: VARCHAR(20) NOT NULL              // CIRCLE, TIME, INITIAL, FULL
        hint_text: TEXT NOT NULL
        created_at: TIMESTAMPTZ DEFAULT NOW()

        UNIQUE(vote_id, tier)
    }

    // 투표 결과 테이블 (집계용)
    table poll_results {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        poll_id: UUID FOREIGN KEY -> polls(id)
        user_id: UUID FOREIGN KEY -> users(id)
        vote_count: INTEGER DEFAULT 0
        vote_percentage: DECIMAL(5,2) DEFAULT 0
        rank: INTEGER

        UNIQUE(poll_id, user_id)
    }

    // 서버 투표 세션 테이블
    table vote_sessions {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id)
        circle_id: UUID FOREIGN KEY -> circles(id) NULL  // 전체 세션이면 NULL
        status: VARCHAR(20) DEFAULT 'ACTIVE'  // ACTIVE, COMPLETED
        poll_ids: JSONB NOT NULL              // 최대 12개 poll UUID 문자열
        current_index: INTEGER DEFAULT 0
        skipped_poll_ids: JSONB DEFAULT '[]'
        completed_at: TIMESTAMPTZ
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 알림 테이블
    table notifications {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id)
        type: notification_type NOT NULL
        title: VARCHAR(100) NOT NULL
        body: TEXT NOT NULL
        data: JSONB  // 추가 데이터 (poll_id, circle_id 등)
        is_read: BOOLEAN DEFAULT FALSE
        sent_at: TIMESTAMPTZ
        created_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 푸시 토큰 테이블
    table push_tokens {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id)
        expo_token: VARCHAR(255) UNIQUE NOT NULL
        device_id: VARCHAR(255)
        platform: VARCHAR(10)  // ios, android
        is_active: BOOLEAN DEFAULT TRUE
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 알림 설정 테이블
    table notification_settings {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id) UNIQUE
        all_notifications: BOOLEAN DEFAULT TRUE
        poll_start_notifications: BOOLEAN DEFAULT TRUE
        poll_deadline_notifications: BOOLEAN DEFAULT TRUE
        poll_result_notifications: BOOLEAN DEFAULT TRUE
        quiet_hours_start: TIME DEFAULT '22:00'
        quiet_hours_end: TIME DEFAULT '08:00'
        max_daily_notifications: INTEGER DEFAULT 10
        created_at: TIMESTAMPTZ DEFAULT NOW()
        updated_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 알림 발송 로그 테이블
    table notification_logs {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        user_id: UUID FOREIGN KEY -> users(id)
        poll_id: UUID FOREIGN KEY -> polls(id)
        notification_type: notification_type NOT NULL
        title: VARCHAR(255)
        body: TEXT
        sent_at: TIMESTAMPTZ
        status: notification_log_status DEFAULT 'PENDING'  // PENDING, SENT, FAILED, CLICKED
        expo_receipt_id: VARCHAR(255)
        error_message: TEXT
        created_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // 신고 테이블
    table reports {
        id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
        reporter_id: UUID FOREIGN KEY -> users(id)
        target_type: report_target_type NOT NULL  // USER, CIRCLE, POLL
        target_id: UUID NOT NULL
        reason: report_reason NOT NULL
        description: TEXT
        status: report_status DEFAULT 'PENDING'  // PENDING, REVIEWED, RESOLVED, DISMISSED
        reviewed_by: UUID FOREIGN KEY -> users(id)
        reviewed_at: TIMESTAMPTZ
        created_at: TIMESTAMPTZ DEFAULT NOW()
    }

    // Enum 타입 정의
    enum user_role = 'USER' | 'ADMIN'
    enum user_gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNSPECIFIED'
    enum user_age_group = 'YOUNG_TEEN' | 'MID_TEEN' | 'OLDER_TEEN' | 'UNSPECIFIED'
    enum member_role = 'OWNER' | 'ADMIN' | 'MEMBER'
    enum template_category = 'APPEARANCE' | 'CRUSH' | 'PERSONALITY' | 'TALENT' | 'SPECIAL'
    enum template_safety_category = 'COMPLIMENT' | 'SENSITIVE_COMPLIMENT' | 'REJECTED'
    enum template_review_status = 'DRAFT' | 'APPROVED' | 'DISABLED'
    enum poll_status = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    enum notification_type = 'POLL_STARTED' | 'POLL_REMINDER' | 'POLL_ENDED' | 'VOTE_RECEIVED' | 'CIRCLE_INVITE'
    enum report_target_type = 'USER' | 'CIRCLE' | 'POLL'
    enum report_reason = 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER'
    enum report_status = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
    enum notification_log_status = 'PENDING' | 'SENT' | 'FAILED' | 'CLICKED'
}
```

## 3. 모듈별 정의

### 3.1 Auth 모듈

```dsl
module Auth {

    // Repository Layer
    repository UserRepository {
        await function create(user: UserCreate) -> Result<User, Error>
        await function findById(id: UUID) -> Result<User, Error>
        await function findByEmail(email: String) -> Result<User, Error>
        await function update(id: UUID, data: UserUpdate) -> Result<User, Error>
        await function updatePushToken(id: UUID, token: String) -> Result<Void, Error>
        await function applyVoteReward(userId: UUID, votedAt: DateTime) -> Result<User, Error>
        await function deactivate(id: UUID) -> Result<Void, Error>
    }

    // Service Layer
    service AuthService {
        await function register(
            email: String,
            password: String,
            username?: String
        ) -> Result<AuthResponse, Error>

        await function login(
            email: String,
            password: String
        ) -> Result<TokenResponse, Error>

        await function getCurrentUser(token: String) -> Result<User, Error>
        await function updateProfile(userId: UUID, data: UserUpdate) -> Result<User, Error>
        await function logout(userId: UUID) -> Result<Void, Error>

        // Helper 함수
        function hashPassword(password: String) -> String
        function verifyPassword(plain: String, hashed: String) -> Boolean
        function createAccessToken(userId: UUID) -> String
        function verifyToken(token: String) -> Result<TokenPayload, Error>
    }

    // API Router
    router AuthRouter {
        POST   /api/v1/auth/register         -> register
        POST   /api/v1/auth/login            -> login
        POST   /api/v1/auth/logout           -> logout
        GET    /api/v1/auth/me               -> getCurrentUser
        PUT    /api/v1/auth/me               -> updateProfile
        POST   /api/v1/auth/push-token       -> updatePushToken
    }

    // Types
    type User {
        id: UUID
        email: String
        username: String?
        displayName: String?
        profileEmoji: String
        gender: UserGender
        ageGroup: UserAgeGroup
        profileVisibility: ProfileVisibility
        coinBalance: Integer
        streakDays: Integer
        role: UserRole
        isActive: Boolean
        createdAt: DateTime
    }

    type UserGender = "MALE" | "FEMALE" | "NON_BINARY" | "UNSPECIFIED"
    type UserAgeGroup = "YOUNG_TEEN" | "MID_TEEN" | "OLDER_TEEN" | "UNSPECIFIED"

    type ProfileVisibility {
        gender: "private"  // MVP: 후보 필터에만 사용, 다른 사용자에게 공개하지 않음
        ageGroup: "private"  // MVP: 후보 필터에만 사용, 다른 사용자에게 공개하지 않음
    }

    type UserCreate {
        email: String
        password: String
        username?: String
        displayName?: String
    }

    type UserUpdate {
        username?: String
        displayName?: String
        profileEmoji?: String
        gender?: UserGender
        ageGroup?: UserAgeGroup
    }

    type AuthResponse {
        user: User
        accessToken: String
        tokenType: String
    }

    type TokenResponse {
        accessToken: String
        tokenType: String
    }

    type TokenPayload {
        sub: UUID
        exp: DateTime
    }
}
```

### 3.2 Circle 모듈

```dsl
module Circle {

    // Repository Layer
    repository CircleRepository {
        await function create(circle: CircleCreate) -> Result<Circle, Error>
        await function findById(id: UUID) -> Result<Circle, Error>
        await function findByInviteCode(code: String) -> Result<Circle, Error>
        await function findByUserId(userId: UUID) -> List<Circle>
        await function update(id: UUID, data: CircleUpdate) -> Result<Circle, Error>
        await function delete(id: UUID) -> Result<Void, Error>
        await function incrementMemberCount(id: UUID) -> Result<Void, Error>
        await function decrementMemberCount(id: UUID) -> Result<Void, Error>
    }

    repository MembershipRepository {
        await function create(membership: MembershipCreate) -> Result<Membership, Error>
        await function findByCircleId(circleId: UUID) -> List<Membership>
        await function findByUserId(userId: UUID) -> List<Membership>
        await function findByCircleAndUser(circleId: UUID, userId: UUID) -> Result<Membership, Error>
        await function updateRole(id: UUID, role: MemberRole) -> Result<Void, Error>
        await function delete(id: UUID) -> Result<Void, Error>
    }

    // Service Layer
    service CircleService {
        await function createCircle(
            ownerId: UUID,
            name: String,
            description?: String,
            maxMembers?: Integer
        ) -> Result<CircleResponse, Error>

        await function getCircle(circleId: UUID) -> Result<CircleDetail, Error>
        await function getUserCircles(userId: UUID) -> List<CircleListItem>
        await function updateCircle(circleId: UUID, data: CircleUpdate) -> Result<Circle, Error>
        await function deleteCircle(circleId: UUID, userId: UUID) -> Result<Void, Error>

        await function joinByCode(userId: UUID, code: String, nickname: String) -> Result<Membership, Error>
        await function joinByLink(userId: UUID, linkId: UUID, nickname: String) -> Result<Membership, Error>
        // 영구 linkId로 직접 가입하며 만료 가능한 inviteCode로 변환하지 않음
        await function resolveInviteLink(linkId: UUID) -> Result<ResolveInviteLinkResponse, Error>
        await function leaveCircle(circleId: UUID, userId: UUID) -> Result<Void, Error>
        await function removeMember(circleId: UUID, targetUserId: UUID, requesterId: UUID) -> Result<Void, Error>

        await function regenerateInviteCode(circleId: UUID, userId: UUID) -> Result<String, Error>
        await function getMembers(circleId: UUID) -> List<MemberInfo>

        // Helper 함수
        function generateInviteCode() -> String  // 6자리 영숫자
        function generateInviteLinkId() -> UUID
        function validateMemberLimit(circle: Circle) -> Boolean
    }

    // API Router
    router CircleRouter {
        POST   /api/v1/circles                       -> createCircle
        GET    /api/v1/circles                       -> getUserCircles
        GET    /api/v1/circles/{id}                  -> getCircle
        PUT    /api/v1/circles/{id}                  -> updateCircle
        DELETE /api/v1/circles/{id}                  -> deleteCircle

        POST   /api/v1/circles/join/code             -> joinByCode
        GET    /api/v1/circles/invite-links/{linkId} -> resolveInviteLink
        POST   /api/v1/circles/join/link/{linkId}    -> joinByLink
        POST   /api/v1/circles/{id}/leave            -> leaveCircle
        DELETE /api/v1/circles/{id}/members/{userId} -> removeMember

        POST   /api/v1/circles/{id}/regenerate-code  -> regenerateInviteCode
        GET    /api/v1/circles/{id}/members          -> getMembers
    }

    // Types
    type Circle {
        id: UUID
        name: String
        description: String?
        inviteCode: String
        inviteCodeExpiresAt: DateTime  // 초대 코드 만료 시간
        inviteLinkId: UUID
        ownerId: UUID
        maxMembers: Integer
        memberCount: Integer
        isActive: Boolean
        createdAt: DateTime
    }

    type CircleCreate {
        name: String
        description?: String
        maxMembers?: Integer
    }

    type CircleUpdate {
        name?: String
        description?: String
        maxMembers?: Integer
    }

    type CircleDetail {
        circle: Circle
        members: List<MemberInfo>
        activePolls: List<PollSummary>
        myRole: MemberRole
    }

    type CircleListItem {
        id: UUID
        name: String
        memberCount: Integer
        activePollCount: Integer
        myRole: MemberRole
    }

    type ResolveInviteLinkResponse {
        valid: Boolean
        circleName: String?
        circleId: UUID?
        memberCount: Integer?
        maxMembers: Integer?
        message: String?
    }

    type Membership {
        id: UUID
        circleId: UUID
        userId: UUID
        role: MemberRole
        nickname: String
        joinedAt: DateTime
    }

    type MemberInfo {
        userId: UUID
        nickname: String
        profileEmoji: String
        role: MemberRole
        joinedAt: DateTime
    }

    type MemberRole = "OWNER" | "ADMIN" | "MEMBER"
}
```

### 3.3 Poll 모듈

```dsl
module Poll {

    // Repository Layer
    repository TemplateRepository {
        await function findAll(category?: TemplateCategory) -> List<PollTemplate>
        await function findById(id: UUID) -> Result<PollTemplate, Error>
        await function incrementUsageCount(id: UUID) -> Result<Void, Error>
        await function create(template: TemplateCreate) -> Result<PollTemplate, Error>  // Admin only
    }

    repository PollRepository {
        await function create(poll: PollCreate) -> Result<Poll, Error>
        await function findById(id: UUID) -> Result<Poll, Error>
        await function findByCircleId(circleId: UUID, status?: PollStatus) -> List<Poll>
        await function findActiveByCircleId(circleId: UUID) -> List<Poll>
        await function updateStatus(id: UUID, status: PollStatus) -> Result<Void, Error>
        await function incrementVoteCount(id: UUID) -> Result<Void, Error>
        await function findEndingSoon(minutes: Integer) -> List<Poll>
    }

    repository VoteRepository {
        await function create(vote: VoteCreate) -> Result<Vote, Error>
        await function existsByVoterHash(pollId: UUID, voterHash: String) -> Boolean
        await function countByPollId(pollId: UUID) -> Integer
        await function getResultsByPollId(pollId: UUID) -> List<VoteResult>
    }

    repository ResultRepository {
        await function upsert(result: ResultCreate) -> Result<PollResult, Error>
        await function findByPollId(pollId: UUID) -> List<PollResult>
        await function findTopByPollId(pollId: UUID, limit: Integer) -> List<PollResult>
    }

    // Service Layer
    service PollService {
        await function getTemplates(category?: TemplateCategory) -> List<PollTemplate>

        await function createPoll(
            circleId: UUID,
            creatorId: UUID,
            templateId: UUID,
            duration: PollDuration
        ) -> Result<PollResponse, Error>

        await function getPoll(pollId: UUID, userId: UUID) -> Result<PollDetail, Error>
        await function getCirclePolls(circleId: UUID, status?: PollStatus) -> List<PollListItem>
        await function cancelPoll(pollId: UUID, userId: UUID) -> Result<Void, Error>

        await function vote(
            pollId: UUID,
            voterId: UUID,
            votedForId: UUID
        ) -> Result<VoteResponse, Error>

        await function hasVoted(pollId: UUID, userId: UUID) -> Boolean
        await function getResults(pollId: UUID) -> List<PollResultItem>
        await function closePoll(pollId: UUID) -> Result<Void, Error>

        // Background Jobs
        await function processEndedPolls() -> Void
        await function sendReminderNotifications() -> Void

        // Helper 함수
        function calculateEndTime(duration: PollDuration) -> DateTime
        function generateVoterHash(voterId: UUID, pollId: UUID, salt: String) -> String
        function calculateResults(pollId: UUID) -> List<PollResultItem>
        function validateVoteEligibility(poll: Poll, voterId: UUID, votedForId: UUID) -> Result<Void, Error>
    }

    // API Router
    router PollRouter {
        GET    /api/v1/polls/templates                -> getTemplates

        POST   /api/v1/circles/{circleId}/polls       -> createPoll
        GET    /api/v1/circles/{circleId}/polls       -> getCirclePolls
        GET    /api/v1/polls/{id}                     -> getPoll
        DELETE /api/v1/polls/{id}                     -> cancelPoll

        POST   /api/v1/polls/{id}/vote                -> vote
        GET    /api/v1/polls/{id}/candidates?shuffle  -> getPollCandidates
        GET    /api/v1/polls/sessions/availability    -> getVoteSessionAvailability
        POST   /api/v1/polls/sessions                 -> startVoteSession
        POST   /api/v1/polls/sessions/{id}/skip       -> skipVoteSessionPoll
        POST   /api/v1/polls/sessions/{id}/advance    -> advanceVoteSessionPoll
        GET    /api/v1/polls/me/received              -> getReceivedHearts
        POST   /api/v1/polls/me/received/{id}/read    -> markReceivedHeartAsRead
        GET    /api/v1/polls/{id}/hints               -> getVoteHints
        GET    /api/v1/polls/{id}/has-voted           -> hasVoted
        GET    /api/v1/polls/{id}/results             -> getResults
    }

    // Types
    type PollTemplate {
        id: UUID
        category: TemplateCategory
        questionText: String
        emoji: String
        safetyCategory: TemplateSafetyCategory
        reviewStatus: TemplateReviewStatus
        allowedCandidateFilters: CandidateFilterPolicy
        usageCount: Integer
    }

    type TemplateCategory = "APPEARANCE" | "CRUSH" | "PERSONALITY" | "TALENT" | "SPECIAL"

    type TemplateSafetyCategory = "COMPLIMENT" | "SENSITIVE_COMPLIMENT" | "REJECTED"

    type TemplateReviewStatus = "DRAFT" | "APPROVED" | "DISABLED"

    type CandidateFilterPolicy {
        allowGenderFilter: Boolean
        defaultIncludeUnspecifiedGender: Boolean
    }

    type Poll {
        id: UUID
        circleId: UUID
        templateId: UUID
        creatorId: UUID
        questionText: String
        status: PollStatus
        candidateFilter: CandidateFilter
        endsAt: DateTime
        voteCount: Integer
        createdAt: DateTime
    }

    type PollStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

    type PollDuration = "1H" | "3H" | "6H" | "24H"

    type PollCreate {
        circleId: UUID
        templateId: UUID
        creatorId: UUID
        questionText: String
        candidateFilter?: CandidateFilter
        endsAt: DateTime
    }

    type CandidateFilter {
        gender?: UserGender  // 서버 내부 후보 정책 전용. 개별 값은 생성자/친구에게 노출하지 않음
        ageGroup?: UserAgeGroup  // 서버 내부 후보 정책 전용. 개별 값은 생성자/친구에게 노출하지 않음
        includeUnspecifiedGender: Boolean
        includeUnspecifiedAgeGroup: Boolean
        excludedUserIds?: List<UUID>
    }

    type PollDetail {
        poll: Poll
        template: PollTemplate
        options: List<VoteOption>  // Circle 멤버들 (투표 생성자 제외)
        hasVoted: Boolean
        results?: List<PollResultItem>  // 투표 후 또는 종료 후에만
        timeRemaining: Integer  // seconds
    }

    type PollListItem {
        id: UUID
        questionText: String
        emoji: String
        status: PollStatus
        voteCount: Integer
        endsAt: DateTime
        hasVoted: Boolean
    }

    type ReceivedHeartItem {
        pollId: UUID
        circleId: UUID
        circleName: String
        questionText: String
        emoji: String?
        receivedCount: Integer
        latestReceivedAt: DateTime
        isRead: Boolean
        freeHint: ReceivedHeartHint
    }

    type ReceivedHeartHint {
        circleName: String
        timeLabel: String  // 예: "3시간 전", "어제"
    }

    type ReceivedHeartReadResponse {
        pollId: UUID
        isRead: Boolean
    }

    type VoteHintTier = "CIRCLE" | "TIME" | "INITIAL" | "FULL"

    type VoteHint {
        voteId: UUID
        tier: VoteHintTier
        text: String
        unlocked: Boolean
    }

    type VoteHintResponse {
        pollId: UUID
        questionText: String
        hints: List<VoteHint>
    }

    type VoteOption {
        userId: UUID
        nickname: String
        profileEmoji: String
    }

    type CandidateOption extends VoteOption {
        receivedCount: Integer  // 같은 Circle에서 받은 누적 득표 수
    }

    type PollCandidatesResponse {
        pollId: UUID
        status: PollCandidatesStatus
        requiredCount: Integer  // MVP: 4
        candidates: List<CandidateOption>
    }

    type PollCandidatesStatus = "READY" | "NOT_ENOUGH_CANDIDATES"

    type VoteSessionCreate {
        circleId?: UUID  // 없으면 사용자가 속한 모든 Circle에서 큐 생성
    }

    type VoteSessionAvailability {
        canStart: Boolean
        nextSessionAt?: DateTime
        remainingSeconds: Integer
        unlockedByInvite: Boolean
    }

    type VoteSession {
        id: UUID
        userId: UUID
        circleId?: UUID
        status: VoteSessionStatus
        pollIds: List<UUID>
        skippedPollIds: List<UUID>
        currentIndex: Integer
        totalCount: Integer
        currentPollId?: UUID
        createdAt: DateTime
        updatedAt: DateTime
        completedAt?: DateTime
    }

    type VoteSessionStatus = "ACTIVE" | "COMPLETED"

    type Vote {
        id: UUID
        pollId: UUID
        voterId: UUID       // 내부 저장용. 직접 실명 공개가 아니라 안전 힌트 생성에 사용
        voterHash: String   // 중복 투표 방지용
        votedForId: UUID
        createdAt: DateTime
    }

    type VoteCreate {
        pollId: UUID
        voterId: UUID
        voterHash: String
        votedForId: UUID
    }

    type VoteResponse {
        success: Boolean
        results: List<PollResultItem>
        message: String
    }

    type PollResult {
        id: UUID
        pollId: UUID
        userId: UUID
        voteCount: Integer
        votePercentage: Float
        rank: Integer
    }

    type PollResultItem {
        userId: UUID
        nickname: String
        profileEmoji: String
        voteCount: Integer
        votePercentage: Float
        rank: Integer
    }
}
```

### 3.4 Notification 모듈

```dsl
module Notification {

    // Repository Layer
    repository NotificationRepository {
        await function create(notification: NotificationCreate) -> Result<Notification, Error>
        await function createBulk(notifications: List<NotificationCreate>) -> Result<Integer, Error>
        await function findByUserId(userId: UUID, limit?: Integer, offset?: Integer) -> List<Notification>
        await function findUnreadByUserId(userId: UUID) -> List<Notification>
        await function markAsRead(id: UUID) -> Result<Void, Error>
        await function markAllAsRead(userId: UUID) -> Result<Void, Error>
        await function countUnread(userId: UUID) -> Integer
    }

    // Service Layer
    service NotificationService {
        // 알림 발송
        await function sendPollStarted(poll: Poll, circleMembers: List<UUID>) -> Result<Void, Error>
        await function sendPollReminder(poll: Poll, nonVoters: List<UUID>) -> Result<Void, Error>
        await function sendPollEnded(poll: Poll, circleMembers: List<UUID>) -> Result<Void, Error>
        await function sendVoteReceived(votedForId: UUID, poll: Poll) -> Result<Void, Error>
        await function sendCircleInvite(userId: UUID, circle: Circle) -> Result<Void, Error>

        // 알림 조회
        await function getNotifications(userId: UUID, limit?: Integer, offset?: Integer) -> List<Notification>
        await function getUnreadCount(userId: UUID) -> Integer
        await function markAsRead(notificationId: UUID, userId: UUID) -> Result<Void, Error>
        await function markAllAsRead(userId: UUID) -> Result<Void, Error>

        // Push 알림
        await function sendPushNotification(userId: UUID, notification: PushPayload) -> Result<Void, Error>
        await function sendBulkPush(userIds: List<UUID>, notification: PushPayload) -> Result<Integer, Error>

        // Helper 함수
        function buildPushPayload(type: NotificationType, data: Object) -> PushPayload
        function shouldSendPush(userId: UUID, type: NotificationType) -> Boolean  // 사용자 설정 확인
    }

    // API Router
    router NotificationRouter {
        GET    /api/v1/notifications              -> getNotifications
        GET    /api/v1/notifications/unread-count -> getUnreadCount
        PUT    /api/v1/notifications/{id}/read    -> markAsRead
        PUT    /api/v1/notifications/read-all     -> markAllAsRead
    }

    // Types
    type Notification {
        id: UUID
        userId: UUID
        type: NotificationType
        title: String
        body: String
        data: Object?  // { pollId?, circleId?, ... }
        isRead: Boolean
        sentAt: DateTime?
        createdAt: DateTime
    }

    type NotificationCreate {
        userId: UUID
        type: NotificationType
        title: String
        body: String
        data?: Object
    }

    type NotificationType = "POLL_STARTED" | "POLL_REMINDER" | "POLL_ENDED" | "VOTE_RECEIVED" | "CIRCLE_INVITE"

    type PushPayload {
        to: String  // Expo push token
        title: String
        body: String
        data: Object
        sound: String?
        badge: Integer?
    }
}
```

### 3.5 Report 모듈

```dsl
module Report {

    // Repository Layer
    repository ReportRepository {
        await function create(report: ReportCreate) -> Result<Report, Error>
        await function findById(id: UUID) -> Result<Report, Error>
        await function findByStatus(status: ReportStatus) -> List<Report>
        await function findByTargetId(targetType: ReportTargetType, targetId: UUID) -> List<Report>
        await function updateStatus(id: UUID, status: ReportStatus, reviewerId: UUID) -> Result<Void, Error>
    }

    // Service Layer
    service ReportService {
        await function createReport(
            reporterId: UUID,
            targetType: ReportTargetType,
            targetId: UUID,
            reason: ReportReason,
            description?: String
        ) -> Result<Report, Error>

        await function getReportById(reportId: UUID) -> Result<Report, Error>
        await function getPendingReports() -> List<Report>  // Admin only
        await function reviewReport(reportId: UUID, reviewerId: UUID, action: ReviewAction) -> Result<Void, Error>

        // 자동 감지
        await function checkForAbusePatterns(targetType: ReportTargetType, targetId: UUID) -> Boolean

        // Helper
        function shouldAutoBlock(reportCount: Integer) -> Boolean
    }

    // API Router
    router ReportRouter {
        POST   /api/v1/reports                    -> createReport
        GET    /api/v1/admin/reports              -> getPendingReports  // Admin only
        PUT    /api/v1/admin/reports/{id}/review  -> reviewReport       // Admin only
    }

    // Types
    type Report {
        id: UUID
        reporterId: UUID
        targetType: ReportTargetType
        targetId: UUID
        reason: ReportReason
        description: String?
        status: ReportStatus
        reviewedBy: UUID?
        reviewedAt: DateTime?
        createdAt: DateTime
    }

    type ReportCreate {
        reporterId: UUID
        targetType: ReportTargetType
        targetId: UUID
        reason: ReportReason
        description?: String
    }

    type ReportTargetType = "USER" | "CIRCLE" | "POLL"
    type ReportReason = "INAPPROPRIATE" | "SPAM" | "HARASSMENT" | "OTHER"
    type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED"
    type ReviewAction = "RESOLVE" | "DISMISS" | "BAN_USER" | "DELETE_CONTENT"
}
```

### 3.6 Share 모듈

```dsl
module Share {

    // Service Layer
    service ShareService {
        await function generateResultCard(
            pollId: UUID,
            template: CardTemplate,
            options?: CardOptions
        ) -> Result<CardResponse, Error>

        await function getCardTemplates() -> List<CardTemplate>

        // Helper
        function renderCard(poll: Poll, results: List<PollResultItem>, template: CardTemplate, options: CardOptions) -> Buffer
        function uploadToStorage(buffer: Buffer, filename: String) -> String  // URL
    }

    // API Router
    router ShareRouter {
        POST   /api/v1/polls/{id}/share/card     -> generateResultCard
        GET    /api/v1/share/templates           -> getCardTemplates
    }

    // Types
    type CardTemplate {
        id: String
        name: String
        previewUrl: String
        isPremium: Boolean
    }

    type CardOptions {
        backgroundColor?: String
        showBranding?: Boolean
        fontStyle?: String
    }

    type CardResponse {
        imageUrl: String
        expiresAt: DateTime
    }
}
```

## 4. 이벤트 시스템

```dsl
events DomainEvents {

    // Circle 이벤트
    event CircleCreated {
        circleId: UUID
        ownerId: UUID
        name: String
        timestamp: DateTime
    }

    event MemberJoined {
        circleId: UUID
        userId: UUID
        nickname: String
        timestamp: DateTime
    }

    event MemberLeft {
        circleId: UUID
        userId: UUID
        timestamp: DateTime
    }

    // Poll 이벤트
    event PollCreated {
        pollId: UUID
        circleId: UUID
        creatorId: UUID
        questionText: String
        endsAt: DateTime
        timestamp: DateTime
    }

    event VoteCast {
        pollId: UUID
        votedForId: UUID
        timestamp: DateTime
    }

    event PollEnded {
        pollId: UUID
        circleId: UUID
        results: List<PollResultItem>
        timestamp: DateTime
    }

    // 이벤트 핸들러 매핑
    handlers {
        PollCreated -> NotificationService.sendPollStarted
        VoteCast -> NotificationService.sendVoteReceived
        PollEnded -> NotificationService.sendPollEnded
        MemberJoined -> AnalyticsService.trackMemberJoin
    }
}
```

## 5. 주요 워크플로우

```dsl
workflow JoinCircleFlow {
    1. 사용자가 초대 링크/코드 입력
    2. POST /api/v1/circles/join/code (또는 /join/link/{linkId})
    3. CircleService.joinByCode() 또는 joinByLink()
       - Circle 존재 확인
       - 6자리 코드는 발급 후 24시간 만료 확인
       - 영구 linkId 가입은 6자리 코드 만료와 독립적으로 처리
       - 멤버 제한 확인 (validateMemberLimit)
       - 중복 가입 확인
       - Membership 생성
       - Circle memberCount 증가
       - MemberJoined 이벤트 발행
    4. 새 멤버 정보 반환
    5. (Optional) 기존 멤버들에게 알림
}

workflow CreatePollFlow {
    1. 사용자가 템플릿 선택 (GET /api/v1/polls/templates)
       - reviewStatus=APPROVED, safetyCategory!=REJECTED 템플릿만 노출
       - APPEARANCE/CRUSH 카테고리는 긍정형 칭찬 질문만 허용
    2. 마감 시간 설정 (1H/3H/6H/24H)
    3. 후보 제한 필터 설정(Optional)
       - 성별/나이 값은 선택 입력한 Profile 정보만 사용
       - MVP에서는 생성자에게 성별/나이 직접 선택 옵션을 노출하지 않음
       - 개별 성별/나이 값은 투표 생성자/친구에게 공개하지 않음
       - 필터 적용 후 후보가 4명 미만이면 제한 완화 또는 초대 CTA 표시
    4. POST /api/v1/circles/{circleId}/polls
    5. PollService.createPoll()
       - 템플릿 검증(reviewStatus, safetyCategory)
       - allowedCandidateFilters 검증
       - Circle 멤버 권한 확인
       - 동시 진행 투표 수 확인 (최대 3개)
       - Poll 생성
       - PollCreated 이벤트 발행
    6. NotificationService.sendPollStarted()
       - Circle 멤버 전체에게 푸시 알림 (생성자 제외)
    7. 생성된 Poll 정보 반환
}

workflow VoteFlow {
    1. 사용자가 투표 세션 진입
    2. GET /api/v1/polls/sessions/availability
       - users.next_session_at이 없거나 현재 시각 이전이면 canStart=true
       - next_session_at이 미래면 canStart=false와 remainingSeconds 반환
       - 쿨다운 시작 이후 사용자가 속한 Circle에 신규 멤버가 가입했으면 쿨다운 해제, unlockedByInvite=true
    3. POST /api/v1/polls/sessions
       - circleId가 있으면 해당 Circle만 큐 생성
       - 없으면 사용자가 속한 모든 Circle에서 라운드로빈 큐 생성
       - ACTIVE, 미투표, 마감 전 Poll만 포함
       - 최대 12개 pollId를 고정 큐로 저장
       - 서버는 availability를 재검증해 쿨다운 중 세션 시작을 차단
    4. GET /api/v1/polls/{id}/candidates?shuffle=false
       - 같은 Circle 멤버만 후보로 사용
       - 현재 투표자와 투표 생성자는 후보에서 제외
       - 후보는 같은 Circle 내 받은 득표 수가 적은 순서로 우선 노출
       - 후보가 4명 미만이면 status=NOT_ENOUGH_CANDIDATES 반환
    5. 후보 부족 시 투표 UI 대신 Circle 초대 CTA와 질문 건너뛰기 CTA 표시
       - 건너뛰기 시 POST /api/v1/polls/sessions/{sessionId}/skip
       - 서버는 currentPollId를 skippedPollIds에 저장하고 currentIndex를 전진
    6. 사용자가 섞기 선택 시 GET /api/v1/polls/{id}/candidates?shuffle=true
       - 서버가 후보 풀을 섞어 다시 반환
       - 현재 MVP는 클라이언트 로컬 샘플링을 사용하지 않음
    7. 사용자가 투표 옵션 선택
    8. POST /api/v1/polls/{id}/vote
    9. PollService.vote()
       - 투표자의 Poll Circle 멤버십 확인 (비회원은 FORBIDDEN)
       - votedForId가 같은 Poll Circle 멤버인지 확인 (외부 사용자는 INVALID_VOTE_TARGET)
       - 투표 기한 확인
       - 중복 투표 확인 (voterHash)
       - 자기 자신 투표 방지
       - 익명 해시 생성: SHA-256(voterId + pollId + salt)
       - Vote 레코드 생성 (voterHash만 저장)
       - Poll voteCount 증가
       - 실시간 결과 계산
       - VoteCast 이벤트 발행
    10. 투표 성공 후 POST /api/v1/polls/sessions/{sessionId}/advance
       - 서버는 currentIndex를 전진
       - 마지막 질문이면 status=COMPLETED, completedAt 저장
       - 완료 시 users.next_session_at = 현재 시각 + 1시간 저장
       - 마지막 질문을 skip으로 넘긴 경우도 동일하게 저장
    11. 투표 결과 반환 (실시간 차트용)
    12. NotificationService.sendVoteReceived()
       - 선택받은 사람에게 푸시 알림 (익명)
}

workflow PollEndFlow {
    // Background Job: 매 분 실행
    1. PollService.processEndedPolls()
    2. 종료된 Poll 조회 (endsAt < NOW() AND status = 'ACTIVE')
    3. 각 Poll에 대해:
       a. 최종 결과 계산 및 저장
       b. status = 'COMPLETED' 업데이트
       c. PollEnded 이벤트 발행
    4. NotificationService.sendPollEnded()
       - Circle 전체 멤버에게 결과 알림
    5. ShareService가 결과 카드 미리 생성 (Optional)
}

workflow ReminderFlow {
    // Background Job: 투표 마감 1시간 전, 10분 전
    1. PollService.sendReminderNotifications()
    2. 마감 임박 Poll 조회
    3. 미참여자 목록 추출
    4. NotificationService.sendPollReminder()
       - 미참여자에게만 리마인드 푸시
}
```

## 6. FastAPI 애플리케이션 구조

```dsl
application FastAPIApp {

    main: "main.py"
    python_version: "3.13"

    dependencies: [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "alembic",
        "asyncpg",
        "pydantic",
        "python-jose",      // JWT
        "passlib[bcrypt]",  // Password hashing
        "redis",
        "celery",           // Background tasks
        "httpx",            // HTTP client
        "pytest",
        "pytest-asyncio"
    ]

    structure {
        /backend
        ├── app/
        │   ├── __init__.py
        │   ├── main.py                    // FastAPI 앱 초기화
        │   ├── config.py                  // 환경 변수 관리
        │   ├── database.py                // DB 연결
        │   ├── deps.py                    // 공통 의존성
        │   │
        │   ├── core/                      // 핵심 유틸리티
        │   │   ├── __init__.py
        │   │   ├── security.py           // JWT, 비밀번호 해싱
        │   │   ├── exceptions.py         // 커스텀 예외
        │   │   └── events.py             // 이벤트 버스
        │   │
        │   ├── modules/                   // 도메인 모듈
        │   │   ├── auth/
        │   │   │   ├── __init__.py
        │   │   │   ├── models.py
        │   │   │   ├── schemas.py
        │   │   │   ├── repository.py
        │   │   │   ├── service.py
        │   │   │   ├── router.py
        │   │   │   └── tests/
        │   │   ├── circle/
        │   │   │   └── (동일 구조)
        │   │   ├── poll/
        │   │   │   └── (동일 구조)
        │   │   ├── notification/
        │   │   │   └── (동일 구조)
        │   │   ├── report/
        │   │   │   └── (동일 구조)
        │   │   └── share/
        │   │       └── (동일 구조)
        │   │
        │   └── workers/                   // Background workers
        │       ├── __init__.py
        │       ├── celery_app.py
        │       └── tasks.py
        │
        ├── alembic/                       // DB 마이그레이션
        │   ├── versions/
        │   └── alembic.ini
        │
        ├── tests/
        │   ├── conftest.py
        │   ├── test_auth.py
        │   ├── test_circle.py
        │   └── test_poll.py
        │
        ├── requirements.txt
        ├── Dockerfile
        └── docker-compose.yml
    }

    startup {
        loadConfig()
        initializeDatabase()
        registerModuleRouters()
        setupEventBus()
        setupCORS()
        initializeBackgroundWorkers()
    }
}
```

## 7. 프론트엔드 구조

```dsl
application ExpoApp {

    framework: "React Native (Expo SDK 51+)"
    router: "Expo Router (File-based)"

    structure {
        /circly-app
        ├── app/                          // Expo Router
        │   ├── (auth)/                   // 비인증 그룹
        │   │   ├── _layout.tsx
        │   │   ├── login.tsx
        │   │   └── join/[code].tsx       // 딥링크 처리
        │   ├── (main)/                   // 인증 그룹 (탭 네비게이션)
        │   │   ├── _layout.tsx
        │   │   ├── (home)/
        │   │   │   ├── index.tsx         // 진행 중인 투표
        │   │   │   └── poll/[id].tsx     // 투표 상세
        │   │   ├── (create)/
        │   │   │   ├── index.tsx         // 투표 생성
        │   │   │   └── templates.tsx     // 템플릿 선택
        │   │   └── (profile)/
        │   │       ├── index.tsx         // Profile
        │   │       ├── settings.tsx      // 설정
        │   │       └── circles.tsx       // Circle 관리
        │   └── _layout.tsx               // 루트 레이아웃
        │
        ├── src/
        │   ├── components/               // UI 컴포넌트
        │   │   ├── ui/                   // 공통 UI
        │   │   ├── poll/                 // 투표 관련
        │   │   ├── circle/               // Circle 관련
        │   │   └── shared/               // 공유 컴포넌트
        │   │
        │   ├── features/                 // 기능 모듈
        │   │   ├── auth/
        │   │   │   ├── hooks/
        │   │   │   ├── store/
        │   │   │   └── api/
        │   │   ├── polls/
        │   │   ├── circles/
        │   │   └── notifications/
        │   │
        │   ├── lib/                      // 유틸리티
        │   │   ├── api.ts               // API 클라이언트
        │   │   ├── storage.ts           // AsyncStorage
        │   │   └── supabase.ts          // Supabase 클라이언트
        │   │
        │   └── styles/                   // 스타일
        │       ├── theme.ts
        │       └── colors.ts
        │
        ├── assets/
        ├── app.json
        └── package.json
    }

    state_management {
        server_state: "TanStack Query (React Query)"
        client_state: "Zustand"
        realtime: "Supabase Realtime"
    }
}
```

## 8. 테스트 전략

```dsl
testing TestStrategy {

    // Repository Layer - 실제 DB 연동 테스트
    repository_tests {
        setup: 테스트용 PostgreSQL (Docker)

        coverage {
            - CRUD 기본 동작
            - 유니크 제약 조건
            - 외래키 관계
            - 트랜잭션 처리
        }
    }

    // Service Layer - 비즈니스 로직 테스트
    service_tests {
        focus: 도메인 로직, 유효성 검증

        examples {
            - 익명 해시 생성 정확성
            - 투표 자격 검증
            - 결과 계산 로직
            - 이벤트 발행
        }
    }

    // Router Layer - API 엔드포인트 테스트
    router_tests {
        tool: FastAPI TestClient

        coverage {
            - HTTP 상태 코드
            - 요청/응답 스키마
            - 인증/인가
            - 에러 핸들링
        }
    }

    // Integration Tests
    integration_tests {
        scope: 전체 워크플로우

        scenarios {
            - Circle 생성 → 초대 → 가입 플로우
            - 투표 생성 → 참여 → 결과 확인 플로우
            - 푸시 알림 발송 플로우
        }
    }

    pytest_config {
        testpaths = ["app/modules"]
        python_files = ["test_*.py"]
        addopts = [
            "--verbose",
            "--cov=app",
            "--cov-report=html"
        ]
        markers = [
            "unit: marks tests as unit tests",
            "integration: marks tests as integration tests"
        ]
    }
}
```

## 9. API 응답 표준

```dsl
api_standards APIResponseFormat {

    success_response {
        structure: {
            success: true,
            data: Any,
            message?: String
        }
        example: |
            {
                "success": true,
                "data": {
                    "poll": { ... },
                    "results": [ ... ]
                },
                "message": "투표가 완료되었습니다"
            }
    }

    error_response {
        structure: {
            success: false,
            error: {
                code: String,
                message: String,
                details?: Any
            }
        }
        example: |
            {
                "success": false,
                "error": {
                    "code": "ALREADY_VOTED",
                    "message": "이미 투표에 참여하셨습니다"
                }
            }
    }

    list_response {
        structure: {
            success: true,
            data: {
                items: List<Any>,
                total: Integer,
                hasMore: Boolean
            }
        }
    }

    error_codes {
        // Auth
        AUTH_001: "인증이 필요합니다"
        AUTH_002: "잘못된 인증 정보입니다"
        AUTH_003: "토큰이 만료되었습니다"

        // Circle
        CIRCLE_001: "Circle을 찾을 수 없습니다"
        CIRCLE_002: "유효하지 않은 초대 코드입니다"
        CIRCLE_003: "Circle 멤버 수가 초과되었습니다"
        CIRCLE_004: "이미 가입된 Circle입니다"

        // Poll
        POLL_001: "투표를 찾을 수 없습니다"
        POLL_002: "투표가 종료되었습니다"
        POLL_003: "이미 투표에 참여하셨습니다"
        POLL_004: "자기 자신에게 투표할 수 없습니다"
        POLL_005: "동시 진행 가능한 투표 수를 초과했습니다"
        POLL_006 (INVALID_VOTE_TARGET): "같은 Circle 멤버만 투표 대상으로 선택할 수 있습니다"

        // General
        VALIDATION_ERROR: "입력값 검증 실패"
        NOT_FOUND: "리소스를 찾을 수 없습니다"
        FORBIDDEN: "접근 권한이 없습니다"
        INTERNAL_ERROR: "서버 오류가 발생했습니다"
    }
}
```

## 10. 보안 고려사항

```dsl
security SecurityPolicy {

    // 투표 익명성 및 Orb Mode
    vote_anonymity {
        principle: "기본 익명, Orb Mode에서도 실명 공개가 아니라 단계형 안전 힌트 제공"
        implementation: {
            - voter_id 저장 (힌트 생성용 내부 데이터)
            - voter_hash = SHA-256(voter_id + poll_id + salt) 저장 (중복 투표 방지)
            - 일반 사용자: 투표자 정보 비공개 (익명)
            - 무료 사용자: Circle/시간대 힌트
            - Orb Mode 구독자: 이니셜/앱 내 표시명 힌트까지 단계적으로 제공
            - 법적 실명, 연락처, 계정 식별자, 민감 개인정보는 공개 금지
            - RevenueCat 연동으로 구독 상태 확인
        }
        orb_mode: {
            - 구독자가 받은 하트의 맥락을 안전한 단계형 힌트로 확인
            - 핵심 수익화 모델
            - API: GET /api/v1/polls/{id}/hints
            - Circle 멤버십 검증 필수
            - RevenueCat entitlement: `orb_mode`
            - Store product IDs: `orb_mode_monthly`, `orb_mode_annual`
            - RevenueCat package IDs: `$rc_monthly`, `$rc_annual`
            - RevenueCat app_user_id는 인증된 User.id(UUID)와 일치
            - `orb_mode` entitlement가 포함된 webhook만 User.is_orb_mode를 변경
            - CANCELLATION은 만료일까지 권한 유지, EXPIRATION/BILLING_ISSUE에서 비활성화
            - webhook 처리 실패는 non-2xx로 응답하여 RevenueCat 재시도 허용
        }
    }

    // 인증
    authentication {
        method: "JWT Bearer Token"
        algorithm: "HS256"
        expiry: "24h"
        refresh: false  // 단순화
    }

    // 인가
    authorization {
        circle_access: "멤버십 기반"
        poll_access: "Circle 멤버만"
        admin_access: "role = 'ADMIN'"
    }

    // Rate Limiting
    rate_limiting {
        api_general: "100 req/min per user"
        vote: "10 req/min per user"
        create_poll: "5 req/hour per user"
    }

    // 입력 검증
    input_validation {
        - Pydantic 스키마 검증
        - SQL Injection 방지 (ORM 사용)
        - XSS 방지 (입력 새니타이징)
    }
}
```
