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
- [ ] `app/modules/auth/__init__.py`
- [ ] `app/modules/auth/models.py` - User 모델 → `docs/DSL.md#2 (users 테이블)`
- [ ] **마이그레이션**: `uv run alembic revision --autogenerate -m "create users table"`
- [ ] **테스트**: `uv run alembic upgrade head`
- [ ] **커밋**: `feat(auth): add User model and migration`

### 3.5 Circles 모델
- [ ] `app/modules/circles/__init__.py`
- [ ] `app/modules/circles/models.py` - Circle 모델 → `docs/DSL.md#2 (circles 테이블)`
- [ ] `app/modules/circles/models.py` - CircleMember 모델 → `docs/DSL.md#2 (circle_members 테이블)`
- [ ] **마이그레이션**: `uv run alembic revision --autogenerate -m "create circles tables"`
- [ ] **테스트**: `uv run alembic upgrade head`
- [ ] **커밋**: `feat(circles): add Circle and CircleMember models`

### 3.6 Polls 모델
- [ ] `app/modules/polls/__init__.py`
- [ ] `app/modules/polls/models.py` - PollTemplate 모델 → `docs/DSL.md#2 (poll_templates 테이블)`
- [ ] `app/modules/polls/models.py` - Poll 모델 → `docs/DSL.md#2 (polls 테이블)`
- [ ] `app/modules/polls/models.py` - Vote 모델 → `docs/DSL.md#2 (votes 테이블)`
- [ ] `app/modules/polls/models.py` - PollResult 모델 → `docs/DSL.md#2 (poll_results 테이블)`
- [ ] **마이그레이션**: `uv run alembic revision --autogenerate -m "create polls tables"`
- [ ] **테스트**: `uv run alembic upgrade head`
- [ ] **커밋**: `feat(polls): add Poll, PollTemplate, Vote models`

### 3.7 Notifications 모델
- [ ] `app/modules/notifications/__init__.py`
- [ ] `app/modules/notifications/models.py` - Notification 모델 → `docs/DSL.md#2 (notifications 테이블)`
- [ ] **마이그레이션**: `uv run alembic revision --autogenerate -m "create notifications tables"`
- [ ] **테스트**: `uv run alembic upgrade head`
- [ ] **커밋**: `feat(notifications): add Notification models`

### 3.8 Reports 모델
- [ ] `app/modules/reports/__init__.py`
- [ ] `app/modules/reports/models.py` - Report 모델 → `docs/DSL.md#2 (reports)`
- [ ] **마이그레이션**: `uv run alembic revision --autogenerate -m "create reports table"`
- [ ] **테스트**: `uv run alembic upgrade head`
- [ ] **커밋**: `feat(reports): add Report model`

---

## Phase 4: Auth 모듈 (TDD)

> **참고 문서**: `trd/06-authentication-architecture.md`, `trd/00-interface-specifications.md`, `docs/DSL.md#3.1`, `trd/05-api-specification.md`

### 4.1 Auth Schemas
- [ ] `app/modules/auth/schemas.py` - UserCreate schema → `docs/DSL.md#3.1 (UserCreate)`
- [ ] `app/modules/auth/schemas.py` - UserResponse schema → `docs/DSL.md#3.1 (User)`
- [ ] `app/modules/auth/schemas.py` - UserUpdate schema → `docs/DSL.md#3.1 (UserUpdate)`
- [ ] `app/modules/auth/schemas.py` - TokenResponse schema → `docs/DSL.md#3.1 (TokenResponse)`
- [ ] `app/modules/auth/schemas.py` - LoginRequest schema → `trd/00-interface-specifications.md`
- [ ] **커밋**: `feat(auth): add Pydantic schemas`

### 4.2 Auth Repository (TDD)
- [ ] `tests/modules/auth/test_repository.py` - create user 테스트 작성
- [ ] `app/modules/auth/repository.py` - UserRepository.create 구현 → `docs/DSL.md#3.1 (UserRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [ ] `tests/modules/auth/test_repository.py` - find by email 테스트 작성
- [ ] `app/modules/auth/repository.py` - UserRepository.find_by_email 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [ ] `tests/modules/auth/test_repository.py` - find by id 테스트 작성
- [ ] `app/modules/auth/repository.py` - UserRepository.find_by_id 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`

