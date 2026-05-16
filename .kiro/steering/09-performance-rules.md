# Performance Optimization Rules

## Frontend Performance

### Code Splitting

```typescript
// Lazy load routes
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'))

// Lazy load heavy components
const AudioVisualizer = lazy(() => import('@/components/AudioVisualizer'))

// Use Suspense for loading states
<Suspense fallback={<Spinner />}>
  <AudioVisualizer />
</Suspense>
```

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['antd', '@mui/material'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
})
```

### Image Optimization

```typescript
// Use WebP format
// Lazy load images
<img
  src={imageUrl}
  loading="lazy"
  alt="Description"
  width={800}
  height={600}
/>

// Use responsive images
<picture>
  <source srcSet={`${imageUrl}?w=400`} media="(max-width: 640px)" />
  <source srcSet={`${imageUrl}?w=800`} media="(max-width: 1024px)" />
  <img src={`${imageUrl}?w=1200`} alt="Description" />
</picture>
```

### Memoization

```typescript
// Memoize expensive computations
const sortedQuestions = useMemo(
  () => questions.sort((a, b) => a.questionNumber - b.questionNumber),
  [questions],
)

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency])

// Memoize components
const MemoizedComponent = memo(ExpensiveComponent)
```

### Virtual Scrolling

```typescript
// Use virtual scrolling for long lists
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

### Debounce & Throttle

```typescript
// Debounce search input
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

const [search, setSearch] = useState('')
const debouncedSearch = useDebouncedValue(search, 300)

useEffect(() => {
  // Fetch results with debounced value
  fetchResults(debouncedSearch)
}, [debouncedSearch])

// Throttle scroll handler
import { throttle } from 'lodash'

const handleScroll = throttle(() => {
  // Scroll logic
}, 100)
```

## Backend Performance

### Database Query Optimization

#### Use Indexes

```prisma
model Question {
  id         String @id
  partNumber Int
  status     String

  @@index([partNumber])
  @@index([status])
  @@index([partNumber, status])
}
```

#### Select Only Needed Fields

```typescript
// ❌ Bad - Fetches all fields
const users = await prisma.user.findMany()

// ✅ Good - Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true,
  },
})
```

#### Avoid N+1 Queries

```typescript
// ❌ Bad - N+1 queries
const users = await prisma.user.findMany()
for (const user of users) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
  })
}

// ✅ Good - Single query with include
const users = await prisma.user.findMany({
  include: {
    subscriptions: true,
  },
})
```

#### Use Batch Operations

```typescript
// ❌ Bad - Multiple queries
for (const id of questionIds) {
  await prisma.question.update({
    where: { id },
    data: { status: 'PUBLISHED' },
  })
}

// ✅ Good - Single batch query
await prisma.question.updateMany({
  where: { id: { in: questionIds } },
  data: { status: 'PUBLISHED' },
})
```

#### Use Pagination

```typescript
const page = 1
const limit = 10
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  prisma.question.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.question.count(),
])
```

### Caching

#### Redis Caching

```typescript
import { redis } from '@/lib/redis'

async function getQuestions(partNumber: number) {
  const cacheKey = `questions:part:${partNumber}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch from database
  const questions = await prisma.question.findMany({
    where: { partNumber, status: 'PUBLISHED' },
  })

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(questions))

  return questions
}
```

#### Cache Invalidation

```typescript
async function updateQuestion(id: string, data: UpdateQuestionDto) {
  const question = await prisma.question.update({
    where: { id },
    data,
  })

  // Invalidate cache
  await redis.del(`questions:part:${question.partNumber}`)
  await redis.del(`question:${id}`)

  return question
}
```

#### HTTP Caching Headers

```typescript
// Cache static assets
app.use(
  '/static',
  express.static('public', {
    maxAge: '1y',
    immutable: true,
  }),
)

// Cache API responses
app.get('/api/questions', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300') // 5 minutes
  // ... response
})
```

### Connection Pooling

#### Prisma Connection Pool

```typescript
// Configure in DATABASE_URL
DATABASE_URL = 'postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20'
```

#### Redis Connection Pool

```typescript
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})
```

### Async Processing

#### Use Job Queues for Heavy Tasks

```typescript
// Don't process heavy tasks in request handler
// ❌ Bad
app.post('/api/responses', async (req, res) => {
  const transcription = await openai.audio.transcriptions.create(...)
  const score = await calculateScore(transcription)
  res.json({ score })
})

