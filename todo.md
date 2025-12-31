# Circly Backend Development Todo

> TDD 기반 백엔드 개발 진행 순서
> 각 작업 완료 후 테스트 실행 및 `/commit` 커맨드로 커밋
> 각 작업 완료 후, 작업에 완료 표시 [x]

---

## Phase 1: 개발 환경 설정

> **참고 문서**: `trd/07-development-deployment-setup.md`

### 1.1 프로젝트 초기화
- [x] `backend/` 디렉토리 생성
- [x] `uv init` 실행
- [x] `pyproject.toml` 작성 (의존성 정의) → `trd/07-development-deployment-setup.md#1.2`
- [x] `uv sync` 의존성 설치
- [x] `.env.example` 파일 생성 → `trd/07-development-deployment-setup.md#4.1`
- [x] `.gitignore` 설정
- [x] **테스트**: `uv run python --version` 확인
- [x] **커밋**: `chore: initialize backend project with uv`

### 1.2 FastAPI 기본 구조 생성
- [x] `app/__init__.py` 생성
- [x] `app/main.py` - FastAPI 앱 팩토리 생성 → `docs/DSL.md#6`
- [x] `app/config.py` - Pydantic Settings 설정
- [x] `app/deps.py` - 공통 의존성
- [x] **테스트**: `uv run uvicorn app.main:app --reload` 서버 실행 확인
- [x] **커밋**: `feat: create FastAPI application skeleton`

### 1.3 Core 모듈 구조 생성
- [x] `app/core/__init__.py`
- [x] `app/core/database.py` - SQLAlchemy async 설정 → `trd/07-development-deployment-setup.md#1.1`
- [x] `app/core/security.py` - JWT, 비밀번호 해싱 유틸 → `trd/06-authentication-architecture.md`, `docs/DSL.md#10`
- [x] `app/core/exceptions.py` - 커스텀 예외 클래스 → `docs/DSL.md#9`
- [x] `app/core/responses.py` - 표준 응답 포맷 → `docs/DSL.md#9`
- [x] **커밋**: `feat: add core module with database and security utilities`

### 1.4 Docker 개발 환경
- [x] `Dockerfile` 작성 → `trd/07-development-deployment-setup.md#1.5`
- [x] `docker-compose.yml` 작성 (PostgreSQL, Redis) → `trd/07-development-deployment-setup.md#1.4`
- [x] **테스트**: `docker-compose up -d db redis` 실행 확인
- [x] **커밋**: `chore: add Docker development environment`

---

## Phase 2: 테스트 환경 셋업

> **참고 문서**: `trd/07-development-deployment-setup.md`, `docs/DSL.md#8`

### 2.1 pytest 기본 설정
- [x] `tests/__init__.py` 생성
- [x] `tests/conftest.py` - 공통 fixture 설정 → `docs/DSL.md#8`
- [x] pytest 설정 (`pyproject.toml`에 추가) → `trd/07-development-deployment-setup.md#1.2`
- [x] **테스트**: `uv run pytest --version` 확인
- [x] **커밋**: `test: setup pytest configuration`

### 2.2 테스트 DB 설정
- [x] `tests/conftest.py` - 테스트용 DB fixture
- [x] `tests/conftest.py` - 테스트용 FastAPI client fixture
- [x] `tests/conftest.py` - 테스트용 async session fixture
- [x] **테스트**: `uv run pytest tests/ -v` 빈 테스트 실행
- [x] **커밋**: `test: add test database and client fixtures`

---

## Phase 3: Database 모델링

> **참고 문서**: `docs/DSL.md#2` (데이터베이스 스키마)

### 3.1 Alembic 설정
- [x] `alembic init migrations` 실행
- [x] `alembic.ini` 설정
- [x] `migrations/env.py` async 설정
- [x] **테스트**: `uv run alembic --help` 확인
- [x] **커밋**: `chore: setup Alembic for database migrations`

### 3.2 Enum 타입 정의
- [x] `app/core/enums.py` - UserRole enum → `docs/DSL.md#2 (enum 정의)`
- [x] `app/core/enums.py` - MemberRole enum → `docs/DSL.md#2 (member_role)`
- [x] `app/core/enums.py` - PollStatus enum → `docs/DSL.md#2 (poll_status)`
- [x] `app/core/enums.py` - TemplateCategory enum → `docs/DSL.md#2 (template_category)`
- [x] `app/core/enums.py` - NotificationType enum → `docs/DSL.md#2 (notification_type)`
- [x] `app/core/enums.py` - ReportStatus, ReportReason enum → `docs/DSL.md#2 (report_*)`
- [x] **커밋**: `feat: define database enum types`

### 3.3 Base 모델 정의
- [x] `app/core/models.py` - Base, TimestampMixin 정의
- [x] **커밋**: `feat: add SQLAlchemy base model and mixins`

### 3.4 Users 모델
- [x] `app/modules/auth/__init__.py`
- [x] `app/modules/auth/models.py` - User 모델 → `docs/DSL.md#2 (users 테이블)`
- [x] **마이그레이션**: `uv run alembic revision --autogenerate -m "create users table"`
- [x] **테스트**: `uv run alembic upgrade head`
- [x] **커밋**: `feat(auth): add User model and migration`

### 3.5 Circles 모델
- [x] `app/modules/circles/__init__.py`
- [x] `app/modules/circles/models.py` - Circle 모델 → `docs/DSL.md#2 (circles 테이블)`
- [x] `app/modules/circles/models.py` - CircleMember 모델 → `docs/DSL.md#2 (circle_members 테이블)`
- [x] **마이그레이션**: `uv run alembic revision --autogenerate -m "create circles tables"`
- [x] **테스트**: `uv run alembic upgrade head`
- [x] **커밋**: `feat(circles): add Circle and CircleMember models`

### 3.6 Polls 모델
- [x] `app/modules/polls/__init__.py`
- [x] `app/modules/polls/models.py` - PollTemplate 모델 → `docs/DSL.md#2 (poll_templates 테이블)`
- [x] `app/modules/polls/models.py` - Poll 모델 → `docs/DSL.md#2 (polls 테이블)`
- [x] `app/modules/polls/models.py` - Vote 모델 → `docs/DSL.md#2 (votes 테이블)`
- [x] `app/modules/polls/models.py` - PollResult 모델 → `docs/DSL.md#2 (poll_results 테이블)`
- [x] **마이그레이션**: `uv run alembic revision --autogenerate -m "create polls tables"`
- [x] **테스트**: `uv run alembic upgrade head`
- [x] **커밋**: `feat(polls): add Poll, PollTemplate, Vote models`

### 3.7 Notifications 모델
- [x] `app/modules/notifications/__init__.py`
- [x] `app/modules/notifications/models.py` - Notification 모델 → `docs/DSL.md#2 (notifications 테이블)`
- [x] **마이그레이션**: `uv run alembic revision --autogenerate -m "create notifications tables"`
- [x] **테스트**: `uv run alembic upgrade head`
- [x] **커밋**: `feat(notifications): add Notification models`

### 3.8 Reports 모델
- [x] `app/modules/reports/__init__.py`
- [x] `app/modules/reports/models.py` - Report 모델 → `docs/DSL.md#2 (reports)`
- [x] **마이그레이션**: `uv run alembic revision --autogenerate -m "create reports table"`
- [x] **테스트**: `uv run alembic upgrade head`
- [x] **커밋**: `feat(reports): add Report model`

---

## Phase 4: Auth 모듈 (TDD)

> **참고 문서**: `trd/06-authentication-architecture.md`, `trd/00-interface-specifications.md`, `docs/DSL.md#3.1`, `trd/05-api-specification.md`

