import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { redis } from '@/lib/redis'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

// Only initialize Bull Board if Redis is available
if (redis) {
  // Dynamic import to avoid loading queues when Redis is not available
  import('@/queues/transcription.queue').then((queues) => {
    createBullBoard({
      queues: [
        new BullMQAdapter(queues.transcriptionQueue),
        new BullMQAdapter(queues.analysisQueue),
        new BullMQAdapter(queues.transcriptionAndAnalysisQueue),
      ],
      serverAdapter,
    })
  })
}

export { serverAdapter }
