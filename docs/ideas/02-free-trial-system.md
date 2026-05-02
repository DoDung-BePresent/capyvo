# Phase 2: Free Trial System

## Tổng quan

Cho phép người dùng mới dùng thử hệ thống trước khi quyết định mua gói Pro. Áp dụng mô hình hybrid: **5 lần luyện tập HOẶC 7 ngày** (cái nào hết trước). Có các cơ chế chống lạm dụng để tránh user tạo nhiều tài khoản.

**Thời gian triển khai:** 1 tuần  
**Độ ưu tiên:** Trung bình (Sau Manual Review)

---

## Mục tiêu nghiệp vụ

### Cho người dùng mới

- Dùng thử miễn phí trước khi quyết định mua
- Đánh giá chất lượng AI scoring
- Trải nghiệm đầy đủ tính năng (trong giới hạn)
- Giảm rào cản tâm lý (không phải trả tiền ngay)

### Cho platform

- Tăng số lượng người dùng đăng ký
- Tăng conversion rate (Free → Pro)
- Expand user base
- Collect feedback từ trial users

---

## Quy trình nghiệp vụ

### 1. User đăng ký tài khoản

**Actor:** Người dùng mới

**Flow:**

1. User truy cập trang chủ
2. Click "Đăng ký" hoặc "Dùng thử miễn phí"
3. Đăng ký qua Google OAuth
4. Sau khi đăng ký thành công:
   - System tự động tạo trial record
   - Trial type: HYBRID (5 attempts OR 7 days)
   - Status: PENDING_VERIFICATION
5. User nhận email verification
6. Click link trong email → Email verified
7. Trial status: ACTIVE
8. User có thể bắt đầu luyện tập

**Business Rules:**

- Mỗi email chỉ được 1 trial
- Phải verify email mới dùng được trial
- Trial bắt đầu từ lúc verify email (không phải lúc đăng ký)

---

### 2. User sử dụng trial

**Actor:** User có trial active

**Điều kiện:**

- Trial status = ACTIVE
- Email đã verify
- Chưa hết quota (< 5 attempts)
- Chưa hết thời gian (< 7 ngày)

**Flow:**

1. User vào trang luyện tập
2. Chọn part muốn luyện (Part 1-5)
3. Chọn câu hỏi
4. Làm bài như bình thường:
   - Nghe instruction
   - Prep time
   - Record audio
   - Submit
5. AI chấm tự động (Whisper + GPT)
6. Xem kết quả:
   - Transcript
   - AI analysis
   - Score
7. System tăng: attemptsUsed + 1
8. Hiển thị: "Còn X/5 lần dùng thử"

**Business Rules:**

- Mỗi lần submit = 1 attempt (dù câu nào)
- Không giới hạn số lần record (chỉ tính khi submit)
- Trial users không được request manual review
- Trial users không xem được history chi tiết (chỉ xem kết quả hiện tại)

**Giới hạn cho trial users:**

- ✅ Được: Luyện tất cả 5 parts
- ✅ Được: AI chấm tự động
- ✅ Được: Xem transcript + analysis
- ❌ Không được: Request manual review
- ❌ Không được: Xem history (các lần làm trước)
- ❌ Không được: Export results

---

### 3. Trial hết hạn

**Kịch bản 1: Hết attempts (5 lần)**

**Flow:**

1. User submit lần thứ 5
2. System update: attemptsUsed = 5
3. Sau khi xem kết quả, hiển thị modal:
   - "Bạn đã dùng hết 5 lần dùng thử"
   - "Nâng cấp lên Pro để tiếp tục luyện tập không giới hạn"
   - Button: "Xem gói Pro" → Redirect to pricing page
4. Trial status: EXPIRED
5. User không thể làm bài mới (button "Bắt đầu" bị disable)

**Kịch bản 2: Hết thời gian (7 ngày)**

**Flow:**

1. Cron job chạy hàng ngày (00:00)
2. Check trials có expiryDate < now
3. Update status: EXPIRED
4. User login lần sau:
   - Thấy banner: "Thời gian dùng thử đã hết"
   - Button "Bắt đầu" bị disable
   - Hiển thị: "Nâng cấp lên Pro để tiếp tục"

**Business Rules:**

- Cái nào hết trước thì trial hết (5 attempts OR 7 days)
- Không gia hạn trial
- Không reset trial
- Phải mua Pro để tiếp tục

---

### 4. Conversion: Trial → Pro

**Actor:** User có trial (active hoặc expired)

**Flow:**

1. User click "Nâng cấp lên Pro"
2. Redirect to pricing page
3. Chọn gói (1 tháng / 3 tháng / 6 tháng)
4. Thanh toán qua PayOS
5. Thanh toán thành công:
   - User.isPremium = true
   - User.premiumUntil = now + duration
   - Trial status: CONVERTED (optional, để tracking)
6. User có thể luyện tập không giới hạn

**Business Rules:**

