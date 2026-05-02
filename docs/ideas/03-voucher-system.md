# Phase 3: Voucher System

## Tổng quan

Hệ thống voucher/mã giảm giá cho phép admin tạo các mã khuyến mãi để chạy campaign marketing, tăng sales trong các dịp đặc biệt, hoặc reward loyal users. Hệ thống được thiết kế để tránh race condition và lạm dụng.

**Thời gian triển khai:** 1 tuần  
**Độ ưu tiên:** Trung bình (Sau Free Trial)

---

## Mục tiêu nghiệp vụ

### Cho Marketing

- Chạy campaign khuyến mãi (Black Friday, Tết, ...)
- Referral program (giới thiệu bạn bè)
- Partnership (hợp tác với influencers, trường học)
- A/B testing pricing strategies

### Cho Sales

- Flash sale (tạo urgency)
- Seasonal promotion (theo mùa)
- Bundle deals (mua nhiều giảm nhiều)
- First-time buyer discount

### Cho Retention

- Reward loyal users (dùng lâu năm)
- Win-back campaign (users đã churn)
- Referral rewards (người giới thiệu + người được giới thiệu)

### Cho Platform

- Tăng conversion rate
- Tăng average order value
- Viral marketing (users share voucher codes)
- Collect user data (email, phone)

---

## Quy trình nghiệp vụ

### 1. Admin tạo voucher

**Actor:** Admin

**Flow:**

1. Admin vào "Voucher Management"
2. Click "Tạo voucher mới"
3. Điền form:
   - **Code:** CAPYVO2026 (unique, uppercase, 6-20 ký tự)
   - **Loại giảm giá:**
     - Percentage (%) - VD: 20%
     - Fixed Amount (VND) - VD: 50,000 VND
   - **Giá trị:** 20 (nếu %) hoặc 50000 (nếu VND)
   - **Giảm tối đa:** 100,000 VND (chỉ cho %, optional)
   - **Đơn hàng tối thiểu:** 100,000 VND (optional)
   - **Tổng số lượt dùng:** 100 (total usage limit)
   - **Số lượt/user:** 1 (per-user limit)
   - **Áp dụng cho gói:** MONTHLY, QUARTERLY, BIANNUAL (multi-select)
   - **Thời gian hiệu lực:**
     - Từ: 2026-05-01 00:00
     - Đến: 2026-05-31 23:59
   - **Trạng thái:** Active/Inactive
4. Click "Tạo voucher"
5. System validate:
   - Code chưa tồn tại
   - Giá trị hợp lệ (> 0)
   - Thời gian hợp lệ (validFrom < validUntil)
6. Tạo thành công → Hiển thị voucher code
7. Admin có thể copy code để share

**Business Rules:**

- Code phải unique (không trùng)
- Code chỉ chứa chữ cái, số, gạch ngang (A-Z, 0-9, -)
- Percentage: 1-100%
- Fixed amount: > 0 VND
- Usage limit: > 0
- Per-user limit: 1-10 (thường là 1)
- Có thể tạo voucher inactive (để schedule sau)

**Ví dụ vouchers:**

- `WELCOME10` - 10% off cho user mới
- `BLACKFRIDAY50` - 50,000 VND off
- `REFER20` - 20% off cho referral
- `STUDENT15` - 15% off cho sinh viên

---

### 2. User áp dụng voucher

**Actor:** User (trial hoặc đã có tài khoản)

**Điều kiện:**

- User đang ở trang pricing hoặc checkout
- Voucher còn hiệu lực (validFrom < now < validUntil)
- Voucher còn lượt dùng (usageCount < usageLimit)
- User chưa dùng hết lượt (< perUserLimit)

**Flow:**

1. User chọn gói Pro (MONTHLY/QUARTERLY/BIANNUAL)
2. Thấy field "Mã giảm giá" (voucher code input)
3. Nhập code: "WELCOME10"
4. Click "Áp dụng"
5. System validate:
   - Voucher tồn tại
   - Còn hiệu lực (thời gian)
   - Còn lượt dùng (total)
   - User chưa dùng hết lượt (per-user)
   - Áp dụng cho gói đang chọn
   - Đơn hàng đạt tối thiểu (nếu có)
6. Nếu OK:
   - Tính discount amount
   - Hiển thị:
     - Giá gốc: 150,000 VND
     - Giảm giá: -15,000 VND (10%)
     - **Tổng cần trả: 135,000 VND**
   - Button "Thanh toán" enabled
