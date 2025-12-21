# Circly - 익명 칭찬 투표 플랫폼

> 중·고등학생을 위한 익명 칭찬 투표 앱

친구들끼리 Circle(그룹)을 만들어 익명으로 칭찬 투표를 하고, 결과를 SNS에 공유할 수 있는 모바일 앱입니다.

## 📱 Tech Stack

### Frontend
- **React Native** (Expo SDK 51+)
- **Expo Router** - File-based routing
- **React Native Reanimated** - 60fps animations
- **TypeScript** - Type safety

### Backend
- **FastAPI** (Python 3.13)
- **PostgreSQL** (via Supabase)
- **Redis** - Caching
- **Celery** - Background jobs
- **uv** - Python package management

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.13+
- **uv** (Python package manager)
- **Docker** & Docker Compose
- **iOS Simulator** (for iOS development) or **Android Studio** (for Android)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies with uv
uv sync

# 3. Start PostgreSQL and Redis with Docker
docker-compose up -d db redis

# 4. Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Run database migrations
uv run alembic upgrade head

# 6. Seed initial data (poll templates)
uv run python scripts/seed_templates.py

# 7. Start development server
uv run uvicorn app.main:app --reload
```

Backend will be running at `http://localhost:8000`

**API Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```

**Run on devices:**
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## 🌓 Dark Mode Testing

Circly supports both light and dark modes with automatic system preference detection.

### Test Dark Mode

1. **Start the app:**
   ```bash
   cd frontend
   npx expo start
   ```

2. **Navigate to Dark Mode Test Screen:**
   - Open the app in simulator/emulator
   - Go to `Dark Mode Test` screen in the dev menu

3. **Test Features:**
   - ✅ Toggle between light/dark modes using ThemeToggle components
   - ✅ Verify all UI components adapt to current theme
   - ✅ Test "Follow System" option
   - ✅ Close app and reopen to verify theme persistence

### Dark Mode Demo Screens

**Responsive Test Screen** (`/app/(dev)/responsive-test.tsx`)
- Test all components on different screen sizes
- Device info display
- Safe area verification

**Dark Mode Test Screen** (`/app/(dev)/dark-mode-test.tsx`)
- Theme toggle controls (3 variants)
- Component showcase in light/dark modes
- Theme persistence testing

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run specific module tests
uv run pytest tests/modules/auth/ -v

# Run with coverage
uv run pytest --cov=app --cov-report=html
```

Current coverage: **87%** (140 tests passing)

### Frontend Tests

```bash
cd frontend

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📂 Project Structure

```
circlyapp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Core utilities (database, security, exceptions)
│   │   ├── modules/        # Feature modules (auth, circles, polls, etc.)
│   │   └── main.py         # FastAPI application entry
│   ├── tests/              # Pytest tests
│   ├── migrations/         # Alembic migrations
│   └── scripts/            # Utility scripts
│
├── frontend/               # React Native frontend
│   ├── app/                # Expo Router screens
│   │   ├── (auth)/        # Authentication screens
│   │   ├── (main)/        # Main app screens
│   │   └── (dev)/         # Development/test screens
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── primitives/   # Basic components (Button, Card, Input, Text)
│   │   │   ├── patterns/     # Composed components (VoteCard, ResultBar)
│   │   │   └── states/       # Loading/empty states
│   │   ├── theme/         # Design tokens, animations, theme context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── docs/              # Frontend documentation
│
├── docs/                   # Technical documentation
│   └── DSL.md             # Domain-Specific Language (Single Source of Truth)
│
├── prd/                    # Product requirements
│   ├── features/          # Feature specifications
│   ├── design/            # UI/UX design docs
│   └── business/          # Business model
│
└── trd/                    # Technical reference docs
    ├── 00-system-architecture-v2.md
    ├── 00-interface-specifications.md
    ├── 05-api-specification.md
    ├── 06-authentication-architecture.md
    └── 07-development-deployment-setup.md
