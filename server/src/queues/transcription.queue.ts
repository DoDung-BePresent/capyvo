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
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
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
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 500,
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
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 500,
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