7. Nếu lỗi:
   - Hiển thị message lỗi:
     - "Mã giảm giá không tồn tại"
     - "Mã giảm giá đã hết hạn"
     - "Mã giảm giá đã hết lượt sử dụng"
     - "Bạn đã sử dụng hết lượt cho mã này"
     - "Mã giảm giá không áp dụng cho gói này"
     - "Đơn hàng tối thiểu 100,000 VND"

**Business Rules:**

- Chỉ áp dụng 1 voucher/đơn hàng (không stack)
- Voucher được lock khi user click "Thanh toán" (tránh race condition)
- Nếu thanh toán thất bại → Unlock voucher (không tính usage)
- Nếu thanh toán thành công → Increment usageCount

---

### 3. Thanh toán với voucher

**Actor:** User

**Flow:**

1. User đã áp dụng voucher thành công
2. Click "Thanh toán"
3. System:
   - Tạo payment order với giá đã giảm
   - **Lock voucher** (transaction-safe)
   - Increment usageCount (atomic)
   - Lưu VoucherUsage record
4. Redirect to PayOS checkout
5. User thanh toán:
   - **Thành công:**
     - Payment status: PAID
     - VoucherUsage confirmed
     - User nhận subscription
   - **Thất bại/Hủy:**
     - Payment status: CANCELLED
     - Rollback: Decrement usageCount
     - Delete VoucherUsage record

**Business Rules:**

- Sử dụng database transaction để đảm bảo consistency
- Row-level locking để tránh race condition
- Nếu 2 users dùng cùng voucher cùng lúc:
  - User 1 lock trước → OK
  - User 2 lock sau → Lỗi "Voucher đã hết lượt"

---

### 4. Admin quản lý vouchers

**Actor:** Admin

**Chức năng:**

**4.1. Xem danh sách vouchers**

- Table hiển thị:
  - Code
  - Type (% / VND)
  - Value
  - Usage (50/100)
  - Valid period
  - Status (Active/Inactive/Expired)
- Filter: Active / Expired / All
- Sort: By created date, by usage
- Search: By code

**4.2. Xem chi tiết voucher**

- Thông tin voucher
- Usage statistics:
  - Total uses: 50/100
  - Unique users: 45
  - Total discount given: 2,500,000 VND
  - Conversion rate: 80% (users dùng voucher → mua thành công)
- Usage history:
  - User email
  - Plan purchased
  - Discount amount
  - Date

**4.3. Chỉnh sửa voucher**

- Có thể sửa:
  - Usage limit (tăng/giảm)
  - Valid period (gia hạn)
  - Status (Active/Inactive)
- Không thể sửa:
  - Code (unique identifier)
  - Discount type & value (ảnh hưởng users đã dùng)

**4.4. Vô hiệu hóa voucher**

- Click "Deactivate"
- Confirm → Status: Inactive
- Users không thể dùng nữa
- Lý do: Hết budget, campaign kết thúc, abuse detected

**4.5. Xóa voucher**

- Chỉ xóa được voucher chưa ai dùng (usageCount = 0)
- Nếu đã có người dùng → Không cho xóa (chỉ deactivate)

---

## Tính toán giảm giá

### Percentage Discount

**Formula:**

```
discountAmount = floor(originalPrice * discountValue / 100)
if (maxDiscount) {
  discountAmount = min(discountAmount, maxDiscount)
}
finalPrice = max(0, originalPrice - discountAmount)
```

**Ví dụ 1:**

- Gói: QUARTERLY (350,000 VND)
- Voucher: 20% off, max 50,000 VND
- Discount: 350,000 × 20% = 70,000 VND
- Capped: min(70,000, 50,000) = 50,000 VND
- **Final: 300,000 VND**

**Ví dụ 2:**

- Gói: MONTHLY (150,000 VND)
- Voucher: 10% off, no max
- Discount: 150,000 × 10% = 15,000 VND
- **Final: 135,000 VND**

### Fixed Amount Discount

**Formula:**

```
discountAmount = discountValue
finalPrice = max(0, originalPrice - discountAmount)
```

**Ví dụ:**

- Gói: BIANNUAL (600,000 VND)
- Voucher: 100,000 VND off
- Discount: 100,000 VND
- **Final: 500,000 VND**

**Edge case:**

- Gói: MONTHLY (150,000 VND)
- Voucher: 200,000 VND off
- Discount: 200,000 VND
- Final: max(0, 150,000 - 200,000) = **0 VND** (free!)

---

## Chống lạm dụng (Anti-Abuse)

### 1. Transaction-safe Application

**Vấn đề:** 2 users dùng cùng voucher cùng lúc → Vượt usage limit

**Giải pháp:** Database transaction + Row-level locking