```

## 🎨 Design System

### Theme Tokens

All design tokens are defined in `frontend/src/theme/tokens.ts`:

- **Colors**: Primary, secondary, semantic, neutral palettes
- **Typography**: Font sizes, weights, line heights
- **Spacing**: 8pt grid system
- **Shadows**: Elevation levels
- **Border Radius**: Rounded corners
- **Dark Mode**: Automatic light/dark theme support

### Using Themes in Components

```tsx
import { useTheme, useThemedStyles } from '@/theme';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={{ color: theme.text }}>Hello</Text>
    </View>
  );
}

const createStyles = (theme, isDark) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    padding: 16,
  },
});
```

## 🔧 Development Commands

### Backend

```bash
# Development server
uv run uvicorn app.main:app --reload

# Database migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1

# Testing
uv run pytest
uv run pytest tests/modules/auth/ -v
uv run pytest --cov=app

# Code quality
uv run ruff check .
uv run ruff format .
uv run mypy .
```

### Frontend

```bash
# Development
npx expo start
npx expo start --ios
npx expo start --android

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📖 Documentation

### Key Documents

- **`docs/DSL.md`** - Complete system DSL (Single Source of Truth)
- **`CLAUDE.md`** - Claude Code development guidelines
- **`todo.md`** - Development task tracker

### Feature Documentation

- `prd/features/01-voting-spec.md` - Voting system
- `prd/features/02-circle-invite.md` - Circle invitation
- `prd/features/03-push-notification.md` - Push notifications
- `prd/features/04-result-card.md` - Result card generation

### Design Documentation

- `prd/design/02-ui-design-system.md` - UI design system
- `prd/design/03-animations.md` - Animation guidelines
- `prd/design/05-complete-ui-specification.md` - Complete UI specs
- `frontend/src/components/README.md` - Component library docs
- `frontend/docs/RESPONSIVE_TESTING.md` - Responsive design guide

### Technical Documentation

- `trd/00-system-architecture-v2.md` - System architecture
- `trd/05-api-specification.md` - API specifications
- `trd/06-authentication-architecture.md` - Auth system
- `trd/07-development-deployment-setup.md` - Dev environment setup

## 🎯 Core Features

### ✅ Implemented (MVP)

- **Authentication System**
  - JWT-based authentication
  - Email/password registration and login
  - Session management

- **Circle Management**
  - Create circles (friend groups)
  - Join by 6-digit invite code
  - Member management (10-50 members)
  - Leave circle functionality

- **Voting System**
  - Template-based compliment polls
  - Anonymous voting with SHA-256 voter hashing
  - Self-vote prevention
  - Duplicate vote prevention
  - Time-limited polls (1H/3H/6H/24H)
  - Result calculation and display

- **Notifications**
  - Poll start notifications
  - Vote received notifications
  - Unread count tracking

- **Reporting System**
  - Report inappropriate content
  - Admin moderation support

- **UI Components**
  - Design system with tokens
  - Primitive components (Button, Card, Input, Text)
  - Pattern components (VoteCard, ResultBar, ProgressBar)
  - State components (EmptyState, LoadingSpinner, Skeleton)
  - **Dark mode support** with theme persistence

### 🚧 In Progress

- Complete dark mode for all components
- Result card image generation
- SNS sharing functionality

### 📋 Planned

- Push notifications (Expo Push Service)
- Background job processing (Celery)
- Analytics tracking
- Performance optimization

## 🤝 Contributing

This is a private project. Development follows TDD principles and modular monolith architecture.

### Development Workflow

1. **Backend**: TDD - Write tests first, then implementation
2. **Frontend**: Component-driven development with design system
3. **Commit**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
4. **Documentation**: Update relevant docs when changing features

## 📝 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Design inspired by Gas app
- Built with Expo, FastAPI, and Supabase
- Development assisted by Claude Code

---

**Last Updated**: 2025-12-21
**Version**: MVP v0.1.0
**Status**: In Development 🚧
