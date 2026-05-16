# Security Best Practices

## Authentication & Authorization

### Supabase Authentication

- Use Supabase Auth for user authentication
- Store JWT tokens securely (httpOnly cookies or secure storage)
- Validate tokens on every protected request
- Implement token refresh mechanism

### Backend Token Validation

```typescript
// middlewares/auth.middleware.ts
import supabase from '@/lib/supabase'

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    })
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}
```

## Input Validation & Sanitization

### Always Validate Input

```typescript
// Use Zod for validation
const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(100).trim(),
  age: z.number().int().min(0).max(150).optional(),
})

// Validate in service
async createUser(body: unknown) {
  const dto = CreateUserSchema.parse(body) // Throws if invalid
  return prisma.user.create({ data: dto })
}
```

### Sanitize User Input

- Trim whitespace from strings
- Validate email formats
- Validate URLs
- Escape HTML if displaying user content
- Validate file types and sizes

## SQL Injection Prevention

### Use Prisma (Parameterized Queries)

```typescript
// ✅ Good - Prisma automatically prevents SQL injection
const user = await prisma.user.findUnique({
  where: { email: userInput },
})

// ❌ Bad - Never use raw SQL with user input
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
```

### If Raw SQL is Necessary

```typescript
// Use parameterized queries
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${Prisma.sql`${userInput}`}
`
```

## XSS (Cross-Site Scripting) Prevention

### Frontend

- React automatically escapes content
- Be careful with `dangerouslySetInnerHTML`
- Sanitize user-generated HTML content

```typescript
// ✅ Good - React escapes automatically
<div>{userContent}</div>

// ⚠️ Dangerous - Only use with sanitized content
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />

// Use DOMPurify for sanitization
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(dirtyHTML)
```

### Backend

- Set appropriate Content-Type headers
- Use Content Security Policy (CSP)

```typescript
// Helmet middleware (already configured)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
)
```

## CSRF (Cross-Site Request Forgery) Prevention

### Use SameSite Cookies

```typescript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
})
```

### CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
```

## Rate Limiting

### API Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', apiLimiter)

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 attempts
  message: 'Too many login attempts, please try again later',
})

app.use('/api/auth/login', authLimiter)
```

### Redis-Based Rate Limiting (Production)

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redis } from '@/lib/redis'

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rate_limit',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
})

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (err) {
    res.status(429).json({
      success: false,
      message: 'Too many requests',
    })
  }
}
```

## File Upload Security

### Validate File Types

```typescript
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/webm']

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed'))
      return
    }
    cb(null, true)
  },
})
```

### Scan Files for Malware (Production)

```typescript
// Use ClamAV or similar service
import { scanFile } from '@/lib/antivirus'

async uploadFile(buffer: Buffer) {
  const isSafe = await scanFile(buffer)
  if (!isSafe) {
    throw new Error('File contains malware')
  }
  // Proceed with upload
}
```

### Generate Random Filenames

```typescript
// Don't use user-provided filenames directly
const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
```

## Secrets Management

### Environment Variables

```typescript
// ✅ Good - Use environment variables
const apiKey = process.env.OPENAI_API_KEY

// ❌ Bad - Never hardcode secrets
const apiKey = 'sk-1234567890abcdef'
```

### .env File Security

```bash
# Never commit .env files
# Add to .gitignore
.env
.env.local
.env.production

# Use .env.example for documentation
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_connection_string
```

### Rotate Secrets Regularly

- Rotate API keys every 90 days
- Rotate database passwords every 90 days
- Rotate JWT secrets on security incidents

## Password Security (If Implementing Custom Auth)

### Hash Passwords

```typescript
import bcrypt from 'bcrypt'

// Hash password
const saltRounds = 12
const hashedPassword = await bcrypt.hash(password, saltRounds)

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword)
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```typescript
const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
```

## Logging & Monitoring

### Log Security Events

```typescript
import logger from '@/lib/logger'

