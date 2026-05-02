# Phase 1: Manual Review System (MVP)

## Tổng quan

Hệ thống cho phép người dùng Pro yêu cầu giảng viên chấm chữa chi tiết bài làm của họ. Giảng viên làm việc theo mô hình "worklist" - ai nhận trước làm trước, không có thanh toán (làm free để xây dựng portfolio).

**Thời gian triển khai:** 2 tuần  
**Độ ưu tiên:** Cao (Quick win)

---

## Mục tiêu nghiệp vụ

### Cho người dùng (Pro)

- Nhận feedback chi tiết từ giảng viên thực
- Hiểu rõ lỗi sai và cách cải thiện
- Bổ sung góc nhìn con người (human touch) cho AI scoring
- Miễn phí (đã bao gồm trong gói Pro)

### Cho giảng viên

- Làm quen với platform không rủi ro
- Xây dựng portfolio (số reviews + rating)
- Showcase chuyên môn để thu hút học viên
- Chuẩn bị cho tính năng Class Management (Phase 4)

### Cho platform

- Tăng giá trị gói Pro (justify tăng giá 50%)
- Thu hút giảng viên vào ecosystem
- Test market cho Class Management
- Xây dựng cộng đồng instructors + students

---

## Quy trình nghiệp vụ

### 1. Đăng ký làm giảng viên

**Actor:** User có tài khoản

**Flow:**

1. User click "Trở thành giảng viên"
2. Điền form:
   - Tên hiển thị
   - Giới thiệu bản thân (bio)
   - Kinh nghiệm giảng dạy
   - Chứng chỉ (optional: upload ảnh)
3. Submit → Status: Chờ duyệt
4. Admin xem đơn → Approve/Reject
5. Nếu approved → User nhận email thông báo
6. Instructor có thể vào worklist

**Business Rules:**

- Mỗi user chỉ đăng ký 1 lần
- Admin phải approve trước khi instructor hoạt động
- Instructor có thể bị suspend nếu rating thấp

---

### 2. User yêu cầu review

**Actor:** User có gói Pro active

**Điều kiện:**

- User có gói Pro còn hiệu lực
- Chưa hết quota (5 part reviews + 1 full test review/tháng)
- Practice session đã hoàn thành (status = COMPLETED)
- Session chưa được yêu cầu review trước đó

**Flow:**

1. User vào trang kết quả (ResultPage) sau khi làm bài
2. Thấy button "Yêu cầu review từ giảng viên"
3. Click → Hiển thị modal:
   - Loại review: Part review / Full test review
   - Quota còn lại: X/5 part reviews, X/1 full test review
   - Lưu ý: Review sẽ được hoàn thành trong 48 giờ
4. Confirm → Tạo review request
5. Request vào worklist (status: PENDING)
6. User nhận thông báo: "Yêu cầu đã được gửi, vui lòng chờ giảng viên nhận"

**Business Rules:**

- Quota reset vào đầu tháng (ngày 1)
- Quota không rollover (không cộng dồn)
- Nếu request không ai claim sau 7 ngày → Expired, hoàn lại quota
- Mỗi session chỉ được request review 1 lần

**Quota:**

- Part review: 5 lần/tháng (review 1 part = 11 câu)
- Full test review: 1 lần/tháng (review cả 5 parts)

---

### 3. Instructor xem worklist

**Actor:** Instructor đã được verify

**Flow:**

1. Instructor login → Vào "Worklist"
2. Thấy danh sách review requests (status: PENDING)
3. Sắp xếp: Oldest first (FIFO - first in first out)
4. Filter: Part 1-5 | Full Test
5. Mỗi request hiển thị:
   - Student name (ẩn bớt: "Nguyễn V\*\*\*")
   - Review type (Part 1 | Full Test)
   - Thời gian request (2 giờ trước)
   - Preview: Số câu, tổng thời gian audio
6. Click vào request → Xem chi tiết:
   - Nghe audio từng câu
   - Xem transcript
   - Xem AI analysis
7. Button: "Nhận review này"

**Business Rules:**

- Chỉ instructor verified mới thấy worklist
- Instructor tối đa claim 3 reviews cùng lúc
- Không thể claim nếu đã có 3 reviews đang làm (status: CLAIMED/IN_PROGRESS)

---

### 4. Instructor claim review

**Actor:** Instructor

**Flow:**

1. Instructor click "Nhận review này"
2. System check:
   - Review vẫn còn PENDING (chưa ai claim)
   - Instructor chưa có quá 3 reviews đang làm
3. Nếu OK → Update status: CLAIMED
4. Instructor được chuyển đến trang review editor
5. Có 48 giờ để hoàn thành

**Business Rules:**

- First come first serve (ai click trước được trước)
- Nếu 2 instructors claim cùng lúc → Người đầu tiên được, người sau báo lỗi
- Sau 48 giờ không complete → Auto-unclaim, trả về worklist
- Instructor không được cancel sau khi claim (trừ lý do chính đáng, cần admin approve)

