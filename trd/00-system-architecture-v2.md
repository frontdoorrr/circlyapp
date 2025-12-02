# Circly System Architecture v2.0

> Modern Modular Monolith Architecture for 1K-50K Users Scale

## Executive Summary

This document defines the complete system architecture for Circly, an anonymous compliment voting platform for middle/high school students. The architecture follows a **Modular Monolith** pattern optimized for medium-scale deployment (1K-50K users) with clear module boundaries for future service extraction.

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   iOS App    │  │ Android App  │  │  Web Landing │  │ Admin Panel  │    │
│  │  (Expo RN)   │  │  (Expo RN)   │  │   (Next.js)  │  │  (Next.js)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │                  │
          └──────────────────┼──────────────────┼──────────────────┘
                             │                  │
┌────────────────────────────┼──────────────────┼─────────────────────────────┐
│                    EDGE & DELIVERY LAYER                                     │
├────────────────────────────┼──────────────────┼─────────────────────────────┤
│  ┌─────────────────────────┴──────────────────┴─────────────────────────┐   │
│  │                       Cloudflare (CDN + WAF)                          │   │
│  │  • Static Asset Caching  • DDoS Protection  • SSL Termination         │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
├────────────────────────────────────┼────────────────────────────────────────┤
│  ┌─────────────────────────────────┴────────────────────────────────────┐   │
│  │                    API Gateway (FastAPI)                              │   │
│  │  • Rate Limiting  • Auth Middleware  • Request Validation             │   │
│  └─────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────┴────────────────────────────────────┐   │
│  │                     MODULAR MONOLITH CORE                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│  │  │  Auth Module │ │ Circle Module│ │  Poll Module │ │ Notify Module│ │   │
│  │  │  ────────────│ │  ────────────│ │  ────────────│ │  ────────────│ │   │
│  │  │ • Device Auth│ │ • CRUD       │ │ • Templates  │ │ • Push Queue │ │   │
│  │  │ • JWT Tokens │ │ • Membership │ │ • Voting     │ │ • Scheduling │ │   │
│  │  │ • Sessions   │ │ • Invites    │ │ • Results    │ │ • Preferences│ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│  │  │ Report Module│ │Analytics Mod │ │ Share Module │ │ Admin Module │ │   │
│  │  │  ────────────│ │  ────────────│ │  ────────────│ │  ────────────│ │   │
│  │  │ • Moderation │ │ • Events     │ │ • Card Gen   │ │ • Templates  │ │   │
│  │  │ • Safety     │ │ • Metrics    │ │ • Export     │ │ • Moderation │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────┴────────────────────────────────────┐   │
│  │                    Background Workers (Celery)                        │   │
│  │  • Notification Tasks  • Cleanup Jobs  • Analytics Processing         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                           DATA LAYER                                         │
├────────────────────────────────────┼────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Supabase PostgreSQL │ │   Redis Cluster    │ │ Supabase Storage │          │
│  │  ────────────────  │ │  ────────────────  │ │  ────────────────│          │
│  │ • Users/Circles   │ │ • Session Cache    │ │ • Result Cards   │          │
│  │ • Polls/Votes     │ │ • Rate Limiting    │ │ • Profile Images │          │
│  │ • Templates       │ │ • Pub/Sub          │ │ • Static Assets  │          │
│  │ • Analytics       │ │ • Task Queue       │ │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Supabase Realtime                                 │   │
│  │  • Live Poll Results  • Circle Updates  • Notification Delivery       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
├────────────────────────────────────┼────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Expo Push   │  │  RevenueCat  │  │    Sentry    │  │   Firebase   │    │
│  │  Service     │  │  Payments    │  │  Monitoring  │  │  Analytics   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Modular Monolith** | Single deployable unit with clear internal module boundaries | Each domain (Auth, Circle, Poll) is a separate Python package with defined interfaces |
| **Dependency Inversion** | High-level modules don't depend on low-level modules | Repository pattern abstracts data access; Services depend on abstractions |
| **Event-Driven Communication** | Loose coupling between modules via events | Internal event bus for cross-module communication |
| **Fail-Fast Validation** | Validate inputs at system boundaries | Pydantic schemas + custom validators at API layer |
| **Defense in Depth** | Multiple security layers | JWT + RLS + Rate limiting + Input validation |

### 1.3 Module Boundary Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE COMMUNICATION RULES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ALLOWED:                                                        │
│  ✅ Module → Module via Service Interfaces (not direct DB)       │
│  ✅ Module → EventBus → Other Modules (async)                    │
│  ✅ Module → Shared Kernel (common utilities, base classes)      │
│                                                                  │
│  FORBIDDEN:                                                      │
│  ❌ Module → Another Module's Repository directly                │
│  ❌ Module → Another Module's internal entities                  │
│  ❌ Circular dependencies between modules                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (React Native + Expo)

### 2.1 Application Structure