// Log authentication attempts
logger.info('Login attempt', { email, ip: req.ip, success: true })
logger.warn('Failed login attempt', { email, ip: req.ip, reason: 'Invalid password' })

// Log authorization failures
logger.warn('Unauthorized access attempt', {
  userId,
  resource: req.path,
  ip: req.ip,
})

// Log suspicious activity
logger.error('Potential attack detected', {
  type: 'SQL injection attempt',
  ip: req.ip,
  payload: req.body,
})
```

### Don't Log Sensitive Data

```typescript
// ❌ Bad - Logging sensitive data
logger.info('User login', { email, password, token })

// ✅ Good - Log only necessary info
logger.info('User login', { userId, ip: req.ip })
```

### Use Sentry for Error Tracking

```typescript
import * as Sentry from '@sentry/node'

// Sentry automatically captures errors
// Don't send sensitive data to Sentry
Sentry.setUser({ id: user.id, email: user.email })
```

## HTTPS & TLS

### Enforce HTTPS in Production

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
})
```

### Use HSTS Header

```typescript
// Helmet automatically adds HSTS
app.use(
  helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
)
```

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Use Dependabot

- Enable Dependabot on GitHub
- Review and merge security updates promptly

### Pin Dependencies

```json
// Use exact versions in production
{
  "dependencies": {
    "express": "5.2.1", // Not "^5.2.1"
    "prisma": "7.6.0"
  }
}
```

## API Security

### API Keys

- Use API keys for service-to-service communication
- Rotate API keys regularly
- Store API keys in environment variables
- Use different keys for dev/staging/production

### Webhook Security

```typescript
// Verify webhook signatures
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}
```

## Database Security

### Use Connection Pooling

```typescript
// Prisma handles connection pooling automatically
// Configure in DATABASE_URL
DATABASE_URL = 'postgresql://user:pass@host:5432/db?connection_limit=10'
```

### Principle of Least Privilege

- Use separate database users for different services
- Grant only necessary permissions
- Don't use root/admin accounts in application

### Backup & Recovery

- Regular automated backups
- Test restore procedures
- Encrypt backups
- Store backups in separate location

## Security Headers

### Helmet Configuration

```typescript
app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: true,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  }),
)
```

## Security Checklist

### Development

- [ ] Use HTTPS in development (mkcert)
- [ ] Never commit secrets to git
- [ ] Use environment variables for config
- [ ] Validate all user input
- [ ] Use parameterized queries
- [ ] Implement authentication
- [ ] Implement authorization
- [ ] Add rate limiting
- [ ] Validate file uploads
- [ ] Use security headers (Helmet)
- [ ] Enable CORS properly
- [ ] Log security events
- [ ] Handle errors securely

### Production

- [ ] Enforce HTTPS
- [ ] Use strong passwords/keys
- [ ] Rotate secrets regularly
- [ ] Enable Sentry monitoring
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Use Redis for rate limiting
- [ ] Enable DDoS protection
- [ ] Set up intrusion detection
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity

## Common Vulnerabilities to Avoid

### OWASP Top 10

1. **Broken Access Control** - Implement proper RBAC
2. **Cryptographic Failures** - Use HTTPS, hash passwords
3. **Injection** - Use Prisma, validate input
4. **Insecure Design** - Follow security best practices
5. **Security Misconfiguration** - Use Helmet, secure defaults
6. **Vulnerable Components** - Keep dependencies updated
7. **Authentication Failures** - Use Supabase Auth, rate limiting
8. **Data Integrity Failures** - Validate data, use checksums
9. **Logging Failures** - Log security events, monitor logs
10. **SSRF** - Validate URLs, whitelist domains

## Incident Response

### Security Incident Plan

1. **Detect** - Monitor logs, alerts
2. **Contain** - Isolate affected systems
3. **Investigate** - Analyze logs, identify root cause
4. **Remediate** - Fix vulnerability, patch systems
5. **Recover** - Restore from backups if needed
6. **Learn** - Document incident, improve security

### Contact Information

- Security team email
- On-call engineer phone
- Incident response runbook location