### 4.1 Auth Schemas
- [x] `app/modules/auth/schemas.py` - UserCreate schema → `docs/DSL.md#3.1 (UserCreate)`
- [x] `app/modules/auth/schemas.py` - UserResponse schema → `docs/DSL.md#3.1 (User)`
- [x] `app/modules/auth/schemas.py` - UserUpdate schema → `docs/DSL.md#3.1 (UserUpdate)`
- [x] `app/modules/auth/schemas.py` - TokenResponse schema → `docs/DSL.md#3.1 (TokenResponse)`
- [x] `app/modules/auth/schemas.py` - LoginRequest schema → `trd/00-interface-specifications.md`
- [x] **커밋**: `feat(auth): add Pydantic schemas`

### 4.2 Auth Repository (TDD)
- [x] `tests/modules/auth/test_repository.py` - create user 테스트 작성
- [x] `app/modules/auth/repository.py` - UserRepository.create 구현 → `docs/DSL.md#3.1 (UserRepository)`
- [x] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [x] `tests/modules/auth/test_repository.py` - find by email 테스트 작성
- [x] `app/modules/auth/repository.py` - UserRepository.find_by_email 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [x] `tests/modules/auth/test_repository.py` - find by id 테스트 작성
- [x] `app/modules/auth/repository.py` - UserRepository.find_by_id 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [x] `tests/modules/auth/test_repository.py` - update user 테스트 작성
- [x] `app/modules/auth/repository.py` - UserRepository.update 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`
- [x] **커밋**: `feat(auth): implement UserRepository with tests`

### 4.3 Auth Service (TDD)
- [x] `tests/modules/auth/test_service.py` - register 테스트 작성
- [x] `app/modules/auth/service.py` - AuthService.register 구현 → `docs/DSL.md#3.1 (AuthService)`
- [x] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [x] `tests/modules/auth/test_service.py` - login 테스트 작성
- [x] `app/modules/auth/service.py` - AuthService.login 구현 → `trd/06-authentication-architecture.md`
- [x] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [x] `tests/modules/auth/test_service.py` - get_current_user 테스트 작성
- [x] `app/modules/auth/service.py` - AuthService.get_current_user 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [x] `tests/modules/auth/test_service.py` - update_profile 테스트 작성
- [x] `app/modules/auth/service.py` - AuthService.update_profile 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`
- [x] **커밋**: `feat(auth): implement AuthService with tests`

### 4.4 Auth Router (TDD)
- [x] `tests/modules/auth/test_router.py` - POST /register 테스트 작성
- [x] `app/modules/auth/router.py` - register endpoint 구현 → `docs/DSL.md#3.1 (AuthRouter)`, `trd/05-api-specification.md`
- [x] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [x] `tests/modules/auth/test_router.py` - POST /login 테스트 작성
- [x] `app/modules/auth/router.py` - login endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [x] `tests/modules/auth/test_router.py` - GET /me 테스트 작성
- [x] `app/modules/auth/router.py` - get_me endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [x] `tests/modules/auth/test_router.py` - PUT /me 테스트 작성
- [x] `app/modules/auth/router.py` - update_me endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [x] `app/main.py` - auth router 등록
- [x] **테스트**: 전체 Auth 모듈 테스트 `uv run pytest tests/modules/auth/ -v`
- [x] **커밋**: `feat(auth): implement Auth API endpoints with tests`

---

## Phase 5: Circle 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.2`, `trd/00-interface-specifications.md`, `trd/05-api-specification.md`

### 5.1 Circle Schemas
- [x] `app/modules/circles/schemas.py` - CircleCreate schema → `docs/DSL.md#3.2 (CircleCreate)`
- [x] `app/modules/circles/schemas.py` - CircleResponse schema → `docs/DSL.md#3.2 (Circle)`
- [x] `app/modules/circles/schemas.py` - CircleUpdate schema → `docs/DSL.md#3.2 (CircleUpdate)`
- [x] `app/modules/circles/schemas.py` - CircleDetail schema → `docs/DSL.md#3.2 (CircleDetail)`
- [x] `app/modules/circles/schemas.py` - MemberInfo schema → `docs/DSL.md#3.2 (MemberInfo)`
- [x] `app/modules/circles/schemas.py` - JoinByCodeRequest schema
- [x] **커밋**: `feat(circles): add Pydantic schemas`

### 5.2 Circle Repository (TDD)
- [x] `tests/modules/circles/test_repository.py` - create circle 테스트 작성
- [x] `app/modules/circles/repository.py` - CircleRepository.create 구현 → `docs/DSL.md#3.2 (CircleRepository)`
- [x] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`

- [x] `tests/modules/circles/test_repository.py` - find by invite_code 테스트 작성
- [x] `app/modules/circles/repository.py` - CircleRepository.find_by_invite_code 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`

- [x] `tests/modules/circles/test_repository.py` - find by user_id 테스트 작성
- [x] `app/modules/circles/repository.py` - CircleRepository.find_by_user_id 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`
- [x] **커밋**: `feat(circles): implement CircleRepository with tests`

### 5.3 Membership Repository (TDD)
- [x] `tests/modules/circles/test_membership_repository.py` - create membership 테스트 작성
- [x] `app/modules/circles/repository.py` - MembershipRepository.create 구현 → `docs/DSL.md#3.2 (MembershipRepository)`
- [x] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`

- [x] `tests/modules/circles/test_membership_repository.py` - find members 테스트 작성
- [x] `app/modules/circles/repository.py` - MembershipRepository.find_by_circle_id 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`

- [x] `tests/modules/circles/test_membership_repository.py` - check membership 테스트 작성
- [x] `app/modules/circles/repository.py` - MembershipRepository.exists 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`
- [x] **커밋**: `feat(circles): implement MembershipRepository with tests`

### 5.4 Circle Service (TDD)
- [x] `tests/modules/circles/test_service.py` - create_circle 테스트 작성
- [x] `app/modules/circles/service.py` - CircleService.create_circle 구현 → `docs/DSL.md#3.2 (CircleService)`
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [x] `tests/modules/circles/test_service.py` - join_by_code 테스트 작성 → `docs/DSL.md#5 (JoinCircleFlow)`
- [x] `app/modules/circles/service.py` - CircleService.join_by_code 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [x] `tests/modules/circles/test_service.py` - get_user_circles 테스트 작성
- [x] `app/modules/circles/service.py` - CircleService.get_user_circles 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [x] `tests/modules/circles/test_service.py` - get_circle_detail 테스트 작성
- [x] `app/modules/circles/service.py` - CircleService.get_circle_detail 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [x] `tests/modules/circles/test_service.py` - leave_circle 테스트 작성
- [x] `app/modules/circles/service.py` - CircleService.leave_circle 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [x] `tests/modules/circles/test_service.py` - regenerate_invite_code 테스트 작성
- [x] `app/modules/circles/service.py` - CircleService.regenerate_invite_code 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`
- [x] **커밋**: `feat(circles): implement CircleService with tests`

### 5.5 Circle Router (TDD)
- [x] `tests/modules/circles/test_router.py` - POST /circles 테스트 작성
- [x] `app/modules/circles/router.py` - create_circle endpoint 구현 → `docs/DSL.md#3.2 (CircleRouter)`, `trd/05-api-specification.md`
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `tests/modules/circles/test_router.py` - GET /circles 테스트 작성
- [x] `app/modules/circles/router.py` - get_circles endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `tests/modules/circles/test_router.py` - GET /circles/{id} 테스트 작성
- [x] `app/modules/circles/router.py` - get_circle endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `tests/modules/circles/test_router.py` - POST /circles/join/code 테스트 작성
- [x] `app/modules/circles/router.py` - join_by_code endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `tests/modules/circles/test_router.py` - POST /circles/{id}/leave 테스트 작성
- [x] `app/modules/circles/router.py` - leave_circle endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `tests/modules/circles/test_router.py` - GET /circles/{id}/members 테스트 작성
- [x] `app/modules/circles/router.py` - get_members endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [x] `app/main.py` - circles router 등록
- [x] **테스트**: 전체 Circle 모듈 테스트 `uv run pytest tests/modules/circles/ -v`
- [x] **커밋**: `feat(circles): implement Circle API endpoints with tests`

