# Backend Coding Rules

## General Principles

- Write TypeScript with strict type checking
- Use CommonJS module system (`require`/`module.exports`)
- Follow layered architecture: Routes → Controllers → Services → Database
- Keep functions focused and testable
- Use dependency injection where appropriate
- Use absolute imports with `@/` prefix (configured in tsconfig paths)

## File Naming Conventions

- **Controllers**: kebab-case with `.controller.ts` suffix (e.g., `user.controller.ts`)
- **Services**: kebab-case with `.service.ts` suffix (e.g., `user.service.ts`)
- **Routes**: kebab-case with `.routes.ts` suffix (e.g., `user.routes.ts`)
- **Middlewares**: kebab-case with `.middleware.ts` or descriptive name (e.g., `auth.middleware.ts`)
- **Utils**: kebab-case (e.g., `date-formatter.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_CONSTANTS.ts`)

## Architecture Layers

### 1. Routes Layer

- Define API endpoints
- Apply middlewares
- Delegate to controllers
- No business logic

```typescript
// routes/user.routes.ts
import { Router } from 'express'
import { UserController } from '@/controllers/user.controller'
import { authenticate } from '@/middlewares/auth.middleware'

const router = Router()
const controller = new UserController()

router.get('/users/:id', authenticate, (req, res, next) => controller.getUser(req, res, next))

export default router
```

### 2. Controllers Layer

- Handle HTTP request/response
- Validate request data
- Call service methods
- Format responses
- Handle errors with try-catch or pass to next()

```typescript
// controllers/user.controller.ts
import type { Request, Response, NextFunction } from 'express'
import { UserService } from '@/services/user.service'
import { NotFoundError } from '@/errors/app-error'

export class UserController {
  private service = new UserService()

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string
      const user = await this.service.findById(id)

      if (!user) {
        throw new NotFoundError('User')
      }

      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  }
}
```

### 3. Services Layer

- Contain business logic
- Interact with database (Prisma)
- Call external APIs
- Validate business rules
- Throw custom errors

```typescript
// services/user.service.ts
import prisma from '@/lib/prisma'
import { ValidationError } from '@/errors/app-error'

export class UserService {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  }

  async updateUser(id: string, data: UpdateUserDto) {
    // Validate business rules
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (existing && existing.id !== id) {
        throw new ValidationError('Email already in use')
      }
    }

    return prisma.user.update({ where: { id }, data })
  }
}
```

## Response Format

### Success Response

```typescript
res.json({
  success: true,
  data: result,
})
```

### Error Response (handled by error middleware)

```typescript
{
  success: false,
  message: 'Error message',
  errors?: ValidationError[] // For validation errors
}
```

## Error Handling

### Custom Error Classes

Use custom error classes from `errors/app-error.ts`:

- `ValidationError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict

```typescript
import { NotFoundError, ValidationError } from '@/errors/app-error'

// Throw custom errors
if (!user) {
  throw new NotFoundError('User')
}

if (age < 18) {
  throw new ValidationError('User must be 18 or older')
}
```

### Error Middleware

All errors are caught by the global error handler in `middlewares/error-handler.ts`

## Validation

### Zod Schemas

- Define Zod schemas for request validation
- Place schemas near service methods
- Export types from schemas

```typescript
import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>

// In service
async createUser(body: unknown) {
  const dto = CreateUserSchema.parse(body) // Throws if invalid
  return prisma.user.create({ data: dto })
}
```

## Database (Prisma)

### Query Patterns

```typescript
// Find one
const user = await prisma.user.findUnique({ where: { id } })
const user = await prisma.user.findUniqueOrThrow({ where: { id } })

// Find many with filters
const users = await prisma.user.findMany({
  where: { role: 'USER', isPremium: true },
  include: { subscriptions: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
})

// Create
const user = await prisma.user.create({
  data: { email, fullName, role: 'USER' },
})

// Update
const user = await prisma.user.update({
  where: { id },
  data: { fullName },
})

// Delete
await prisma.user.delete({ where: { id } })

// Transactions
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { isPremium: true } })
  await tx.subscription.create({ data: { userId: id, planId: 'PREMIUM' } })
})
```

### Prisma Error Handling

```typescript
try {
  await prisma.user.delete({ where: { id } })
} catch (err) {
  if ((err as { code?: string }).code === 'P2025') {
    throw new NotFoundError('User')
  }
  throw err
}
```

## Authentication & Authorization

### Authentication Middleware

```typescript
import { authenticate } from '@/middlewares/auth.middleware'