- [ ] `tests/modules/auth/test_repository.py` - update user 테스트 작성
- [ ] `app/modules/auth/repository.py` - UserRepository.update 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_repository.py -v`
- [ ] **커밋**: `feat(auth): implement UserRepository with tests`

### 4.3 Auth Service (TDD)
- [ ] `tests/modules/auth/test_service.py` - register 테스트 작성
- [ ] `app/modules/auth/service.py` - AuthService.register 구현 → `docs/DSL.md#3.1 (AuthService)`
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [ ] `tests/modules/auth/test_service.py` - login 테스트 작성
- [ ] `app/modules/auth/service.py` - AuthService.login 구현 → `trd/06-authentication-architecture.md`
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [ ] `tests/modules/auth/test_service.py` - get_current_user 테스트 작성
- [ ] `app/modules/auth/service.py` - AuthService.get_current_user 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`

- [ ] `tests/modules/auth/test_service.py` - update_profile 테스트 작성
- [ ] `app/modules/auth/service.py` - AuthService.update_profile 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_service.py -v`
- [ ] **커밋**: `feat(auth): implement AuthService with tests`

### 4.4 Auth Router (TDD)
- [ ] `tests/modules/auth/test_router.py` - POST /register 테스트 작성
- [ ] `app/modules/auth/router.py` - register endpoint 구현 → `docs/DSL.md#3.1 (AuthRouter)`, `trd/05-api-specification.md`
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [ ] `tests/modules/auth/test_router.py` - POST /login 테스트 작성
- [ ] `app/modules/auth/router.py` - login endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [ ] `tests/modules/auth/test_router.py` - GET /me 테스트 작성
- [ ] `app/modules/auth/router.py` - get_me endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [ ] `tests/modules/auth/test_router.py` - PUT /me 테스트 작성
- [ ] `app/modules/auth/router.py` - update_me endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/auth/test_router.py -v`

- [ ] `app/main.py` - auth router 등록
- [ ] **테스트**: 전체 Auth 모듈 테스트 `uv run pytest tests/modules/auth/ -v`
- [ ] **커밋**: `feat(auth): implement Auth API endpoints with tests`

---

## Phase 5: Circle 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.2`, `trd/00-interface-specifications.md`, `trd/05-api-specification.md`

### 5.1 Circle Schemas
- [ ] `app/modules/circles/schemas.py` - CircleCreate schema → `docs/DSL.md#3.2 (CircleCreate)`
- [ ] `app/modules/circles/schemas.py` - CircleResponse schema → `docs/DSL.md#3.2 (Circle)`
- [ ] `app/modules/circles/schemas.py` - CircleUpdate schema → `docs/DSL.md#3.2 (CircleUpdate)`
- [ ] `app/modules/circles/schemas.py` - CircleDetail schema → `docs/DSL.md#3.2 (CircleDetail)`
- [ ] `app/modules/circles/schemas.py` - MemberInfo schema → `docs/DSL.md#3.2 (MemberInfo)`
- [ ] `app/modules/circles/schemas.py` - JoinByCodeRequest schema
- [ ] **커밋**: `feat(circles): add Pydantic schemas`

### 5.2 Circle Repository (TDD)
- [ ] `tests/modules/circles/test_repository.py` - create circle 테스트 작성
- [ ] `app/modules/circles/repository.py` - CircleRepository.create 구현 → `docs/DSL.md#3.2 (CircleRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`

- [ ] `tests/modules/circles/test_repository.py` - find by invite_code 테스트 작성
- [ ] `app/modules/circles/repository.py` - CircleRepository.find_by_invite_code 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`

- [ ] `tests/modules/circles/test_repository.py` - find by user_id 테스트 작성
- [ ] `app/modules/circles/repository.py` - CircleRepository.find_by_user_id 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_repository.py -v`
- [ ] **커밋**: `feat(circles): implement CircleRepository with tests`

### 5.3 Membership Repository (TDD)
- [ ] `tests/modules/circles/test_membership_repository.py` - create membership 테스트 작성
- [ ] `app/modules/circles/repository.py` - MembershipRepository.create 구현 → `docs/DSL.md#3.2 (MembershipRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`

