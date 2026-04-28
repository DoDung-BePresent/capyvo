# Backend API TODO - Part Practice Page

## 📋 Cần implement 2 endpoints mới

### 1. GET `/api/questions/part/:partNumber/all`

Trả về tất cả câu hỏi của một part (flat list)

**Response:**

```typescript
{
  success: true,
  data: [
    {
      id: "q1",
      examSetId: "set1",
      examSetTitle: "Đề thi số 1",
      partNumber: 1,
      questionNumber: 1,
      contentText: "...",
      // ... other question fields
    },
    // ...
  ]
}
```

**Implementation:**

```typescript
// server/src/controllers/question.controller.ts
async getQuestionsByPart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const partNumber = Number(req.params.partNumber)
    const questions = await questionService.getQuestionsByPart(partNumber)
    res.json({ success: true, data: questions })
  } catch (err) {
    next(err)
  }
}

// server/src/services/question.service.ts
async getQuestionsByPart(partNumber: number) {
  const questions = await prisma.question.findMany({
    where: {
      partNumber,
      examSet: {
        isPublished: true
      }
    },
    include: {
      examSet: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: [
      { examSetId: 'asc' },
      { questionNumber: 'asc' }
    ]
  })

  return questions.map(q => ({
    ...q,
    examSetId: q.examSet?.id ?? '',
    examSetTitle: q.examSet?.title ?? '',
    examSet: undefined // Remove nested object
  }))
}
```

### 2. GET `/api/questions/part/:partNumber/exam-sets`

Trả về danh sách exam sets của một part (cho filter)

**Response:**

```typescript
{
  success: true,
  data: [
    {
      id: "set1",
      title: "Đề thi số 1",
      questionCount: 11
    },
    {
      id: "set2",
      title: "Đề thi số 2",
      questionCount: 11
    }
  ]
}
```

**Implementation:**

```typescript
// server/src/controllers/question.controller.ts
async getExamSetsByPart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const partNumber = Number(req.params.partNumber)
    const examSets = await questionService.getExamSetsByPart(partNumber)
    res.json({ success: true, data: examSets })
  } catch (err) {
    next(err)
  }
}

// server/src/services/question.service.ts
async getExamSetsByPart(partNumber: number) {
  const examSets = await prisma.examSet.findMany({
    where: {
      isPublished: true,
      questions: {
        some: {
          partNumber
        }
      }
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          questions: {
            where: {
              partNumber
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return examSets.map(set => ({
    id: set.id,
    title: set.title,
    questionCount: set._count.questions
  }))
}
```

## 🛣️ Routes

```typescript
// server/src/routes/question.routes.ts
router.get('/part/:partNumber/all', (req, res, next) => ctrl.getQuestionsByPart(req, res, next))

router.get('/part/:partNumber/exam-sets', (req, res, next) =>
  ctrl.getExamSetsByPart(req, res, next),
)
```

## ✅ Checklist

- [ ] Add methods to QuestionController
- [ ] Add methods to QuestionService
- [ ] Add routes
- [ ] Test endpoints
- [ ] Verify frontend integration

## 🎯 Benefits

- ✅ Không cần map thủ công ở frontend
- ✅ API tối ưu cho UI mới
- ✅ Giảm số lượng requests
- ✅ Response nhỏ gọn hơn
