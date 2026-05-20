import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import type { Request } from 'express'
import { redis } from '@/lib/redis'

/**
 * Rate limiting configurations for different endpoints
 */

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

// Create Redis store only if Redis is available
const createStore = (prefix: string) => {
  if (!redis) {
    console.warn(`⚠️  Redis not available, using memory store for ${prefix}`)
    return undefined // Will use default memory store
  }
  return new RedisStore({
    // @ts-expect-error - rate-limit-redis types are outdated
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix,
  })
}

// Transcribe only: 50 requests per minute per user, 10 per minute for unauthenticated
export const transcribeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Authenticated users: 10 requests/min
    // Unauthenticated: 2 requests/min (stricter)
    return (req as AuthenticatedRequest).user ? 50 : 10
  },
  message: 'Quá nhiều yêu cầu phiên âm. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:transcribe:'),
  // Use default key generator (handles IPv6 properly)
  // Authenticated users are tracked by session, unauthenticated by IP
})

// Analyze only: 50 requests per minute per user, 10 per minute for unauthenticated
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {
    return (req as AuthenticatedRequest).user ? 50 : 10
  },
  message: 'Quá nhiều yêu cầu phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:analyze:'),
})

// Transcribe + Analyze: 50 requests per minute per user, 10 per minute for unauthenticated (most expensive)
export const transcribeAndAnalyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {
    return (req as AuthenticatedRequest).user ? 50 : 10
  },
  message: 'Quá nhiều yêu cầu phiên âm và phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:transcribe-analyze:'),
})

// General API rate limit: 100 requests per minute per user
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Quá nhiều requests. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:general:'),
  skip: (req) => !(req as AuthenticatedRequest).user,
})

// Webhook rate limit: 100 requests per minute per IP (prevent DDoS)
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 webhooks per minute per IP
  message: 'Too many webhook requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:webhook:'),
  // Use default key generator (IP-based, handles IPv6 properly)
})
