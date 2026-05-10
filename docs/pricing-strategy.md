# Chiến lược giá & Roadmap triển khai - Hệ thống luyện thi TOEIC Speaking

## 📊 Phân tích chi phí thực tế

### 1. Chi phí Supabase (Storage + Database)

**Gói FREE Supabase:**

- 500MB Database
- 1GB File Storage
- 5GB Bandwidth
- 50,000 Monthly Active Users
- **Chi phí: $0/tháng**

**Gói PRO Supabase ($25/tháng):**

- 8GB Database
- 100GB File Storage
- 250GB Bandwidth
- 100,000 Monthly Active Users

**Ước tính storage cho audio:**

- Audio file trung bình: ~200-500KB/recording (WebM/OGG compressed)
- 1 user active (30 recordings/tháng): ~15MB
- 100 users: ~1.5GB
- 1000 users: ~15GB

→ **Với 100-200 users có thể dùng FREE tier, >500 users cần PRO ($25/tháng)**

---

### 2. Chi phí OpenAI API (Phân tích AI)

Dựa trên code thực tế trong `response.service.ts`:

**Whisper API (Transcription only):**

- Model: `whisper-1`
- Giá: **$0.006/phút**
- Audio trung bình: 1-2 phút/recording
- Chi phí: **~$0.009/recording** (trung bình 1.5 phút)

**GPT-4o-mini (Analysis & Scoring):**

- Model: `gpt-4o-mini`
- Input: ~500-1000 tokens (prompt + transcript)
- Output: ~300-500 tokens (JSON analysis)
- Giá: $0.150/1M input tokens, $0.600/1M output tokens
- Chi phí: **~$0.0004/request**

**Chi phí theo gói:**

- **Basic (Transcription only):** $0.009/recording
- **Premium (Transcription + Analysis):** $0.009 + $0.0004 = **$0.0094/recording**

**Chi phí AI theo user (30 recordings/tháng):**

- **Basic user:** 30 × $0.009 = **$0.27/tháng**
- **Premium user:** 30 × $0.0094 = **$0.28/tháng**

---

## 💰 Đề xuất 2 gói dịch vụ (FINAL)

### GÓI BASIC - 49,000 VNĐ/tháng (~$2)

**Tính năng:**

- ✅ Lưu trữ audio không giới hạn
- ✅ Nghe lại recordings
- ✅ **AI Transcription** (Whisper) - Hiển thị transcript
- ✅ Xem lịch sử luyện tập
- ✅ **Share bài tập & reactions** (community features)
- ✅ Luyện tập theo Part (1-5)
- ✅ Làm Full Test
- ❌ **KHÔNG có AI Analysis & Scoring**
- ❌ **KHÔNG có Feedback chi tiết**
- ❌ **KHÔNG có ước tính điểm TOEIC**

**Phù hợp với:**

- Học viên tự luyện tập, muốn xem transcript để tự đánh giá
- Người muốn làm quen với format đề thi
- Người có ngân sách hạn chế nhưng vẫn muốn biết mình nói gì

**Chi phí AI:** $0.27/user/tháng

---

### GÓI PREMIUM - 99,000 VNĐ/tháng (~$4)

**Tính năng:**

- ✅ **Tất cả tính năng Basic**
- ✅ **AI Analysis & Scoring** (GPT-4o-mini)
- ✅ **Feedback chi tiết** theo từng tiêu chí:
  - Accuracy (độ chính xác)
  - Vocabulary (từ vựng)
  - Grammar (ngữ pháp)
  - Fluency (độ trôi chảy)
- ✅ **Phân tích lỗi chi tiết** (omission, pronunciation, grammar, substitution...)
- ✅ **Ước tính điểm TOEIC** (0-200)
- ✅ **Overall Assessment** cho Full Test
- ✅ **Progress tracking** với AI insights

**Phù hợp với:**

- Học viên muốn cải thiện nhanh
- Người cần feedback chi tiết để sửa lỗi cụ thể
- Người chuẩn bị thi TOEIC Speaking nghiêm túc

**Chi phí AI:** $0.28/user/tháng

---

## 📈 Phân tích lợi nhuận

### Kịch bản 1: 500 users (300 Basic + 200 Premium)

**Doanh thu:**