router.get('/protected', authenticate, controller.method)
```

### Role-Based Access

```typescript
import { requireRole } from '@/middlewares/auth.middleware'

router.post('/admin/users', authenticate, requireRole('ADMIN'), controller.method)
```

### Get Current User

```typescript
// In controller (after authenticate middleware)
const userId = req.user?.id // Set by authenticate middleware
```

## File Uploads

### Multer Configuration

```typescript
import multer from 'multer'

// Image upload
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files allowed'))
      return
    }
    cb(null, true)
  },
})

// Audio upload
export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files allowed'))
      return
    }
    cb(null, true)
  },
})
```

### Upload to Supabase Storage

```typescript
import supabaseAdmin from '@/lib/supabase'

async uploadImage(buffer: Buffer, filename: string): Promise<string> {
  const storagePath = `images/${Date.now()}-${filename}`

  const { error } = await supabaseAdmin.storage
    .from('images')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(storagePath)

  return publicUrl
}
```

## External Services

### OpenAI Integration

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Text-to-Speech
const mp3 = await openai.audio.speech.create({
  model: 'tts-1-hd',
  voice: 'onyx',
  input: text,
  speed: 0.9,
})

// Speech-to-Text
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',
})

// Chat Completion
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  max_tokens: 500,
})
```

## Job Queues (BullMQ)

### Define Queue

```typescript
// queues/transcription.queue.ts
import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

export const transcriptionQueue = new Queue('transcription', {
  connection: redis,
})

export async function addTranscriptionJob(data: TranscriptionJobData) {
  await transcriptionQueue.add('transcribe', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
}
```

### Define Worker

```typescript
// workers/transcription.worker.ts
import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import logger from '@/lib/logger'

const worker = new Worker(
  'transcription',
  async (job) => {
    logger.info(`Processing job ${job.id}`)
    // Process job
    return result
  },
  { connection: redis },
)

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`)
})
```

## Logging

### Winston Logger

```typescript
import logger from '@/lib/logger'

// Log levels: error, warn, info, debug
logger.info('User created', { userId: user.id })
logger.error('Failed to process payment', { error: err.message, userId })
logger.warn('Rate limit exceeded', { ip: req.ip })
```

### Request Logging

Automatic via `request-logger` middleware (already configured)

## Cron Jobs

### Define Cron Job

```typescript
// jobs/check-expired-subscriptions.job.ts
import cron from 'node-cron'
import logger from '@/lib/logger'

export function startSubscriptionCheckJob() {
  // Run every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running subscription check job')
    try {
      // Job logic
    } catch (err) {
      logger.error('Subscription check job failed', { error: err })
    }
  })
}
```

## Security

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests',
})

router.post('/api/login', limiter, controller.login)
```

### Input Sanitization

- Use Zod for validation (automatically sanitizes)
- Never trust user input
- Validate file uploads

### SQL Injection Prevention

- Prisma automatically prevents SQL injection
- Never use raw SQL with user input

## Testing (Future)

- Write unit tests for services
- Write integration tests for API endpoints
- Use Jest or Vitest
- Mock external services

## Common Patterns

### Pagination

```typescript
interface PaginationParams {
  page?: number
  limit?: number
}

async function getPaginated(params: PaginationParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.item.findMany({ skip, take: limit }),
    prisma.item.count(),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

### Soft Delete

```typescript
// Add deletedAt field to model
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
})

// Filter out deleted records
const users = await prisma.user.findMany({
  where: { deletedAt: null },
})
```

## Don'ts

- ❌ Don't use `any` type (use `unknown` if needed)
- ❌ Don't put business logic in controllers
- ❌ Don't put HTTP logic in services
- ❌ Don't use `var` (use `const` or `let`)
- ❌ Don't ignore errors (always handle or propagate)
- ❌ Don't log sensitive data (passwords, tokens, API keys)
- ❌ Don't use synchronous file operations in request handlers
- ❌ Don't trust user input
- ❌ Don't commit `.env` files
- ❌ Don't use `console.log` (use logger)
- ❌ Don't make database queries in loops (use batch operations)
- ❌ Don't forget to close database connections in tests
