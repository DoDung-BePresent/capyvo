# Database & Prisma Rules

## Prisma Schema Guidelines

### Model Naming

- Use PascalCase for model names (e.g., `User`, `ExamSet`)
- Use singular form (e.g., `User` not `Users`)
- Use descriptive names that reflect domain concepts

### Field Naming

- Use camelCase for field names (e.g., `fullName`, `createdAt`)
- Use descriptive names
- Boolean fields should start with `is`, `has`, or `can` (e.g., `isPremium`, `hasAccess`)

### Table Naming

- Use snake_case for table names via `@@map`
- Use plural form (e.g., `@@map("users")`)

```prisma
model User {
  id        String   @id @default(uuid())
  fullName  String?
  isPremium Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("users")
}
```

## Relationships

### One-to-Many

```prisma
model User {
  id       String    @id
  sessions Session[]

  @@map("users")
}

model Session {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id])

  @@map("sessions")
}
```

### Many-to-Many (Junction Table)

```prisma
model Question {
  id                 String               @id
  examSetAssignments QuestionAssignment[]

  @@map("questions")
}

model ExamSet {
  id                  String               @id
  questionAssignments QuestionAssignment[]

  @@map("exam_sets")
}

model QuestionAssignment {
  id             String   @id @default(uuid())
  examSetId      String
  questionId     String
  questionNumber Int

  examSet  ExamSet  @relation(fields: [examSetId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([examSetId, questionNumber])
  @@index([examSetId])
  @@index([questionId])
  @@map("question_assignments")
}
```

## Indexes

### When to Add Indexes

- Foreign keys (automatically indexed by Prisma)
- Fields used in WHERE clauses frequently
- Fields used in ORDER BY
- Composite indexes for common query patterns

```prisma
model Question {
  id         String @id
  partNumber Int
  status     String
  type       String

  @@index([partNumber])
  @@index([status])
  @@index([partNumber, status]) // Composite index
  @@map("questions")
}
```

## Enums

### Define Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum QuestionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id   String @id
  role Role   @default(USER)
}
```

## Default Values

### Use Appropriate Defaults

```prisma
model User {
  id        String   @id @default(uuid())
  role      Role     @default(USER)
  isPremium Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Cascading Deletes

### Use onDelete Cascade for Dependent Data

```prisma
model User {
  id            String         @id
  subscriptions Subscription[]
}

model Subscription {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Migrations

### Creating Migrations

```bash
# Create migration
npx prisma migrate dev --name add_user_premium_fields

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

### Migration Best Practices

- Always review generated SQL before applying
- Test migrations on staging before production
- Never edit migration files manually
- Use descriptive migration names
- Keep migrations small and focused

## Seeding

### Seed File Structure

```typescript
// prisma/seed.ts
import prisma from '../src/lib/prisma'

async function main() {
  // Seed data
  await prisma.subscriptionPlan.createMany({
    data: [
      { id: 'BASIC', name: 'Basic', durationDays: 30, price: 99000 },
      { id: 'PREMIUM', name: 'Premium', durationDays: 90, price: 249000 },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Run Seeds

```bash
npm run seed
```

## Query Optimization

### Select Only Needed Fields

```typescript
// ❌ Bad - Fetches all fields
const users = await prisma.user.findMany()

// ✅ Good - Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true,
  },
})
```

### Use Include Wisely

```typescript
// ❌ Bad - Over-fetching
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    sessions: true,
    payments: true,
    subscriptions: true,
  },
})

// ✅ Good - Include only what's needed
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    subscriptions: {
      where: { status: 'ACTIVE' },
      take: 1,
    },
  },
})
```

### Batch Operations

```typescript
// ❌ Bad - N+1 queries
for (const userId of userIds) {
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  })
}

// ✅ Good - Single query
await prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { isPremium: true },
})
```

### Use Transactions for Related Operations

```typescript
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({ data: paymentData })

  await tx.subscription.create({
    data: {
      userId,
      planId: 'PREMIUM',
      startDate: new Date(),
      endDate: addDays(new Date(), 90),
    },
  })

  await tx.user.update({
    where: { id: userId },
    data: { isPremium: true, premiumUntil: addDays(new Date(), 90) },
  })
})
```

## Common Query Patterns

### Pagination

```typescript
const page = 1
const limit = 10
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  prisma.question.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.question.count(),
])
```

### Search with Filters

```typescript
const questions = await prisma.question.findMany({
  where: {
    partNumber: 1,
    status: 'PUBLISHED',
    OR: [
      { contentText: { contains: search, mode: 'insensitive' } },
      { questionText: { contains: search, mode: 'insensitive' } },
    ],
  },
})
```

### Aggregations

```typescript
const stats = await prisma.userResponse.aggregate({
  where: { userId },
  _avg: { overallScore: true },
  _count: { id: true },
})
```

### Group By

```typescript
const questionsByPart = await prisma.question.groupBy({
  by: ['partNumber'],
  _count: { id: true },
  where: { status: 'PUBLISHED' },
})
```

## Data Validation

### Use Prisma Validation

```prisma
model User {
  email    String  @unique
  fullName String? @db.VarChar(100)
  age      Int?    @db.SmallInt
}
```

### Additional Validation in Service Layer

```typescript
// Use Zod for complex validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
})
```

## Error Handling

### Prisma Error Codes

```typescript
try {
  await prisma.user.create({ data })
} catch (err) {
  const error = err as { code?: string }

  switch (error.code) {
    case 'P2002': // Unique constraint violation
      throw new ConflictError('Email already exists')
    case 'P2025': // Record not found
      throw new NotFoundError('User')
    default:
      throw err
  }
}
```

## Connection Management

### Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
```

## Best Practices

### Do's

- ✅ Use transactions for related operations
- ✅ Add indexes for frequently queried fields
- ✅ Use select/include to fetch only needed data
- ✅ Use batch operations instead of loops
- ✅ Handle Prisma errors appropriately
- ✅ Use enums for fixed sets of values
- ✅ Add unique constraints where appropriate
- ✅ Use cascading deletes for dependent data
- ✅ Keep migrations small and focused
- ✅ Test migrations on staging first

### Don'ts

- ❌ Don't make queries in loops (N+1 problem)
- ❌ Don't fetch all fields if you only need a few
- ❌ Don't ignore Prisma errors
- ❌ Don't edit migration files manually
- ❌ Don't use raw SQL unless absolutely necessary
- ❌ Don't forget to disconnect in tests
- ❌ Don't over-index (impacts write performance)
- ❌ Don't use nullable fields when not needed
- ❌ Don't forget to add indexes on foreign keys
- ❌ Don't commit schema changes without migrations
