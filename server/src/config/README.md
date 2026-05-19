# Environment Variable Configuration

This directory contains the environment variable validation and configuration for the application.

## Files

- `env.ts` - Environment variable validation using Zod

## Usage

### Importing Environment Variables

Always use the validated `env` object instead of `process.env`:

```typescript
// ✅ Good - Type-safe and validated
import { env, isProduction, isDevelopment } from '@/config/env'

const apiKey = env.OPENAI_API_KEY // string (guaranteed to exist)
const port = env.PORT // number
const dbUrl = env.DATABASE_URL // string

if (isProduction) {
  // Production-specific logic
}
```

### Helper Constants

- `isProduction` - Boolean constant, true if NODE_ENV is 'production'
- `isDevelopment` - Boolean constant, true if NODE_ENV is 'development'
- `isTest` - Boolean constant, true if NODE_ENV is 'test'

## Adding New Environment Variables

1. Add to the Zod schema in `env.ts`:

```typescript
const EnvSchema = z.object({
  // ... existing vars
  NEW_API_KEY: z.string().min(1, 'NEW_API_KEY is required'),
  NEW_OPTIONAL_VAR: z.string().optional(),
})
```

2. Add to `.env.example`:

```bash
NEW_API_KEY=your_api_key_here
NEW_OPTIONAL_VAR=optional_value
```

3. Update documentation if needed

## Type Coercion

Use `z.coerce.number()` for numeric environment variables:

```typescript
PORT: z.coerce.number().default(3000),
QUEUE_CONCURRENCY: z.coerce.number().default(5),
```

This automatically converts string env vars to numbers.

## Validation

Environment variables are validated on server startup. If validation fails:

1. Server will not start
2. Error messages will show which variables are missing or invalid
3. Fix the `.env` file and restart

Example error:

```
❌ Environment variable validation failed:
  - OPENAI_API_KEY: Required
  - DATABASE_URL: Invalid url
```

## Important Notes

### ⚠️ Circular Dependency Warning

**DO NOT import `logger` in `env.ts`!**

The `env.ts` file is imported by `logger.ts` to get `LOG_LEVEL`. If `env.ts` imports `logger`, it creates a circular dependency where `env` is undefined when `logger` tries to use it.

```typescript
// ❌ BAD - Creates circular dependency
import logger from '@/lib/logger'
logger.info('Environment validated')

// ✅ GOOD - Use console instead
console.log('✅ Environment variables validated successfully')
```

### Import Order

**CRITICAL:** The import order matters! Always follow this sequence:

```typescript
// 1. Load .env file FIRST
import 'dotenv/config'

// 2. Validate environment variables SECOND
import '@/config/env'

// 3. Initialize other services THIRD
import '@/lib/sentry'

// 4. Then import everything else
import express from 'express'
// ... other imports
```

**Why this order?**

- `dotenv/config` must load first to populate `process.env`
- `@/config/env` validates `process.env` and exports `env`
- Other modules can then safely import and use `env`

**Example in `server.ts`:**

```typescript
// ✅ CORRECT ORDER
import 'dotenv/config' // 1. Load .env
import '@/config/env' // 2. Validate
import app from './app' // 3. Other imports
import { env } from '@/config/env' // 4. Use env

const PORT = env.PORT // ✅ Works!
```

**Example in `app.ts`:**

```typescript
// ✅ CORRECT ORDER
import 'dotenv/config' // 1. Load .env
import '@/config/env' // 2. Validate
import '@/lib/sentry' // 3. Initialize Sentry
import express from 'express' // 4. Other imports
```

## Available Environment Variables

See `env.ts` for the complete list of validated environment variables.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `PAYOS_CLIENT_ID` - PayOS client ID
- `PAYOS_API_KEY` - PayOS API key
- `PAYOS_CHECKSUM_KEY` - PayOS checksum key
- `CLIENT_URL` - Frontend URL for CORS

### Optional Variables

- `ADMIN_URL` - Admin panel URL for CORS
- `REDIS_URL` - Redis connection string (for queues)
- `SENTRY_DSN` - Sentry error tracking DSN
- `OPENAI_API_ADMIN_KEY` - OpenAI admin API key (for usage tracking)
- `AZURE_SPEECH_KEY` - Azure Speech service key
- `AZURE_SPEECH_REGION` - Azure Speech service region
- `SUPABASE_ACCESS_TOKEN` - Supabase access token (for admin API)
- `SUPABASE_PROJECT_REF` - Supabase project reference

### Variables with Defaults

- `NODE_ENV` - Default: `'development'`
- `PORT` - Default: `3000`
- `LOG_LEVEL` - Default: `'info'`
- `QUEUE_CONCURRENCY` - Default: `5`

## Best Practices

1. **Never use `process.env` directly** - Always use `env` from `@/config/env`
2. **Use helper constants** - Use `isProduction` instead of checking `NODE_ENV`
3. **Add validation** - Add all new env vars to the Zod schema
4. **Document defaults** - Document default values in comments
5. **Use type coercion** - Use `z.coerce.number()` for numeric values
6. **Avoid circular dependencies** - Don't import other modules in `env.ts`

## Examples

### Basic Usage

```typescript
import { env } from '@/config/env'

// Database connection
const prisma = new PrismaClient({
  datasources: {
    db: { url: env.DATABASE_URL },
  },
})

// OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

// Server port
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
```

### Environment-Specific Logic

```typescript
import { env, isProduction, isDevelopment } from '@/config/env'

// Logging
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: isProduction ? prodFormat : devFormat,
})

// CORS
const allowedOrigins = isProduction ? [env.CLIENT_URL] : [env.CLIENT_URL, 'http://localhost:5173']

// Error messages
const errorMessage = isProduction ? 'Internal server error' : error.message
```

### Optional Variables

```typescript
import { env } from '@/config/env'

// Check if optional variable exists
if (env.REDIS_URL) {
  const redis = new Redis(env.REDIS_URL)
}

// Sentry (optional)
if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN })
}
```