```
circly-app/
├── app/                          # Expo Router (File-based routing)
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── join/[code].tsx       # Deep link join handler
│   ├── (main)/                   # Main app group (authenticated)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── (home)/
│   │   │   ├── index.tsx         # Home - Active polls
│   │   │   └── poll/[id].tsx     # Poll detail + voting
│   │   ├── (create)/
│   │   │   ├── index.tsx         # Create poll flow
│   │   │   └── templates.tsx     # Template selection
│   │   └── (profile)/
│   │       ├── index.tsx         # User profile
│   │       ├── settings.tsx      # App settings
│   │       └── circles.tsx       # Circle management
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
│
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Atomic design components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── poll/                 # Poll domain components
│   │   │   ├── PollCard.tsx
│   │   │   ├── VoteOption.tsx
│   │   │   ├── ResultChart.tsx
│   │   │   └── index.ts
│   │   ├── circle/               # Circle domain components
│   │   │   ├── CircleHeader.tsx
│   │   │   ├── MemberAvatar.tsx
│   │   │   ├── InviteSheet.tsx
│   │   │   └── index.ts
│   │   └── shared/               # Cross-domain components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingState.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── features/                 # Feature modules (business logic)
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts
│   │   │   └── api/
│   │   │       └── authApi.ts
│   │   ├── polls/
│   │   │   ├── hooks/
│   │   │   │   ├── usePolls.ts
│   │   │   │   ├── useVote.ts
│   │   │   │   └── usePollResults.ts
│   │   │   ├── store/
│   │   │   │   └── pollStore.ts
│   │   │   └── api/
│   │   │       └── pollApi.ts
│   │   ├── circles/
│   │   │   ├── hooks/
│   │   │   │   ├── useCircles.ts
│   │   │   │   └── useCircleMembers.ts
│   │   │   ├── store/
│   │   │   │   └── circleStore.ts
│   │   │   └── api/
│   │   │       └── circleApi.ts
│   │   └── notifications/
│   │       ├── hooks/
│   │       │   └── useNotifications.ts
│   │       └── services/
│   │           └── pushService.ts
│   │
│   ├── lib/                      # Core utilities
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance + interceptors
│   │   │   └── types.ts          # API response types
│   │   ├── storage/
│   │   │   └── secureStorage.ts  # Secure token storage
│   │   ├── analytics/
│   │   │   └── tracker.ts        # Event tracking
│   │   └── constants/
│   │       └── config.ts         # Environment config
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── poll.ts
│   │   ├── circle.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── theme/                    # Design system
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── index.ts
│
├── assets/                       # Static assets
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── package.json
└── tsconfig.json
```

### 2.2 State Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SERVER STATE                              ││
│  │           (TanStack Query / React Query)                     ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  • API responses (polls, circles, users)                     ││
│  │  • Automatic caching + background refetch                    ││
│  │  • Optimistic updates for voting                             ││
│  │  • Infinite queries for pagination                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    CLIENT STATE                              ││
│  │                     (Zustand)                                ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  • Auth state (tokens, user session)                         ││
│  │  • UI state (modals, sheets, navigation)                     ││
│  │  • User preferences (theme, notifications)                   ││
│  │  • Persisted via expo-secure-store                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   REALTIME STATE                             ││
│  │              (Supabase Realtime)                             ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  • Live poll vote counts                                     ││
│  │  • Circle member updates                                     ││
│  │  • New poll notifications                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow Pattern

```typescript
// Feature: Vote on a Poll
// Location: src/features/polls/hooks/useVote.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pollApi } from '../api/pollApi';
import { Poll, VoteRequest } from '@/types';

export function useVote(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VoteRequest) => pollApi.vote(pollId, data),

    // Optimistic update
    onMutate: async (newVote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['poll', pollId] });

      // Snapshot previous value
      const previousPoll = queryClient.getQueryData<Poll>(['poll', pollId]);

      // Optimistically update
      queryClient.setQueryData<Poll>(['poll', pollId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_votes: old.total_votes + 1,
          user_voted: true,
          options: old.options.map(opt =>
            opt.id === newVote.option_id
              ? { ...opt, vote_count: opt.vote_count + 1 }
              : opt
          ),
        };
      });

      return { previousPoll };
    },

    // Rollback on error
    onError: (err, newVote, context) => {
      queryClient.setQueryData(['poll', pollId], context?.previousPoll);
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['poll', pollId] });
    },
  });
}
```

### 2.4 Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     NAVIGATION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  App Launch                                                      │
│      │                                                           │
│      ▼                                                           │
│  ┌───────────────────────────────────────────────────┐          │
│  │              Splash + Auth Check                   │          │
│  └───────────────────────────────────────────────────┘          │
│      │                                                           │
│      ├──── No Token ──────▶  (auth)/login                       │
│      │                            │                              │
│      │                            ▼                              │
│      │                     Device Login                          │
│      │                            │                              │
│      └──── Has Token ─────┬──────┘                              │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────┐          │
│  │              (main)/ Tab Navigator                 │          │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │          │
│  │  │  Home   │  │ Create  │  │ Profile │           │          │
│  │  │  Tab    │  │  Tab    │  │   Tab   │           │          │
│  │  └─────────┘  └─────────┘  └─────────┘           │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                  │
│  Deep Links:                                                     │
│  • circly://join/{code} → (auth)/join/[code] → Auto-join Circle │
│  • circly://poll/{id}   → (main)/home/poll/[id]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Architecture (FastAPI Modular Monolith)

