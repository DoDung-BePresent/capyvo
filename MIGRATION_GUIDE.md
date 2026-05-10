# Migration Guide: Many-to-Many Question-ExamSet Relationship

## Thay đổi

Chuyển từ quan hệ **one-to-many** sang **many-to-many** giữa Question và ExamSet:

### Trước:

- 1 câu hỏi chỉ thuộc 1 đề
- Khi gán câu vào đề mới → tự động gỡ khỏi đề cũ

### Sau:

- 1 câu hỏi có thể thuộc nhiều đề
- Khi gán câu vào đề mới → KHÔNG gỡ khỏi đề cũ
- Phù hợp cho bộ đề dự đoán (FORECAST) - có thể chia sẻ câu hỏi giữa các đề

## Cách chạy migration

```bash
cd server
npx prisma migrate deploy
```

## Thay đổi database schema

### Bảng mới: `question_assignments`

```sql
CREATE TABLE "question_assignments" (
  "id" TEXT PRIMARY KEY,
  "examSetId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "questionNumber" INTEGER NOT NULL,  -- Vị trí trong đề cụ thể
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `questions`

- **Xóa**: `examSetId` column
- **Xóa**: `@@unique([examSetId, questionNumber])` constraint

## Thay đổi code

### Backend Services Updated:

1. `exam-set.service.ts` - Sử dụng `questionAssignments` thay vì `questions`
2. `question.service.ts` - Query qua bảng `question_assignments`

### API Endpoints (không đổi):

- `POST /exam-sets/:id/assign` - Gán câu vào đề
- `POST /exam-sets/:id/unassign` - Gỡ câu khỏi đề

### Behavior Changes:

- `assignQuestion()`: Không còn check "already assigned to another exam set"
- `unassignQuestion()`: Chỉ gỡ khỏi đề được chỉ định, không ảnh hưởng đề khác
- `getPoolQuestions()`: Trả về `examSets[]` thay vì `examSet` (show tất cả đề chứa câu này)

## Full Test Logic

Đề chỉ hiển thị trong Full Test nếu:

```typescript
questionAssignments.length === 11 // Đủ 11 câu
```

## Practice View Logic

Câu hỏi hiển thị trong Practice nếu:

```typescript
examSet.isPublished === true // Đề đã public
// Không cần check số lượng câu
```

## UI Changes Needed

### Admin - Question Assignment View:

```tsx
// Trước: Hiển thị 1 đề
;<Tag>Đã gán: {question.examSet?.title}</Tag>

// Sau: Hiển thị nhiều đề
{
  question.examSets.map((set) => <Tag key={set.id}>{set.title}</Tag>)
}
```

### Admin - Assign Button:

```tsx
// Trước: Disable nếu đã gán vào đề khác
disabled={question.examSetId && question.examSetId !== currentExamSetId}

// Sau: Disable nếu đã gán vào đề HIỆN TẠI
disabled={question.examSets.some(s => s.id === currentExamSetId)}
```

## Rollback (nếu cần)

Không thể rollback tự động vì mất thông tin "câu thuộc đề nào". Cần restore từ backup.

## Testing Checklist

- [ ] Gán 1 câu vào nhiều đề
- [ ] Gỡ câu khỏi 1 đề, check đề khác vẫn còn
- [ ] Full Test chỉ hiện đề có đủ 11 câu
- [ ] Practice hiện tất cả câu đã public (dù đề chưa đủ)
- [ ] UI hiển thị danh sách đề chứa câu hỏi