- [ ] `tests/modules/circles/test_membership_repository.py` - find members 테스트 작성
- [ ] `app/modules/circles/repository.py` - MembershipRepository.find_by_circle_id 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`

- [ ] `tests/modules/circles/test_membership_repository.py` - check membership 테스트 작성
- [ ] `app/modules/circles/repository.py` - MembershipRepository.exists 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_membership_repository.py -v`
- [ ] **커밋**: `feat(circles): implement MembershipRepository with tests`

### 5.4 Circle Service (TDD)
- [ ] `tests/modules/circles/test_service.py` - create_circle 테스트 작성
- [ ] `app/modules/circles/service.py` - CircleService.create_circle 구현 → `docs/DSL.md#3.2 (CircleService)`
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [ ] `tests/modules/circles/test_service.py` - join_by_code 테스트 작성 → `docs/DSL.md#5 (JoinCircleFlow)`
- [ ] `app/modules/circles/service.py` - CircleService.join_by_code 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [ ] `tests/modules/circles/test_service.py` - get_user_circles 테스트 작성
- [ ] `app/modules/circles/service.py` - CircleService.get_user_circles 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [ ] `tests/modules/circles/test_service.py` - get_circle_detail 테스트 작성
- [ ] `app/modules/circles/service.py` - CircleService.get_circle_detail 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [ ] `tests/modules/circles/test_service.py` - leave_circle 테스트 작성
- [ ] `app/modules/circles/service.py` - CircleService.leave_circle 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`

- [ ] `tests/modules/circles/test_service.py` - regenerate_invite_code 테스트 작성
- [ ] `app/modules/circles/service.py` - CircleService.regenerate_invite_code 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_service.py -v`
- [ ] **커밋**: `feat(circles): implement CircleService with tests`

### 5.5 Circle Router (TDD)
- [ ] `tests/modules/circles/test_router.py` - POST /circles 테스트 작성
- [ ] `app/modules/circles/router.py` - create_circle endpoint 구현 → `docs/DSL.md#3.2 (CircleRouter)`, `trd/05-api-specification.md`
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `tests/modules/circles/test_router.py` - GET /circles 테스트 작성
- [ ] `app/modules/circles/router.py` - get_circles endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `tests/modules/circles/test_router.py` - GET /circles/{id} 테스트 작성
- [ ] `app/modules/circles/router.py` - get_circle endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `tests/modules/circles/test_router.py` - POST /circles/join/code 테스트 작성
- [ ] `app/modules/circles/router.py` - join_by_code endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `tests/modules/circles/test_router.py` - POST /circles/{id}/leave 테스트 작성
- [ ] `app/modules/circles/router.py` - leave_circle endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `tests/modules/circles/test_router.py` - GET /circles/{id}/members 테스트 작성
- [ ] `app/modules/circles/router.py` - get_members endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/circles/test_router.py -v`

- [ ] `app/main.py` - circles router 등록
- [ ] **테스트**: 전체 Circle 모듈 테스트 `uv run pytest tests/modules/circles/ -v`
- [ ] **커밋**: `feat(circles): implement Circle API endpoints with tests`

---

## Phase 6: Poll 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.3`, `trd/00-interface-specifications.md`, `trd/05-api-specification.md`, `docs/DSL.md#10 (투표 익명성)`

### 6.1 Poll Schemas
- [ ] `app/modules/polls/schemas.py` - PollTemplateResponse schema → `docs/DSL.md#3.3 (PollTemplate)`
- [ ] `app/modules/polls/schemas.py` - PollCreate schema → `docs/DSL.md#3.3 (PollCreate)`
- [ ] `app/modules/polls/schemas.py` - PollResponse schema → `docs/DSL.md#3.3 (Poll)`
- [ ] `app/modules/polls/schemas.py` - PollDetail schema → `docs/DSL.md#3.3 (PollDetail)`
- [ ] `app/modules/polls/schemas.py` - VoteRequest schema → `docs/DSL.md#3.3 (VoteCreate)`
- [ ] `app/modules/polls/schemas.py` - VoteResponse schema → `docs/DSL.md#3.3 (VoteResponse)`
- [ ] `app/modules/polls/schemas.py` - PollResultItem schema → `docs/DSL.md#3.3 (PollResultItem)`
- [ ] **커밋**: `feat(polls): add Pydantic schemas`

