import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import {
  transcriptionQueue,
  analysisQueue,
  transcriptionAndAnalysisQueue,
} from '@/queues/transcription.queue'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(transcriptionQueue),
    new BullMQAdapter(analysisQueue),
    new BullMQAdapter(transcriptionAndAnalysisQueue),
  ],
  serverAdapter,
})

export { serverAdapter }