---

## Phase 6: Poll 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.3`, `trd/00-interface-specifications.md`, `trd/05-api-specification.md`, `docs/DSL.md#10 (투표 익명성)`

### 6.1 Poll Schemas
- [x] `app/modules/polls/schemas.py` - PollTemplateResponse schema → `docs/DSL.md#3.3 (PollTemplate)`
- [x] `app/modules/polls/schemas.py` - PollCreate schema → `docs/DSL.md#3.3 (PollCreate)`
- [x] `app/modules/polls/schemas.py` - PollResponse schema → `docs/DSL.md#3.3 (Poll)`
- [x] `app/modules/polls/schemas.py` - PollDetail schema → `docs/DSL.md#3.3 (PollDetail)`
- [x] `app/modules/polls/schemas.py` - VoteRequest schema → `docs/DSL.md#3.3 (VoteCreate)`
- [x] `app/modules/polls/schemas.py` - VoteResponse schema → `docs/DSL.md#3.3 (VoteResponse)`
- [x] `app/modules/polls/schemas.py` - PollResultItem schema → `docs/DSL.md#3.3 (PollResultItem)`
- [x] **커밋**: `feat(polls): add Pydantic schemas`

### 6.2 Template Repository (TDD)
- [x] `tests/modules/polls/test_template_repository.py` - find_all 테스트 작성
- [x] `app/modules/polls/repository.py` - TemplateRepository.find_all 구현 → `docs/DSL.md#3.3 (TemplateRepository)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_template_repository.py -v`

- [x] `tests/modules/polls/test_template_repository.py` - find_by_category 테스트 작성
- [x] `app/modules/polls/repository.py` - TemplateRepository.find_by_category 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_template_repository.py -v`
- [x] **커밋**: `feat(polls): implement TemplateRepository with tests`

### 6.3 Poll Repository (TDD)
- [x] `tests/modules/polls/test_poll_repository.py` - create poll 테스트 작성
- [x] `app/modules/polls/repository.py` - PollRepository.create 구현 → `docs/DSL.md#3.3 (PollRepository)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`

- [x] `tests/modules/polls/test_poll_repository.py` - find by circle_id 테스트 작성
- [x] `app/modules/polls/repository.py` - PollRepository.find_by_circle_id 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`

- [x] `tests/modules/polls/test_poll_repository.py` - update status 테스트 작성
- [x] `app/modules/polls/repository.py` - PollRepository.update_status 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`
- [x] **커밋**: `feat(polls): implement PollRepository with tests`

### 6.4 Vote Repository (TDD)
- [x] `tests/modules/polls/test_vote_repository.py` - create vote 테스트 작성
- [x] `app/modules/polls/repository.py` - VoteRepository.create 구현 → `docs/DSL.md#3.3 (VoteRepository)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`

- [x] `tests/modules/polls/test_vote_repository.py` - check duplicate 테스트 작성 → `docs/DSL.md#10 (vote_anonymity)`
- [x] `app/modules/polls/repository.py` - VoteRepository.exists_by_voter_hash 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`

- [x] `tests/modules/polls/test_vote_repository.py` - get results 테스트 작성
- [x] `app/modules/polls/repository.py` - VoteRepository.get_results 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`
- [x] **커밋**: `feat(polls): implement VoteRepository with tests`

### 6.5 Poll Service (TDD)
- [x] `tests/modules/polls/test_service.py` - get_templates 테스트 작성
- [x] `app/modules/polls/service.py` - PollService.get_templates 구현 → `docs/DSL.md#3.3 (PollService)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - create_poll 테스트 작성 → `docs/DSL.md#5 (CreatePollFlow)`
- [x] `app/modules/polls/service.py` - PollService.create_poll 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - vote (익명 해시 포함) 테스트 작성 → `docs/DSL.md#5 (VoteFlow)`, `docs/DSL.md#10`
- [x] `app/modules/polls/service.py` - PollService.vote 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - 중복 투표 방지 테스트 작성 → `docs/DSL.md#5 (VoteFlow - 중복 투표 확인)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - 자기 자신 투표 방지 테스트 작성 → `docs/DSL.md#5 (VoteFlow - 자기 자신 투표 방지)`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - get_results 테스트 작성
- [x] `app/modules/polls/service.py` - PollService.get_results 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [x] `tests/modules/polls/test_service.py` - close_poll 테스트 작성 → `docs/DSL.md#5 (PollEndFlow)`
- [x] `app/modules/polls/service.py` - PollService.close_poll 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`
- [x] **커밋**: `feat(polls): implement PollService with tests`

### 6.6 Poll Router (TDD)
- [x] `tests/modules/polls/test_router.py` - GET /polls/templates 테스트 작성
- [x] `app/modules/polls/router.py` - get_templates endpoint 구현 → `docs/DSL.md#3.3 (PollRouter)`, `trd/05-api-specification.md`
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `tests/modules/polls/test_router.py` - POST /circles/{id}/polls 테스트 작성
- [x] `app/modules/polls/router.py` - create_poll endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `tests/modules/polls/test_router.py` - GET /circles/{id}/polls 테스트 작성
- [x] `app/modules/polls/router.py` - get_circle_polls endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `tests/modules/polls/test_router.py` - GET /polls/{id} 테스트 작성
- [x] `app/modules/polls/router.py` - get_poll endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `tests/modules/polls/test_router.py` - POST /polls/{id}/vote 테스트 작성
- [x] `app/modules/polls/router.py` - vote endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `tests/modules/polls/test_router.py` - GET /polls/{id}/results 테스트 작성
- [x] `app/modules/polls/router.py` - get_results endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [x] `app/main.py` - polls router 등록
- [x] **테스트**: 전체 Poll 모듈 테스트 `uv run pytest tests/modules/polls/ -v`
- [x] **커밋**: `feat(polls): implement Poll API endpoints with tests`

---

## Phase 7: Notification 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.4`, `trd/05-api-specification.md`

### 7.1 Notification Schemas
- [x] `app/modules/notifications/schemas.py` - NotificationResponse schema → `docs/DSL.md#3.4 (Notification)`
- [x] `app/modules/notifications/schemas.py` - NotificationSettingsResponse schema
- [x] `app/modules/notifications/schemas.py` - NotificationSettingsUpdate schema
- [x] **커밋**: `feat(notifications): add Pydantic schemas`

### 7.2 Notification Repository (TDD)
- [x] `tests/modules/notifications/test_repository.py` - create notification 테스트 작성
- [x] `app/modules/notifications/repository.py` - NotificationRepository.create 구현 → `docs/DSL.md#3.4 (NotificationRepository)`
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`

- [x] `tests/modules/notifications/test_repository.py` - find by user_id 테스트 작성
- [x] `app/modules/notifications/repository.py` - NotificationRepository.find_by_user_id 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`

- [x] `tests/modules/notifications/test_repository.py` - mark as read 테스트 작성
- [x] `app/modules/notifications/repository.py` - NotificationRepository.mark_as_read 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`
- [x] **커밋**: `feat(notifications): implement NotificationRepository with tests`

### 7.3 Notification Service (TDD)
- [x] `tests/modules/notifications/test_service.py` - send_poll_started 테스트 작성
- [x] `app/modules/notifications/service.py` - NotificationService.send_poll_started 구현 → `docs/DSL.md#3.4 (NotificationService)`
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`

- [x] `tests/modules/notifications/test_service.py` - send_vote_received 테스트 작성
- [x] `app/modules/notifications/service.py` - NotificationService.send_vote_received 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`

