import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

if (!redis) {
  console.warn('⚠️  Redis not available - Queue functionality disabled')
}

let transcriptionQueue: Queue | null = null
let analysisQueue: Queue | null = null
let transcriptionAndAnalysisQueue: Queue | null = null

if (redis) {
  try {
    const connection = {
      host: redis.options.host as string,
      port: redis.options.port as number,
      password: redis.options.password as string | undefined,
      tls: redis.options.tls,
      family: 4,
    }

    // Queue for transcription only
    transcriptionQueue = new Queue('transcription', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 50, // Keep last 50 completed jobs (reduced from 100)
          age: 3600, // Keep for 1 hour only (reduced from 24h)
        },
        removeOnFail: {
          count: 100, // Keep last 100 failed jobs (reduced from 500)
          age: 7 * 24 * 3600, // Keep for 7 days for debugging
        },
      },
    })

    // Queue for analysis only
    analysisQueue = new Queue('analysis', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 50,
          age: 3600, // 1 hour
        },
        removeOnFail: {
          count: 100,
          age: 7 * 24 * 3600, // 7 days
        },
      },
    })

    // Queue for transcription + analysis (combo)
    transcriptionAndAnalysisQueue = new Queue('transcription-and-analysis', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 50,
          age: 3600, // 1 hour
        },
        removeOnFail: {
          count: 100,
          age: 7 * 24 * 3600, // 7 days
        },
      },
    })

    // Suppress ECONNRESET errors (connection issues are already logged in redis.ts)
    transcriptionQueue.on('error', (err) => {
      if (!err.message?.includes('ECONNRESET')) {
        console.error('❌ Transcription queue error:', err.message)
      }
    })

    analysisQueue.on('error', (err) => {
      if (!err.message?.includes('ECONNRESET')) {
        console.error('❌ Analysis queue error:', err.message)
      }
    })

    transcriptionAndAnalysisQueue.on('error', (err) => {
      if (!err.message?.includes('ECONNRESET')) {
        console.error('❌ Transcription+Analysis queue error:', err.message)
      }
    })

    console.log('✅ Queues initialized')
  } catch (error) {
    console.error('❌ Failed to initialize queues:', error)
    console.warn('⚠️  Continuing without queues - API will fallback to synchronous processing')
    // Set queues to null so fallback logic works
    transcriptionQueue = null
    analysisQueue = null
    transcriptionAndAnalysisQueue = null
  }
}

export { transcriptionQueue, analysisQueue, transcriptionAndAnalysisQueue }
