import { Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { ResponseService } from '@/services/response.service'

if (!redis) {
  throw new Error('Redis is required for workers. Please set REDIS_URL in environment variables.')
}

const connection = {
  host: redis.options.host as string,
  port: redis.options.port as number,
  password: redis.options.password as string | undefined,
}

const responseService = new ResponseService()
const concurrency = Number(process.env['QUEUE_CONCURRENCY']) || 5

// Worker for transcription only
export const transcriptionWorker = new Worker(
  'transcription',
  async (job: Job) => {
    const { responseId, userId } = job.data
    console.log(`🎤 Processing transcription job ${job.id} for response ${responseId}`)

    try {
      const result = await responseService.transcribeResponse(responseId, userId)
      console.log(`✅ Transcription completed for response ${responseId}`)
      return result
    } catch (error) {
      console.error(`❌ Transcription failed for response ${responseId}:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency,
  },
)

// Worker for analysis only
export const analysisWorker = new Worker(
  'analysis',
  async (job: Job) => {
    const { responseId, userId, partNumber } = job.data
    console.log(`🧠 Processing analysis job ${job.id} for response ${responseId}`)

    try {
      const result = await responseService.analyzeResponse(responseId, userId, partNumber)
      console.log(`✅ Analysis completed for response ${responseId}`)
      return result
    } catch (error) {
      console.error(`❌ Analysis failed for response ${responseId}:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency,
  },
)

// Worker for transcription + analysis (combo)
export const transcriptionAndAnalysisWorker = new Worker(
  'transcription-and-analysis',
  async (job: Job) => {
    const { responseId, userId, partNumber } = job.data
    console.log(`🎤🧠 Processing transcription+analysis job ${job.id} for response ${responseId}`)

    try {
      const result = await responseService.transcribeAndAnalyze(responseId, userId, partNumber)
      console.log(`✅ Transcription+Analysis completed for response ${responseId}`)
      return result
    } catch (error) {
      console.error(`❌ Transcription+Analysis failed for response ${responseId}:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency,
  },
)

// Event listeners
transcriptionWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

transcriptionWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

analysisWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

analysisWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

transcriptionAndAnalysisWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

transcriptionAndAnalysisWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

console.log('✅ Workers started with concurrency:', concurrency)
