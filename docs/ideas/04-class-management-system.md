# Phase 4: Class Management System

## Tổng quan

Hệ thống quản lý lớp học cho giảng viên, cho phép họ tạo classes, thêm học viên, giao bài tập, theo dõi tiến độ, và chấm chữa. Đây là tính năng B2B chính, tạo revenue stream mới từ giảng viên.

**Thời gian triển khai:** 3-4 tuần  
**Độ ưu tiên:** Cao (Long-term strategy)  
**Điều kiện tiên quyết:** Phase 1 (Manual Review) đã có base instructors

---

## Mục tiêu nghiệp vụ

### Cho giảng viên

- Quản lý lớp học tập trung (thay thế Google Drive + Zalo)
- Tiết kiệm thời gian chấm bài (AI chấm tự động)
- Theo dõi tiến độ từng học viên
- Tạo bài tập dễ dàng
- Export báo cáo Excel
- Tăng tính chuyên nghiệp → Tăng giá lớp

### Cho học viên

- Học có hệ thống, theo lộ trình
- Theo dõi tiến độ của bản thân
- Nhận feedback từ giảng viên
- Được dùng như Pro (trong class)
- Không phải mua gói Pro riêng

### Cho platform

- B2B revenue stream (500k/instructor/tháng)
- Scalable (1 instructor = 30 users)
- Sticky (instructors khó churn)
- Network effect (instructors mời instructors)
- Unique value proposition (không có competitor)

---

## Business Model

### Pricing cho Giảng viên

**INSTRUCTOR PLAN - 500,000 VND/tháng**  
(hoặc 1,200,000 VND/quý - giảm 20%)

**Bao gồm:**

- Tạo unlimited classes
- Mỗi class: tối đa 30 học viên
- Tự tạo/import bài tập (unlimited questions)
- Dashboard theo dõi tiến độ
- Xem chi tiết từng bài làm + AI scoring
- Thêm feedback/notes cho từng bài
- Export báo cáo Excel
- **Học viên trong class được dùng như Pro** (chỉ trong class)

### Tính khả thi

**Chi phí cho Platform (per instructor/month):**

- Giả sử: 30 học viên × 20 bài/tháng = 600 requests
- Whisper: 600 × $0.006/min × 0.5min = $1.8 (~42k VND)
- GPT-4o-mini: 600 × $0.0001 = $0.06 (~1.4k VND)
- Storage: ~500MB × $0.02/GB = $0.01 (~0.2k VND)
- **Total cost: ~44k VND/tháng**

**Revenue:**

- Instructor trả: 500k VND/tháng
- Chi phí: 44k VND
- **Lợi nhuận: 456k VND/tháng (91% margin)**

**Tính toán cho Giảng viên:**

- Lớp 25 học viên × 200k/tháng = 5,000k VND doanh thu
- Chi phí tool: 500k VND (10%)
- **Lợi nhuận: 4,500k VND/tháng**
- → **Hoàn toàn khả thi!**

---

## Quy trình nghiệp vụ

### 1. Instructor mua gói INSTRUCTOR

**Actor:** User có role INSTRUCTOR (đã được approve ở Phase 1)

**Điều kiện:**

- Đã đăng ký làm instructor (Phase 1)
- Đã được admin approve
- Chưa có gói INSTRUCTOR active

**Flow:**

1. Instructor login → Thấy banner: "Nâng cấp lên Instructor Pro để tạo lớp học"
2. Click "Xem gói Instructor"
3. Pricing page hiển thị:
   - **INSTRUCTOR MONTHLY:** 500,000 VND/tháng
   - **INSTRUCTOR QUARTERLY:** 1,200,000 VND/quý (giảm 20%)
   - Features list
4. Chọn gói → Thanh toán qua PayOS
5. Thanh toán thành công:
   - Instructor.isPremium = true
   - Instructor.premiumUntil = now + duration
6. Redirect to Instructor Dashboard
7. Có thể tạo classes

**Business Rules:**

- Chỉ instructors verified mới mua được
- Subscription tự động gia hạn (nếu có autoRenew)
- Hết hạn → Không tạo class mới được (class cũ vẫn xem được)

---

### 2. Instructor tạo class

**Actor:** Instructor có gói active

