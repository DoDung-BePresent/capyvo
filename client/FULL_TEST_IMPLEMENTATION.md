# Full Test Implementation Summary

## Tính năng đã implement

### 1. **Test Flow - Luồng thi thử**

```
Intro → Part Instruction → Questions (1-11) → Saving → Completed
```

**Chi tiết từng phase:**

- `intro`: Màn hình hướng dẫn ban đầu (TOEIC Speaking Test Directions)
- `part-instruction`: Hướng dẫn từng part (Part 1-5)
- `preparing`: Đếm ngược thời gian chuẩn bị
- `recording`: Đang ghi âm câu trả lời
- `saving`: Lưu câu trả lời và chuyển câu tiếp theo
- `completed`: Hoàn thành toàn bộ test, hiển thị kết quả

### 2. **Components đã tạo**

#### `TestIntroView.tsx`

- Hiển thị hướng dẫn tổng quan về TOEIC Speaking Test
- Bảng mô tả 11 câu hỏi và tiêu chí đánh giá
- Nút "Bắt đầu thi" (có check subscription)

#### `PartInstructionView.tsx`

- Hiển thị hướng dẫn từng part (Part 1-5)
- Auto-play audio instruction tương ứng
- Nút "Tiếp tục" để bắt đầu làm bài

#### `FullTestQuestionView.tsx`

- Hiển thị câu hỏi và tự động ghi âm
- Auto-play audio sequence:
  - Part 3: context audio → question audio → begin preparing
  - Part 4: question audio → begin preparing
  - Part 5: question audio → begin preparing
- Tự động đếm ngược prep time → record time
- Phát "begin preparing now" và "begin speaking now"
- Không có nút Cancel (khác với practice mode)

#### `SavingView.tsx`

- Hiển thị khi đang lưu câu trả lời
- Phát "end-sound.mp3"
- Thông báo: "Stop Talking - Your response time has ended..."

### 3. **Audio Files được sử dụng**

```
/sounds/instructions/
├── instruction-part-1.mp3  (Hướng dẫn Part 1)
├── instruction-part-2.mp3  (Hướng dẫn Part 2)
├── instruction-part-3.mp3  (Hướng dẫn Part 3)
├── instruction-part-4.mp3  (Hướng dẫn Part 4)
├── instruction-part-5.mp3  (Hướng dẫn Part 5)
├── begin-preparing-now.mp3 (Bắt đầu chuẩn bị)
├── begin-speaking-now.mp3  (Bắt đầu nói)
└── end-sound.mp3           (Kết thúc câu trả lời)
```

### 4. **Test State Management**

```typescript
interface TestState {
  phase: TestPhase
  currentPartNumber: number // 1-5
  currentQuestionIndex: number // Index trong part hiện tại
  responses: Map<string, string> // questionId -> responseId
  startTime: Date | null
  endTime: Date | null
}
```

### 5. **Cơ chế chuyển câu**

```typescript
// Sau khi ghi âm xong:
1. Save audio → get responseId
2. Transcribe & analyze (background)
3. Store result
4. Check: Last question in part?
   - Yes → Move to next part instruction
   - No → Move to next question
5. Check: Last part (Part 5)?
   - Yes → Show completed view
   - No → Continue
```

### 6. **History Panel Logic**

```typescript
// Chỉ hiển thị history panel khi:
- phase === 'intro'  (Chưa bắt đầu)
- phase === 'completed' (Đã hoàn thành)

// Ẩn history panel khi đang thi:
- phase === 'part-instruction'
- phase === 'preparing'
- phase === 'recording'
- phase === 'saving'
```

### 7. **Subscription Check**

```typescript
// Check subscription trước khi bắt đầu thi
useEffect(() => {
  const checkSubscription = async () => {
    const result = await responseService.checkSubscription()
    setHasAccess(result.hasAccess)
    setDaysRemaining(result.daysRemaining)
  }
  checkSubscription()
}, [])

// Nếu không có access → hiển thị nút "Mua gói ngay"
```

## Cách sử dụng

### 1. **Route**

```
/exam/:examSetId/test
```

### 2. **Từ ExamListPage**

```tsx
<Link to={`/exam/${examSet.id}/test`}>
  <Button>Thi thử</Button>
</Link>
```

### 3. **Flow người dùng**

1. Vào trang exam list
2. Chọn một exam set
3. Click "Thi thử"
4. Đọc hướng dẫn tổng quan → Click "Bắt đầu thi"
5. Đọc hướng dẫn Part 1 → Click "Tiếp tục"
6. Làm câu 1-2 (Part 1)
7. Đọc hướng dẫn Part 2 → Click "Tiếp tục"
8. Làm câu 3-4 (Part 2)
9. ... (tương tự cho Part 3, 4, 5)
10. Hoàn thành → Xem kết quả

## Khác biệt với Practice Mode

| Feature              | Practice Mode | Full Test Mode            |
| -------------------- | ------------- | ------------------------- |
| **Intro**            | Không có      | Có (TOEIC directions)     |
| **Part Instruction** | Không có      | Có (mỗi part)             |
| **Cancel Button**    | Có            | Không                     |
| **Skip Prep**        | Có            | Không                     |
| **History Panel**    | Luôn hiển thị | Chỉ ở intro & completed   |
| **Result View**      | Sau mỗi câu   | Sau khi hoàn thành tất cả |
| **Audio Sequence**   | Manual play   | Auto-play theo flow       |

## TODO - Cần hoàn thiện

### 1. **Completed View**

- [ ] Hiển thị tổng điểm
- [ ] Hiển thị chi tiết từng câu
- [ ] Nút "Xem chi tiết" cho từng câu
- [ ] Nút "Thi lại"
- [ ] Nút "Về trang chủ"

### 2. **Session Management**

- [ ] Lưu session ID để có thể resume
- [ ] Xử lý trường hợp user refresh page
- [ ] Xử lý trường hợp user đóng tab

### 3. **Error Handling**

- [ ] Xử lý lỗi khi save audio failed
- [ ] Xử lý lỗi khi transcribe failed
- [ ] Retry mechanism

### 4. **UX Improvements**

- [ ] Loading state khi chuyển câu
- [ ] Progress bar (đã làm x/11 câu)
- [ ] Confirm dialog khi user muốn thoát giữa chừng

### 5. **Audio Optimization**

- [ ] Preload audio files
- [ ] Cache audio files
- [ ] Fallback khi audio không load được

## Testing Checklist

- [ ] Test flow từ đầu đến cuối
- [ ] Test với user không có subscription
- [ ] Test với user có subscription hết hạn
- [ ] Test audio auto-play trên các browser
- [ ] Test recording trên các browser
- [ ] Test với các exam set khác nhau
- [ ] Test error cases (network error, etc.)
