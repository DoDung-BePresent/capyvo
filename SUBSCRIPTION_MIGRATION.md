# Migration: Token-based → Subscription-based

## 📋 Tổng quan

Chuyển đổi từ hệ thống mua token sang hệ thống subscription theo tháng.

---

## 🎨 Frontend (✅ Hoàn thành)

### Components đã tạo:

1. **PricingCard** (`client/src/features/payment/components/PricingCard.tsx`)
   - Hiển thị thông tin gói subscription
   - Button 3D effect giống PartCard
   - Support popular badge, discount tag

2. **PricingPage** (`client/src/features/payment/pages/PricingPage.tsx`)
   - 3 gói: 1 tháng, 3 tháng, 6 tháng
   - Responsive grid layout
   - Navigate to checkout

3. **UpgradeWidget** (`client/src/features/exam/layouts/components/UpgradeWidget.tsx`)
   - Thay thế Token widget cũ
   - Collapsed/Expanded states
   - Navigate to /pricing

### Routes đã thêm:

- `/pricing` - Trang chọn gói subscription

---

## 🔧 Backend (⏳ Cần làm)

### 1. Database Schema Changes

#### Tạo bảng mới: `Subscription`

```prisma
model Subscription {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  planId        String   // 'monthly', 'quarterly', 'biannual'
  status        SubscriptionStatus @default(ACTIVE)

  startDate     DateTime @default(now())
  endDate       DateTime

  autoRenew     Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}
```

#### Tạo bảng: `SubscriptionPlan`

```prisma
model SubscriptionPlan {
  id              String   @id // 'monthly', 'quarterly', 'biannual'
  name            String
  durationDays    Int
  price           Int
  pricePerMonth   Int
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Cập nhật bảng `User`

```prisma
model User {
  // ... existing fields

  // Xóa hoặc deprecated
  // transcriptionCredits Int @default(0)

  // Thêm mới
  subscriptions   Subscription[]
  currentSubscription Subscription? @relation("CurrentSubscription")

  isPremium       Boolean  @default(false)
  premiumUntil    DateTime?
}
```

### 2. API Endpoints cần tạo/cập nhật

#### GET `/api/subscription/plans`

- Trả về danh sách các gói subscription
- Response:

```typescript
{
  plans: [
    {
      id: 'monthly',
      name: '1 THÁNG',
      durationDays: 30,
      price: 90000,
      pricePerMonth: 90000,
      features: [...],
      discount: null
    },
    // ...
  ]
}
```

#### GET `/api/subscription/current`

- Lấy subscription hiện tại của user
- Response:

```typescript
{
  subscription: {
    id: 'sub_xxx',
    planId: 'quarterly',
    status: 'ACTIVE',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    daysRemaining: 45,
    autoRenew: false
  } | null
}
```

#### POST `/api/subscription/create`

- Tạo subscription mới (sau khi thanh toán thành công)
- Body:

```typescript
{
  planId: 'quarterly',
  paymentId: 'payment_xxx'
}
```

#### POST `/api/subscription/cancel`

- Hủy subscription (không gia hạn)
- Body:

```typescript
{
  subscriptionId: 'sub_xxx'
}
```

#### POST `/api/subscription/renew`

- Gia hạn subscription
- Body:

```typescript
{
  subscriptionId: 'sub_xxx',
  planId: 'quarterly'
}
```

### 3. Payment Integration

#### Cập nhật VNPay callback

- Sau khi thanh toán thành công:
  1. Tạo Subscription record
  2. Update `user.isPremium = true`
  3. Update `user.premiumUntil = endDate`
  4. Gửi email xác nhận

#### Webhook/Cron job

- Chạy hàng ngày để check expired subscriptions
- Update `status = EXPIRED` nếu `endDate < now()`
- Update `user.isPremium = false` nếu không còn active subscription

### 4. Middleware/Guards

#### `isPremiumUser` middleware

```typescript
export function isPremiumUser(req, res, next) {
  const user = req.user

  if (!user.isPremium || !user.premiumUntil) {
    return res.status(403).json({ error: 'Premium subscription required' })
  }

  if (new Date() > user.premiumUntil) {
    return res.status(403).json({ error: 'Subscription expired' })
  }

  next()
}
```

#### Áp dụng cho các endpoints:

- `/api/transcribe` - Yêu cầu premium
- `/api/analyze` - Yêu cầu premium
- `/api/exam-sessions/create` - Có thể giới hạn cho premium

### 5. Migration Script

```typescript
// scripts/migrate-to-subscription.ts

async function migrateUsersWithCredits() {
  // Tìm users có credits > 0
  const users = await prisma.user.findMany({
    where: { transcriptionCredits: { gt: 0 } },
  })

  for (const user of users) {
    // Convert credits sang subscription days
    // VD: 100 credits = 30 days premium
    const days = Math.floor(user.transcriptionCredits / 3.33)

    if (days > 0) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: 'custom',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: addDays(new Date(), days),
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: true,
          premiumUntil: addDays(new Date(), days),
        },
      })
    }
  }
}
```

---

## 📝 Checklist Backend

- [ ] Tạo Prisma schema cho Subscription & SubscriptionPlan
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Seed initial plans vào database
- [ ] Tạo API endpoints (plans, current, create, cancel, renew)
- [ ] Cập nhật VNPay payment flow
- [ ] Tạo cron job check expired subscriptions
- [ ] Tạo middleware `isPremiumUser`
- [ ] Áp dụng middleware cho protected endpoints
- [ ] Viết migration script cho users hiện tại
- [ ] Test toàn bộ flow: pricing → payment → subscription active
- [ ] Update API docs

---

## 🎯 Pricing Plans

| Gói     | Thời hạn | Giá      | Giá/tháng | Tiết kiệm |
| ------- | -------- | -------- | --------- | --------- |
| 1 tháng | 30 ngày  | 90.000đ  | 90k       | -         |
| 3 tháng | 90 ngày  | 255.000đ | 85k       | 5%        |
| 6 tháng | 180 ngày | 480.000đ | 80k       | 11%       |

---

## 🚀 Deployment Steps

1. Deploy backend với schema mới
2. Run migration script cho existing users
3. Deploy frontend với UI mới
4. Monitor errors và user feedback
5. Deprecate old token system sau 1 tháng

---

## 📧 Email Templates cần tạo

1. **Subscription Activated** - Khi mua gói thành công
2. **Subscription Expiring Soon** - 7 ngày trước hết hạn
3. **Subscription Expired** - Khi hết hạn
4. **Subscription Renewed** - Khi gia hạn thành công

---

## 🔍 Testing Checklist

- [ ] User mua gói mới → subscription active
- [ ] User với subscription active → access premium features
- [ ] User với subscription expired → blocked from premium
- [ ] Cron job chạy đúng → update expired subscriptions
- [ ] Cancel subscription → không gia hạn
- [ ] Renew subscription → extend endDate
- [ ] Migration script → convert credits thành công

---

**Người thực hiện Backend**: [Tên dev]
**Timeline ước tính**: 3-5 ngày
**Priority**: High
