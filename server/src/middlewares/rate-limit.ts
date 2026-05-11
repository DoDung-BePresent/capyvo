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

// Transcribe only: 10 requests per minute per user
export const transcribeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Quá nhiều yêu cầu phiên âm. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis types are outdated
    client: redis,
    prefix: 'rl:transcribe:',
  }),
  keyGenerator: (req: Request) => {
    // Rate limit per user
    const user = (req as AuthenticatedRequest).user
    return user?.id || req.ip || 'anonymous'
  },
})

// Analyze only: 20 requests per minute per user
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Quá nhiều yêu cầu phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis types are outdated
    client: redis,
    prefix: 'rl:analyze:',
  }),
  keyGenerator: (req: Request) => {
    const user = (req as AuthenticatedRequest).user
    return user?.id || req.ip || 'anonymous'
  },
})

// Transcribe + Analyze: 5 requests per minute per user (most expensive)
export const transcribeAndAnalyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Quá nhiều yêu cầu phiên âm và phân tích. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis types are outdated
    client: redis,
    prefix: 'rl:transcribe-analyze:',
  }),
  keyGenerator: (req: Request) => {
    const user = (req as AuthenticatedRequest).user
    return user?.id || req.ip || 'anonymous'
  },
})

// General API rate limit: 100 requests per minute per user
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Quá nhiều requests. Vui lòng đợi 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis types are outdated
    client: redis,
    prefix: 'rl:general:',
  }),
  keyGenerator: (req: Request) => {
    const user = (req as AuthenticatedRequest).user
    return user?.id || req.ip || 'anonymous'
  },
})