- Trial users được giảm giá 10% cho lần mua đầu tiên (optional)
- Sau khi mua Pro, trial record vẫn giữ (để analytics)

---

## Chống lạm dụng (Anti-Abuse)

### 1. Email Verification bắt buộc

**Mục đích:** Tránh user tạo nhiều tài khoản ảo

**Cơ chế:**

- User phải verify email mới dùng được trial
- Trial chỉ bắt đầu sau khi verify (không tính từ lúc đăng ký)
- Blacklist các email domain tạm thời:
  - tempmail.com
  - guerrillamail.com
  - 10minutemail.com
  - mailinator.com
  - etc.

**Business Rules:**

- Email chưa verify → Trial status = PENDING_VERIFICATION
- Không thể làm bài khi chưa verify
- Email verification link hết hạn sau 24 giờ

---

### 2. Device Fingerprinting

**Mục đích:** Giới hạn số trial accounts từ 1 device

**Cơ chế:**

- Frontend thu thập device fingerprint:
  - User agent
  - Screen resolution
  - Timezone
  - Language
  - Canvas fingerprint
  - WebGL fingerprint
- Backend lưu hash của fingerprint
- Giới hạn: **Tối đa 2 trial accounts từ 1 device**

**Thư viện:** `@fingerprintjs/fingerprintjs`

**Business Rules:**

- Nếu device đã có 2 trials → Không cho tạo trial mới
- Hiển thị: "Thiết bị này đã đạt giới hạn dùng thử"
- Suggest: "Vui lòng mua gói Pro để tiếp tục"

---

### 3. IP-based Rate Limiting

**Mục đích:** Tránh spam từ 1 IP

**Cơ chế:**

- Track số trial accounts tạo từ 1 IP
- Giới hạn: **Tối đa 3 trial accounts từ 1 IP trong 30 ngày**
- Sử dụng Redis để track (fast lookup)

**Business Rules:**

- Nếu IP đã có 3 trials trong 30 ngày → Block
- Hiển thị: "Đã đạt giới hạn tạo tài khoản từ địa chỉ này"
- Suggest: "Liên hệ support nếu bạn gặp vấn đề"

**Exception:**

- IP công cộng (cafe, trường học) có thể có nhiều users thật
- Admin có thể whitelist IP nếu cần

---

### 4. Progressive Restrictions

**Mục đích:** Giảm value cho abusers, tăng value cho users thật

**Giới hạn cho trial users:**

- Chỉ được luyện Part 1 & 2 (không có Part 3, 4, 5)
- Hoặc: Chỉ được luyện 1 exam set cố định (không chọn được)
- Không xem được history (chỉ xem kết quả hiện tại)
- Không export results
- Không request manual review

**Lợi ích:**

- Users thật vẫn đánh giá được chất lượng (Part 1 & 2 đủ để test)
- Abusers không có đủ value để lạm dụng
- Tạo động lực upgrade lên Pro

---

### 5. Honeypot & Bot Detection

**Mục đích:** Phát hiện bot/script tự động

**Cơ chế:**

- Hidden field trong form đăng ký (honeypot)
- reCAPTCHA v3 (invisible)
- Track behavior: Thời gian điền form, mouse movement
- Detect headless browsers

**Business Rules:**

- Bot detected → Block registration
- Suspicious behavior → Require manual verification

---

## Các trạng thái (Status Flow)

### Trial Status

```
PENDING_VERIFICATION → ACTIVE → EXPIRED
                         ↓
                     CONVERTED (mua Pro)
```

**PENDING_VERIFICATION:**

- User mới đăng ký, chưa verify email
- Không thể làm bài
- Hiển thị: "Vui lòng verify email để bắt đầu"

**ACTIVE:**

- Email đã verify
- Còn attempts (< 5) và còn thời gian (< 7 ngày)
- Có thể làm bài

**EXPIRED:**

- Hết attempts (= 5) hoặc hết thời gian (> 7 ngày)
- Không thể làm bài
- Hiển thị: "Nâng cấp lên Pro để tiếp tục"

**CONVERTED:**

- User đã mua Pro
- Trial record giữ lại để analytics
- Không ảnh hưởng gì đến user

---

## UI/UX

### Trial Badge

**Vị trí:** Header, sidebar

**Hiển thị:**

- Icon: 🎁 hoặc ⭐
- Text: "Dùng thử: 3/5 lần còn lại"
- Hoặc: "Dùng thử: 4 ngày còn lại"
- Click → Modal giải thích trial

### Trial Expiry Warning

**Khi còn 1 lần hoặc 1 ngày:**

- Banner màu vàng: "⚠️ Bạn còn 1 lần dùng thử. Nâng cấp ngay để không bị gián đoạn!"
- Button: "Xem gói Pro"

**Khi hết trial:**

