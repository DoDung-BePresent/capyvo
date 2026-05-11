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

// Helper to generate rate limit key (user-based only, no IP fallback)
const generateKey = (req: Request): string => {
  const user = (req as AuthenticatedRequest).user
  if (user?.id) {
    return `user:${user.id}`
  }
  // For unauthenticated requests, use a generic key
  // This means all unauthenticated users share the same limit
  return 'anonymous'
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

// Transcribe only: 10 requests per minute per user
export const transcribeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Quá nhiều yêu cầu phiên âm. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:transcribe:'),
  keyGenerator: generateKey,
  skip: (req) => !(req as AuthenticatedRequest).user, // Skip rate limit for unauthenticated
})

// Analyze only: 20 requests per minute per user
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Quá nhiều yêu cầu phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:analyze:'),
  keyGenerator: generateKey,
  skip: (req) => !(req as AuthenticatedRequest).user,
})

// Transcribe + Analyze: 5 requests per minute per user (most expensive)
export const transcribeAndAnalyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Quá nhiều yêu cầu phiên âm và phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:transcribe-analyze:'),
  keyGenerator: generateKey,
  skip: (req) => !(req as AuthenticatedRequest).user,
})

// General API rate limit: 100 requests per minute per user
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Quá nhiều requests. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:general:'),
  keyGenerator: generateKey,
  skip: (req) => !(req as AuthenticatedRequest).user,
})