---

### 5. Instructor hoàn thành review

**Actor:** Instructor

**Flow:**

1. Instructor vào trang review editor
2. Xem lại toàn bộ session:
   - Nghe từng câu audio
   - Xem transcript
   - Xem AI analysis (tham khảo)
3. Điền feedback form:
   - **Detailed Feedback** (bắt buộc, min 50 ký tự):
     - Chi tiết từng lỗi phát âm, ngữ pháp, từ vựng
     - Ví dụ: "Câu 3: Bạn phát âm 'schedule' sai, nên đọc là /ˈʃedjuːl/"
   - **Suggestions** (bắt buộc, min 50 ký tự):
     - Gợi ý cải thiện cụ thể
     - Ví dụ: "Nên luyện thêm các từ có âm /ʃ/, xem video phát âm..."
   - **Overall Comment** (bắt buộc, min 30 ký tự):
     - Nhận xét chung về bài làm
     - Ví dụ: "Bài làm tốt, cần chú ý phát âm và tốc độ nói"
4. Click "Hoàn thành review"
5. System validate:
   - Tất cả fields đã điền đủ
   - Độ dài tối thiểu đạt yêu cầu
6. Nếu OK → Update status: COMPLETED
7. Instructor stats tăng: totalReviews + 1
8. Student nhận notification: "Review của bạn đã hoàn thành"

**Business Rules:**

- Feedback phải đủ chi tiết (min length)
- Không được copy-paste AI analysis
- Admin có thể spot check chất lượng
- Instructor có rating < 3.0 → Warning
- Instructor có rating < 2.5 sau 10 reviews → Suspend

---

### 6. Student xem kết quả review

**Actor:** Student (user đã request review)

**Flow:**

1. Student nhận notification → Click vào
2. Hoặc vào ResultPage → Tab "Instructor Review"
3. Xem nội dung review:
   - Instructor name + avatar
   - Rating của instructor (nếu có)
   - Detailed Feedback
   - Suggestions
   - Overall Comment
4. Button: "Đánh giá giảng viên"

**Business Rules:**

- Chỉ xem được khi review status = COMPLETED
- Có thể xem lại bất cứ lúc nào

---

### 7. Student đánh giá instructor

**Actor:** Student

**Flow:**

1. Student click "Đánh giá giảng viên"
2. Modal hiển thị:
   - Rating: 1-5 sao (bắt buộc)
   - Comment: Textarea (optional)
3. Submit → Lưu rating
4. Tính lại average rating của instructor
5. Hiển thị "Cảm ơn bạn đã đánh giá"

**Business Rules:**

- Mỗi review chỉ được đánh giá 1 lần
- Không thể sửa rating sau khi submit
- Rating ảnh hưởng đến instructor reputation
- Instructor có thể xem ratings của mình

---

## Các trạng thái (Status Flow)

### Review Status

```
PENDING → CLAIMED → IN_PROGRESS → COMPLETED
   ↓
EXPIRED (sau 7 ngày không ai claim)
   ↓
CANCELLED (user hủy, hiếm khi xảy ra)
```

**PENDING:**

- Review mới tạo, chờ instructor claim
- Hiển thị trong worklist
- Tự động expire sau 7 ngày

**CLAIMED:**

- Instructor đã nhận review
- Có 48 giờ để hoàn thành
- Không hiển thị trong worklist nữa

**IN_PROGRESS:**

- Instructor đang làm review (optional status)
- Có thể bỏ qua, chuyển thẳng CLAIMED → COMPLETED

**COMPLETED:**

- Review đã hoàn thành
- Student có thể xem và đánh giá

**EXPIRED:**

- Không ai claim sau 7 ngày
- Quota được hoàn lại cho user
- Không hiển thị trong worklist

**CANCELLED:**

- User hoặc admin hủy review
- Quota được hoàn lại

---

## Chống lạm dụng (Anti-Abuse)

### 1. Quota System

- Pro user: 5 part reviews + 1 full test review/tháng
- Reset vào đầu tháng (ngày 1)
- Không rollover (không cộng dồn)
- Expired reviews được hoàn lại quota

### 2. Instructor Verification

- Phải được admin approve trước khi hoạt động
- Admin xem: CV, chứng chỉ, kinh nghiệm
- Chỉ verified instructors mới thấy worklist

### 3. Quality Control

- Student rating instructor (1-5 sao)
- Instructor có rating < 3.0 → Warning email
- Instructor có rating < 2.5 sau 10 reviews → Suspend
- Admin có thể xem tất cả reviews để spot check

### 4. Rate Limiting

- Instructor tối đa claim 3 reviews cùng lúc
- Phải complete trong 48 giờ, nếu không → auto-unclaim
- Instructor không được cancel review sau khi claim

### 5. Expiration

- Request không ai claim sau 7 ngày → EXPIRED
- User được hoàn lại quota
- Cron job chạy hàng ngày để expire old reviews