- Basic: 300 × 49,000 = 14,700,000 VNĐ (~$595)
- Premium: 200 × 99,000 = 19,800,000 VNĐ (~$800)
- **Tổng: 34,500,000 VNĐ (~$1,395/tháng)**

**Chi phí:**

- Supabase PRO: $25
- OpenAI Basic: 300 × $0.27 = $81
- OpenAI Premium: 200 × $0.28 = $56
- **Tổng chi phí: $162**

**Lợi nhuận: $1,395 - $162 = $1,233** ✅ (Lãi 88%)

---

### Kịch bản 2: 500 users (350 Basic + 150 Premium)

**Doanh thu:**

- Basic: 350 × 49,000 = 17,150,000 VNĐ (~$694)
- Premium: 150 × 99,000 = 14,850,000 VNĐ (~$600)
- **Tổng: 32,000,000 VNĐ (~$1,294/tháng)**

**Chi phí:**

- Supabase PRO: $25
- OpenAI Basic: 350 × $0.27 = $94.5
- OpenAI Premium: 150 × $0.28 = $42
- **Tổng chi phí: $161.5**

**Lợi nhuận: $1,294 - $161.5 = $1,132.5** ✅ (Lãi 87%)

---

### Kịch bản 3: 1000 users (600 Basic + 400 Premium)

**Doanh thu:**

- Basic: 600 × 49,000 = 29,400,000 VNĐ (~$1,190)
- Premium: 400 × 99,000 = 39,600,000 VNĐ (~$1,600)
- **Tổng: 69,000,000 VNĐ (~$2,790/tháng)**

**Chi phí:**

- Supabase PRO: $25
- OpenAI Basic: 600 × $0.27 = $162
- OpenAI Premium: 400 × $0.28 = $112
- **Tổng chi phí: $299**

**Lợi nhuận: $2,790 - $299 = $2,491** ✅ (Lãi 89%)

---

## 🎯 Chiến lược marketing

**Voucher Code System:**

- Admin tạo voucher codes để phát cho nhóm người dùng
- 1 voucher code có thể dùng cho nhiều users (tùy chỉnh `maxUses`)
- User nhập voucher code tại trang Billing
- Voucher hợp lệ → Kích hoạt Premium miễn phí theo duration
- Không cần thẻ tín dụng để dùng voucher
- Mỗi user chỉ dùng được 1 lần/voucher code

**Ví dụ Voucher Campaigns:**

- **WELCOME2024**: 7 ngày Premium, maxUses = 100 (cho 100 người đầu tiên)
- **EARLYBIRD**: 14 ngày Premium, maxUses = 50 (cho early adopters)
- **BETA_TESTER**: 30 ngày Premium, maxUses = 20 (cho beta testers)
- **PARTNER_INFLUENCER**: 90 ngày Premium, maxUses = 5 (cho influencers)
- **FRIEND_REFERRAL**: 7 ngày Premium, maxUses = 1 (cho referral cá nhân)

**Use Cases:**

1. **Chào mừng người mới:** Tạo code "WELCOME2024" với maxUses = 1000
2. **Event/Workshop:** Tạo code "WORKSHOP_JAN2024" với maxUses = 30
3. **Influencer campaign:** Tạo code "INFLUENCER_NAME" với maxUses = 100
4. **Personal referral:** Tạo code unique với maxUses = 1

**Note:** Không có chương trình giảm giá dài hạn hoặc referral program tự động ở giai đoạn đầu

---

## 🚀 Roadmap triển khai tính năng

### Phase 1: Community Features (Tuần 1-2)

#### 1.1. Sidebar với Segmented Control (Practice Part only)

**File cần sửa:**

- `client/src/features/exam/pages/QuestionPracticePage.tsx`
- `client/src/features/exam/components/PracticeHistoryPanel.tsx`

**Tính năng:**

- Thêm Ant Design `Segmented` component với 2 tabs:
  - Tab 1: "Lịch sử" (History) - Hiển thị history cards như hiện tại
  - Tab 2: "Cộng đồng" (Community) - Hiển thị public shares
- Chỉ áp dụng cho Practice Part, **KHÔNG có ở Full Test**

#### 1.2. Share Button trên History Card

**File cần sửa:**