**Điều kiện:**

- Instructor.isPremium = true
- Instructor.premiumUntil > now
- Chưa đạt giới hạn classes (default: 10 classes)

**Flow:**

1. Instructor vào "My Classes"
2. Click "Tạo lớp mới"
3. Điền form:
   - **Tên lớp:** "TOEIC Speaking - Lớp K23" (required)
   - **Mô tả:** "Lớp luyện thi TOEIC Speaking..." (optional)
   - **Mã lớp:** "K23TOEIC" (auto-generate hoặc custom, unique)
   - **Giới hạn học viên:** 30 (default, có thể sửa 10-50)
4. Click "Tạo lớp"
5. System validate:
   - Mã lớp chưa tồn tại
   - Chưa đạt giới hạn classes
6. Tạo thành công → Redirect to Class Detail
7. Hiển thị mã lớp để share cho học viên

**Business Rules:**

- Mã lớp phải unique (không trùng)
- Mã lớp: 6-20 ký tự, chỉ chữ cái, số, gạch ngang
- Instructor tối đa 10 classes (có thể tăng nếu cần)
- Class có thể archive (không xóa)

---

### 3. Student join class

**Actor:** User có tài khoản

**Điều kiện:**

- Có tài khoản (đã đăng ký)
- Có mã lớp từ instructor
- Class còn slot (currentStudents < maxStudents)

**Flow:**

1. User vào "/join-class" (hoặc link từ instructor)
2. Nhập mã lớp: "K23TOEIC"
3. Click "Tham gia"
4. System validate:
   - Mã lớp tồn tại
   - Class còn slot
   - User chưa join class này
5. Nếu OK:
   - Tạo ClassStudent record
   - currentStudents + 1
   - Hiển thị: "Bạn đã tham gia lớp [Tên lớp]"
6. Redirect to Class Dashboard (student view)

**Business Rules:**

- Mỗi user chỉ join 1 lần/class
- Không giới hạn số class user có thể join
- User có thể rời class (leave)
- Instructor có thể kick user (remove)

---

### 4. Instructor tạo bài tập (Assignment)

**Actor:** Instructor

**Điều kiện:**

- Instructor owns class
- Class có ít nhất 1 học viên

**Flow:**

1. Instructor vào Class Detail
2. Tab "Assignments" → Click "Tạo bài tập mới"
3. Chọn loại bài tập:

**Option 1: Chọn từ Exam Set có sẵn**

- Chọn exam set (Practice/Forecast)
- Chọn part (1-5) hoặc full exam
- Tất cả questions trong part/exam được add

**Option 2: Chọn questions cụ thể**

- Browse questions (filter by part)
- Multi-select questions
- Add to assignment

**Option 3: Tạo custom questions** (Advanced)

- Instructor tự tạo questions (như Admin)
- Lưu vào exam set riêng của instructor
- Add to assignment

4. Điền thông tin:
   - **Tiêu đề:** "Bài tập tuần 1 - Part 1" (required)
   - **Mô tả:** "Tập trung vào phát âm..." (optional)
   - **Hạn nộp:** 2026-05-10 23:59 (optional)
5. Click "Tạo bài tập"
6. Assignment được tạo → Học viên thấy trong class

**Business Rules:**

- Assignment phải có ít nhất 1 question
- Có thể tạo assignment không có deadline (practice)
- Có thể edit assignment trước deadline
- Không thể xóa assignment đã có submissions

---

### 5. Student làm bài tập

**Actor:** Student (user đã join class)

**Điều kiện:**

- Đã join class
- Class có assignments

**Flow:**

1. Student login → Vào "My Classes"
2. Click vào class → Tab "Assignments"
3. Thấy danh sách bài tập:
   - Tiêu đề
   - Số câu
   - Deadline
   - Status: Chưa làm / Đang làm / Đã nộp / Đã chấm
4. Click "Làm bài"
5. Vào practice session (giống flow hiện tại):
   - Nghe instruction
   - Làm từng câu
   - Record audio
   - Submit
6. AI chấm tự động (Whisper + GPT)
7. Khi hoàn thành tất cả câu:
   - AssignmentSubmission status: SUBMITTED
   - Student thấy kết quả AI