### 6.2 Template Repository (TDD)
- [ ] `tests/modules/polls/test_template_repository.py` - find_all 테스트 작성
- [ ] `app/modules/polls/repository.py` - TemplateRepository.find_all 구현 → `docs/DSL.md#3.3 (TemplateRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_template_repository.py -v`

- [ ] `tests/modules/polls/test_template_repository.py` - find_by_category 테스트 작성
- [ ] `app/modules/polls/repository.py` - TemplateRepository.find_by_category 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_template_repository.py -v`
- [ ] **커밋**: `feat(polls): implement TemplateRepository with tests`

### 6.3 Poll Repository (TDD)
- [ ] `tests/modules/polls/test_poll_repository.py` - create poll 테스트 작성
- [ ] `app/modules/polls/repository.py` - PollRepository.create 구현 → `docs/DSL.md#3.3 (PollRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`

- [ ] `tests/modules/polls/test_poll_repository.py` - find by circle_id 테스트 작성
- [ ] `app/modules/polls/repository.py` - PollRepository.find_by_circle_id 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`

- [ ] `tests/modules/polls/test_poll_repository.py` - update status 테스트 작성
- [ ] `app/modules/polls/repository.py` - PollRepository.update_status 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_poll_repository.py -v`
- [ ] **커밋**: `feat(polls): implement PollRepository with tests`

### 6.4 Vote Repository (TDD)
- [ ] `tests/modules/polls/test_vote_repository.py` - create vote 테스트 작성
- [ ] `app/modules/polls/repository.py` - VoteRepository.create 구현 → `docs/DSL.md#3.3 (VoteRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`

- [ ] `tests/modules/polls/test_vote_repository.py` - check duplicate 테스트 작성 → `docs/DSL.md#10 (vote_anonymity)`
- [ ] `app/modules/polls/repository.py` - VoteRepository.exists_by_voter_hash 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`

- [ ] `tests/modules/polls/test_vote_repository.py` - get results 테스트 작성
- [ ] `app/modules/polls/repository.py` - VoteRepository.get_results 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_vote_repository.py -v`
- [ ] **커밋**: `feat(polls): implement VoteRepository with tests`

### 6.5 Poll Service (TDD)
- [ ] `tests/modules/polls/test_service.py` - get_templates 테스트 작성
- [ ] `app/modules/polls/service.py` - PollService.get_templates 구현 → `docs/DSL.md#3.3 (PollService)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - create_poll 테스트 작성 → `docs/DSL.md#5 (CreatePollFlow)`
- [ ] `app/modules/polls/service.py` - PollService.create_poll 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - vote (익명 해시 포함) 테스트 작성 → `docs/DSL.md#5 (VoteFlow)`, `docs/DSL.md#10`
- [ ] `app/modules/polls/service.py` - PollService.vote 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - 중복 투표 방지 테스트 작성 → `docs/DSL.md#5 (VoteFlow - 중복 투표 확인)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - 자기 자신 투표 방지 테스트 작성 → `docs/DSL.md#5 (VoteFlow - 자기 자신 투표 방지)`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - get_results 테스트 작성
- [ ] `app/modules/polls/service.py` - PollService.get_results 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`

- [ ] `tests/modules/polls/test_service.py` - close_poll 테스트 작성 → `docs/DSL.md#5 (PollEndFlow)`
- [ ] `app/modules/polls/service.py` - PollService.close_poll 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_service.py -v`
- [ ] **커밋**: `feat(polls): implement PollService with tests`

### 6.6 Poll Router (TDD)
- [ ] `tests/modules/polls/test_router.py` - GET /polls/templates 테스트 작성
- [ ] `app/modules/polls/router.py` - get_templates endpoint 구현 → `docs/DSL.md#3.3 (PollRouter)`, `trd/05-api-specification.md`
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `tests/modules/polls/test_router.py` - POST /circles/{id}/polls 테스트 작성
- [ ] `app/modules/polls/router.py` - create_poll endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `tests/modules/polls/test_router.py` - GET /circles/{id}/polls 테스트 작성
- [ ] `app/modules/polls/router.py` - get_circle_polls endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `tests/modules/polls/test_router.py` - GET /polls/{id} 테스트 작성
- [ ] `app/modules/polls/router.py` - get_poll endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `tests/modules/polls/test_router.py` - POST /polls/{id}/vote 테스트 작성
- [ ] `app/modules/polls/router.py` - vote endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `tests/modules/polls/test_router.py` - GET /polls/{id}/results 테스트 작성
- [ ] `app/modules/polls/router.py` - get_results endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/polls/test_router.py -v`

- [ ] `app/main.py` - polls router 등록
- [ ] **테스트**: 전체 Poll 모듈 테스트 `uv run pytest tests/modules/polls/ -v`
- [ ] **커밋**: `feat(polls): implement Poll API endpoints with tests`

---

## Phase 7: Notification 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.4`, `trd/05-api-specification.md`

