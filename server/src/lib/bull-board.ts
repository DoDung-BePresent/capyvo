import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { redis } from '@/lib/redis'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

// Only initialize Bull Board if Redis is available
if (redis) {
  // Dynamic import to avoid loading queues when Redis is not available
  import('@/queues/transcription.queue')
    .then((queues) => {
      // Filter out null queues
      const availableQueues = [
        queues.transcriptionQueue,
        queues.analysisQueue,
        queues.transcriptionAndAnalysisQueue,
      ].filter((q) => q !== null)

      // Only create Bull Board if we have at least one queue
      if (availableQueues.length > 0) {
        createBullBoard({
          queues: availableQueues.map((q) => new BullMQAdapter(q!)),
          serverAdapter,
        })
        console.log(`✅ Bull Board initialized with ${availableQueues.length} queue(s)`)
      } else {
        console.warn('⚠️  No queues available - Bull Board disabled')
      }
    })
    .catch((err) => {
      console.error('❌ Failed to initialize Bull Board:', err.message)
    })
}

export { serverAdapter }
