# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Circly is an anonymous voting mobile app targeting Korean middle/high school students. The app allows users to create "circles" where friends can anonymously vote on questions about each other, creating real-time FOMO through push notifications and shareable result cards.

## Tech Stack & Architecture

**Frontend**: React Native (Expo)
**Backend**: FastAPI (Python)
**Database**: Supabase (PostgreSQL)
**Authentication**: Supabase Auth
**Push Notifications**: Expo Push Notification Service
**Payments**: RevenueCat SDK
**Analytics**: Firebase Analytics / Supabase Analytics

## Planned Project Structure

```
/
├── src/                     # React Native frontend
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens (HomeScreen, CreatePollScreen, etc.)
│   ├── services/           # API client and data access logic
│   ├── utils/              # Utility functions and constants
│   ├── context/            # State management (Context API or Zustand)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # App entry point
│   └── index.tsx           # Expo entry point
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app instance
│   │   ├── models/         # Pydantic models (poll.py, user.py, etc.)
│   │   ├── routers/        # API endpoints by domain
│   │   ├── database.py     # Database connection and config
│   │   ├── utils/          # Backend utilities
│   │   └── config.py       # Configuration management
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Container configuration
├── prd/                    # Product Requirements Document
├── trd/                    # Technical Requirements Document
├── .env                    # Environment variables
├── package.json            # React Native dependencies
└── tsconfig.json           # TypeScript configuration
```

## Development Commands

### 🐳 Docker Development (Recommended)

```bash
# Start entire development environment
docker-compose up --build

# Start specific services
docker-compose up backend worker db redis  # Backend with worker
docker-compose up frontend                 # Frontend only

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in containers
docker-compose exec backend bash                         # Access backend container
docker-compose exec worker bash                          # Access worker container
docker-compose exec db psql -U circly_user -d circly_db  # Access database
docker-compose exec backend alembic upgrade head         # Run migrations
docker-compose exec backend pytest                       # Run backend tests
docker-compose exec frontend npm test                    # Run frontend tests

# Stop all services
docker-compose down

# Remove volumes (reset data)
docker-compose down -v
```

### 💻 Local Development (Alternative)

```bash
# Frontend (React Native/Expo)
cd circly-app
npm install                 # Install frontend dependencies
npm start                   # Start Expo development server
npm run build              # Build for production
npm run test               # Run tests
npm run lint               # Lint code
npm run type-check         # TypeScript type checking

# Backend (FastAPI) - Using uv
cd backend
uv venv                     # Create virtual environment
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt     # Install backend dependencies
uv run uvicorn app.main:app --reload   # Start development server
uv run pytest                          # Run backend tests

# Alternative: Direct execution with uv
uv run uvicorn app.main:app --reload   # No venv activation needed
uv run pytest                          # Direct test execution
```

## Core Features (MVP Priority)

**P0 Features**:
- Anonymous voting creation/participation (max 4 options)
- Circle invite links/codes (24-hour expiry, 10/25/50 member limits)
- Push notifications (vote start, deadline reminder, results)
- Shareable result summary cards (Instagram story/reel format)

**P1 Features**:
- Real-time result animations
- Points/level system
- Question templates

## Key Technical Considerations

**Domain Organization**: Separate domains for user management, voting, circles, and payments
**State Management**: Context API or Zustand for simple state management
**Database**: PostgreSQL with proper indexing for vote tallying performance
**Real-time Updates**: Consider Supabase Realtime or WebSocket for live vote results
**Security**: Anonymous voting while preventing abuse, proper data encryption
**Performance**: Image optimization for result cards, API response caching

## Target Metrics

- Invite link → app install conversion: 30%+
- Average vote participation per circle: 70%+
- 7-day retention rate: 35%+
- Average invites sent per user: 5+

## Development Phases

**Phase 1 (8 weeks)**: MVP implementation with core infrastructure
**Phase 2 (6 weeks)**: Feature enhancement and performance optimization

## Korean Language Support

The app targets Korean students, so ensure proper Korean language support in:
- UI text and labels
- Push notification messages
- Question templates and suggestions
- Error messages and validation text

## 🧪 Testing Requirements

**ALL feature development must include comprehensive test code.**

### Required Test Coverage
- **Backend**: 90% minimum coverage required
- **Frontend**: 80% minimum coverage required
- **E2E Tests**: Core user flows must be covered

### Test Guidelines
**Always refer to `TESTING_GUIDE.md` when writing test code.**

This document provides comprehensive testing strategies for:
- Unit testing (services, components, utilities)
- Integration testing (API endpoints, database interactions)
- E2E testing (complete user flows)
- Security testing (authentication, data privacy)
- Performance testing (response times, concurrent users)

### Test-Driven Development (TDD)
Prefer TDD approach where possible:
1. Write failing tests first
2. Implement minimum code to pass tests
3. Refactor while keeping tests green

### Testing Commands (will be available after setup)
```bash
# Backend Testing (using uv)
cd backend
uv run pytest --cov=app --cov-report=html  # Run tests with coverage
uv run pytest tests/unit/                  # Unit tests only
uv run pytest tests/integration/           # Integration tests only

# Code quality checks
uv run black .                      # Format code
uv run ruff check .                 # Lint code
uv run mypy .                       # Type checking

# Frontend Testing  
cd circly-app
npm test                            # Run all tests
npm run test:coverage               # Run with coverage report
npm run test:e2e                    # Run E2E tests
```