---

## Báo cáo & Analytics

### Instructor Dashboard

- Tổng số reviews đã làm
- Average rating (1-5 sao)
- Average completion time (giờ)
- Reviews đang làm (CLAIMED/IN_PROGRESS)
- Review history (COMPLETED)

### Admin Dashboard

- Tổng số instructors (active/suspended)
- Tổng số reviews (by status)
- Average completion time
- Top instructors (by rating, by reviews)
- Reviews cần spot check (low rating)

### User Dashboard

- Quota còn lại (X/5 part, X/1 full test)
- Reviews đã request (PENDING/COMPLETED)
- Ngày reset quota (đầu tháng sau)

---

## Tác động đến giá gói Pro

### Giá hiện tại (chỉ AI)

- 1 tháng: 100k VND
- 3 tháng: 250k VND
- 6 tháng: 450k VND

### Giá đề xuất (AI + Manual Review)

- 1 tháng: 150k VND (+50%)
- 3 tháng: 350k VND (+40%)
- 6 tháng: 600k VND (+33%)

### Justification

- 5 manual reviews/tháng × 50k (giá thị trường) = 250k value
- 1 full test review × 200k (giá thị trường) = 200k value
- **Total value: 450k VND**
- Giá 150k/tháng = chỉ 33% giá trị thực → Rất hời

---

## Success Metrics (KPIs)

### User Engagement

- % Pro users request manual review (target: >50%)
- Average reviews requested per user (target: 3-4/tháng)
- User retention sau khi nhận manual review (target: +20%)

### Instructor Engagement

- Number of verified instructors (target: 20 instructors sau 1 tháng)
- % reviews claimed within 24h (target: >80%)
- Average completion time (target: <24 giờ)
- Average instructor rating (target: >4.0)

### Quality

- Student satisfaction rating (target: >4.0)
- % reviews completed vs expired (target: >90% completed)
- Average feedback length (target: >200 chars)

### Business

- Pro subscription price increase acceptance (target: <10% churn)
- Instructor → Class Management conversion (track sau Phase 4)

---

## Rủi ro & Giải pháp

### Rủi ro 1: Không đủ instructors

**Tác động:** Reviews không ai claim, expired nhiều, user không hài lòng

**Giải pháp:**

- Outreach trực tiếp đến giảng viên TOEIC
- Offer early access + featured profile
- Gamification: badges, leaderboard
- Referral program: Instructor mời instructor khác

### Rủi ro 2: Instructors làm qua loa (low quality)

**Tác động:** User không hài lòng, rating thấp, churn

**Giải pháp:**

- Minimum feedback length (50 chars)
- Student rating system
- Admin spot check (random 10% reviews)
- Suspend low-rated instructors
- Training materials cho instructors

### Rủi ro 3: Users spam requests

**Tác động:** Worklist quá tải, instructors overwhelmed

**Giải pháp:**

- Quota system (5+1/tháng)
- Chỉ Pro users
- Rate limiting
- Monitor abuse patterns

### Rủi ro 4: Reviews không ai claim (expired nhiều)

**Tác động:** User thất vọng, waste quota

**Giải pháp:**

- Notify instructors (email/push notification)
- Show "urgent" badge cho old requests (>3 ngày)
- Increase quota nếu claim rate cao
- Recruit thêm instructors

---

## Checklist triển khai

### Backend

- [ ] Tạo models: Instructor, ManualReview, InstructorRating
- [ ] Add quota fields vào User model
- [ ] API: Request review
- [ ] API: Worklist (get pending reviews)
- [ ] API: Claim review (with transaction)
- [ ] API: Complete review
- [ ] API: Rate instructor
- [ ] Cron job: Expire old reviews
- [ ] Cron job: Reset monthly quota

### Frontend - Student

- [ ] Button "Yêu cầu review" trên ResultPage
- [ ] Modal request review (show quota)
- [ ] Tab "Instructor Review" trên ResultPage
- [ ] Rating modal (1-5 sao + comment)
- [ ] Notification: Review completed

### Frontend - Instructor

- [ ] Instructor registration page
- [ ] Worklist page (list pending reviews)
- [ ] Review detail page (preview before claim)
- [ ] Review editor (feedback form)
- [ ] My reviews page (history)
- [ ] Instructor profile page (public)

### Admin

- [ ] Approve/reject instructor applications
- [ ] View all reviews
- [ ] Suspend instructors
- [ ] Dashboard: Stats & analytics

### Testing

- [ ] Test quota system (reset, rollover)
- [ ] Test claim race condition (2 instructors claim cùng lúc)
- [ ] Test expiration (7 days)
- [ ] Test rating calculation
- [ ] Load test: 100 concurrent claims

---

## Tài liệu liên quan

- [Phase 4: Class Management System](./04-class-management-system.md) - Bước tiếp theo sau Manual Review
- [Tổng quan](./00-overview.md) - Roadmap tổng thể