- `client/src/features/exam/components/PracticeHistoryPanel.tsx`

**Tính năng:**

- Thêm nút "Share" (icon ShareAltOutlined) trên mỗi history card
- Click Share → Chuyển sang tab "Cộng đồng" + hiển thị modal xác nhận
- Modal: "Chia sẻ bài tập này với cộng đồng?"
  - Nút "Hủy" / "Chia sẻ"

#### 1.3. Public Shares Tab

**File mới:**

- `client/src/features/exam/components/PublicSharesPanel.tsx`
- `client/src/features/exam/services/share.service.ts`

**Tính năng:**

- Hiển thị danh sách các bài tập đã được share công khai
- Mỗi share card hiển thị:
  - Avatar + tên user
  - Transcript (nếu có)
  - Thời gian share
  - Reactions bar (1️⃣2️⃣3️⃣4️⃣5️⃣😍💖🤔)
  - Số lượng mỗi reaction
- Click vào card → Xem chi tiết (transcript + audio player)

#### 1.4. Reactions System

**File mới:**

- `client/src/features/exam/components/ReactionBar.tsx`

**Tính năng:**

- Reactions giống GitHub Issues:
  - 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ (đánh giá 1-5 sao)
  - 😍 (Excellent)
  - 💖 (Love it)
  - 🤔 (Needs improvement)
- User chỉ được react 1 lần/share
- Click lại để bỏ reaction
- Hiển thị số lượng mỗi reaction

---

### Phase 2: Backend cho Share & Reactions (Tuần 1-2)

#### 2.1. Database Schema

**File cần sửa:**

- `server/prisma/schema.prisma`

**Thêm models:**

```prisma
model PublicShare {
  id          String   @id @default(cuid())
  responseId  String   @unique
  userId      String
  questionId  String
  createdAt   DateTime @default(now())

  response    UserResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  question    Question     @relation(fields: [questionId], references: [id], onDelete: Cascade)
  reactions   Reaction[]

  @@index([questionId])
  @@index([createdAt])
}

model Reaction {
  id        String   @id @default(cuid())
  shareId   String
  userId    String
  emoji     String   // "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "😍", "💖", "🤔"
  createdAt DateTime @default(now())

  share     PublicShare @relation(fields: [shareId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([shareId, userId]) // 1 user chỉ react 1 lần/share
  @@index([shareId])
}
```

#### 2.2. API Endpoints

**File mới:**

- `server/src/controllers/share.controller.ts`
- `server/src/services/share.service.ts`
- `server/src/routes/share.routes.ts`

**Endpoints:**

```typescript
POST   /api/shares                    // Tạo public share
DELETE /api/shares/:shareId           // Xóa share (chỉ owner)
GET    /api/shares/question/:questionId  // Lấy shares của 1 câu hỏi
POST   /api/shares/:shareId/reactions // Thêm/xóa reaction
GET    /api/shares/:shareId/reactions // Lấy reactions của 1 share
```

#### 2.3. Business Logic

**Rules:**

- Chỉ Premium users mới được share (vì cần transcript)
- Basic users có thể xem shares và react
- Owner có thể xóa share của mình
- 1 response chỉ share được 1 lần
- 1 user chỉ react 1 lần/share (click lại để đổi reaction)

---

### Phase 3: Subscription System (Tuần 3-4)

#### 3.1. Gating Logic cho Basic vs Premium

**File cần sửa:**

- `server/src/services/response.service.ts`

**Logic:**

- `transcribeResponse()`: Cho phép cả Basic và Premium
- `analyzeResponse()`: Chỉ Premium (giữ nguyên check subscription)
- `transcribeAndAnalyze()`: Chỉ Premium (giữ nguyên)

**File cần sửa:**

- `client/src/features/exam/components/QuestionPracticeView.tsx`
- `client/src/features/exam/components/ResultView.tsx`

**UI Changes:**

- Basic users: Hiển thị transcript sau khi record
- Basic users: KHÔNG hiển thị score, criteria, issues
- Basic users: Hiển thị CTA "Nâng cấp Premium để nhận phân tích AI"

#### 3.2. Voucher System

**File mới:**

- `server/src/models/voucher.model.ts`
- `server/src/services/voucher.service.ts`
- `server/src/controllers/voucher.controller.ts`

