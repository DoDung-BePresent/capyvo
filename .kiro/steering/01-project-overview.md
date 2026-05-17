# Project Overview - Capyvo TOEIC Speaking Practice

## Project Description

Capyvo is a TOEIC Speaking test preparation platform that provides:

- Interactive speaking practice for all 5 parts of TOEIC Speaking
- AI-powered pronunciation and content scoring using OpenAI
- Question management system with topics and exam sets
- Subscription-based premium features
- Payment integration with PayOS (Vietnam)
- Audio recording and transcription
- Public sharing and community reactions

## Tech Stack

### Frontend (Client)

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router v7
- **State Management**:
  - TanStack Query (server state)
  - Zustand (client state)
- **UI Libraries**:
  - Ant Design (primary)
  - Material-UI (secondary)
  - Tailwind CSS v4
- **Authentication**: Supabase Auth
- **HTTP Client**: Axios
- **Audio**: WaveSurfer.js, Audiomotion Analyzer
- **Monitoring**: Sentry

### Backend (Server)

- **Runtime**: Node.js 22+
- **Framework**: Express 5
- **Language**: TypeScript (CommonJS)
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Supabase Storage (audio/images)
- **AI Services**: OpenAI (TTS, Whisper, GPT-4o)
- **Job Queue**: BullMQ + Redis + IORedis
- **Payment**: PayOS SDK
- **Monitoring**: Sentry
- **Security**: Helmet, CORS, Rate Limiting
- **API Docs**: Swagger (dev only)

## Architecture

### Frontend Structure

```
client/src/
├── app/              # Router, guards, providers
├── features/         # Feature modules (admin, auth, exam, payment)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       └── types/
├── shared/           # Shared utilities
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── lib/              # External service configs
└── config/           # App configuration
```

### Backend Structure

```
server/src/
├── controllers/      # Request handlers
├── services/         # Business logic
├── routes/           # API routes
├── middlewares/      # Express middlewares
├── lib/              # External service clients
├── utils/            # Helper functions
├── errors/           # Custom error classes
├── queues/           # BullMQ queue definitions
├── workers/          # BullMQ workers
├── jobs/             # Cron jobs
└── config/           # Configuration
```

## Key Features

### Question Management

- 5 parts of TOEIC Speaking (11 questions total)
- Part 1: Read aloud (Q1-2)
- Part 2: Describe a picture (Q3-4)
- Part 3: Respond to questions (Q5-7, grouped)
- Part 4: Respond using information (Q8-10, grouped)
- Part 5: Express an opinion (Q11)
- Question types: PRACTICE, FORECAST, CUSTOM
- Question status: DRAFT, PUBLISHED, ARCHIVED
- Topic tagging system
- Exam set grouping

### User Features

- Practice by part or full exam
- Audio recording with prep/response timers
- AI scoring (pronunciation + content)
- Progress tracking and streaks
- Public sharing with reactions
- Subscription plans (BASIC, PREMIUM, CLASSROOM)

### Admin Features

- Question CRUD with bulk operations
- Topic management
- Exam set creation
- OpenAI usage monitoring
- Pricing calculator
- Abuse detection
- System statistics dashboard
- Maintenance mode scheduling

## Database Schema

See `server/prisma/schema.prisma` for complete schema.

Key models:

- User (with subscription fields)
- Question (with part-specific fields)
- ExamSet + QuestionAssignment (many-to-many)
- Topic + QuestionTopicAssignment (many-to-many)
- PracticeSession + UserResponse
- Payment + Subscription + SubscriptionPlan
- PublicShare + Reaction
- AppSetting (maintenance, etc.)

## Environment Variables

### Client (.env.local)

- `VITE_API_URL`: Backend API URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `VITE_SENTRY_DSN`: Sentry DSN (optional)

### Server (.env)

- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`: PayOS credentials
- `REDIS_URL`: Redis connection string (optional)
- `CLIENT_URL`: Frontend URL for CORS
- `SENTRY_DSN`: Sentry DSN (optional)
- `NODE_ENV`: development | production

## Development Commands

### Client

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
```

### Server

```bash
npm run dev          # Start dev server (nodemon + ts-node)
npm run build        # Build TypeScript
npm start            # Run production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run seed         # Seed database
```

## Deployment

- **Frontend**: Vercel (or similar)
- **Backend**: Railway (configured in railway.json)
- **Database**: Railway PostgreSQL
- **Storage**: Supabase Storage
- **Redis**: Railway Redis (optional, for queues)
