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

**Note**: This project is in early planning stage. When code is implemented, common commands will likely include:

```bash
# Frontend (React Native/Expo)
npm install                 # Install frontend dependencies
npm start                   # Start Expo development server
npm run build              # Build for production
npm run test               # Run tests
npm run lint               # Lint code
npm run type-check         # TypeScript type checking

# Backend (FastAPI)
pip install -r backend/requirements.txt  # Install backend dependencies
uvicorn app.main:app --reload            # Start development server
pytest                                   # Run backend tests
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