- Modal full-screen:
  - "Bạn đã dùng hết lượt dùng thử"
  - "Nâng cấp lên Pro để tiếp tục luyện tập không giới hạn"
  - Pricing table
  - Button: "Chọn gói Pro"

### Pricing Page

**Highlight cho trial users:**

- Badge: "🎉 Ưu đãi cho người dùng mới: Giảm 10%"
- Countdown timer: "Ưu đãi kết thúc sau 24 giờ" (tạo urgency)

---

## Báo cáo & Analytics

### Trial Funnel

1. Registrations (total users đăng ký)
2. Email verified (% verify email)
3. First attempt (% users làm bài lần đầu)
4. Used all attempts (% users dùng hết 5 lần)
5. Converted to Pro (% conversion)

**Target metrics:**

- Email verification rate: >80%
- First attempt rate: >60%
- Used all attempts rate: >40%
- Conversion rate: >15%

### Trial Analytics Dashboard

**Metrics:**

- Total trial users (active/expired/converted)
- Average attempts used (target: 4-5)
- Average days active (target: 5-7)
- Conversion rate by source (Google, Facebook, Direct)
- Time to conversion (days from trial start to purchase)

**Cohort analysis:**

- Week 1 cohort: X% converted
- Week 2 cohort: Y% converted
- Compare conversion rates over time

---

## A/B Testing Ideas

### Test 1: Trial Duration

- **Variant A:** 5 attempts OR 7 days
- **Variant B:** 3 attempts OR 5 days
- **Variant C:** 10 attempts OR 14 days
- **Metric:** Conversion rate

### Test 2: Trial Restrictions

- **Variant A:** All parts (1-5)
- **Variant B:** Only Part 1 & 2
- **Variant C:** Only 1 exam set
- **Metric:** Conversion rate + User satisfaction

### Test 3: Expiry Warning

- **Variant A:** Warning at 1 attempt left
- **Variant B:** Warning at 2 attempts left
- **Variant C:** No warning
- **Metric:** Conversion rate

### Test 4: First-time Discount

- **Variant A:** 10% off
- **Variant B:** 20% off
- **Variant C:** No discount
- **Metric:** Conversion rate + Revenue

---

## Rủi ro & Giải pháp

### Rủi ro 1: Users tạo nhiều tài khoản (abuse)

**Tác động:** Chi phí AI tăng, không convert

**Giải pháp:**

- Email verification + blacklist temp emails
- Device fingerprinting (max 2 trials/device)
- IP rate limiting (max 3 trials/IP/30 days)
- Progressive restrictions (chỉ Part 1 & 2)
- Monitor abuse patterns, ban suspicious accounts

### Rủi ro 2: Conversion rate thấp

**Tác động:** Nhiều trial users nhưng không mua

**Giải pháp:**

- A/B test trial duration & restrictions
- Improve onboarding (tutorial, tips)
- Email drip campaign (remind, educate, offer)
- Exit survey: Tại sao không mua?
- Retargeting ads

### Rủi ro 3: Chi phí AI cao

**Tác động:** Trial users làm nhiều, không convert → lỗ

**Giải pháp:**

- Giới hạn 5 attempts (đủ để test, không quá nhiều)
- Monitor cost per trial user
- Nếu cost > $0.5/user → Giảm attempts xuống 3
- Track conversion rate để tính ROI

### Rủi ro 4: Email verification rate thấp

**Tác động:** Nhiều users đăng ký nhưng không verify

**Giải pháp:**

- Simplify verification flow
- Resend email button
- Show clear instructions
- Email reminder sau 24 giờ
- Allow social login (Google) → Auto-verified

---

## Checklist triển khai

### Backend

- [ ] Tạo model: UserTrial
- [ ] API: Create trial (on registration)
- [ ] API: Check trial access
- [ ] API: Increment attempts
- [ ] Email verification flow
- [ ] Device fingerprinting (save hash)
- [ ] IP rate limiting (Redis)
- [ ] Blacklist temp email domains
- [ ] Cron job: Expire old trials
- [ ] Cron job: Send expiry warnings

### Frontend

- [ ] Trial badge (header/sidebar)
- [ ] Trial expiry warning banner
- [ ] Modal: Trial expired
- [ ] Pricing page: Highlight for trial users
- [ ] Onboarding tutorial (first-time users)
- [ ] Email verification page
- [ ] Resend verification email button

### Analytics

- [ ] Track trial funnel (registration → conversion)
- [ ] Dashboard: Trial metrics
- [ ] Cohort analysis
- [ ] A/B testing setup

### Testing

- [ ] Test email verification flow
- [ ] Test device fingerprinting (multiple accounts)
- [ ] Test IP rate limiting
- [ ] Test trial expiry (attempts & time)
- [ ] Test conversion flow (trial → Pro)

---

## Tài liệu liên quan

- [Phase 3: Voucher System](./03-voucher-system.md) - Có thể combine với trial (first-time discount)
- [Tổng quan](./00-overview.md) - Roadmap tổng thể