### 7.1 Notification Schemas
- [ ] `app/modules/notifications/schemas.py` - NotificationResponse schema → `docs/DSL.md#3.4 (Notification)`
- [ ] `app/modules/notifications/schemas.py` - NotificationSettingsResponse schema
- [ ] `app/modules/notifications/schemas.py` - NotificationSettingsUpdate schema
- [ ] **커밋**: `feat(notifications): add Pydantic schemas`

### 7.2 Notification Repository (TDD)
- [ ] `tests/modules/notifications/test_repository.py` - create notification 테스트 작성
- [ ] `app/modules/notifications/repository.py` - NotificationRepository.create 구현 → `docs/DSL.md#3.4 (NotificationRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`

- [ ] `tests/modules/notifications/test_repository.py` - find by user_id 테스트 작성
- [ ] `app/modules/notifications/repository.py` - NotificationRepository.find_by_user_id 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`

- [ ] `tests/modules/notifications/test_repository.py` - mark as read 테스트 작성
- [ ] `app/modules/notifications/repository.py` - NotificationRepository.mark_as_read 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_repository.py -v`
- [ ] **커밋**: `feat(notifications): implement NotificationRepository with tests`

### 7.3 Notification Service (TDD)
- [ ] `tests/modules/notifications/test_service.py` - send_poll_started 테스트 작성
- [ ] `app/modules/notifications/service.py` - NotificationService.send_poll_started 구현 → `docs/DSL.md#3.4 (NotificationService)`
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`

- [ ] `tests/modules/notifications/test_service.py` - send_vote_received 테스트 작성
- [ ] `app/modules/notifications/service.py` - NotificationService.send_vote_received 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`

- [ ] `tests/modules/notifications/test_service.py` - get_notifications 테스트 작성
- [ ] `app/modules/notifications/service.py` - NotificationService.get_notifications 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_service.py -v`
- [ ] **커밋**: `feat(notifications): implement NotificationService with tests`

### 7.4 Notification Router (TDD)
- [ ] `tests/modules/notifications/test_router.py` - GET /notifications 테스트 작성
- [ ] `app/modules/notifications/router.py` - get_notifications endpoint 구현 → `docs/DSL.md#3.4 (NotificationRouter)`, `trd/05-api-specification.md`
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [ ] `tests/modules/notifications/test_router.py` - PUT /notifications/{id}/read 테스트 작성
- [ ] `app/modules/notifications/router.py` - mark_as_read endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [ ] `tests/modules/notifications/test_router.py` - GET /notifications/unread-count 테스트 작성
- [ ] `app/modules/notifications/router.py` - get_unread_count endpoint 구현
- [ ] **테스트**: `uv run pytest tests/modules/notifications/test_router.py -v`

- [ ] `app/main.py` - notifications router 등록
- [ ] **테스트**: 전체 Notification 모듈 테스트 `uv run pytest tests/modules/notifications/ -v`
- [ ] **커밋**: `feat(notifications): implement Notification API endpoints with tests`

---

## Phase 8: Report 모듈 (TDD)

> **참고 문서**: `docs/DSL.md#3.5`, `trd/05-api-specification.md`

### 8.1 Report Schemas
- [ ] `app/modules/reports/schemas.py` - ReportCreate schema → `docs/DSL.md#3.5 (ReportCreate)`
- [ ] `app/modules/reports/schemas.py` - ReportResponse schema → `docs/DSL.md#3.5 (Report)`
- [ ] **커밋**: `feat(reports): add Pydantic schemas`

