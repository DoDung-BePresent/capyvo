import Redis from 'ioredis'

const redisUrl = process.env['REDIS_URL']

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in environment variables')
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err)
})

redis.on('close', () => {
  console.log('⚠️  Redis connection closed')
})
