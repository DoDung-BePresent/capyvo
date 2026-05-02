# Tổng quan các tính năng mở rộng - Capyvo

## Mục tiêu chung

Xây dựng hệ sinh thái hoàn chỉnh cho việc luyện thi TOEIC Speaking, bao gồm:

1. Thu hút người dùng mới (Free Trial)
2. Tăng conversion và retention (Voucher System)
3. Xây dựng cộng đồng giảng viên (Manual Review + Class Management)

---

## Roadmap triển khai

### Phase 0: Foundation (Đã hoàn thành)

- ✅ Hệ thống AI chấm tự động (Whisper + GPT)
- ✅ Subscription-based access control
- ✅ Payment integration (PayOS)
- ✅ Practice session management
- ✅ Question bank (5 parts)

### Phase 1: Manual Review System (MVP) - 2 tuần

**Mục tiêu:** Thu hút giảng viên vào hệ thống, tăng giá trị gói Pro

**Tính năng chính:**

- User Pro request manual review (5 part reviews + 1 full test/tháng)
- Instructor worklist (FIFO - first come first serve)
- Instructor claim & complete review
- Student rating system

**Lợi ích:**

- User: Feedback chi tiết từ giảng viên (miễn phí trong gói Pro)
- Instructor: Xây dựng portfolio, làm quen platform
- Platform: Tăng value gói Pro, thu hút instructors

### Phase 2: Free Trial System - 1 tuần

**Mục tiêu:** Tăng số lượng người dùng mới, giảm rào cản thử nghiệm

**Tính năng chính:**

- 5 lần luyện tập HOẶC 7 ngày (cái nào hết trước)
- Email verification bắt buộc
- Device fingerprinting
- IP-based rate limiting

**Lợi ích:**

- User: Dùng thử trước khi quyết định mua
- Platform: Tăng conversion rate, expand user base

### Phase 3: Voucher System - 1 tuần

**Mục tiêu:** Marketing tool, tăng sales trong các đợt campaign

**Tính năng chính:**

- Tạo voucher code (% hoặc fixed amount)
- Usage limit + per-user limit
- Transaction-safe application
- Auto-expire

**Lợi ích:**

- Marketing: Chạy campaign, referral program
- Sales: Flash sale, seasonal promotion
- Retention: Reward loyal users

### Phase 4: Class Management System - 3-4 tuần

**Mục tiêu:** Monetize instructors, tạo B2B revenue stream

**Tính năng chính:**

- Instructor tạo classes (tối đa 30 học viên/class)
- Student join class bằng code
- Assignment management
- Progress tracking & grading
- Export reports

**Lợi ích:**

- Instructor: Quản lý lớp tập trung, tiết kiệm thời gian
- Student: Học có hệ thống, theo dõi tiến độ
- Platform: B2B revenue (500k/instructor/tháng)

---

## Ưu tiên triển khai

**Ngay lập tức:**

1. **Manual Review System** - Quick win, high value, thu hút instructors

**Sau 1 tháng:** 2. **Free Trial System** - Tăng user acquisition 3. **Voucher System** - Marketing tool

**Sau 3 tháng:** 4. **Class Management** - Khi đã có base instructors từ Manual Review

---

## Metrics theo dõi

### User Metrics

- Free trial → Pro conversion rate
- Pro user retention rate
- Average reviews requested per user
- User satisfaction (NPS)

### Instructor Metrics

- Number of active instructors
- Reviews completed per instructor
- Average instructor rating
- Manual Review → Class Management conversion

### Business Metrics

- MRR (Monthly Recurring Revenue)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Churn rate

---

## Tài liệu chi tiết

- [Phase 1: Manual Review System](./01-manual-review-system.md)
- [Phase 2: Free Trial System](./02-free-trial-system.md)
- [Phase 3: Voucher System](./03-voucher-system.md)
- [Phase 4: Class Management System](./04-class-management-system.md)