// ✅ Good - Use job queue
app.post('/api/responses', async (req, res) => {
  const response = await prisma.userResponse.create({ data })
  await transcriptionQueue.add('transcribe', { responseId: response.id })
  res.json({ success: true, data: response })
})
```

#### Parallel Processing

```typescript
// ❌ Bad - Sequential
const user = await prisma.user.findUnique({ where: { id } })
const subscriptions = await prisma.subscription.findMany({ where: { userId: id } })
const payments = await prisma.payment.findMany({ where: { userId: id } })

// ✅ Good - Parallel
const [user, subscriptions, payments] = await Promise.all([
  prisma.user.findUnique({ where: { id } }),
  prisma.subscription.findMany({ where: { userId: id } }),
  prisma.payment.findMany({ where: { userId: id } }),
])
```

### Compression

#### Gzip Compression

```typescript
import compression from 'compression'

app.use(
  compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false
      }
      return compression.filter(req, res)
    },
  }),
)
```

#### Image Compression

```typescript
import sharp from 'sharp'

async function optimizeImage(buffer: Buffer) {
  return sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}
```

#### Audio Compression

```typescript
import ffmpeg from 'fluent-ffmpeg'

async function compressAudio(inputPath: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate('64k')
      .audioCodec('libmp3lame')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject)
  })
}
```

## API Performance

### Response Time Optimization

```typescript
// Set timeout for external API calls
const response = await axios.get(url, { timeout: 5000 })

// Use streaming for large responses
app.get('/api/export', (req, res) => {
  res.setHeader('Content-Type', 'text/csv')
  const stream = createReadStream('export.csv')
  stream.pipe(res)
})
```

### Rate Limiting

```typescript
// Prevent abuse and improve performance
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', limiter)
```

## Monitoring & Profiling

### Performance Monitoring

```typescript
// Log slow queries
import logger from '@/lib/logger'

const start = Date.now()
const result = await prisma.question.findMany()
const duration = Date.now() - start

if (duration > 1000) {
  logger.warn('Slow query detected', { duration, query: 'findMany questions' })
}
```

### Sentry Performance Monitoring

```typescript
import * as Sentry from '@sentry/node'

// Automatic performance monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1,
})

// Manual transaction tracking
const transaction = Sentry.startTransaction({
  op: 'process-audio',
  name: 'Process Audio Recording',
})

try {
  // Process audio
  await processAudio()
} finally {
  transaction.finish()
}
```

### Database Query Logging

```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

## Best Practices

### Do's

- ✅ Use lazy loading for routes and heavy components
- ✅ Implement code splitting
- ✅ Optimize images (WebP, lazy loading, responsive)
- ✅ Use memoization for expensive computations
- ✅ Add database indexes for frequently queried fields
- ✅ Use Redis caching for frequently accessed data
- ✅ Implement pagination for large datasets
- ✅ Use job queues for heavy background tasks
- ✅ Enable compression (gzip)
- ✅ Use connection pooling
- ✅ Monitor performance metrics
- ✅ Profile slow queries and optimize

### Don'ts

- ❌ Don't fetch all data when you only need a subset
- ❌ Don't make N+1 queries
- ❌ Don't process heavy tasks in request handlers
- ❌ Don't load large files into memory
- ❌ Don't use synchronous operations in async code
- ❌ Don't ignore slow query warnings
- ❌ Don't over-cache (cache invalidation is hard)
- ❌ Don't optimize prematurely (measure first)
- ❌ Don't forget to clean up event listeners
- ❌ Don't use blocking operations

## Performance Metrics

### Target Metrics

- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%

### Tools

- **Frontend**: Lighthouse, Web Vitals, React DevTools Profiler
- **Backend**: Sentry, New Relic, DataDog
- **Database**: Prisma Studio, pgAdmin, query logs
- **Network**: Chrome DevTools Network tab