**Database Schema:**

```prisma
model Voucher {
  id          String    @id @default(cuid())
  code        String    @unique // "WELCOME2024", "EARLYBIRD", etc.
  description String?   // "Chào mừng người dùng mới", "Early bird campaign"
  type        String    // "CAMPAIGN", "PERSONAL", "PARTNER", "EVENT"
  durationDays Int      // 7, 14, 30, 90
  maxUses     Int       @default(1) // Số lần tối đa có thể dùng (1 = personal, 100+ = campaign)
  usedCount   Int       @default(0) // Số lần đã dùng
  isActive    Boolean   @default(true) // Admin có thể tắt voucher
  expiresAt   DateTime? // Ngày hết hạn voucher (optional)
  createdAt   DateTime  @default(now())
  createdBy   String    // Admin user ID

  redemptions VoucherRedemption[]

  @@index([code])
  @@index([isActive])
}

model VoucherRedemption {
  id          String   @id @default(cuid())
  voucherId   String
  userId      String
  redeemedAt  DateTime @default(now())

  voucher     Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([voucherId, userId]) // 1 user chỉ dùng 1 voucher code 1 lần
  @@index([userId])
  @@index([voucherId])
}
```

**API Endpoints:**

```typescript
// Admin endpoints
POST   /api/admin/vouchers              // Tạo voucher mới
GET    /api/admin/vouchers              // List tất cả vouchers
PATCH  /api/admin/vouchers/:voucherId   // Toggle active/inactive
DELETE /api/admin/vouchers/:voucherId   // Xóa voucher
GET    /api/admin/vouchers/:voucherId/redemptions // Xem ai đã dùng

// User endpoints
POST   /api/vouchers/redeem             // Nhập voucher code
GET    /api/vouchers/my-redemptions     // Xem vouchers đã dùng
```

**Critical Implementation Notes:**

1. **Race Condition Protection (QUAN TRỌNG!):**

```typescript
// voucher.service.ts
async redeemVoucher(code: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock voucher row và lấy thông tin
    const voucher = await tx.voucher.findUnique({
      where: { code },
      // Transaction sẽ lock row này
    })

    // 2. Validate
    if (!voucher) throw new Error('Voucher không tồn tại')
    if (!voucher.isActive) throw new Error('Voucher đã bị vô hiệu hóa')
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new Error('Voucher đã hết hạn')
    }
    if (voucher.usedCount >= voucher.maxUses) {
      throw new Error('Voucher đã hết lượt sử dụng')
    }

    // 3. Check user chưa dùng voucher này
    const existing = await tx.voucherRedemption.findUnique({
      where: {
        voucherId_userId: {
          voucherId: voucher.id,
          userId
        }
      }
    })
    if (existing) throw new Error('Bạn đã sử dụng voucher này rồi')

    // 4. Get current user
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    // 5. Calculate new premium until
    const today = new Date()
    const currentPremium = user.premiumUntil || today
    const baseDate = currentPremium > today ? currentPremium : today
    const newPremiumUntil = addDays(baseDate, voucher.durationDays)

    // 6. Create redemption (unique constraint sẽ catch duplicate nếu có)
    await tx.voucherRedemption.create({
      data: {
        voucherId: voucher.id,
        userId
      }
    })

    // 7. Increment usedCount (atomic operation)
    await tx.voucher.update({
      where: { id: voucher.id },
      data: { usedCount: { increment: 1 } }
    })

    // 8. Update user premium
    await tx.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: newPremiumUntil
      }
    })

    return {
      success: true,
      premiumUntil: newPremiumUntil,
      daysAdded: voucher.durationDays
    }
  }, {
    isolationLevel: 'Serializable', // Highest isolation level
    timeout: 10000 // 10 seconds timeout
  })
}
```

2. **Why This Prevents Race Conditions:**
   - **Database Transaction**: All operations are atomic (all-or-nothing)
   - **Row Locking**: Prisma locks the voucher row during transaction
   - **Unique Constraint**: `@@unique([voucherId, userId])` prevents duplicate redemptions
   - **Atomic Increment**: `{ increment: 1 }` is atomic at database level
   - **Serializable Isolation**: Prevents phantom reads and write skews