### 3.1 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI application factory
│   ├── config.py                 # Settings with Pydantic
│   ├── dependencies.py           # Dependency injection
│   │
│   ├── core/                     # Shared Kernel
│   │   ├── __init__.py
│   │   ├── database.py           # SQLAlchemy async engine
│   │   ├── security.py           # JWT, hashing utilities
│   │   ├── events.py             # Internal event bus
│   │   ├── exceptions.py         # Custom exceptions
│   │   ├── middleware.py         # Custom middleware
│   │   └── base_repository.py    # Generic repository pattern
│   │
│   ├── modules/                  # Domain Modules
│   │   │
│   │   ├── auth/                 # Authentication Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py         # API routes
│   │   │   ├── service.py        # Business logic
│   │   │   ├── repository.py     # Data access
│   │   │   ├── schemas.py        # Pydantic models
│   │   │   ├── models.py         # SQLAlchemy models
│   │   │   └── events.py         # Module events
│   │   │
│   │   ├── circles/              # Circle Management Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   ├── events.py
│   │   │   └── invite_service.py # Invite code generation
│   │   │
│   │   ├── polls/                # Poll & Voting Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   ├── events.py
│   │   │   ├── template_service.py
│   │   │   └── result_calculator.py
│   │   │
│   │   ├── notifications/        # Notification Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   ├── events.py
│   │   │   └── push_provider.py  # Expo Push integration
│   │   │
│   │   ├── reports/              # Safety & Moderation Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── analytics/            # Analytics Module
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── schemas.py
│   │   │
│   │   └── sharing/              # Result Card Generation Module
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── service.py
│   │       ├── card_generator.py
│   │       └── templates/        # Card SVG templates
│   │
│   ├── tasks/                    # Celery Background Tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py         # Celery configuration
│   │   ├── notifications.py      # Notification tasks
│   │   ├── cleanup.py            # Data cleanup tasks
│   │   └── analytics.py          # Analytics aggregation
│   │
│   └── api/                      # API Layer
│       ├── __init__.py
│       ├── v1/
│       │   ├── __init__.py
│       │   └── router.py         # API v1 router aggregation
│       └── health.py             # Health check endpoints
│
├── migrations/                   # Alembic migrations
├── tests/                        # Test suite
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                      # Utility scripts
├── pyproject.toml                # Project dependencies (uv)
├── Dockerfile
└── docker-compose.yml
```

### 3.2 Module Interface Contracts

```python
# app/modules/polls/service.py
from abc import ABC, abstractmethod
from typing import Protocol
from uuid import UUID

class IPollService(Protocol):
    """Poll Service Interface - Other modules depend on this"""

    async def create_poll(
        self,
        template_id: UUID,
        circle_id: UUID,
        creator_id: UUID,
        deadline: datetime
    ) -> PollResponse:
        """Create a new poll from template"""
        ...

    async def vote(
        self,
        poll_id: UUID,
        option_id: UUID,
        user_id: UUID
    ) -> VoteResponse:
        """Cast a vote (anonymous)"""
        ...

    async def get_results(
        self,
        poll_id: UUID,
        requester_id: UUID
    ) -> PollResultResponse:
        """Get poll results (only for Circle members)"""
        ...


class PollService(IPollService):
    """Concrete implementation"""

    def __init__(
        self,
        repository: IPollRepository,
        circle_service: ICircleService,  # Injected interface, not concrete
        event_bus: IEventBus,
    ):
        self._repo = repository
        self._circles = circle_service
        self._events = event_bus

    async def create_poll(self, ...) -> PollResponse:
        # 1. Validate creator is Circle member
        membership = await self._circles.get_membership(circle_id, creator_id)
        if not membership:
            raise NotCircleMemberError()

        # 2. Get Circle members as poll options
        members = await self._circles.get_members(circle_id, exclude=[creator_id])

        # 3. Create poll with options
        poll = await self._repo.create_with_options(
            template_id=template_id,
            circle_id=circle_id,
            creator_id=creator_id,
            deadline=deadline,
            options=[m.id for m in members]
        )

        # 4. Emit event for notification module
        await self._events.publish(PollCreatedEvent(
            poll_id=poll.id,
            circle_id=circle_id,
            question=poll.question_text
        ))

        return PollResponse.from_orm(poll)
```

### 3.3 Event Bus Implementation

```python
# app/core/events.py
from typing import Callable, Dict, List, Type, TypeVar
from dataclasses import dataclass
import asyncio

E = TypeVar('E', bound='DomainEvent')

@dataclass
class DomainEvent:
    """Base class for all domain events"""
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class PollCreatedEvent(DomainEvent):
    poll_id: UUID
    circle_id: UUID
    question: str


@dataclass
class VoteCastEvent(DomainEvent):
    poll_id: UUID
    option_id: UUID
    voter_id: UUID  # For internal use, never exposed


@dataclass
class PollClosedEvent(DomainEvent):
    poll_id: UUID
    winner_option_id: UUID
    total_votes: int


class EventBus:
    """Simple in-process async event bus"""

    def __init__(self):
        self._handlers: Dict[Type[DomainEvent], List[Callable]] = {}

    def subscribe(
        self,
        event_type: Type[E],
        handler: Callable[[E], Awaitable[None]]
    ):
        """Subscribe a handler to an event type"""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent):
        """Publish an event to all subscribers"""
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])

        # Run all handlers concurrently
        await asyncio.gather(
            *[handler(event) for handler in handlers],
            return_exceptions=True  # Don't fail if one handler fails
        )


# Usage in notification module
# app/modules/notifications/events.py
def register_handlers(event_bus: EventBus, notification_service: NotificationService):

    @event_bus.subscribe(PollCreatedEvent)
    async def on_poll_created(event: PollCreatedEvent):
        await notification_service.send_poll_start_notifications(
            poll_id=event.poll_id,
            circle_id=event.circle_id
        )

    @event_bus.subscribe(PollClosedEvent)
    async def on_poll_closed(event: PollClosedEvent):
        await notification_service.send_result_notifications(
            poll_id=event.poll_id
        )
```

### 3.4 Repository Pattern

```python
# app/core/base_repository.py
from typing import Generic, TypeVar, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import DeclarativeBase