### 8.2 Report Repository (TDD)
- [ ] `tests/modules/reports/test_repository.py` - create report 테스트 작성
- [ ] `app/modules/reports/repository.py` - ReportRepository.create 구현 → `docs/DSL.md#3.5 (ReportRepository)`
- [ ] **테스트**: `uv run pytest tests/modules/reports/test_repository.py -v`

- [ ] `tests/modules/reports/test_repository.py` - find by status 테스트 작성
- [ ] `app/modules/reports/repository.py` - ReportRepository.find_by_status 구현
- [ ] **테스트**: `uv run pytest tests/modules/reports/test_repository.py -v`
- [ ] **커밋**: `feat(reports): implement ReportRepository with tests`

### 8.3 Report Service (TDD)
- [ ] `tests/modules/reports/test_service.py` - create_report 테스트 작성
- [ ] `app/modules/reports/service.py` - ReportService.create_report 구현 → `docs/DSL.md#3.5 (ReportService)`
- [ ] **테스트**: `uv run pytest tests/modules/reports/test_service.py -v`
- [ ] **커밋**: `feat(reports): implement ReportService with tests`

### 8.4 Report Router (TDD)
- [ ] `tests/modules/reports/test_router.py` - POST /reports 테스트 작성
- [ ] `app/modules/reports/router.py` - create_report endpoint 구현 → `docs/DSL.md#3.5 (ReportRouter)`, `trd/05-api-specification.md`
- [ ] **테스트**: `uv run pytest tests/modules/reports/test_router.py -v`

- [ ] `app/main.py` - reports router 등록
- [ ] **테스트**: 전체 Report 모듈 테스트 `uv run pytest tests/modules/reports/ -v`
- [ ] **커밋**: `feat(reports): implement Report API endpoints with tests`

---

## Phase 9: 통합 테스트 및 마무리

> **참고 문서**: `trd/00-system-architecture-v2.md`, `docs/DSL.md#5 (워크플로우)`, `docs/DSL.md#8 (테스트 전략)`

### 9.1 통합 테스트
- [ ] `tests/integration/test_circle_flow.py` - Circle 생성 -> 가입 플로우 테스트 → `docs/DSL.md#5 (JoinCircleFlow)`
- [ ] `tests/integration/test_poll_flow.py` - 투표 생성 -> 참여 -> 결과 플로우 테스트 → `docs/DSL.md#5 (CreatePollFlow, VoteFlow, PollEndFlow)`
- [ ] **테스트**: `uv run pytest tests/integration/ -v`
- [ ] **커밋**: `test: add integration tests for main workflows`

### 9.2 API 문서화
- [ ] OpenAPI 스키마 검토 → `trd/05-api-specification.md`
- [ ] API 엔드포인트 설명 추가
- [ ] `/docs` 및 `/redoc` 확인
- [ ] **커밋**: `docs: improve API documentation`

### 9.3 성능 및 보안 검토
- [ ] Rate limiting 미들웨어 추가 → `docs/DSL.md#10 (rate_limiting)`
- [ ] CORS 설정 검토 → `trd/07-development-deployment-setup.md#4.1`
- [ ] 민감 데이터 로깅 제외
- [ ] **테스트**: 전체 테스트 스위트 실행 `uv run pytest -v --cov=app`
- [ ] **커밋**: `feat: add rate limiting and security middleware`

### 9.4 초기 데이터 시딩
- [ ] `scripts/seed_templates.py` - 투표 템플릿 초기 데이터 → `docs/DSL.md#2 (poll_templates)`
- [ ] **테스트**: 시드 스크립트 실행 확인
- [ ] **커밋**: `chore: add seed script for poll templates`

---

## 최종 점검

- [ ] 전체 테스트 통과: `uv run pytest -v --cov=app --cov-report=html`
- [ ] 린트 통과: `uv run ruff check app/`
- [ ] 타입 체크 통과: `uv run mypy app/`
- [ ] 서버 정상 실행: `uv run uvicorn app.main:app --reload`
- [ ] **최종 커밋**: `chore: complete backend MVP implementation`

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