3. **Test Scenarios:**
   - ✅ 2 users redeem simultaneously when usedCount = 98, maxUses = 100 → Both succeed
   - ✅ 2 users redeem simultaneously when usedCount = 99, maxUses = 100 → 1 succeeds, 1 fails
   - ✅ Same user tries to redeem twice → Second attempt fails
   - ✅ User redeems expired voucher → Fails
   - ✅ User redeems inactive voucher → Fails

**Business Logic:**

- Admin tạo voucher với:
  - `code`: Mã voucher (VD: "WELCOME2024")
  - `description`: Mô tả campaign
  - `type`: Loại voucher
  - `durationDays`: Số ngày Premium
  - `maxUses`: Số lượng người có thể dùng (VD: 30, 100, 1000)
  - `expiresAt`: Ngày hết hạn (optional)

- User nhập code tại Billing page
- System validation:
  1. ✅ Voucher tồn tại?
  2. ✅ `isActive = true`?
  3. ✅ Chưa hết hạn (`expiresAt > now` hoặc null)?
  4. ✅ Còn slot (`usedCount < maxUses`)?
  5. ✅ User chưa dùng voucher này? (check VoucherRedemption)

- **Nếu hợp lệ (với Database Transaction để tránh race condition):**

  ```typescript
  // Sử dụng Prisma transaction + optimistic locking
  await prisma.$transaction(async (tx) => {
    // 1. Lock voucher row và check lại usedCount
    const voucher = await tx.voucher.findUnique({
      where: { id: voucherId },
      // Prisma sẽ lock row này cho đến khi transaction commit
    })

    if (!voucher || voucher.usedCount >= voucher.maxUses) {
      throw new Error('Voucher đã hết lượt sử dụng')
    }

    // 2. Check user chưa dùng voucher này
    const existing = await tx.voucherRedemption.findUnique({
      where: { voucherId_userId: { voucherId, userId } },
    })

    if (existing) {
      throw new Error('Bạn đã sử dụng voucher này rồi')
    }

    // 3. Tạo redemption record
    await tx.voucherRedemption.create({
      data: { voucherId, userId },
    })

    // 4. Increment usedCount (atomic operation)
    await tx.voucher.update({
      where: { id: voucherId },
      data: { usedCount: { increment: 1 } },
    })

    // 5. Update user premium
    const newPremiumUntil = calculatePremiumUntil(user.premiumUntil, durationDays)
    await tx.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: newPremiumUntil,
      },
    })
  })
  ```

- **Race Condition Protection:**
  - Sử dụng **Database Transaction** để đảm bảo atomicity
  - Prisma transaction tự động lock rows trong transaction
  - `usedCount: { increment: 1 }` là atomic operation
  - `@@unique([voucherId, userId])` constraint ngăn duplicate redemption
  - Nếu 2 users cùng redeem lúc maxUses = 99/100:
    - User A: Lock → Check (99 < 100) → Increment → Commit (100/100) ✅
    - User B: Wait → Lock → Check (100 >= 100) → Rollback ❌

**Example Flow:**

```
Admin tạo: "WELCOME2024" - 7 days - maxUses: 100
User 1 nhập "WELCOME2024" → Success (usedCount: 1/100)
User 2 nhập "WELCOME2024" → Success (usedCount: 2/100)
...
User 99 & 100 cùng nhập lúc usedCount = 98:
  → User 99: Success (usedCount: 99/100)
  → User 100: Success (usedCount: 100/100)
User 101 nhập "WELCOME2024" → Error: "Voucher đã hết lượt sử dụng"
User 1 nhập "WELCOME2024" lại → Error: "Bạn đã sử dụng voucher này rồi"
```

#### 3.3. Subscription Management UI

**File mới:**

- `client/src/features/subscription/pages/BillingPage.tsx`
- `client/src/features/subscription/components/PricingCards.tsx`
- `client/src/features/subscription/components/VoucherInput.tsx`
- `client/src/features/subscription/components/UpgradeModal.tsx`

**Tính năng:**

- Trang Billing hiển thị:
  - Gói hiện tại (Basic/Premium)
  - Ngày hết hạn (nếu Premium)
  - Input nhập voucher code
  - Pricing comparison table
  - Nút "Nâng cấp" / "Gia hạn"
