# Practice Mode - Nullable examSetId

## Problem

Practice mode (luyện từng câu ngẫu nhiên) không có exam set cụ thể, nhưng database schema yêu cầu `examSetId` bắt buộc.

## Solution

Make `examSetId` nullable trong `PracticeSession` model.

## Changes

### 1. Database Schema

**File:** `server/prisma/schema.prisma`

```prisma
model PracticeSession {
  id          String        @id @default(uuid())
  userId      String
  examSetId   String?       // ✅ Now nullable
  partNumber  Int?
  status      SessionStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now())
  completedAt DateTime?

  user          User           @relation(fields: [userId], references: [id])
  examSet       ExamSet?       // ✅ Now optional relation
  userResponses UserResponse[]

  @@map("practice_sessions")
}
```

**Meaning:**

- `examSetId = null` → Practice mode (individual questions)
- `examSetId = "some-id"` → Exam mode (specific exam set)

### 2. Backend Controller

**File:** `server/src/controllers/session.controller.ts`

```typescript
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { examSetId, partNumber } = req.body

  // Convert empty string to null
  const effectiveExamSetId = examSetId && examSetId.trim() !== '' ? examSetId : null

  const session = await this.service.createSession(userId, effectiveExamSetId, part)
  // ...
}
```

**Changes:**

- ❌ Removed: `if (!examSetId) throw new ValidationError('examSetId is required')`
- ✅ Added: Convert empty string to `null`

### 3. Backend Service

**File:** `server/src/services/session.service.ts`

```typescript
async createSession(
  userId: string,
  examSetId: string | null,  // ✅ Now accepts null
  partNumber?: number | null
) {
  return prisma.practiceSession.create({
    data: {
      userId,
      examSetId: examSetId ?? undefined,  // null → undefined for Prisma
      partNumber: partNumber ?? null,
      status: 'IN_PROGRESS'
    },
  })
}
```

**Changes:**

- ✅ Parameter type: `string` → `string | null`
- ✅ Convert `null` to `undefined` for Prisma (optional field)

## Migration

Run this command to apply schema changes:

```bash
npx prisma migrate dev --name make_examsetid_nullable_in_practice_sessions
```

**Migration SQL:**

```sql
-- AlterTable
ALTER TABLE "practice_sessions"
ALTER COLUMN "examSetId" DROP NOT NULL;
```

## Benefits

### ✅ Cleaner Design

- No need for fake "PRACTICE" exam set
- Database accurately represents the data model
- Practice sessions are truly independent

### ✅ Better Queries

```typescript
// Get all practice sessions (no exam set)
const practiceSessions = await prisma.practiceSession.findMany({
  where: { examSetId: null },
})

// Get all exam sessions
const examSessions = await prisma.practiceSession.findMany({
  where: { examSetId: { not: null } },
})
```

### ✅ Type Safety

```typescript
// TypeScript knows examSet can be null
session.examSet?.title // ✅ Safe optional chaining
```

## Testing Checklist

### Practice Mode

- [ ] Create practice session → `examSetId = null`
- [ ] Save audio response → Works
- [ ] View session history → Shows "Practice Mode"
- [ ] Session detail → No exam set info

### Exam Mode

- [ ] Create exam session → `examSetId = "some-id"`
- [ ] Save audio response → Works
- [ ] View session history → Shows exam set title
- [ ] Session detail → Shows exam set info

### Edge Cases

- [ ] Frontend sends empty string `""` → Converted to `null`
- [ ] Frontend sends `null` → Stays `null`
- [ ] Frontend sends valid ID → Stays as ID

## Files Modified

**Schema:**

- `server/prisma/schema.prisma`

**Backend:**

- `server/src/controllers/session.controller.ts`
- `server/src/services/session.service.ts`

**Frontend:**

- No changes needed (already sends empty string for practice mode)

## Notes

- Existing sessions with `examSetId` will continue to work
- New practice sessions will have `examSetId = null`
- Frontend doesn't need changes (already handles this correctly)
- Migration is backward compatible