- [x] `tests/modules/notifications/test_service.py` - get_notifications 테스트 작성
- [x] `app/modules/notifications/service.py` - NotificationService.get_notifications 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`
- [x] **커밋**: `feat(notifications): implement NotificationService with tests`

### 7.4 Notification Router (TDD)
- [x] `tests/modules/notifications/test_router.py` - GET /notifications 테스트 작성
- [x] `app/modules/notifications/router.py` - get_notifications endpoint 구현 → `docs/DSL.md#3.4 (NotificationRouter)`, `trd/05-api-specification.md`
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [x] `tests/modules/notifications/test_router.py` - PUT /notifications/{id}/read 테스트 작성
- [x] `app/modules/notifications/router.py` - mark_as_read endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [x] `tests/modules/notifications/test_router.py` - GET /notifications/unread-count 테스트 작성
- [x] `app/modules/notifications/router.py` - get_unread_count endpoint 구현
- [x] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [x] `app/main.py` - notifications router 등록
- [x] **테스트**: 전체 Notification 모듈 테스트 `uv run pytest tests/modules/notifications/ -v`
- [x] **커밋**: `feat(notifications): implement Notification API endpoints with tests`

---

## Phase 8: Report 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.5`, `trd/05-api-specification.md`

### 8.1 Report Schemas
- [x] `app/modules/reports/schemas.py` - ReportCreate schema → `docs/DSL.md#3.5 (ReportCreate)`
- [x] `app/modules/reports/schemas.py` - ReportResponse schema → `docs/DSL.md#3.5 (Report)`
- [x] **커밋**: `feat(reports): add Pydantic schemas`

### 8.2 Report Repository (TDD)
- [x] `tests/modules/reports/test_repository.py` - create report 테스트 작성
- [x] `app/modules/reports/repository.py` - ReportRepository.create 구현 → `docs/DSL.md#3.5 (ReportRepository)`
- [x] **테스트**: `uv run pytest tests/modules/reports/test_repository.py -v`

- [x] `tests/modules/reports/test_repository.py` - find by status 테스트 작성
- [x] `app/modules/reports/repository.py` - ReportRepository.find_by_status 구현
- [x] **테스트**: `uv run pytest tests/modules/reports/test_repository.py -v`
- [x] **커밋**: `feat(reports): implement ReportRepository with tests`

### 8.3 Report Service (TDD)
- [x] `tests/modules/reports/test_service.py` - create_report 테스트 작성
- [x] `app/modules/reports/service.py` - ReportService.create_report 구현 → `docs/DSL.md#3.5 (ReportService)`
- [x] **테스트**: `uv run pytest tests/modules/reports/test_service.py -v`
- [x] **커밋**: `feat(reports): implement ReportService with tests`

### 8.4 Report Router (TDD)
- [x] `tests/modules/reports/test_router.py` - POST /reports 테스트 작성
- [x] `app/modules/reports/router.py` - create_report endpoint 구현 → `docs/DSL.md#3.5 (ReportRouter)`, `trd/05-api-specification.md`
- [x] **테스트**: `uv run pytest tests/modules/reports/test_router.py -v`

- [x] `app/main.py` - reports router 등록
- [x] **테스트**: 전체 Report 모듈 테스트 `uv run pytest tests/modules/reports/ -v`
- [x] **커밋**: `feat(reports): implement Report API endpoints with tests`

---

## Phase 9: 통합 테스트 및 마무리

> **참고 문서**: `trd/00-system-architecture-v2.md`, `docs/DSL.md#5 (워크플로우)`, `docs/DSL.md#8 (테스트 전략)`

### 9.1 통합 테스트
- [x] `tests/integration/test_circle_flow.py` - Circle 생성 -> 가입 플로우 테스트 → `docs/DSL.md#5 (JoinCircleFlow)`
- [x] `tests/integration/test_poll_flow.py` - 투표 생성 -> 참여 -> 결과 플로우 테스트 → `docs/DSL.md#5 (CreatePollFlow, VoteFlow, PollEndFlow)`
- [x] **테스트**: `uv run pytest tests/integration/ -v`
- [x] **커밋**: `test: add integration tests for main workflows`

### 9.2 API 문서화
- [x] OpenAPI 스키마 검토 → `trd/05-api-specification.md`
- [x] API 엔드포인트 설명 추가 (각 router에 summary, description 포함)
- [x] `/docs` 및 `/redoc` 확인 (debug 모드에서 자동 활성화)
- [x] **커밋**: `docs: improve API documentation`

### 9.3 성능 및 보안 검토
- [x] Rate limiting 미들웨어 추가 → `docs/DSL.md#10 (rate_limiting)` - slowapi 사용
- [x] CORS 설정 검토 → `trd/07-development-deployment-setup.md#4.1`
- [x] 민감 데이터 로깅 제외 (토큰 직접 로깅 없음)
- [x] **테스트**: 전체 테스트 스위트 실행 `uv run pytest -v --cov=app` (139 passed, 87% coverage)
- [x] **커밋**: `feat: add rate limiting and security middleware`

### 9.4 초기 데이터 시딩
- [x] `scripts/seed_templates.py` - 투표 템플릿 초기 데이터 → `docs/DSL.md#2 (poll_templates)`
- [x] **테스트**: 시드 스크립트 실행 확인
- [x] **커밋**: `chore: add seed script for poll templates`

---

## Phase 10: 코드 품질 개선 및 보안 강화

> **참고**: 코드 분석을 통해 도출된 개선사항 (MVP 이후 안정화 단계)

### 10.1 보안 강화 (CRITICAL/HIGH)

#### 10.1.1 Secret Key 설정 개선(나중에 진행)
- [ ] `app/config.py` - `secret_key` 기본값 제거, 필수 설정으로 변경
- [ ] 환경변수 미설정 시 애플리케이션 시작 실패하도록 검증 추가
- [ ] `.env.example`에 `secrets.token_urlsafe(32)` 생성 가이드 추가
- [ ] **커밋**: `fix(security): require secret key configuration`

#### 10.1.2 Notification 권한 체크 추가 ✅
- [x] `app/modules/notifications/service.py` - `mark_as_read()` 소유권 검증 추가
- [x] `app/modules/notifications/repository.py` - `find_by_id()` 메서드 추가
- [x] `tests/modules/notifications/test_router.py` - 권한 체크 테스트 추가
- [x] **커밋**: `fix(notifications): add authorization check for notification updates`

#### 10.1.3 JWT 토큰 만료 시간 조정(나중에 진행)
- [ ] `app/config.py` - `jwt_access_token_expire_minutes` 120분(2시간)으로 변경
- [ ] Refresh Token 스키마 및 엔드포인트 설계 (선택적)
- [ ] **커밋**: `fix(auth): reduce JWT token expiration to 2 hours`

#### 10.1.4 Username 입력 검증 강화(나중에 진행)
- [ ] `app/modules/auth/schemas.py` - `username` 필드에 `pattern=r"^[a-zA-Z0-9_-]+$"` 추가
- [ ] **커밋**: `fix(auth): add username pattern validation`

### 10.2 아키텍처 개선 (HIGH)

#### 10.2.1 트랜잭션 관리 일관성 ✅
- [x] Repository 파일들에서 `commit()` 호출 제거, `flush()`만 사용
  - [x] `app/modules/polls/repository.py`
  - [x] `app/modules/notifications/repository.py`
  - [x] `app/modules/reports/repository.py`
