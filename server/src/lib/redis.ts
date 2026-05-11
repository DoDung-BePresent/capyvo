import Redis from 'ioredis'

const redisUrl = process.env['REDIS_URL']

if (!redisUrl) {
  console.warn('⚠️  REDIS_URL not defined - Redis features disabled')
}

// Create a single Redis instance to be reused
export const redis = redisUrl
  ? new Redis(redisUrl, {
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
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
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
      console.warn('⚠️  Continuing without Redis - features will be limited')
      // Don't crash the server, just disable Redis
    })

  redis.on('error', (err) => {
    // Only log critical errors, not connection spam
    if (err.message && !err.message.includes('ECONNRESET')) {
      console.error('❌ Redis error:', err.message)
    }
  })

  redis.on('close', () => {
    // Only log if we were previously connected
    if (redis.status === 'ready') {
      console.log('⚠️  Redis connection closed')
    }
  })
}