8. Chờ instructor review (optional)

**Business Rules:**

- Student có thể làm lại (tạo submission mới)
- Mỗi submission là 1 practice session riêng
- Chỉ submission cuối cùng được tính (hoặc submission tốt nhất)
- Student chỉ được làm assignments trong class (không làm bài ngoài)

**Access Control:**

- Student trong class = có quyền Pro (chỉ trong class)
- Không cần mua gói Pro riêng
- Rời class → Mất quyền truy cập

---

### 6. Instructor xem submissions & chấm bài

**Actor:** Instructor

**Flow:**

1. Instructor vào Class Detail → Tab "Submissions"
2. Thấy matrix view (bảng học viên × bài tập):
   - Rows: Students
   - Columns: Assignments
   - Cells: Status (Chưa nộp / Đã nộp / Đã chấm) + Score
3. Filter:
   - By assignment
   - By student
   - By status (Chưa nộp / Đã nộp / Đã chấm)
4. Sort:
   - By name
   - By score
   - By submission time
5. Click vào cell → Xem chi tiết submission:
   - Nghe audio từng câu
   - Xem transcript
   - Xem AI analysis
   - Thêm instructor note (textarea)
   - Override score (optional): AI chấm 2.5 → Instructor cho 3.0
6. Click "Lưu" → Status: REVIEWED
7. Student nhận notification

**Business Rules:**

- Instructor có thể xem tất cả submissions trong class
- Instructor note là private (chỉ student và instructor thấy)
- Override score không bắt buộc (có thể chỉ thêm note)
- Có thể bulk review (chọn nhiều submissions cùng lúc)

---

### 7. Student xem feedback từ instructor

**Actor:** Student

**Flow:**

1. Student vào Class → Tab "Assignments"
2. Thấy assignment có status: REVIEWED
3. Click vào → Xem kết quả:
   - AI score + analysis (như bình thường)
   - **Instructor note** (nếu có)
   - **Instructor score** (nếu có override)
4. Có thể làm lại (tạo submission mới)

**Business Rules:**

- Student chỉ thấy feedback của mình (không thấy của bạn khác)
- Có thể xem lại bất cứ lúc nào

---

### 8. Instructor export báo cáo

**Actor:** Instructor

**Flow:**

1. Instructor vào Class Detail → Tab "Reports"
2. Chọn loại báo cáo:
   - **Student Progress:** Tiến độ từng học viên
   - **Assignment Summary:** Tổng hợp theo bài tập
   - **Score Distribution:** Phân bố điểm
3. Chọn format: Excel / PDF
4. Click "Export"
5. Download file

**Nội dung báo cáo (Excel):**

**Sheet 1: Student Progress**
| Student Name | Email | Assignments Completed | Average Score | Last Active |
|--------------|-------|----------------------|---------------|-------------|
| Nguyễn Văn A | a@... | 8/10 | 2.8 | 2026-05-01 |

**Sheet 2: Assignment Summary**
| Assignment | Due Date | Submitted | Not Submitted | Average Score |
|------------|----------|-----------|---------------|---------------|
| Bài tập 1 | 2026-05-01 | 25 | 5 | 2.5 |

**Sheet 3: Detailed Scores**
| Student | Assignment | Score | Submitted At | Reviewed |
|---------|------------|-------|--------------|----------|
| Nguyễn Văn A | Bài tập 1 | 2.5 | 2026-04-30 | Yes |

**Business Rules:**

- Chỉ export data của class mình
- Data real-time (không cache)
- Có thể export nhiều lần

---

## Dashboard & Analytics

### Instructor Dashboard

**Overview:**

- Total classes: 3
- Total students: 75
- Assignments created: 25
- Submissions pending review: 12

**Recent Activity:**

- Nguyễn Văn A submitted Bài tập 1 (2 giờ trước)
- Trần Thị B joined Lớp K23 (5 giờ trước)

**Quick Actions:**

- Tạo class mới
- Tạo bài tập mới
- Xem submissions cần chấm

### Class Detail Dashboard

**Stats:**

- Students: 28/30
- Assignments: 10
- Completion rate: 85%
- Average score: 2.7

**Charts:**

- Score distribution (histogram)
- Progress over time (line chart)
- Top performers (leaderboard)

