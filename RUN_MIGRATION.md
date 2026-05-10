# Hướng dẫn chạy Migration: Many-to-Many Question-ExamSet

## Bước 1: Backup Database (QUAN TRỌNG!)

```bash
# PostgreSQL backup
pg_dump -U your_username -d your_database > backup_before_migration.sql
```

## Bước 2: Chạy Migration

```bash
cd server
npx prisma migrate deploy
```

Hoặc nếu đang development:

```bash
cd server
npx prisma migrate dev
```

## Bước 3: Generate Prisma Client

```bash
cd server
npx prisma generate
```

## Bước 4: Restart Server

```bash
cd server
npm run dev
```

## Bước 5: Test

### Test Backend:

1. Vào admin panel
2. Mở một bộ đề
3. Thử gán 1 câu hỏi vào đề
4. Mở bộ đề khác
5. Gán cùng câu hỏi đó vào đề thứ 2
6. ✅ Câu hỏi phải xuất hiện ở CẢ 2 đề

### Test Frontend:

1. Trong drawer "Chọn câu hỏi"
2. ✅ Phải thấy nhiều Tag màu xanh hiển thị tên các đề chứa câu hỏi
3. ✅ Không còn text "sẽ tự động gỡ khỏi bộ đề kia"

## Kiểm tra dữ liệu sau migration

```sql
-- Check question_assignments table
SELECT * FROM question_assignments LIMIT 10;

-- Check if questions still have examSetId (should be NULL or column removed)
SELECT id, "examSetId" FROM questions LIMIT 5;

-- Count assignments per question (should see some > 1)
SELECT "questionId", COUNT(*) as assignment_count
FROM question_assignments
GROUP BY "questionId"
HAVING COUNT(*) > 1;
```

## Rollback (nếu có vấn đề)

```bash
# Restore from backup
psql -U your_username -d your_database < backup_before_migration.sql

# Revert Prisma schema
git checkout HEAD~1 server/prisma/schema.prisma

# Regenerate client
cd server
npx prisma generate
```

## Troubleshooting

### Lỗi: "column examSetId does not exist"

- Chạy lại: `npx prisma migrate deploy`
- Restart server

### Lỗi: "relation question_assignments does not exist"

- Check migration đã chạy chưa: `SELECT * FROM _prisma_migrations;`
- Nếu chưa có migration mới nhất, chạy lại migrate

### Frontend không hiển thị đúng

- Clear browser cache
- Restart frontend dev server
- Check console log xem có lỗi API không

## Xác nhận thành công

✅ Backend:

- [ ] Bảng `question_assignments` đã được tạo
- [ ] Column `examSetId` đã bị xóa khỏi bảng `questions`
- [ ] Dữ liệu cũ đã được migrate sang bảng mới
- [ ] API `/exam-sets/:id` trả về `questions` array đúng
- [ ] API `/exam-sets/:id/assign` không còn báo lỗi "already assigned"

✅ Frontend:

- [ ] Drawer hiển thị nhiều Tag cho câu hỏi thuộc nhiều đề
- [ ] Có thể gán 1 câu vào nhiều đề
- [ ] Gỡ câu khỏi 1 đề không ảnh hưởng đề khác
- [ ] Tag "Bộ đề này" hiển thị màu xanh
- [ ] Tag các đề khác hiển thị màu xanh (không còn màu cam)
