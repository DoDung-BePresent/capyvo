# Backend Implementation Summary - Subscription System

## ✅ Đã hoàn thành

### 1. Database Schema (Prisma)

- ✅ Thêm enums: `SubscriptionStatus`, `SubscriptionPlanId`
- ✅ Tạo model `SubscriptionPlan` - Lưu thông tin các gói
- ✅ Tạo model `Subscription` - Lưu subscription của user
- ✅ Cập nhật model `User` - Thêm `isPremium`, `premiumUntil`
- ✅ Cập nhật model `Payment` - Thêm `subscriptionId` link

**File:** `server/prisma/schema.prisma`

### 2. Seed Data

- ✅ Tạo script seed cho 3 gói subscription
  - MONTHLY: 90.000đ / 30 ngày
  - QUARTERLY: 255.000đ / 90 ngày
  - BIANNUAL: 480.000đ / 180 ngày

**File:** `server/prisma/seed-subscriptions.ts`

**Chạy:** `npx ts-node server/prisma/seed-subscriptions.ts`

### 3. Services

- ✅ `SubscriptionService` - Logic xử lý subscription
  - `getPlans()` - Lấy danh sách gói
  - `getCurrentSubscription()` - Lấy subscription hiện tại
  - `createSubscription()` - Tạo subscription mới
  - `renewSubscription()` - Gia hạn subscription
  - `cancelSubscription()` - Hủy subscription
  - `checkExpiredSubscriptions()` - Check expired (cron job)
  - `isPremiumUser()` - Check user có premium không
  - `getDaysRemaining()` - Tính số ngày còn lại

**File:** `server/src/services/subscription.service.ts`

- ✅ Cập nhật `PaymentService`
  - `createSubscriptionOrder()` - Tạo payment link cho subscription
  - `handleWebhook()` - Xử lý cả token và subscription
  - `extractPlanIdFromDescription()` - Parse plan từ description

**File:** `server/src/services/payment.service.ts`

### 4. Controllers

- ✅ `SubscriptionController` - API endpoints
  - `GET /api/subscription/plans` - Danh sách gói
  - `GET /api/subscription/current` - Subscription hiện tại
  - `GET /api/subscription/history` - Lịch sử subscriptions
  - `POST /api/subscription/create` - Tạo subscription
  - `POST /api/subscription/cancel` - Hủy subscription
  - `POST /api/subscription/check-expired` - Cron endpoint

**File:** `server/src/controllers/subscription.controller.ts`

- ✅ Cập nhật `PaymentController`
  - `POST /api/payments/create-subscription` - Tạo payment cho subscription

**File:** `server/src/controllers/payment.controller.ts`

### 5. Middleware

- ✅ `requirePremium` - Block non-premium users
- ✅ `checkPremium` - Thêm flag isPremium vào request

**File:** `server/src/middleware/premium.middleware.ts`

### 6. Routes

- ✅ Subscription routes
- ✅ Cập nhật payment routes
- ✅ Register vào main router

**Files:**

- `server/src/routes/subscription.routes.ts`
- `server/src/routes/payment.routes.ts`
- `server/src/routes/index.ts`

### 7. Cron Jobs

- ✅ Check expired subscriptions hàng ngày lúc 00:00
- ✅ Auto revoke premium khi hết hạn

**File:** `server/src/jobs/check-expired-subscriptions.job.ts`

### 8. Server Integration

- ✅ Start cron job khi server khởi động

**File:** `server/src/server.ts`

---

## 📝 Cần làm tiếp

### 1. Run Migration

```bash
cd server
npx prisma migrate dev --name add_subscription_system
npx prisma generate
```

### 2. Seed Subscription Plans

```bash
npx ts-node prisma/seed-subscriptions.ts
```

### 3. Install Dependencies (nếu thiếu)

```bash
npm install node-cron
npm install --save-dev @types/node-cron
npm install date-fns
```

### 4. Áp dụng Premium Middleware

Cập nhật các endpoints cần premium:

```typescript
// server/src/routes/response.routes.ts
import { requirePremium } from '@/middleware/premium.middleware'

router.post('/transcribe', requirePremium, ...)
router.post('/analyze', requirePremium, ...)
```

### 5. Migration Script cho Users hiện tại

Tạo script convert credits sang subscription:

```bash
npx ts-node scripts/migrate-users-to-subscription.ts
```

**File cần tạo:** `server/scripts/migrate-users-to-subscription.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function migrate() {
  const users = await prisma.user.findMany({
    where: { transcriptionCredits: { gt: 0 } },
  })

  for (const user of users) {
    // 1 credit = 1 ngày premium (hoặc tùy logic)
    const days = user.transcriptionCredits

    if (days > 0) {
      const endDate = addDays(new Date(), days)

      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: 'MONTHLY', // Custom plan
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: true,
          premiumUntil: endDate,
        },
      })

      console.log(`Migrated user ${user.email}: ${days} days`)
    }
  }
}

migrate()
```

### 6. Testing

- [ ] Test tạo subscription order
- [ ] Test payment webhook với subscription
- [ ] Test check expired cron job
- [ ] Test premium middleware
- [ ] Test cancel subscription
- [ ] Test renew subscription

### 7. Environment Variables

Đảm bảo có trong `.env`:

```env
PAYOS_CLIENT_ID=xxx
PAYOS_API_KEY=xxx
PAYOS_CHECKSUM_KEY=xxx
PAYOS_RETURN_URL=http://localhost:5173/payment/result
PAYOS_CANCEL_URL=http://localhost:5173/payment/cancel
```

---

## 🔄 API Endpoints Summary

### Subscription

- `GET /api/subscription/plans` - Public, lấy danh sách gói
- `GET /api/subscription/current` - Protected, subscription hiện tại
- `GET /api/subscription/history` - Protected, lịch sử
- `POST /api/subscription/create` - Protected, tạo subscription (sau payment)
- `POST /api/subscription/cancel` - Protected, hủy subscription

### Payment

- `POST /api/payments/create-subscription` - Protected, tạo payment link
- `POST /api/payments/webhook` - Public, PayOS callback
- `GET /api/payments/status?orderCode=xxx` - Protected, check status

---

## 🎯 Flow hoàn chỉnh

1. User chọn gói trên `/pricing`
2. Frontend call `POST /api/payments/create-subscription` với `planId`
3. Backend tạo payment link PayOS
4. User thanh toán trên PayOS
5. PayOS gọi webhook `POST /api/payments/webhook`
6. Backend tạo Subscription, update User premium status
7. User được redirect về `/payment/result`
8. Frontend poll `GET /api/payments/status` để confirm
9. Hiển thị success và redirect về home

---

## 📊 Database Diagram

```
User
├── id (PK)
├── isPremium
├── premiumUntil
└── subscriptions[] ──┐
                      │
Subscription          │
├── id (PK)           │
├── userId (FK) ──────┘
├── planId (FK) ──────┐
├── status            │
├── startDate         │
├── endDate           │
└── payments[] ───┐   │
                  │   │
Payment           │   │
├── id (PK)       │   │
├── userId (FK)   │   │
├── subscriptionId├───┘
└── ...           │
                  │
SubscriptionPlan  │
├── id (PK) ──────┘
├── name
├── durationDays
├── price
└── pricePerMonth
```

---

## ✨ Hoàn thành!

Backend đã sẵn sàng cho subscription system. Chỉ cần:

1. Run migration
2. Seed plans
3. Test flow
4. Deploy!