**Tabs:**

- Overview
- Students (list + stats)
- Assignments (list + create)
- Submissions (matrix view)
- Reports (export)

### Student Dashboard

**My Classes:**

- List of classes joined
- Quick stats per class:
  - Assignments: 8/10 completed
  - Average score: 2.8
  - Next deadline: Bài tập 9 (2 ngày nữa)

**Class Detail (Student View):**

- Assignments list
- My progress (chart)
- Leaderboard (optional, nếu instructor enable)

---

## Tính năng nâng cao (Phase 4.5 - Optional)

### 1. Instructor tạo custom questions

**Flow:**

- Instructor vào "My Question Bank"
- Click "Tạo câu hỏi mới"
- Chọn part (1-5)
- Điền nội dung (giống Admin)
- Upload audio/image (nếu cần)
- Lưu vào exam set riêng của instructor
- Có thể reuse cho nhiều assignments

**Business Rules:**

- Instructor chỉ thấy questions của mình
- Không thấy questions của instructors khác
- Admin có thể promote instructor questions → Public

### 2. Leaderboard (Bảng xếp hạng)

**Instructor enable/disable:**

- Setting trong class: "Show leaderboard"
- Nếu enable → Students thấy top 10

**Leaderboard:**

- Rank by average score
- Rank by completion rate
- Rank by streak (số ngày liên tục làm bài)

**Gamification:**

- Badges: "Top 1", "Perfect Score", "Fast Learner"
- Points system (optional)

### 3. Bulk Actions

**Instructor:**

- Clone assignment (tạo bài tập tương tự)
- Send reminder (nhắc học viên chưa nộp)
- Bulk review (chấm nhiều bài cùng lúc)
- Archive class (không xóa)

### 4. Notifications

**Email:**

- Student: Assignment mới, deadline sắp tới, đã được chấm
- Instructor: Submission mới, student join class

**In-app:**

- Real-time notifications
- Badge count (số notifications chưa đọc)

### 5. Mobile App (Future)

**React Native:**

- Student làm bài trên mobile
- Instructor xem submissions trên mobile
- Push notifications

---

## Chống lạm dụng (Anti-Abuse)

### 1. Class Limits

**Instructor:**

- Tối đa 10 classes (có thể tăng nếu cần)
- Mỗi class tối đa 30 học viên (có thể tăng lên 50)
- Monitor: Class không có học viên → Cảnh báo

**Student:**

- Không giới hạn số class join
- Nhưng chỉ được làm bài trong class (không làm bài ngoài)

### 2. Subscription Check

**Instructor:**

- Hết hạn → Không tạo class mới
- Class cũ vẫn xem được (read-only)
- Students vẫn làm bài được (không ảnh hưởng)

**Student:**

- Rời class → Mất quyền truy cập ngay lập tức
- Không xem được submissions cũ

### 3. Rate Limiting

**Instructor:**

- Tối đa 1000 requests/tháng (API calls)
- Nếu vượt → Throttle hoặc charge thêm

**Student:**

- Tối đa 50 submissions/ngày (chống spam)

### 4. Data Privacy

**Student:**

- Chỉ thấy data của mình
- Không thấy submissions của bạn khác

**Instructor:**

- Chỉ thấy data của classes mình
- Không thấy data của instructors khác

### 5. Audit Log

**Track:**

- Instructor actions (create class, create assignment, review submission)
- Student actions (join class, submit assignment)
- Admin actions (approve instructor, suspend instructor)

**Purpose:**

- Debugging
- Abuse detection
- Compliance

---

## Rủi ro & Giải pháp

### Rủi ro 1: Instructor share account

**Tác động:** 1 account → nhiều instructors dùng chung

**Giải pháp:**

- IP tracking + device fingerprinting
- Giới hạn concurrent sessions (1 session/time)
- Nếu phát hiện → Warning → Ban account
- Monitor: Nhiều IPs khác nhau trong ngày

### Rủi ro 2: Student abuse (làm bài vô hạn)

**Tác động:** Chi phí AI tăng

**Giải pháp:**

- Chỉ được làm assignments trong class
- Rate limiting: 50 submissions/ngày
- Monitor usage patterns
- Instructor có thể kick student