- [x] Session manager에서 트랜잭션 경계 관리하도록 통일

#### 10.2.2 Dependency Injection 개선 ✅
- [x] `app/deps.py` - Service DI 함수 추가 (`get_poll_service`, `get_circle_service` 등)
- [x] Router에서 직접 Repository/Service 생성 코드 제거
- [x] `Annotated[Service, Depends(get_service)]` 패턴 적용
  - [x] `app/modules/polls/router.py`
  - [x] `app/modules/circles/router.py`
  - [x] `app/modules/notifications/router.py`
  - [x] `app/modules/reports/router.py`

#### 10.2.3 N+1 쿼리 해결 ✅
- [x] `app/modules/circles/repository.py` - `find_with_members()`에 User eager loading 이미 적용됨
- [x] `selectinload(CircleMember.user)` 이미 사용 중

#### 10.2.4 중복 코드 제거 ✅
- [x] `app/deps.py` - 중복된 `get_db()` 함수 제거
- [x] `app/core/database.py`의 `get_db()` 사용하도록 통일

### 10.3 코드 품질 개선 (MEDIUM)

#### 10.3.1 에러 핸들링 개선 ✅
- [x] `app/main.py` - `RequestValidationError` 핸들러 추가
- [x] 표준 API 응답 포맷으로 Pydantic 에러 반환

#### 10.3.2 로깅 시스템 도입 ✅
- [x] `app/main.py` - `print()` 문을 `logging` 모듈로 교체
- [x] 로깅 설정 추가 (`app/main.py`에서 basicConfig 설정)

#### 10.3.3 비즈니스 에러 타입 세분화(나중에 진행)
- [ ] `app/core/exceptions.py` - 구체적인 에러 클래스 추가
  - [ ] `PollEndedError`
  - [ ] `SelfVoteError`
  - [ ] `CircleFullError`
  - [ ] `AlreadyMemberError`
- [ ] 서비스 레이어에서 `BadRequestException` 대신 구체적 에러 사용
- [ ] **커밋**: `refactor: add specific business exception types`

#### 10.3.4 Rate Limit 해싱 개선(나중에 진행)
- [ ] `app/core/rate_limit.py` - `hash()` 대신 `hashlib.sha256()` 사용
- [ ] **커밋**: `fix(security): use SHA-256 for rate limit token hashing`

### 10.4 성능 최적화 (MEDIUM)

#### 10.4.1 DB 커넥션 풀 설정(나중에 진행)
- [ ] `app/core/database.py` - `pool_size` 환경변수로 설정 가능하게 변경
- [ ] `app/config.py` - `db_pool_size`, `db_max_overflow` 설정 추가
- [ ] 기본값 `pool_size=20`, `max_overflow=30`으로 조정
- [ ] **커밋**: `perf: make database pool size configurable`

#### 10.4.2 템플릿 캐싱 (선택적)(나중에 진행)
- [ ] Redis 캐싱 레이어 설계
- [ ] `PollService.get_templates()` 결과 캐싱 (TTL 10분)
- [ ] **커밋**: `perf: add Redis caching for poll templates`


### 10.6 설정 및 배포 준비 (LOW)

#### 10.6.1 CORS 설정 개선 ✅
- [x] `app/config.py` - `field_validator`로 CORS origins 검증 추가
- [x] 개발 환경만 localhost 허용하도록 조건부 설정

#### 10.6.2 상수 추출 ✅
- [x] `app/core/constants.py` 생성
- [x] 매직 넘버 상수화 (초대코드 길이, 신고 임계값, 투표 기간 등)

---

## 최종 점검

- [x] 전체 테스트 통과: `uv run pytest -v --cov=app --cov-report=html` (140 passed, 87% coverage)
- [x] 린트 통과: `uv run ruff check app/`
- [x] 타입 체크 통과: `uv run mypy app/` (43 source files checked)
- [x] 서버 정상 실행: `uv run uvicorn app.main:app --reload`
- [x] **최종 커밋**: `chore: complete backend MVP implementation`

---

## Phase 11: Frontend Development

> **참고 문서**: `prd/design/02-ui-design-system.md`, `prd/design/03-animations.md`, `prd/design/05-complete-ui-specification.md`

### 11.1 Design Tokens Setup (P0)
- [x] `frontend/src/theme/` 디렉토리 생성
- [x] `frontend/src/theme/tokens.ts` - 디자인 토큰 정의 → `prd/design/02-ui-design-system.md`
  - [x] Colors (Primary, Secondary, Semantic, Neutral, Gradients)
  - [x] Typography (Font families, sizes, weights, line heights)
  - [x] Spacing (8pt grid)
  - [x] Border Radius
  - [x] Shadows (Elevation)
  - [x] Z-Index Scale
  - [x] Icon Sizes
  - [x] Touch Targets
  - [x] Dark Theme Support
- [x] `frontend/src/theme/animations.ts` - 애니메이션 토큰 → `prd/design/03-animations.md`
  - [x] Duration Tokens
  - [x] Easing Curves (React Native Reanimated)
  - [x] Spring Configurations
  - [x] Animation Helpers (animateValue, animateSpring)
  - [x] Animation Patterns (fade, slide, scale, modal, toast)
  - [x] Haptic Feedback Patterns
- [x] `frontend/src/theme/index.ts` - 통합 export
- [x] **커밋**: `feat(frontend): add design tokens and animation system`

### 11.2 Basic Primitives Components (P0)
- [x] `frontend/src/components/primitives/` 디렉토리 생성
- [x] `Button.tsx` - 기본 버튼 컴포넌트
  - [x] Primary, Secondary, Ghost variants
  - [x] Size variants (sm, md, lg)
  - [x] Loading state
  - [x] Disabled state
  - [x] Press animation (React Native Reanimated)
  - [x] Haptic feedback
  - [ ] **테스트**: Storybook 또는 수동 테스트
- [x] `Card.tsx` - 카드 컴포넌트
  - [x] 기본 카드 레이아웃
  - [x] Shadow elevation variants
  - [x] Border radius variants
  - [x] Press animation (선택적)
- [x] `Input.tsx` - 입력 필드 컴포넌트
  - [x] Text input
  - [x] Focus/Error states
  - [x] Label, placeholder, helper text
  - [x] Validation feedback