- VoucherInput component:
  - Input field + nút "Áp dụng"
  - Validation & error messages
  - Success message khi redeem thành công

#### 3.4. Admin Voucher Management UI

**File mới:**

- `client/src/features/admin/pages/VoucherManagementPage.tsx`
- `client/src/features/admin/components/CreateVoucherModal.tsx`
- `client/src/features/admin/components/VoucherList.tsx`

**Tính năng:**

- Admin page để tạo/quản lý vouchers
- Form tạo voucher:
  - **Code**: Input field (VD: "WELCOME2024") + nút "Generate Random"
  - **Description**: Mô tả campaign (VD: "Chào mừng người dùng mới")
  - **Type**: Dropdown (CAMPAIGN, PERSONAL, PARTNER, EVENT)
  - **Duration**: Input number + dropdown (7, 14, 30, 90 days)
  - **Max Uses**: Input number (VD: 1, 30, 100, 1000)
  - **Expires At**: DatePicker (optional)
- Table hiển thị vouchers:
  - Columns: Code, Description, Type, Duration, Used/Max, Status, Expires, Actions
  - Status badge: Active (green) / Inactive (gray) / Expired (red) / Full (orange)
  - Progress bar: usedCount/maxUses
  - Actions:
    - 📋 Copy code
    - 🔄 Toggle Active/Inactive
    - 🗑️ Delete
- Filters:
  - Status: All / Active / Inactive / Expired / Full
  - Type: All / Campaign / Personal / Partner / Event
- Stats cards:
  - Total vouchers
  - Active vouchers
  - Total redemptions
  - Most used voucher

#### 3.5. Payment Integration (Future)

**Note:** Tạm thời KHÔNG implement payment gateway. User chỉ có thể:

1. Dùng voucher để có Premium
2. Admin manually update premiumUntil trong database

**Future payment options:**

- VNPay (Vietnam)
- Stripe (International)
- MoMo (Vietnam mobile wallet)

---

### Phase 4: Testing & Polish (Tuần 4)

#### 4.1. Testing

- Test share flow: Practice → Share → Community tab
- Test reactions: Add, remove, change reaction
- Test gating: Basic vs Premium features
- Test edge cases: Share khi chưa có transcript, etc.

#### 4.2. UI/UX Polish

- Loading states cho share/reaction actions
- Error handling & user feedback
- Responsive design cho mobile
- Accessibility (keyboard navigation, screen readers)

#### 4.3. Performance

- Pagination cho public shares list
- Caching cho reactions count
- Optimize queries (eager loading)

---

## 📋 Checklist triển khai

### Week 1: Community Features (Frontend)

- [ ] Thêm Segmented control vào QuestionPracticePage
- [ ] Tạo PublicSharesPanel component
- [ ] Thêm Share button vào history cards
- [ ] Tạo ReactionBar component
- [ ] Tạo share modal xác nhận

### Week 2: Backend API

- [ ] Update Prisma schema (PublicShare, Reaction)
- [ ] Tạo share.service.ts
- [ ] Tạo share.controller.ts
- [ ] Tạo API routes
- [ ] Test API endpoints

### Week 3: Subscription & Voucher System

- [ ] Update gating logic trong response.service.ts
- [ ] Update Prisma schema (Voucher, VoucherRedemption)
- [ ] Tạo voucher.service.ts & voucher.controller.ts
- [ ] Tạo API endpoints cho voucher
- [ ] Tạo BillingPage
- [ ] Tạo VoucherInput component
- [ ] Tạo PricingCards component
- [ ] Tạo Admin VoucherManagementPage
- [ ] Tạo CreateVoucherModal
- [ ] Update UI để phân biệt Basic/Premium

### Week 4: Testing & Launch

- [ ] Integration testing
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deploy to production

---

## 🎨 Design Notes

**Colors:**

- Basic tier: Blue (#1890ff)
- Premium tier: Gold (#faad14)

**Icons:**

- Share: ShareAltOutlined
- Reactions: Native emoji (1️⃣2️⃣3️⃣4️⃣5️⃣😍💖🤔)
- Premium badge: CrownOutlined

**Spacing:**

- Reaction bar: 8px gap between emojis
- Share cards: 16px padding
- Segmented control: Full width, 2 equal tabs