### Rủi ro 3: Instructor tạo nhiều class ảo

**Tác động:** Waste resources, không có học viên thật

**Giải pháp:**

- Admin review khi tạo class (optional)
- Giới hạn 10 classes/instructor
- Monitor: Class không có học viên sau 7 ngày → Cảnh báo
- Auto-archive class không active

### Rủi ro 4: Chi phí AI tăng đột biến

**Tác động:** Lỗ tiền

**Giải pháp:**

- Set hard limit: 1000 requests/instructor/tháng
- Monitor usage real-time
- Alert khi vượt threshold
- Có thể charge thêm nếu vượt

### Rủi ro 5: Instructor churn (hủy subscription)

**Tác động:** Mất revenue

**Giải pháp:**

- Exit survey: Tại sao hủy?
- Offer discount để giữ chân
- Improve features dựa trên feedback
- Retention campaign (email, call)

---

## Success Metrics (KPIs)

### Business Metrics

- Number of instructor subscriptions (target: 50 sau 3 tháng)
- MRR from instructors (target: 25M VND/tháng)
- Instructor churn rate (target: <10%/tháng)
- Average revenue per instructor (target: 500k/tháng)

### Engagement Metrics

- Classes created per instructor (target: 2-3)
- Students per class (target: 20-25)
- Assignments created per class (target: 10-15/tháng)
- Submissions per student (target: 15-20/tháng)

### Quality Metrics

- Instructor satisfaction (NPS) (target: >8)
- Student satisfaction (NPS) (target: >7)
- Completion rate (target: >80%)
- Average score improvement (target: +0.5 sau 1 tháng)

### Platform Metrics

- Total active students (via classes) (target: 1000)
- Total submissions (target: 15,000/tháng)
- AI cost per instructor (target: <50k/tháng)
- Profit margin (target: >85%)

---

## Checklist triển khai

### Phase 4.1: Core Features (2 tuần)

**Backend:**

- [ ] Tạo models: Instructor, Class, ClassStudent, Assignment, AssignmentSubmission
- [ ] API: Create class
- [ ] API: Join class (student)
- [ ] API: Create assignment
- [ ] API: Submit assignment (reuse practice session)
- [ ] API: List submissions (instructor)
- [ ] API: Add instructor note
- [ ] API: Override score
- [ ] Access control: Check if student in class

**Frontend - Instructor:**

- [ ] Instructor dashboard
- [ ] Create class page
- [ ] Class detail page
- [ ] Create assignment page
- [ ] Submissions matrix view
- [ ] Review submission page (add note, override score)

**Frontend - Student:**

- [ ] Join class page
- [ ] My classes page
- [ ] Class detail page (student view)
- [ ] Assignments list
- [ ] Do assignment (reuse practice flow)

### Phase 4.2: Enhanced Features (1 tuần)

**Backend:**

- [ ] API: Export reports (Excel)
- [ ] API: Class analytics
- [ ] API: Student progress tracking
- [ ] Cron job: Send deadline reminders

**Frontend:**

- [ ] Class analytics dashboard (charts)
- [ ] Export reports button
- [ ] Student progress page
- [ ] Notifications (email + in-app)

### Phase 4.3: Advanced Features (1 tuần)

**Backend:**

- [ ] API: Instructor create custom questions
- [ ] API: Leaderboard
- [ ] API: Bulk actions (clone, remind)
- [ ] Audit log

**Frontend:**

- [ ] Instructor question bank
- [ ] Create custom question page
- [ ] Leaderboard page
- [ ] Bulk actions UI

### Testing

- [ ] Test access control (student in class vs not in class)
- [ ] Test subscription expiry (instructor)
- [ ] Test class limits (10 classes, 30 students)
- [ ] Test rate limiting (50 submissions/day)
- [ ] Load test: 100 concurrent submissions
- [ ] E2E test: Full flow (create class → join → assignment → submit → review)

---

## Tài liệu liên quan

- [Phase 1: Manual Review System](./01-manual-review-system.md) - Prerequisite: Cần có base instructors
- [Phase 3: Voucher System](./03-voucher-system.md) - Có thể offer voucher cho instructor subscription
- [Tổng quan](./00-overview.md) - Roadmap tổng thể
