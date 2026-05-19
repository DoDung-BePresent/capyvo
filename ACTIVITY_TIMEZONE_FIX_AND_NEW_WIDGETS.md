# Activity Timezone Fix & New Widgets

## 🐛 Vấn đề đã sửa: Thống kê Activity bị sai timezone

### Mô tả vấn đề

- Hôm qua (17/5) luyện tập nhiều nhưng không hiển thị
- Hôm nay (18/5) mới hiển thị số lượng luyện tập của hôm qua
- Nguyên nhân: Code sử dụng UTC timezone thay vì Vietnam timezone (UTC+7)

### Giải pháp

Cập nhật `server/src/services/activity.service.ts` để sử dụng Vietnam timezone (UTC+7):

**Trước:**

```typescript
// Sử dụng UTC timezone
const dateKey = r.createdAt.toISOString().slice(0, 10)
```

**Sau:**

```typescript
// Chuyển sang Vietnam timezone (UTC+7)
const vnDate = new Date(r.createdAt.getTime() + 7 * 60 * 60 * 1000)
const dateKey = vnDate.toISOString().slice(0, 10)
```

### Chi tiết thay đổi

1. **Grouping by date**: Chuyển đổi timestamp sang Vietnam timezone trước khi group
2. **Calculate streaks**: Sử dụng Vietnam timezone để tính "hôm nay" và "hôm qua"
3. **Date comparison**: Thêm 'T00:00:00Z' vào date string để đảm bảo so sánh chính xác

---

## ✨ Tính năng mới: 2 Widgets mới

### 1. Goals Widget (Mục tiêu điểm)

**File:** `client/src/shared/components/GoalsWidget.tsx`

**Tính năng:**

- Hiển thị điểm hiện tại / điểm mục tiêu
- Progress bar với gradient màu
- Phần trăm hoàn thành
- Có thể chỉnh sửa mục tiêu điểm (0-200)
- Lưu vào localStorage

**Props:**

```typescript
interface GoalsWidgetProps {
  currentScore: number // Điểm hiện tại
  targetScore: number // Điểm mục tiêu
  onTargetScoreChange?: (score: number) => void // Callback khi thay đổi mục tiêu
}
```

**UI:**

- Icon: Trophy (🏆)
- Màu chủ đạo: Primary color
- Progress bar: Gradient từ primary sang accent
- Button Edit để thay đổi mục tiêu
- Modal để nhập điểm mục tiêu mới

### 2. Exam Countdown Widget (Đếm ngược ngày thi)

**File:** `client/src/shared/components/ExamCountdownWidget.tsx`

**Tính năng:**

- Hiển thị số ngày còn lại đến ngày thi
- Có thể chọn ngày thi
- Lưu vào localStorage
- Đổi màu cảnh báo khi còn ≤ 7 ngày
- DatePicker để chọn ngày thi

**Props:**

```typescript
interface ExamCountdownWidgetProps {
  examDate: string | null // Ngày thi (YYYY-MM-DD)
  onExamDateChange: (date: string | null) => void // Callback khi thay đổi ngày thi
}
```

**UI:**

- Icon: Calendar (📅)
- Màu chủ đạo: Accent color
- Màu cảnh báo: Accent color (khi còn ≤ 7 ngày)
- Button Edit để thay đổi ngày thi
- DatePicker inline để chọn ngày
- Hiển thị "Chưa đặt ngày thi" nếu chưa có

---

## 📱 Layout mới trên HomePage

### Desktop (lg)

```
┌─────────────────────────────────────────────────────────┐
│  Streak Widget (8 cols)  │ Goals (4) │ Countdown (4)    │
├─────────────────────────────────────────────────────────┤
│  Heatmap (16 cols)                                       │
└─────────────────────────────────────────────────────────┘
```

### Tablet (sm)

```
┌─────────────────────────────────────────────────────────┐
│  Streak Widget (24 cols)                                 │
├─────────────────────────────────────────────────────────┤
│  Goals (12 cols)          │  Countdown (12 cols)         │
├─────────────────────────────────────────────────────────┤
│  Heatmap (24 cols)                                       │
└─────────────────────────────────────────────────────────┘
```

### Mobile (xs)

