# ✅ Sentry Integration Complete!

## 📦 What's Integrated

### Backend:

- ✅ Sentry SDK initialized
- ✅ Request/Tracing handlers
- ✅ Error handler captures exceptions
- ✅ Test endpoint: `/api/test-error`
- ✅ Captures 5xx errors and unexpected errors
- ✅ Ignores 4xx errors (expected)

### Frontend:

- ✅ Sentry SDK initialized
- ✅ Browser tracing
- ✅ Session replay (on errors)
- ✅ ErrorBoundary integration
- ✅ User feedback dialog
- ✅ Test error button (dev only)

---

## 🚀 Setup Instructions

### 1. Create Sentry Account

1. Go to: https://sentry.io/signup/
2. Create Organization
3. Create 2 Projects:
   - **capyvo-backend** (Platform: Node.js)
   - **capyvo-frontend** (Platform: React)

### 2. Get DSN Keys

**Backend DSN:**

- Sentry Dashboard → capyvo-backend → Settings → Client Keys (DSN)
- Copy: `https://xxx@xxx.ingest.sentry.io/xxx`

**Frontend DSN:**

- Sentry Dashboard → capyvo-frontend → Settings → Client Keys (DSN)
- Copy: `https://xxx@xxx.ingest.sentry.io/xxx`

### 3. Install Dependencies

**Backend:**

```bash
cd server
npm install @sentry/node @sentry/profiling-node
```

**Frontend:**

```bash
cd client
npm install @sentry/react
```

### 4. Update Environment Variables

**Backend (.env):**

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
```

**Frontend (.env.local):**

```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=development
```

### 5. Start Servers

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
cd client
npm run dev
```

---

## 🧪 Testing

### Backend Test:

```bash
# Trigger test error
curl http://localhost:5000/api/test-error

# Check Sentry Dashboard → capyvo-backend → Issues
# You should see: "Test error for Sentry"
```

### Frontend Test:

1. Open app in browser
2. Look for "Test Error" button (bottom right, dev only)
3. Click "Test Error" → Should show ErrorBoundary
4. Click "Test Sentry" → Should send message to Sentry
5. Check Sentry Dashboard → capyvo-frontend → Issues

---

## 📊 What Gets Captured

### Backend:

- ✅ 5xx errors (server errors)
- ✅ Unexpected exceptions
- ✅ Request context (path, method, body, query)
- ✅ Stack traces
- ❌ 4xx errors (not captured - they're expected)
- ❌ Validation errors (not captured - they're expected)

### Frontend:

- ✅ Unhandled exceptions
- ✅ ErrorBoundary catches
- ✅ Component stack traces
- ✅ User session replay (on error)
- ✅ Browser info, URL, user actions
- ❌ Network errors (ignored - too noisy)
- ❌ Browser extension errors (ignored)

---

## 🎯 Features

### 1. Error Tracking

- Real-time error notifications
- Stack traces with source maps
- Request/response context
- User session info

### 2. Performance Monitoring

- API endpoint performance
- Slow queries detection
- Frontend page load times
- Component render times

### 3. Session Replay (Frontend)

- Video-like replay of user session
- Only captured when error occurs
- Privacy: masks all text & media

### 4. User Feedback (Frontend)

- User can report bugs directly
- Includes error context
- Linked to Sentry event

---

## 💰 Free Tier Limits

| Feature            | Free Tier                 | Enough for?            |
| ------------------ | ------------------------- | ---------------------- |
| **Errors**         | 5,000/month               | ✅ Yes (100-200 users) |
| **Performance**    | 10,000 transactions/month | ✅ Yes                 |
| **Replays**        | 50 sessions/month         | ⚠️ Limited             |
| **Attachments**    | 1 GB                      | ✅ Yes                 |
| **Data Retention** | 30 days                   | ✅ Yes                 |

**Recommendation:** Start with free tier, upgrade when needed.

---

## 🔧 Configuration

### Sampling Rates:

**Production:**

- Errors: 100% (all errors captured)
- Performance: 10% (1 in 10 requests)
- Replays: 10% normal, 100% on error

**Development:**

- Errors: 100%
- Performance: 100%
- Replays: 100%

### Ignored Errors:

**Frontend:**

- Network errors (too noisy)
- Browser extension errors
- ResizeObserver errors

**Backend:**

- 4xx errors (expected)
- Validation errors (expected)

---

## 📈 Sentry Dashboard

### Issues Tab:

- See all errors
- Group by error type
- Filter by environment
- Assign to team members

### Performance Tab:

- API endpoint performance
- Slow queries
- Frontend page load times

### Replays Tab:

- Watch user sessions
- See what user did before error
- Debug UI issues

---

## 🐛 Troubleshooting

### Backend: "Sentry DSN not found"

- Check `.env` file has `SENTRY_DSN`
- Restart server after adding DSN

### Frontend: "Sentry DSN not found"

- Check `.env.local` file has `VITE_SENTRY_DSN`
- Restart dev server after adding DSN

### No errors showing in Sentry

- Check environment matches (dev/prod)
- Check DSN is correct
- Check network tab for Sentry requests
- Wait 1-2 minutes for processing

### Too many errors

- Adjust sampling rates
- Add more ignored errors
- Filter by environment

---

## ✅ Verification Checklist

**Backend:**

- [ ] Dependencies installed
- [ ] SENTRY_DSN in .env
- [ ] Console shows "✅ Sentry initialized"
- [ ] Test endpoint works: `/api/test-error`
- [ ] Error appears in Sentry dashboard

**Frontend:**

- [ ] Dependencies installed
- [ ] VITE_SENTRY_DSN in .env.local
- [ ] Console shows "✅ Sentry initialized"
- [ ] Test button visible (dev only)
- [ ] Error appears in Sentry dashboard
- [ ] User feedback dialog works

---

## 🎉 You're Done!

Sentry is now tracking errors in both backend and frontend!

**Next steps:**

1. Set up Slack/Email notifications in Sentry
2. Invite team members
3. Set up release tracking
4. Configure source maps for production

**Useful links:**

- Sentry Dashboard: https://sentry.io/
- Docs: https://docs.sentry.io/
- Best Practices: https://docs.sentry.io/platforms/javascript/best-practices/
