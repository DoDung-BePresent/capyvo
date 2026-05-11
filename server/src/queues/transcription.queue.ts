import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
}

// Queue for transcription only
export const transcriptionQueue = new Queue('transcription', {
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
export const analysisQueue = new Queue('analysis', {
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
export const transcriptionAndAnalysisQueue = new Queue('transcription-and-analysis', {
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

transcriptionQueue.on('error', (err) => {
  console.error('❌ Transcription queue error:', err)
})

analysisQueue.on('error', (err) => {
  console.error('❌ Analysis queue error:', err)
})

transcriptionAndAnalysisQueue.on('error', (err) => {
  console.error('❌ Transcription+Analysis queue error:', err)
})

console.log('✅ Queues initialized')