```sql
BEGIN TRANSACTION;

-- Lock voucher row (FOR UPDATE)
SELECT * FROM vouchers WHERE code = 'WELCOME10' FOR UPDATE;

-- Check conditions
IF (usageCount >= usageLimit) THEN
  ROLLBACK;
  THROW 'Voucher đã hết lượt';
END IF;

-- Increment usage (atomic)
UPDATE vouchers SET usageCount = usageCount + 1 WHERE code = 'WELCOME10';

-- Create usage record
INSERT INTO voucher_usages (...);

COMMIT;
```

**Kết quả:**

- User 1 lock trước → Thành công
- User 2 lock sau → Chờ User 1 commit
- Nếu User 1 commit → usageCount = 100 (limit)
- User 2 check → Lỗi "Đã hết lượt"

### 2. Per-User Limit

**Vấn đề:** 1 user dùng voucher nhiều lần

**Giải pháp:**

- Mỗi voucher có `perUserLimit` (thường = 1)
- Check số lần user đã dùng voucher này
- Nếu đã đạt limit → Không cho dùng nữa

**Business Rules:**

- Mỗi user chỉ dùng 1 lần/voucher (default)
- Một số voucher đặc biệt: 2-3 lần/user (VD: referral)
- Track bằng VoucherUsage table

### 3. Rate Limiting

**Vấn đề:** User spam thử nhiều voucher codes

**Giải pháp:**

- Redis-based rate limiting
- Giới hạn: 10 lần thử/giờ/user
- Nếu vượt → Block 1 giờ
- Message: "Bạn đã thử quá nhiều lần, vui lòng thử lại sau"

### 4. Voucher Code Generation

**Vấn đề:** Voucher codes dễ đoán (VOUCHER001, VOUCHER002, ...)

**Giải pháp:**

- Tạo code random, khó đoán
- Format: PREFIX + RANDOM (VD: CAPYVO8A3F2D)
- Không tuần tự
- Hoặc admin tự nhập code (manual)

**Ví dụ generation:**

```typescript
function generateVoucherCode(prefix: string = 'CAPYVO'): string {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}${randomPart}` // CAPYVO8A3F2D1B
}
```

### 5. Auto-deactivate Expired Vouchers

**Vấn đề:** Vouchers hết hạn vẫn active

**Giải pháp:**

- Cron job chạy hàng ngày (00:00)
- Check vouchers có validUntil < now
- Hoặc usageCount >= usageLimit
- Update status: Inactive

**Lợi ích:**

- Giảm load validation (không check expired vouchers)
- Admin dễ quản lý (chỉ xem active vouchers)

---

## Các loại voucher phổ biến

### 1. Welcome Voucher (Chào mừng user mới)

- Code: `WELCOME10`
- Discount: 10% off
- Limit: 1 lần/user
- Applicable: All plans
- Duration: Vô thời hạn
- **Use case:** First-time buyers

### 2. Flash Sale (Giảm giá nhanh)

- Code: `FLASH50`
- Discount: 50,000 VND off
- Limit: 100 uses total
- Applicable: QUARTERLY, BIANNUAL
- Duration: 24 giờ
- **Use case:** Tạo urgency, tăng sales nhanh

### 3. Seasonal Promotion (Theo mùa)

- Code: `TET2026`
- Discount: 20% off, max 100,000 VND
- Limit: 500 uses
- Applicable: All plans
- Duration: 1 tuần (Tết)
- **Use case:** Dịp lễ, Tết, Black Friday

### 4. Referral Reward (Giới thiệu bạn bè)

- Code: `REFER20` (unique per user)
- Discount: 20% off
- Limit: 1 lần/user
- Applicable: All plans
- Duration: 30 ngày
- **Use case:** Viral marketing

### 5. Student Discount (Sinh viên)

- Code: `STUDENT15`
- Discount: 15% off
- Limit: Unlimited (verify student email)
- Applicable: MONTHLY only
- Duration: Vô thời hạn
- **Use case:** Target student segment

### 6. Loyalty Reward (Khách hàng thân thiết)

- Code: `LOYAL30` (sent via email)
- Discount: 30% off
- Limit: 1 lần/user
- Applicable: All plans
- Duration: 7 ngày
- **Use case:** Retention, reward loyal users

---

## Báo cáo & Analytics

### Voucher Performance Dashboard

**Metrics:**

- Total vouchers created
- Active vouchers
- Total uses (all vouchers)
- Total discount given (VND)
- Conversion rate (voucher applied → payment success)

**Per-voucher metrics:**

- Usage rate (50/100 = 50%)
- Unique users
- Total discount given
- Conversion rate
- Revenue generated (with voucher)
- Average order value (with voucher)

**Top performing vouchers:**

- By usage
- By conversion rate
- By revenue generated

### ROI Analysis

**Formula:**

```
Revenue with voucher = Sum of (finalPrice after discount)
Discount given = Sum of (discountAmount)
Revenue without voucher = Sum of (originalPrice) × Conversion rate without voucher

