# Hướng dẫn: Validation Bộ đề (ExamSet)

## Vấn đề đã giải quyết

Trước đây, các bộ đề dự đoán (FORECAST) thường không đủ 11 câu hỏi nhưng vẫn được publish, gây lỗi khi user làm bài.

## Giải pháp

### 1. Database Schema

Thêm trường `isComplete` vào bảng `exam_sets`:

- `isComplete = true`: Bộ đề có đủ 11 câu hỏi
- `isComplete = false`: Bộ đề chưa đủ câu

### 2. Backend Logic

#### Khi publish (toggle switch):

- ✅ Validate: Chỉ cho publish nếu có đủ 11 câu
- ✅ Tự động set `isComplete = true` khi publish thành công
- ❌ Throw error nếu < 11 câu: "Cannot publish exam set with only X/11 questions"

#### Khi gán/gỡ câu hỏi:

- ✅ Tự động update `isComplete` sau mỗi thao tác
- ✅ Tự động **unpublish** nếu gỡ câu khiến < 11 câu
- ✅ Bảo vệ user đang làm bài: Nếu đề đang published mà bị gỡ câu → tự động unpublish

#### API `/exam-sets/published`:

- Chỉ trả về đề có `isPublished = true AND isComplete = true`
- User không thể thấy đề chưa đủ câu

### 3. Frontend UI

#### Trang danh sách bộ đề (`/admin/exam-sets`):

- Cột "Câu hỏi": Hiển thị `X / 11` với dấu ✓ màu xanh nếu đủ
- Cột "Trạng thái":
  - 🟢 "Đã xuất bản" - nếu published & complete
  - 🟠 "Chưa đủ câu" - nếu < 11 câu
  - ⚪ "Nháp" - nếu đủ câu nhưng chưa publish

#### Trang chi tiết bộ đề (`/admin/exam-sets/:id`):

- Switch "Xuất bản":
  - **Disabled** nếu chưa đủ 11 câu
  - Hiển thị text "(Cần đủ 11 câu)" bên cạnh
- Khi gán/gỡ câu:
  - Backend tự động update `isComplete`
  - Nếu gỡ câu khiến < 11 → tự động unpublish

### 4. Workflow Admin

#### Tạo bộ đề mới:

1. Tạo bộ đề → status: "Nháp", `isComplete = false`
2. Gán từng câu hỏi (1-11)
3. Khi đủ 11 câu → `isComplete = true`, switch "Xuất bản" được enable
4. Bật switch → status: "Đã xuất bản"

#### Sửa bộ đề đang published:

1. Nếu gỡ câu → tự động unpublish (bảo vệ user)
2. Gán lại câu đủ 11 → có thể publish lại
3. **Không cần unpublish thủ công** trước khi sửa

## Migration

```bash
cd server
npx prisma migrate deploy
# hoặc
npx prisma migrate dev
```

Migration sẽ:

- Thêm cột `isComplete` với default `false`
- Các bộ đề hiện tại sẽ có `isComplete = false`
- Admin cần kiểm tra và publish lại các đề đã đủ 11 câu

## Testing

### Test case 1: Publish đề chưa đủ câu

1. Tạo bộ đề mới
2. Gán 5 câu hỏi
3. Bật switch "Xuất bản"
4. ✅ Expect: Error "Cannot publish exam set with only 5/11 questions"

### Test case 2: Gỡ câu khỏi đề đang published

1. Tạo bộ đề với 11 câu và publish
2. Gỡ 1 câu hỏi
3. ✅ Expect: Đề tự động unpublish, status = "Chưa đủ câu"

### Test case 3: User không thấy đề chưa đủ câu

1. Tạo bộ đề với 8 câu và publish (sẽ fail)
2. Vào `/exam` với user account
3. ✅ Expect: Đề không hiển thị trong danh sách

### Test case 4: Gán đủ câu và publish

1. Tạo bộ đề mới
2. Gán đủ 11 câu
3. Switch "Xuất bản" được enable
4. Bật switch
5. ✅ Expect: Status = "Đã xuất bản", user thấy được đề

## Lưu ý

- ⚠️ **Không cần unpublish thủ công** trước khi sửa đề - hệ thống tự động xử lý
- ⚠️ Nếu đề đang có user làm bài mà bị unpublish, session của họ vẫn tiếp tục (không bị gián đoạn)
- ⚠️ Các đề cũ cần được admin kiểm tra và publish lại sau khi chạy migration
