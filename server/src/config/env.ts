import { z } from 'zod'

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const EnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Client URL
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  ADMIN_URL: z.string().url('ADMIN_URL must be a valid URL').optional(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required').optional(),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_ACCESS_TOKEN: z.string().optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),

  // Redis (optional - for queues)
  REDIS_URL: z.string().optional(),

  // Queue settings
  QUEUE_CONCURRENCY: z.coerce.number().default(5),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_API_ADMIN_KEY: z.string().optional(),

  // Azure Speech (optional)
  AZURE_SPEECH_KEY: z.string().optional(),
  AZURE_SPEECH_REGION: z.string().optional(),

  // PayOS
  PAYOS_CLIENT_ID: z.string().min(1, 'PAYOS_CLIENT_ID is required'),
  PAYOS_API_KEY: z.string().min(1, 'PAYOS_API_KEY is required'),
  PAYOS_CHECKSUM_KEY: z.string().min(1, 'PAYOS_CHECKSUM_KEY is required'),
  PAYOS_RETURN_URL: z.string().url('PAYOS_RETURN_URL must be a valid URL').optional(),
  PAYOS_CANCEL_URL: z.string().url('PAYOS_CANCEL_URL must be a valid URL').optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

/**
 * Validated environment variables
 * Use this instead of process.env to ensure type safety
 */
export type Env = z.infer<typeof EnvSchema>

/**
 * Parse and validate environment variables
 * Throws error if validation fails
 */
function validateEnv(): Env {
  try {
    const parsed = EnvSchema.parse(process.env)
    console.log('✅ Environment variables validated successfully')
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:')
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Invalid environment variables. Check logs for details.', { cause: error })
    }
    throw error
  }
}

/**
 * Validated environment variables
 * Import this instead of using process.env directly
 *
 * @example
 * import { env } from '@/config/env'
 * const apiKey = env.OPENAI_API_KEY // Type-safe!
 */
export const env = validateEnv()

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test'