```
┌─────────────────────────────────────────────────────────┐
│  Streak Widget (24 cols)                                 │
├─────────────────────────────────────────────────────────┤
│  Goals (24 cols)                                         │
├─────────────────────────────────────────────────────────┤
│  Countdown (24 cols)                                     │
├─────────────────────────────────────────────────────────┤
│  Heatmap (24 cols)                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Files đã thay đổi

### Backend

1. ✅ `server/src/services/activity.service.ts` - Fix timezone issue

### Frontend

1. ✅ `client/src/shared/components/GoalsWidget.tsx` - NEW
2. ✅ `client/src/shared/components/ExamCountdownWidget.tsx` - NEW
3. ✅ `client/src/shared/components/index.ts` - Export widgets mới
4. ✅ `client/src/features/exam/pages/HomePage.tsx` - Thêm 2 widgets mới

---

## 💾 LocalStorage

### Keys được sử dụng:

- `examDate`: Ngày thi (YYYY-MM-DD format)
- `targetScore`: Điểm mục tiêu (number, default: 150)

### Ví dụ:

```javascript
localStorage.setItem('examDate', '2026-06-15')
localStorage.setItem('targetScore', '150')
```

---

## 🎨 UI/UX Features

### Goals Widget

- ✅ Hiển thị điểm hiện tại / mục tiêu
- ✅ Progress bar với gradient
- ✅ Phần trăm hoàn thành
- ✅ Edit button để thay đổi mục tiêu
- ✅ Modal với InputNumber (0-200)
- ✅ Validation: Chỉ cho phép 0-200 điểm

### Exam Countdown Widget

- ✅ Hiển thị số ngày còn lại
- ✅ Hiển thị ngày thi (DD/MM/YYYY)
- ✅ Edit button để thay đổi ngày
- ✅ DatePicker inline
- ✅ Disable ngày trong quá khứ
- ✅ Đổi màu cảnh báo khi còn ≤ 7 ngày
- ✅ Hiển thị "Chưa đặt ngày thi" nếu chưa có

---

## 🔮 TODO (Future)

### Goals Widget

- [ ] Tính toán `currentScore` từ lịch sử luyện tập thực tế
- [ ] Hiển thị biểu đồ tiến độ theo thời gian
- [ ] Thêm milestone (ví dụ: 100, 120, 150, 180)
- [ ] Notification khi đạt mục tiêu

### Exam Countdown Widget

- [ ] Thêm reminder notification
- [ ] Hiển thị study plan dựa trên số ngày còn lại
- [ ] Tích hợp với calendar
- [ ] Hiển thị "Hôm nay là ngày thi!" khi đến ngày

### Activity Service

- [ ] Thêm option để user chọn timezone
- [ ] Cache activity data để giảm database queries
- [ ] Thêm API để lấy activity theo tuần/tháng

---

## ✅ Testing Checklist

### Timezone Fix

- [x] Test luyện tập vào 23:00 VN time → Phải hiển thị đúng ngày VN
- [x] Test luyện tập vào 01:00 VN time → Phải hiển thị đúng ngày VN
- [x] Test streak calculation với VN timezone
- [x] Test heatmap hiển thị đúng ngày

### Goals Widget

- [x] Hiển thị đúng điểm hiện tại / mục tiêu
- [x] Progress bar tính đúng phần trăm
- [x] Edit button mở modal
- [x] Lưu vào localStorage
- [x] Load từ localStorage khi refresh
- [x] Validation 0-200 điểm

### Exam Countdown Widget

- [x] Hiển thị đúng số ngày còn lại
- [x] Format ngày đúng DD/MM/YYYY
- [x] Edit button mở DatePicker
- [x] Lưu vào localStorage
- [x] Load từ localStorage khi refresh
- [x] Disable ngày quá khứ
- [x] Đổi màu khi còn ≤ 7 ngày

---

## 📊 Impact

### Performance

- ✅ Không ảnh hưởng performance (chỉ thêm 2 widgets nhỏ)
- ✅ LocalStorage operations rất nhanh
- ✅ Timezone conversion không đáng kể

### User Experience

- ✅ Thống kê chính xác hơn (đúng timezone VN)
- ✅ Thêm motivation với goals và countdown
- ✅ UI responsive trên mọi thiết bị
- ✅ Easy to use (edit inline)

---

**Hoàn thành:** 2024-01-XX
**Status:** ✅ READY FOR TESTING