T = TypeVar('T', bound=DeclarativeBase)

class BaseRepository(Generic[T]):
    """Generic repository with common CRUD operations"""

    def __init__(self, session: AsyncSession, model: Type[T]):
        self._session = session
        self._model = model

    async def get_by_id(self, id: UUID) -> Optional[T]:
        result = await self._session.execute(
            select(self._model).where(self._model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        limit: int = 100,
        offset: int = 0
    ) -> List[T]:
        result = await self._session.execute(
            select(self._model)
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def create(self, entity: T) -> T:
        self._session.add(entity)
        await self._session.flush()
        await self._session.refresh(entity)
        return entity

    async def update(self, id: UUID, **kwargs) -> Optional[T]:
        await self._session.execute(
            update(self._model)
            .where(self._model.id == id)
            .values(**kwargs)
        )
        return await self.get_by_id(id)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            delete(self._model).where(self._model.id == id)
        )
        return result.rowcount > 0


# app/modules/polls/repository.py
class PollRepository(BaseRepository[Poll]):
    """Poll-specific repository with domain queries"""

    async def get_active_by_circle(
        self,
        circle_id: UUID,
        include_closed: bool = False
    ) -> List[Poll]:
        query = (
            select(Poll)
            .where(Poll.circle_id == circle_id)
            .where(Poll.is_active == True)
        )
        if not include_closed:
            query = query.where(Poll.deadline > datetime.utcnow())

        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def get_with_options_and_votes(
        self,
        poll_id: UUID
    ) -> Optional[Poll]:
        query = (
            select(Poll)
            .options(
                selectinload(Poll.options).selectinload(PollOption.votes)
            )
            .where(Poll.id == poll_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
```

---

## 4. Database Architecture

### 4.1 Entity Relationship Diagram (Enhanced)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │      users       │         │   push_tokens    │                         │
│  ├──────────────────┤         ├──────────────────┤                         │
│  │ id          (PK) │◄───────┤│ user_id     (FK) │                         │
│  │ device_id   (UQ) │         │ token            │                         │
│  │ platform        │         │ platform         │                         │
│  │ app_version     │         │ is_active        │                         │
│  │ created_at      │         │ created_at       │                         │
│  │ last_active_at  │         └──────────────────┘                         │
│  │ is_active       │                                                        │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           │ 1:N                                                              │
│           ▼                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ circle_members   │◄────────│     circles      │                         │
│  ├──────────────────┤    N:1  ├──────────────────┤                         │
│  │ id          (PK) │         │ id          (PK) │                         │
│  │ circle_id   (FK) │─────────┤ name             │                         │
│  │ user_id     (FK) │         │ creator_id  (FK) │──────┐                  │
│  │ nickname    (UQ) │         │ invite_code (UQ) │      │                  │
│  │ role            │         │ invite_link_id   │      │                  │
│  │ joined_at       │         │ max_members      │      │                  │
│  │ is_active       │         │ member_count     │      │ 1:N (creator)    │
│  │ polls_created   │         │ expires_at       │      │                  │
│  │ votes_cast      │         │ is_active        │      │                  │
│  └────────┬─────────┘         │ created_at       │      │                  │
│           │                   └────────┬─────────┘      │                  │
│           │                            │                │                  │
│           │                            │ 1:N            │                  │
│           │                            ▼                │                  │
│           │                   ┌──────────────────┐      │                  │
│           │                   │      polls       │      │                  │
│           │                   ├──────────────────┤      │                  │
│           │              ────►│ id          (PK) │      │                  │
│           │             │     │ circle_id   (FK) │◄─────┘                  │
│           │             │     │ creator_id  (FK) │                         │
│           │             │     │ template_id (FK) │──────┐                  │
│           │             │     │ question_text    │      │                  │
│           │             │     │ deadline         │      │                  │
│           │             │     │ is_anonymous     │      │                  │
│           │             │     │ is_active        │      │                  │
│           │             │     │ is_closed        │      │                  │
│           │             │     │ total_votes      │      │                  │
│           │             │     │ created_at       │      │                  │
│           │             │     └────────┬─────────┘      │                  │
│           │             │              │                │                  │
│           │             │              │ 1:N            │                  │
│           │             │              ▼                │                  │
│           │             │     ┌──────────────────┐      │                  │
│           │             │     │  poll_options    │      │                  │
│           │             │     ├──────────────────┤      │                  │
│           └─────────────┼────►│ id          (PK) │      │                  │
│              (member)   │     │ poll_id     (FK) │      │                  │
│                         │     │ member_id   (FK) │      │ 1:N              │
│                         │     │ member_nickname  │      │                  │
│                         │     │ display_order    │      │                  │
│                         │     │ vote_count       │      │                  │
│                         │     └────────┬─────────┘      │                  │
│                         │              │                │                  │
│                         │              │ 1:N            │                  │
│                         │              ▼                │                  │
│                         │     ┌──────────────────┐      │                  │
│                         │     │      votes       │      │                  │
│                         │     ├──────────────────┤      │                  │
│                         │     │ id          (PK) │      │                  │
│                         │     │ poll_id     (FK) │      │                  │
│                         │     │ option_id   (FK) │      │                  │
│                         │     │ user_id     (FK) │      │                  │
│                         │     │ anonymous_hash   │      │                  │
│                         │     │ created_at       │      │                  │
│                         │     └──────────────────┘      │                  │
│                         │                               │                  │
│                         │     ┌──────────────────┐      │                  │
│                         │     │question_templates│◄─────┘                  │
│                         │     ├──────────────────┤                         │
│                         │     │ id          (PK) │                         │
│                         │     │ category         │                         │
│                         │     │ question_text    │                         │
│                         │     │ usage_count      │                         │
│                         │     │ is_active        │                         │
│                         │     │ created_at       │                         │
│                         │     └──────────────────┘                         │
│                         │                                                   │
│  ┌──────────────────┐   │     ┌──────────────────┐                         │
│  │notification_settings│  │     │    reports       │                         │
│  ├──────────────────┤   │     ├──────────────────┤                         │
│  │ id          (PK) │   │     │ id          (PK) │                         │
│  │ user_id     (FK) │   │     │ reporter_id (FK) │                         │
│  │ poll_start       │   │     │ target_type      │                         │
│  │ poll_deadline    │   │     │ target_id        │                         │
│  │ poll_result      │   │     │ reason           │                         │
│  │ quiet_enabled    │   │     │ status           │                         │
│  │ quiet_start      │   │     │ created_at       │                         │
│  │ quiet_end        │   │     └──────────────────┘                         │
│  │ max_per_day      │   │                                                   │
│  └──────────────────┘   │     ┌──────────────────┐                         │
│                         │     │ analytics_events │                         │
│                         │     ├──────────────────┤                         │
│                         │     │ id          (PK) │                         │
│                         │     │ user_id     (FK) │                         │
│                         │     │ event_name       │                         │
│                         │     │ event_category   │                         │
│                         │     │ properties (JSON)│                         │
│                         │     │ created_at       │ (Partitioned by month) │
│                         │     └──────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Indexes Strategy

```sql
-- Performance-critical indexes for medium scale (1K-50K users)

-- Users: Fast device lookup
CREATE UNIQUE INDEX idx_users_device_id ON users(device_id) WHERE is_active = TRUE;

-- Circles: Active circle lookup
CREATE INDEX idx_circles_active ON circles(is_active, expires_at)
    WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_circles_invite_code ON circles(invite_code)
    WHERE is_active = TRUE;

-- Circle Members: Membership queries
CREATE INDEX idx_circle_members_lookup ON circle_members(circle_id, user_id, is_active);
CREATE INDEX idx_circle_members_user ON circle_members(user_id, is_active);

-- Polls: Active polls by circle
CREATE INDEX idx_polls_circle_active ON polls(circle_id, deadline, is_active)
    WHERE is_active = TRUE AND is_closed = FALSE;
CREATE INDEX idx_polls_deadline ON polls(deadline)
    WHERE is_active = TRUE AND is_closed = FALSE;

-- Votes: Fast vote counting
CREATE INDEX idx_votes_poll ON votes(poll_id);
CREATE INDEX idx_votes_option ON votes(option_id);
CREATE UNIQUE INDEX idx_votes_unique ON votes(poll_id, user_id);

-- Templates: Popular templates
CREATE INDEX idx_templates_popular ON question_templates(usage_count DESC)
    WHERE is_active = TRUE;
CREATE INDEX idx_templates_category ON question_templates(category, is_active);

-- Analytics: Time-based queries (consider partitioning for scale)
CREATE INDEX idx_analytics_time ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
```

### 4.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Users: Can only see and update own data
CREATE POLICY users_select ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY users_update ON users FOR UPDATE
    USING (id = auth.uid());

-- Circle Members: Can see members of circles they belong to
CREATE POLICY circle_members_select ON circle_members FOR SELECT
    USING (
        circle_id IN (
            SELECT circle_id FROM circle_members
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Polls: Can only see polls in circles they belong to
CREATE POLICY polls_select ON polls FOR SELECT
    USING (
        circle_id IN (
            SELECT circle_id FROM circle_members
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Votes: Users can insert their own votes, see only aggregated results
CREATE POLICY votes_insert ON votes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY votes_select ON votes FOR SELECT
    USING (user_id = auth.uid());  -- Only see own votes

-- Poll Options: Read-only, visible to Circle members (via poll RLS)
CREATE POLICY poll_options_select ON poll_options FOR SELECT
    USING (
        poll_id IN (
            SELECT id FROM polls WHERE circle_id IN (
                SELECT circle_id FROM circle_members
                WHERE user_id = auth.uid() AND is_active = TRUE
            )
        )
    );
```

---

## 5. API Architecture

### 5.1 API Version Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    API VERSIONING STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Base URL: https://api.circly.app                               │
│                                                                  │
│  Version Format: /v{major}                                       │
│  Current: /v1                                                    │
│                                                                  │
│  Headers:                                                        │
│  • X-API-Version: 1.0.0 (for minor version tracking)            │
│  • X-Request-ID: {uuid} (for tracing)                           │
│                                                                  │
│  Deprecation Policy:                                             │
│  • 6 months notice before deprecation                           │
│  • Sunset header: Sunset: Sat, 01 Jul 2025 00:00:00 GMT        │
│  • Deprecation header: Deprecation: true                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 API Endpoint Summary

| Domain | Endpoint | Methods | Description |
|--------|----------|---------|-------------|
| **Auth** | `/v1/auth/device-login` | POST | Device-based anonymous login |
| | `/v1/auth/refresh` | POST | Refresh JWT token |
| **Users** | `/v1/users/me` | GET, PUT | Current user profile |
| | `/v1/users/me/push-token` | PUT | Update push notification token |
| **Circles** | `/v1/circles` | GET, POST | List/Create circles |
| | `/v1/circles/{id}` | GET, PUT, DELETE | Circle CRUD |
| | `/v1/circles/join` | POST | Join via code/link |
| | `/v1/circles/{id}/members` | GET | List members |
| | `/v1/circles/{id}/regenerate-invite` | POST | New invite code |
| **Templates** | `/v1/templates` | GET | List question templates |
| | `/v1/templates/popular` | GET | Popular templates |
| **Polls** | `/v1/polls` | GET, POST | List/Create polls |
| | `/v1/polls/{id}` | GET, PUT, DELETE | Poll CRUD |
| | `/v1/polls/{id}/vote` | POST | Cast vote |
| | `/v1/polls/{id}/results` | GET | Get results |
| **Notifications** | `/v1/notifications` | GET | List notifications |
| | `/v1/notifications/settings` | GET, PUT | Notification preferences |
| **Reports** | `/v1/reports` | POST | Submit report |
| **Health** | `/health` | GET | Basic health check |
| | `/health/detailed` | GET | Detailed service status |

### 5.3 Request/Response Contracts

```typescript
// Shared response envelope
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta?: {
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    requestId: string;
    timestamp: string;
  };
}

// Poll Domain Types
interface Poll {
  id: string;
  circleId: string;
  creatorId: string;
  templateId: string;
  questionText: string;
  deadline: string;  // ISO 8601
  isAnonymous: boolean;
  isActive: boolean;
  isClosed: boolean;
  totalVotes: number;
  totalParticipants: number;
  userVoted: boolean;
  options: PollOption[];
  createdAt: string;
}

interface PollOption {
  id: string;
  memberNickname: string;
  displayOrder: number;
  voteCount: number;  // Only shown after voting or when poll closed
}

interface CreatePollRequest {
  templateId: string;
  circleId: string;
  deadline: string;  // ISO 8601, must be in future
}

interface VoteRequest {
  optionId: string;
}

interface PollResult {
  pollId: string;
  questionText: string;
  totalVotes: number;
  totalParticipants: number;
  isClosed: boolean;
  results: {
    optionId: string;
    memberNickname: string;
    voteCount: number;
    percentage: number;
    rank: number;
  }[];
  winner?: {
    memberNickname: string;
    voteCount: number;
    percentage: number;
  };
}
```

### 5.4 Error Response Standards

```typescript
// Error codes by domain
const ErrorCodes = {
  // Auth errors (AUTH_xxx)
  AUTH_INVALID_TOKEN: 'Invalid or expired token',
  AUTH_TOKEN_EXPIRED: 'Token has expired',
  AUTH_DEVICE_BANNED: 'Device has been banned',

  // Circle errors (CIRCLE_xxx)
  CIRCLE_NOT_FOUND: 'Circle not found',
  CIRCLE_EXPIRED: 'Circle invite has expired',
  CIRCLE_FULL: 'Circle has reached maximum members',
  CIRCLE_ALREADY_MEMBER: 'Already a member of this circle',
  CIRCLE_NOT_MEMBER: 'Not a member of this circle',
  CIRCLE_NOT_CREATOR: 'Only circle creator can perform this action',
  CIRCLE_INVALID_CODE: 'Invalid invite code',

  // Poll errors (POLL_xxx)
  POLL_NOT_FOUND: 'Poll not found',
  POLL_ALREADY_VOTED: 'Already voted in this poll',
  POLL_CLOSED: 'Poll has been closed',
  POLL_EXPIRED: 'Poll has expired',
  POLL_NOT_CREATOR: 'Only poll creator can perform this action',
  POLL_INVALID_OPTION: 'Invalid vote option',

  // Validation errors (VALIDATION_xxx)
  VALIDATION_REQUIRED: 'Required field missing',
  VALIDATION_INVALID_FORMAT: 'Invalid data format',
  VALIDATION_OUT_OF_RANGE: 'Value out of allowed range',

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'Too many requests',

  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// Example error response
{
  "success": false,
  "error": {
    "code": "POLL_ALREADY_VOTED",
    "message": "Already voted in this poll",
    "details": {
      "pollId": "123e4567-e89b-12d3-a456-426614174000",
      "votedAt": "2024-01-15T10:30:00Z"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T15:45:00Z"
  }
}
```

---

## 6. Infrastructure Architecture

### 6.1 Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT TOPOLOGY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CLOUDFLARE                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │    CDN      │  │    WAF      │  │   SSL/TLS   │                  │    │
│  │  │  (Static)   │  │ (Protection)│  │(Termination)│                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          RAILWAY                                     │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    API Service                               │    │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │    │    │
│  │  │  │ Pod 1   │  │ Pod 2   │  │ Pod 3   │  │ Pod N   │        │    │    │
│  │  │  │ FastAPI │  │ FastAPI │  │ FastAPI │  │ FastAPI │        │    │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │    │    │
│  │  │       min: 2          max: 10          auto-scale           │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Worker Service                            │    │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │    │    │
│  │  │  │Worker 1 │  │Worker 2 │  │Worker N │                      │    │    │
│  │  │  │ Celery  │  │ Celery  │  │ Celery  │                      │    │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘                      │    │    │
│  │  │       min: 1          max: 5           auto-scale           │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                      Redis                                   │    │    │
│  │  │           (Session Cache + Task Queue + Pub/Sub)             │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          SUPABASE                                    │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │    │
│  │  │   PostgreSQL    │  │    Realtime     │  │     Storage     │     │    │
│  │  │   (Primary DB)  │  │   (WebSocket)   │  │ (Files/Images)  │     │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                          │    │
│  │  │    Auth         │  │    Edge Funcs   │                          │    │
│  │  │  (JWT/Session)  │  │   (Optional)    │                          │    │
│  │  └─────────────────┘  └─────────────────┘                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Environment Configuration

```yaml
# Environment Matrix
environments:
  development:
    api_replicas: 1
    worker_replicas: 1
    database: local_postgres
    redis: local_redis
    features:
      debug: true
      hot_reload: true
      mock_push: true

  staging:
    api_replicas: 1
    worker_replicas: 1
    database: supabase_staging
    redis: railway_redis_staging
    features:
      debug: false
      hot_reload: false
      mock_push: false
    domain: staging-api.circly.app

  production:
    api_replicas: 2-10  # Auto-scale
    worker_replicas: 1-5  # Auto-scale
    database: supabase_production
    redis: railway_redis_production
    features:
      debug: false
      hot_reload: false
      mock_push: false
    domain: api.circly.app
    scaling:
      cpu_threshold: 70%
      memory_threshold: 80%
      min_instances: 2
      max_instances: 10
```

### 6.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Step 1: Lint & Type Check
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v1
      - run: |
          uv sync
          uv run ruff check app/
          uv run mypy app/

  # Step 2: Unit Tests
  test:
    needs: quality
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v1
      - run: |
          uv sync
          uv run pytest --cov=app --cov-report=xml

  # Step 3: Build & Push Docker Image
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: circly/api:${{ github.sha }}

  # Step 4: Deploy to Railway
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: railway/deploy-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: circly-api

  # Step 5: Run Migrations
  migrate:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - run: railway run alembic upgrade head

  # Step 6: Health Check
  verify:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - run: |
          for i in {1..5}; do
            if curl -f https://api.circly.app/health; then
              exit 0
            fi
            sleep 10
          done
          exit 1
```

### 6.4 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONITORING ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │     Sentry      │    │    Railway      │    │   Supabase      │         │
│  │  (Error Track)  │    │   (App Logs)    │    │   (DB Stats)    │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌─────────────────────────┐                              │
│                    │    Grafana Dashboard    │                              │
│                    │  (Unified Visualization)│                              │
│                    └─────────────────────────┘                              │
│                                                                              │
│  Key Metrics:                                                                │
│  ─────────────                                                               │
│  • API Latency (p50, p95, p99)                                              │
│  • Error Rate by endpoint                                                    │
│  • Active users (DAU, WAU, MAU)                                             │
│  • Poll participation rate                                                   │
│  • Push notification delivery rate                                           │
│  • Database connection pool usage                                            │
│  • Redis memory usage                                                        │
│  • Background task queue depth                                               │
│                                                                              │
│  Alerts:                                                                     │
│  ─────────                                                                   │
│  • Error rate > 1% → Slack notification                                     │
│  • API latency p95 > 500ms → Slack notification                            │
│  • Database connections > 80% → Slack + PagerDuty                           │
│  • Health check failure → PagerDuty                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Network Security                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Cloudflare WAF (DDoS, SQL injection, XSS protection)              │    │
│  │ • SSL/TLS termination (TLS 1.3)                                     │    │
│  │ • Rate limiting at edge (100 req/min per IP)                        │    │
│  │ • Geo-blocking (optional)                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Layer 2: Application Security                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • JWT authentication (RS256, 7-day expiry)                          │    │
│  │ • Request validation (Pydantic schemas)                             │    │
│  │ • CORS configuration (whitelist mobile app origins)                 │    │
│  │ • Security headers (HSTS, X-Content-Type-Options, etc.)             │    │
│  │ • Rate limiting per user (100 req/min per user)                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Layer 3: Data Security                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Row Level Security (RLS) on all tables                            │    │
│  │ • Vote anonymization (SHA-256 + random salt)                        │    │
│  │ • Encrypted at rest (Supabase managed)                              │    │
│  │ • Encrypted in transit (TLS)                                        │    │
│  │ • No PII stored (device-based auth only)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Layer 4: Operational Security                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Secrets management (Railway encrypted env vars)                   │    │
│  │ • Audit logging (all admin actions)                                 │    │
│  │ • Automated security scanning (Dependabot, Snyk)                    │    │
│  │ • Incident response plan                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Vote Anonymization

```python
# app/modules/polls/anonymizer.py
import hashlib
import secrets
from datetime import datetime

class VoteAnonymizer:
    """Ensures vote anonymity while preventing double voting"""

    def __init__(self, secret_key: str):
        self._secret = secret_key

    def generate_vote_hash(
        self,
        poll_id: str,
        user_id: str,
        option_id: str
    ) -> str:
        """
        Generates an irreversible hash for vote storage.

        The hash allows:
        - Verification that a user hasn't voted twice
        - Counting votes per option

        The hash prevents:
        - Determining which user voted for which option
        - Reversing the hash to find the user
        """
        # Random salt ensures same vote combo produces different hash
        salt = secrets.token_hex(16)
        timestamp = datetime.utcnow().isoformat()

        # Create hash input with multiple components
        hash_input = f"{self._secret}:{poll_id}:{user_id}:{option_id}:{salt}:{timestamp}"

        # Use SHA-256 for irreversibility
        vote_hash = hashlib.sha256(hash_input.encode()).hexdigest()

        return vote_hash

    def generate_duplicate_check_hash(
        self,
        poll_id: str,
        user_id: str
    ) -> str:
        """
        Generates a deterministic hash for duplicate vote detection.
        This is stored separately from the vote hash.
        """
        hash_input = f"{self._secret}:duplicate:{poll_id}:{user_id}"
        return hashlib.sha256(hash_input.encode()).hexdigest()
```

---

## 8. Scalability Considerations

### 8.1 Current Scale (1K-50K Users)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CURRENT SCALE SPECIFICATIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Base: 1,000 - 50,000 users                                            │
│  Concurrent Users: ~500 - 2,500 (5% of total)                               │
│  Requests per Second: 50 - 250 RPS                                          │
│  Database Size: 1GB - 10GB                                                  │
│                                                                              │
│  Infrastructure Sizing:                                                      │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ Component          │ Min      │ Max      │ Scaling Trigger         │     │
│  ├────────────────────┼──────────┼──────────┼─────────────────────────┤     │
│  │ API Servers        │ 2        │ 10       │ CPU > 70%               │     │
│  │ Worker Instances   │ 1        │ 5        │ Queue depth > 1000      │     │
│  │ Redis Memory       │ 256MB    │ 1GB      │ Memory > 80%            │     │
│  │ DB Connections     │ 20       │ 100      │ Conn pool > 80%         │     │
│  └────────────────────┴──────────┴──────────┴─────────────────────────┘     │
│                                                                              │
│  Bottleneck Analysis:                                                        │
│  • Database is primary bottleneck (single region)                           │
│  • Redis handles ~10K operations/sec (sufficient)                           │
│  • Push notifications: 1K/min capacity (Expo)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Future Scale Path (50K-500K Users)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCALE-UP PATH (WHEN NEEDED)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Optimize Current Architecture (50K-100K)                          │
│  ─────────────────────────────────────────────────                          │
│  • Add read replicas for PostgreSQL                                         │
│  • Implement aggressive caching (poll results, templates)                   │
│  • Database query optimization and index tuning                             │
│  • Estimated cost: $200-500/month additional                                │
│                                                                              │
│  Phase 2: Extract High-Traffic Services (100K-250K)                         │
│  ─────────────────────────────────────────────────                          │
│  • Extract Notification Service to separate deployment                      │
│  • Extract Analytics to dedicated pipeline (Kafka/ClickHouse)               │
│  • Add Redis Cluster for horizontal scaling                                 │
│  • Estimated cost: $500-1000/month additional                               │
│                                                                              │
│  Phase 3: Full Service Decomposition (250K-500K)                            │
│  ─────────────────────────────────────────────────                          │
│  • Extract Poll Service                                                     │
│  • Extract Circle Service                                                   │
│  • Add API Gateway (Kong/AWS API Gateway)                                   │
│  • Multi-region deployment                                                  │
│  • Estimated cost: $2000-5000/month additional                              │
│                                                                              │
│  Module Extraction Priority:                                                 │
│  1. Notifications (high write, async, independent)                          │
│  2. Analytics (heavy processing, independent)                               │
│  3. Polls (highest traffic, complex logic)                                  │
│  4. Circles (lower traffic, many dependencies)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Development Guidelines

### 9.1 Module Development Checklist

```markdown
## Creating a New Module

- [ ] Create module directory: `app/modules/{name}/`
- [ ] Define public interface in `__init__.py`
- [ ] Create models in `models.py`
- [ ] Create Pydantic schemas in `schemas.py`
- [ ] Implement repository in `repository.py`
- [ ] Implement service in `service.py`
- [ ] Define API routes in `router.py`
- [ ] Define domain events in `events.py`
- [ ] Register routes in `app/api/v1/router.py`
- [ ] Add unit tests in `tests/unit/modules/{name}/`
- [ ] Add integration tests in `tests/integration/`
- [ ] Update API documentation
- [ ] Create database migration if needed
```

### 9.2 Code Quality Standards

```python
# Required tools and configurations

# pyproject.toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]
ignore = ["E501"]  # Line length handled by formatter

[tool.ruff.isort]
known-first-party = ["app"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "-v --cov=app --cov-report=term-missing"
```

### 9.3 Testing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        E2E Tests                                 │
│                       ┌───────────┐                             │
│                       │ 10% (~50) │  Playwright + Real API      │
│                       └───────────┘                             │
│                                                                  │
│                  Integration Tests                               │
│               ┌─────────────────────┐                           │
│               │    30% (~150)       │  TestClient + Real DB     │
│               └─────────────────────┘                           │
│                                                                  │
│                    Unit Tests                                    │
│         ┌───────────────────────────────────┐                   │
│         │         60% (~300)                │  Mocked deps      │
│         └───────────────────────────────────┘                   │
│                                                                  │
│  Coverage Target: 80% overall, 90% for business logic           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup with uv + FastAPI
- [ ] Database schema + migrations
- [ ] Core module structure
- [ ] Auth module (device login, JWT)
- [ ] Basic CI/CD pipeline

### Phase 2: Core Features (Weeks 3-4)
- [ ] Circle module (CRUD, invites, membership)
- [ ] Poll module (templates, voting, results)
- [ ] Frontend scaffolding (Expo Router)
- [ ] API integration

### Phase 3: Engagement (Weeks 5-6)
- [ ] Notification module (push via Expo)
- [ ] Real-time updates (Supabase Realtime)
- [ ] Result card generation
- [ ] Deep linking

### Phase 4: Polish (Weeks 7-8)
- [ ] Analytics module
- [ ] Report/moderation module
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production deployment

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Created | 2024-12-02 |
| Author | Architecture Team |
| Status | Draft |
| Review Date | TBD |
| Approved By | TBD |

---

*This architecture document serves as the source of truth for Circly's technical implementation. All implementation decisions should align with the patterns and principles defined here.*