- [x] `Text.tsx` - 타이포그래피 컴포넌트
  - [x] Typography variants (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
  - [x] Weight variants (normal, medium, semibold, bold)
  - [x] Color variants
- [x] **커밋**: `feat(frontend): add primitive components`

### 11.3 Expo Router Setup (P0)
- [x] Expo 프로젝트 초기화
  - [x] `npx create-expo-app frontend --template blank-typescript`
  - [x] `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`
  - [x] `npx expo install react-native-reanimated react-native-gesture-handler`
- [x] `frontend/app/` 디렉토리 구조 생성 → `CLAUDE.md#Architecture`
  - [x] `app/(auth)/` - 비인증 화면 (로그인, 가입)
  - [x] `app/(main)/(home)/` - 홈 탭 (진행 중 투표)
  - [x] `app/(main)/(create)/` - 투표 생성 탭
  - [x] `app/(main)/(profile)/` - 프로필 탭
- [x] `app/_layout.tsx` - Root layout with theme provider
- [x] `app/(auth)/_layout.tsx` - Auth layout
- [x] `app/(main)/_layout.tsx` - Main layout with tabs
- [x] `app/(main)/(home)/_layout.tsx` - Home tab layout
- [x] `app/(main)/(create)/_layout.tsx` - Create poll tab layout
- [x] `app/(main)/(profile)/_layout.tsx` - Profile tab layout
- [ ] **테스트**: `npx expo start` 실행 확인
- [x] **커밋**: `feat(frontend): setup Expo Router file structure and layouts`

### 11.4 Animation Hooks (P1)
- [x] `frontend/src/hooks/` 디렉토리 생성
- [x] `useAnimation.ts` - 공통 애니메이션 훅
  - [x] `useFadeIn()` - Fade in 애니메이션
  - [x] `useFadeOut()` - Fade out 애니메이션
  - [x] `useSlideIn()` - Slide in 애니메이션
  - [x] `useScaleIn()` - Scale in 애니메이션
  - [x] `usePulse()` - Pulse 애니메이션
  - [x] `useButtonPress()` - 버튼 press 애니메이션
  - [x] `useStaggeredFadeIn()` - 스태거 애니메이션
  - [x] `useShake()` - Shake 애니메이션 (에러 표시)
- [x] `useHaptics.ts` - Haptic feedback 훅
  - [x] Expo Haptics 통합
  - [x] Action-to-haptic 매핑
  - [x] Context-specific hooks (Vote, Circle, Navigation, Form)
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add animation hooks`

### 11.5 Pattern Components (P1)
- [x] `frontend/src/components/patterns/` 디렉토리 생성
- [x] `VoteCard.tsx` - 투표 카드 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.3`
  - [x] 4명 선택지 레이아웃 (2x2 그리드)
  - [x] 선택 애니메이션 (scale, border, opacity)
  - [x] Selected state (체크마크 배지)
  - [x] Haptic feedback (selection)
  - [x] 스태거 애니메이션 (순차 등장)
- [x] `ResultBar.tsx` - 결과 바 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.4`
  - [x] 진행바 애니메이션 (spring physics)
  - [x] 퍼센티지 표시
  - [x] 그라디언트 배경 (LinearGradient)
  - [x] 순위 배지
  - [x] 1위 강조 스타일
- [x] `ProgressBar.tsx` - 질문 진행 표시 → `prd/design/02-ui-design-system.md#Progress Indicator`
  - [x] 현재/전체 표시
  - [x] 진행바 애니메이션
  - [x] CompactProgressBar variant (간결한 버전)
  - [x] DotProgress variant (점 표시)
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add pattern components`

### 11.6 Empty/Loading States (P1)
- [x] `frontend/src/components/states/` 디렉토리 생성
- [x] `EmptyState.tsx` - 빈 상태 컴포넌트
  - [x] 아이콘 + 메시지 레이아웃
  - [x] 다양한 빈 상태 variants (8가지)
  - [x] CompactEmptyState variant (간결한 버전)
  - [x] 액션 버튼 옵션
- [x] `LoadingSpinner.tsx` - 로딩 스피너
  - [x] Animated spinner (ActivityIndicator)
  - [x] Size variants (sm, md, lg, xl)
  - [x] DotsLoading variant (점 3개)
  - [x] PulseLoading variant (펄스 애니메이션)
  - [x] 전체 화면 오버레이 옵션
- [x] `Skeleton.tsx` - Skeleton 로딩
  - [x] 다양한 skeleton shapes (rect, circle, rounded)
  - [x] Pulse animation
  - [x] SkeletonText, SkeletonAvatar, SkeletonCard variants
  - [x] SkeletonList, SkeletonVoteCard, SkeletonResultBar variants
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add empty and loading states`

### 11.7 UI Documentation (P2)
- [ ] Storybook 설정 (선택적)
  - [ ] `@storybook/react-native` 설치
  - [ ] 컴포넌트별 stories 작성
- [ ] 컴포넌트 사용 가이드 작성
  - [ ] `frontend/src/components/README.md`
- [ ] **커밋**: `docs(frontend): add component documentation`

### 11.8 Responsive Testing (P2)
- [ ] 다양한 화면 크기 테스트
  - [ ] iPhone SE (작은 화면)
  - [ ] iPhone 14 Pro (표준)
  - [ ] iPhone 14 Pro Max (큰 화면)
  - [ ] iPad (태블릿)
- [ ] Safe Area 처리 확인
- [ ] 가로 모드 지원 (선택적)
- [ ] **커밋**: `test(frontend): verify responsive design`

### 11.9 Dark Mode Implementation (P2)
- [ ] Dark theme tokens 적용
- [ ] Theme provider 구현
- [ ] Theme toggle 컴포넌트
- [ ] 컴포넌트별 dark mode 스타일 추가
- [ ] **테스트**: 라이트/다크 모드 전환 확인
- [ ] **커밋**: `feat(frontend): implement dark mode support`

### 11.10 Create Tab - 투표 생성 (P0)

> **참고 문서**: `prd/design/05-complete-ui-specification.md#2.6`, `prd/design/04-user-flow.md`

#### 11.10.1 메인 화면 - 카테고리 탐색 (P0)
- [x] `app/(main)/(create)/index.tsx` - Create Tab 메인 화면
  - [ ] 헤더: "새 투표 만들기" + 부제
  - [ ] 카테고리 카드 리스트 (세로 스크롤)
    - [ ] 😊 성격 관련 (8개의 질문)
  - [ ] ✨ 외모 관련 (6개의 질문)
    - [ ] 🎉 특별한 날 (4개의 질문)
    - [ ] 🏆 능력 관련 (5개의 질문)
  - [ ] 카드 터치 애니메이션 (scale 0.98, shadow-lg)
  - [x] Haptic: selection
  - [x] 카드 탭 → 질문 선택 화면으로 슬라이드 전환
- [ ] **개선 필요**: 하드코딩된 카테고리 목록을 백엔드 API에서 동적으로 가져오도록 수정
  - [ ] GET /polls/templates/categories 엔드포인트 생성 (백엔드)
  - [ ] API 연동 및 React Query hook 작성 (프론트엔드)
- [x] **테스트**: 카테고리 선택 동작 확인
- [ ] **커밋**: `feat(frontend): implement Create Tab main screen`

#### 11.10.2 질문 선택 화면 - 스와이프 카드 (P0)

> **Gas 앱 스타일**: Tinder/Gas처럼 카드 스택으로 질문 탐색

- [x] `app/(main)/(create)/select-template.tsx` - 질문 카드 스택 화면
  - [x] 헤더: 뒤로가기 + 카테고리명 + 진행 표시 (3/8)
  - [x] 카드 스택 컴포넌트 (최대 3장 표시)
    - [x] 현재 카드: 343×480px, shadow-2xl
    - [x] 뒷카드 1: 8px 아래, 8px 작게, opacity 0.7
    - [x] 뒷카드 2: 16px 아래, 16px 작게, opacity 0.4
  - [x] 카드 내부 레이아웃
    - [x] 이모지 80px (중앙 정렬)
    - [x] 질문 텍스트 (text-2xl, bold)
    - [x] [선택하기] 버튼 (하단 고정)
- [x] **스와이프 제스처** (React Native Gesture Handler + Reanimated)
  - [x] 좌측 스와이프 (←): 다음 질문 (카드 왼쪽으로 사라짐)
    - [x] 임계값: 100px
    - [x] Spring 애니메이션 (stiffness 300, damping 30)
    - [x] Haptic: impact-light
  - [x] 우측 스와이프 (→): 이전 질문
    - [x] 임계값: 100px
    - [x] Haptic: impact-light
  - [x] 위로 스와이프 (↑): 질문 선택 + 다음 단계로
    - [x] 임계값: 80px
    - [x] Scale + fade-out 애니메이션
    - [x] Haptic: impact-medium
- [x] **5개 액션 버튼**
  - [x] ⬅️ 이전 (회색, 48px)
  - [x] ❌ 건너뛰기 (빨강, 56px)
  - [x] 💖 선택 (분홍, 64px, 메인) - Gradient primary
  - [x] ✅ 선택 (파랑, 56px)
  - [x] ➡️ 다음 (회색, 48px)
- [x] 힌트 텍스트: "← 스와이프하여 넘기기" (3초 후 fade-out)
- [x] **테스트**: 스와이프 제스처 및 버튼 동작 확인
- [x] **커밋**: `feat(frontend): implement swipe card question selection`

#### 11.10.3 투표 설정 화면 (P0)
- [x] `app/(main)/(create)/configure.tsx` - 투표 설정 화면
  - [x] 선택한 질문 표시 (읽기 전용)
  - [x] ⏰ 투표 기간 선택 칩 (1H/3H/6H/24H)
    - [x] 비선택: white 배경, gray-200 테두리
    - [x] 선택: primary-50 배경, primary-500 테두리
    - [x] Haptic: selection
  - [x] 🎯 참여 대상 라디오 옵션
    - [x] ◉ Circle 전체 (15명)
    - [x] ◯ 일부만 선택하기
  - [x] 📢 알림 설정 라디오 옵션
    - [x] ◉ 즉시 알림 보내기
    - [x] ◯ 예약 발송
  - [x] [미리보기] 버튼 (하단 고정, gradient-primary)
- [x] **테스트**: 설정 선택 및 유효성 검사 확인
- [x] **커밋**: `feat(frontend): implement poll settings screen`

#### 11.10.4 미리보기 화면 (P0)
- [x] `app/(main)/(create)/preview.tsx` - 미리보기 화면
  - [x] 안내 텍스트: "투표가 이렇게 보여요"
  - [x] 프리뷰 컨테이너 (gray-50 배경)
    - [x] 실제 투표 화면 70% 축소판
    - [x] 2.3 투표 질문 화면 재사용
  - [x] 메타 정보 섹션
    - [x] ⏰ 6시간 후 마감
    - [x] 👥 Circle 전체 (15명)
    - [x] 📢 즉시 알림 발송
  - [x] 액션 버튼 (2개, 좌우 배치)
    - [x] [수정하기] - Secondary 버튼
    - [x] [투표 시작] - Primary 버튼 (gradient-primary)
  - [x] Haptic: impact-medium (투표 시작 시)
- [x] **테스트**: 미리보기 표시 및 버튼 동작 확인
- [x] **커밋**: `feat(frontend): implement poll preview screen`

#### 11.10.5 발행 완료 화면 (P0)
- [x] `app/(main)/(create)/success.tsx` - 발행 완료 화면
  - [x] Success 애니메이션
    - [x] 🎉 이모지 120px
    - [x] Scale bounce + rotate 애니메이션
      - [x] From: scale 0.5, rotate -15deg
      - [x] To: scale 1.2 → 1.0, rotate 15deg → 0deg
      - [x] Duration: 600ms
      - [x] Spring (stiffness 200, damping 15)
    - [x] Confetti 파티클 효과 (custom implementation with Reanimated)
  - [x] Success 메시지: "투표가 시작되었어요!"
  - [x] 상세 정보: "15명의 친구에게 알림을 보냈어요"
  - [x] 로딩 바 (자동 전환 표시)
    - [x] 80px × 4px, gradient-primary
    - [x] 0% → 100% in 3초
  - [x] 자동 전환: 3초 후 Home 화면으로 fade-out
  - [x] Haptic: notification-success
- [x] **테스트**: 애니메이션 및 자동 전환 확인
- [x] **커밋**: `feat(frontend): implement poll creation success screen`

#### 11.10.6 통합 및 상태 관리 (P1)
- [x] `frontend/src/stores/pollCreate.ts` - 투표 생성 상태 관리 (Zustand)
  - [x] 선택된 카테고리
  - [x] 선택된 질문 (template_id, emoji, text)
  - [x] 투표 설정 (duration, target, notification)
  - [x] Actions: setCategory, setQuestion, setSettings, reset
- [x] `frontend/src/hooks/useCreatePoll.ts` - 투표 생성 React Query hook
  - [x] Mutation: POST /circles/{id}/polls
  - [x] Error handling
  - [x] Success callback → Success 화면으로 이동
- [x] Configure, Preview, Success 화면에 state management 통합
- [ ] **테스트**: 전체 투표 생성 플로우 테스트
- [ ] **커밋**: `feat(frontend): add Create Tab state management and API integration`

#### 11.10.7 최적화 및 UX 개선 (P2)
- [x] 카드 프리로딩 (다음 2장 미리 렌더링)
  - [x] 현재 카드 + 뒷카드 2장 동시 렌더링
- [x] 스와이프 제스처 피드백 강화
  - [x] 스와이프 중 카드 회전 효과 (최대 ±20도)
  - [x] 스와이프 방향 힌트 (좌/우/위 색상 overlay)
    - [x] 좌측 스와이프: 빨간색 (다음)
    - [x] 우측 스와이프: 파란색 (이전)
    - [x] 위로 스와이프: 초록색 (선택)
- [x] 애니메이션 성능 최적화
  - [x] 'worklet' 지시어로 useNativeDriver 자동 활성화
  - [x] 불필요한 리렌더링 방지 (React.memo on QuestionCard)
- [x] 접근성 개선
  - [x] 모든 버튼에 accessibilityLabel, accessibilityRole, accessibilityHint 추가
  - [x] 스와이프 대신 버튼으로도 조작 가능 (5개 액션 버튼)
  - [x] 힌트 텍스트 접근성 개선
- [x] **커밋**: `perf(frontend): optimize Create Tab animations and UX`

### 11.11 Home Tab - 투표 피드 (P0)

> **참고 문서**: `prd/design/05-complete-ui-specification.md`, `prd/design/04-user-flow.md`, `docs/DSL.md#3.3 (Poll 모듈)`

#### 11.11.1 화면 레이아웃 및 탭 구조 (P0)
- [x] `app/(main)/(home)/index.tsx` - Home Tab 메인 화면 → `prd/design/05-complete-ui-specification.md#2.2`
  - [x] 헤더: HomeHeader 컴포넌트 (Circle 이름, 알림, 프로필)
  - [x] SectionHeader: "진행 중인 투표 (N)" 섹션 제목
  - [x] PollCard: 투표 카드 컴포넌트 (이모지, 질문, 시간, 참여율)
  - [x] PollEmptyState: 빈 상태 화면
  - [x] Pull-to-Refresh 구현 (RefreshControl)
- [x] **테스트**: Mock 데이터로 레이아웃 확인 완료
- [x] **커밋**: `feat(frontend): implement Home Tab layout with poll cards`

#### 11.11.2 투표 카드 컴포넌트 (P0)
- [ ] `src/components/patterns/PollCard.tsx` - 투표 카드 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.1.2`
  - [ ] Variant 타입: 'active' | 'completed'
  - [ ] Active 카드 레이아웃:
    - [ ] 이모지 + 질문 텍스트 (text-xl, bold)
    - [ ] Circle 이름 (text-sm, neutral-500)
    - [ ] 남은 시간 표시 (⏰ 3H 남음)
    - [ ] 참여 현황 (👥 5/15명 참여)
    - [ ] 투표 상태 배지 (투표 완료 ✅ / 투표하기 →)
  - [ ] Completed 카드 레이아웃:
    - [ ] 이모지 + 질문 텍스트
    - [ ] Circle 이름
    - [ ] "투표 종료" 배지 (gray)
    - [ ] 1위 결과 미리보기 (🏆 이름 + N표)
  - [ ] Press 애니메이션 (scale 0.98) → `prd/design/03-animations.md`
  - [ ] Haptic feedback (selection)
  - [ ] Shadow (shadow-md) → `prd/design/02-ui-design-system.md#Shadows`
- [ ] **테스트**: 카드 variants 렌더링 확인
- [ ] **커밋**: `feat(frontend): add PollCard component with active/completed variants`

#### 11.11.3 Empty State 컴포넌트 (P1)
- [ ] 진행 중 탭 Empty State → `src/components/states/EmptyState.tsx` 재사용
  - [ ] 이모지: 🎯
  - [ ] 메시지: "진행 중인 투표가 없어요"
  - [ ] 서브텍스트: "친구들이 투표를 시작하면 여기에 표시됩니다"
- [ ] 완료됨 탭 Empty State
  - [ ] 이모지: 📊
  - [ ] 메시지: "아직 완료된 투표가 없어요"
  - [ ] 서브텍스트: "투표가 끝나면 결과를 확인할 수 있습니다"
- [ ] **커밋**: `feat(frontend): add Home Tab empty states`

#### 11.11.4 남은 시간 계산 유틸리티 (P0)
- [ ] `src/utils/timeUtils.ts` - 시간 계산 함수
  - [ ] `formatTimeRemaining(endDate: string)` - "3H 남음", "30분 남음", "5분 남음"
    - [ ] 1시간 이상: "XH 남음"
    - [ ] 1시간 미만: "X분 남음"
    - [ ] 마감: "마감됨"
  - [ ] `getTimeRemainingColor(endDate: string)` - 긴급도에 따른 색상
    - [ ] <30분: red-500 (긴급)
    - [ ] <1H: orange-500 (주의)
    - [ ] >1H: neutral-500 (보통)
  - [ ] `isUrgent(endDate: string)` - 1시간 이내 여부 (boolean)
- [ ] **테스트**: 다양한 시간 케이스 단위 테스트
- [ ] **커밋**: `feat(frontend): add time formatting utilities`

#### 11.11.5 투표 목록 API 연동 (P0)
- [ ] `src/hooks/usePolls.ts` 확장 - 투표 목록 React Query hooks → `trd/08-frontend-implementation-spec.md#API 연동`
  - [ ] `useActivePolls()` - 진행 중인 투표 목록 조회
    - [ ] Query: GET /circles/me/polls?status=active → `docs/DSL.md#3.3 (PollRouter)`
    - [ ] staleTime: 1분 (자동 리페치)
    - [ ] 응답 타입: `PollResponse[]` → `docs/DSL.md#3.3 (Poll type)`
  - [ ] `useCompletedPolls()` - 완료된 투표 목록 조회
    - [ ] Query: GET /circles/me/polls?status=completed
    - [ ] staleTime: 5분
  - [ ] 에러 처리 및 로딩 상태 관리
  - [ ] Query key 관리: `['polls', 'active']`, `['polls', 'completed']`
- [ ] **테스트**: API 응답 확인 및 React Query 캐싱 동작 테스트
- [ ] **커밋**: `feat(frontend): add poll list API integration`

#### 11.11.6 리스트 렌더링 및 최적화 (P1)
- [ ] FlatList 사용 (React Native 기본) → `trd/08-frontend-implementation-spec.md#성능 최적화`
  - [ ] keyExtractor: poll.id
  - [ ] renderItem: PollCard 컴포넌트
  - [ ] ItemSeparatorComponent: 12px 간격
- [ ] React.memo로 PollCard 최적화 (불필요한 리렌더링 방지)
- [ ] Pull-to-Refresh 구현
  - [ ] RefreshControl 컴포넌트
  - [ ] onRefresh: queryClient.invalidateQueries(['polls'])
  - [ ] Haptic feedback (impact-light)
- [ ] 정렬 로직: 마감 임박 순 (ends_at ASC)
- [ ] **테스트**: 대량 데이터 렌더링 성능 테스트
- [ ] **커밋**: `perf(frontend): optimize Home Tab list rendering`

#### 11.11.7 투표 상세 화면 네비게이션 (P0)
- [ ] 진행 중 투표 카드 탭 → 투표 화면 이동
  - [ ] `router.push('/poll/[id]/vote')` → `prd/design/04-user-flow.md#투표 참여 플로우`
  - [ ] Poll ID 전달
- [ ] 완료된 투표 카드 탭 → 결과 화면 이동
  - [ ] `router.push('/poll/[id]/result')`
- [ ] 네비게이션 Haptic feedback (impact-medium)
- [ ] **테스트**: 카드 탭 동작 및 화면 전환 확인
- [ ] **커밋**: `feat(frontend): add poll card navigation`

#### 11.11.8 실시간 카운트다운 (P1)
- [ ] 남은 시간 실시간 업데이트 구현
  - [ ] useInterval 훅 또는 setInterval 사용
  - [ ] 1분마다 자동 업데이트
  - [ ] 긴급 상태 (<1H) 시 색상 변경 (red-500)
- [ ] 마감된 투표 자동 처리
  - [ ] 마감 시간 도달 시 queryClient.invalidateQueries(['polls'])
  - [ ] "완료됨" 탭으로 자동 이동 (선택적)
- [ ] **테스트**: 카운트다운 동작 및 색상 변경 확인
- [ ] **커밋**: `feat(frontend): add real-time countdown for polls`

#### 11.11.9 접근성 개선 (P2)
- [ ] PollCard에 accessibilityLabel 추가
  - [ ] Active: "투표: [질문], [남은 시간], [참여 현황], [내 상태]"
  - [ ] Completed: "완료된 투표: [질문], 1위: [이름]"
- [ ] 탭에 accessibilityRole="tab" 추가
- [ ] Empty State 스크린 리더 지원
  - [ ] accessibilityLabel, accessibilityRole="text"
- [ ] Pull-to-Refresh 접근성 힌트
- [ ] **테스트**: VoiceOver (iOS) / TalkBack (Android) 테스트
- [ ] **커밋**: `a11y(frontend): improve Home Tab accessibility`

#### 11.11.10 애니메이션 및 피드백 (P2)
- [ ] 탭 전환 애니메이션 (Slide) → `prd/design/03-animations.md`
  - [ ] useAnimatedStyle + translateX
  - [ ] Duration: 300ms, Easing: easeInOut
- [ ] 카드 등장 애니메이션 (Staggered Fade-in)
  - [ ] useStaggeredFadeIn 훅 사용
  - [ ] Delay: 50ms per item
- [ ] Pull-to-Refresh 커스텀 애니메이션 (선택적)
  - [ ] Loading spinner + bounce
- [ ] 투표 완료 시 축하 애니메이션 (선택적)
  - [ ] Confetti 효과 (투표 완료 후)
- [ ] **테스트**: 애니메이션 부드러움 및 성능 확인
- [ ] **커밋**: `feat(frontend): add Home Tab animations`

---

## 참고 문서 목록

> **Single Source of Truth**: `docs/DSL.md`가 스키마, 타입, API 정의의 기준 문서입니다.

| 문서 | 경로 | 주요 내용 |
|------|------|----------|
| **DSL 정의 (기준)** | `docs/DSL.md` | 전체 도메인 모델, 스키마, 워크플로우 |
| 시스템 아키텍처 | `trd/00-system-architecture-v2.md` | 전체 시스템 구조, 모듈 통신 |
| 인터페이스 명세 | `trd/00-interface-specifications.md` | TypeScript/Python 타입 정의 (DSL.md 기반) |
| API 명세 | `trd/05-api-specification.md` | REST API 엔드포인트 정의 (DSL.md 기반) |
| 인증 아키텍처 | `trd/06-authentication-architecture.md` | JWT, 세션 관리 |
| 개발환경 셋업 | `trd/07-development-deployment-setup.md` | uv, Docker, CI/CD |
