import { Router } from 'express'
import { PartInstructionController, audioUpload } from '@/controllers/part-instruction.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new PartInstructionController()

router.get('/', authenticate, asyncHandler(ctrl.getAll.bind(ctrl)))
router.patch(
  '/:partNumber/audio',
  authenticate,
  requireRole('ADMIN'),
  audioUpload.single('audio'),
  asyncHandler(ctrl.uploadAudio.bind(ctrl)),
)

export default router
