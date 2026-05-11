import app from './app'
import logger from '@/lib/logger'
import { startSubscriptionCheckJob } from './jobs/check-expired-subscriptions.job'

// Initialize Redis connection
import './lib/redis'

// Initialize queues
import './queues/transcription.queue'

// Start workers
import './workers/transcription.worker'

const PORT = Number(process.env.PORT) || 3000

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    env: process.env.NODE_ENV ?? 'development',
  })

  // Start cron jobs
  startSubscriptionCheckJob()

  logger.info('Bull Board available at /admin/queues')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason })
  process.exit(1)
})
