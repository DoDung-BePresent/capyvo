# Sentry Integration Guide

## Step 1: Create Sentry Account

1. Đăng ký tại: https://sentry.io/signup/
2. Create Organization
3. Create 2 Projects:
   - **capyvo-backend** (Node.js)
   - **capyvo-frontend** (React)
4. Copy DSN từ mỗi project

## Step 2: Install Dependencies

### Backend:

```bash
cd server
npm install @sentry/node @sentry/profiling-node
```

### Frontend:

```bash
cd client
npm install @sentry/react
```

## Step 3: Get DSN

### Backend DSN:

- Sentry Dashboard → capyvo-backend → Settings → Client Keys (DSN)
- Copy: `https://xxx@xxx.ingest.sentry.io/xxx`

### Frontend DSN:

- Sentry Dashboard → capyvo-frontend → Settings → Client Keys (DSN)
- Copy: `https://xxx@xxx.ingest.sentry.io/xxx`

## Step 4: Update .env

### Backend (.env):

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
```

### Frontend (.env.local):

```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=development
```

## Step 5: Test

### Backend:

```bash
npm run dev
# Trigger error: curl http://localhost:5000/api/test-error
# Check Sentry dashboard
```

### Frontend:

```bash
npm run dev
# Click "Test Error" button
# Check Sentry dashboard
```

## Free Tier Limits:

- 5,000 errors/month
- 10,000 performance transactions/month
- 1 GB attachments
- **Đủ dùng cho production!**