ROI = (Revenue with voucher - Discount given) / Discount given × 100%
```

**Ví dụ:**

- 100 users dùng voucher 10% off
- Original price: 150,000 VND × 100 = 15,000,000 VND
- Discount given: 15,000 VND × 100 = 1,500,000 VND
- Revenue: 135,000 VND × 100 = 13,500,000 VND
- Giả sử không có voucher, chỉ 50 users mua (50% conversion)
- Revenue without voucher: 150,000 × 50 = 7,500,000 VND
- **ROI: (13,500,000 - 1,500,000) / 1,500,000 = 800%** (rất tốt!)

---

## A/B Testing Ideas

### Test 1: Discount Amount

- **Variant A:** 10% off
- **Variant B:** 20% off
- **Variant C:** 50,000 VND off
- **Metric:** Conversion rate, Revenue

### Test 2: Urgency

- **Variant A:** No expiry (vô thời hạn)
- **Variant B:** 7 days expiry
- **Variant C:** 24 hours expiry (flash sale)
- **Metric:** Conversion rate, Time to purchase

### Test 3: Minimum Purchase

- **Variant A:** No minimum
- **Variant B:** Min 100,000 VND
- **Variant C:** Min 200,000 VND
- **Metric:** Average order value, Conversion rate

### Test 4: Code Visibility

- **Variant A:** Public code (hiển thị trên website)
- **Variant B:** Email-only code (gửi qua email)
- **Variant C:** Referral code (unique per user)
- **Metric:** Usage rate, Viral coefficient

---

## Rủi ro & Giải pháp

### Rủi ro 1: Race condition (2 users dùng cùng voucher)

**Tác động:** Vượt usage limit, mất tiền

**Giải pháp:**

- Database transaction + row-level locking
- Atomic increment (usageCount)
- Test với concurrent requests

### Rủi ro 2: Voucher leak (code bị share công khai)

**Tác động:** Hết lượt nhanh, không đúng target audience

**Giải pháp:**

- Set usage limit hợp lý
- Monitor usage patterns (spike detection)
- Deactivate nếu abuse detected
- Use unique codes per user (referral)

### Rủi ro 3: Discount quá cao (lỗ)

**Tác động:** Revenue giảm, không bù đắp được bằng volume

**Giải pháp:**

- Set max discount (cap)
- Set min purchase
- Calculate ROI trước khi launch
- Monitor revenue impact real-time

### Rủi ro 4: Users spam thử codes

**Tác động:** Server load, database queries

**Giải pháp:**

- Rate limiting (10 attempts/hour)
- Cache voucher data (Redis)
- Validate client-side trước (format check)

---

## Checklist triển khai

### Backend

- [ ] Tạo models: Voucher, VoucherUsage
- [ ] API: Create voucher (admin)
- [ ] API: List vouchers (admin)
- [ ] API: Update voucher (admin)
- [ ] API: Deactivate voucher (admin)
- [ ] API: Apply voucher (user) - with transaction
- [ ] API: Validate voucher (check conditions)
- [ ] Rate limiting (Redis)
- [ ] Cron job: Auto-deactivate expired vouchers
- [ ] Webhook: Handle payment success/failure

### Frontend - User

- [ ] Voucher input field (pricing page)
- [ ] Apply voucher button
- [ ] Display discount (original price, discount, final price)
- [ ] Error messages (invalid, expired, etc.)
- [ ] Success message (voucher applied)

### Frontend - Admin

- [ ] Voucher management page (list)
- [ ] Create voucher form
- [ ] Edit voucher form
- [ ] Voucher detail page (stats, usage history)
- [ ] Deactivate voucher button
- [ ] Dashboard: Voucher analytics

### Testing

- [ ] Test race condition (2 users, 1 voucher, 1 slot left)
- [ ] Test per-user limit
- [ ] Test expiry (time-based)
- [ ] Test usage limit
- [ ] Test discount calculation (%, fixed, max, min)
- [ ] Test payment flow (success, failure, cancel)
- [ ] Load test: 100 concurrent voucher applications

---

## Tài liệu liên quan

- [Phase 2: Free Trial System](./02-free-trial-system.md) - Có thể combine voucher cho trial users
- [Phase 4: Class Management System](./04-class-management-system.md) - Voucher cho instructor subscription
- [Tổng quan](./00-overview.md) - Roadmap tổng thể
