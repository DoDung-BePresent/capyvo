import Redis from 'ioredis'
import { env } from '@/config/env'

if (!env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not defined - Redis features disabled')
}

// Create a single Redis instance to be reused
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          console.error('❌ Redis connection failed after 3 attempts. Disabling Redis features.')
          return null // Stop retrying
        }
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: true, // Allow queuing commands while connecting
      // TLS options for Upstash
      tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
      family: 4, // Force IPv4
    })
  : null

if (redis) {
  // Connect once
  redis
    .connect()
    .then(() => {
      console.log('✅ Redis connected')
    })
    .catch((err) => {
      console.error('❌ Redis connection failed:', err.message)
      console.warn(
        '⚠️  Continuing without Redis - Queue features will fallback to synchronous processing',
      )
      // Don't crash the server, just disable Redis
    })

  redis.on('error', (err) => {
    // Suppress ECONNRESET spam - these are expected when connection is unstable
    if (err.message && !err.message.includes('ECONNRESET') && !err.message.includes('ENOTFOUND')) {
      console.error('❌ Redis error:', err.message)
    }
  })

  redis.on('close', () => {
    // Only log if we were previously connected
    if (redis.status === 'ready') {
      console.log('⚠️  Redis connection closed')
    }
  })

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...')
  })
}
