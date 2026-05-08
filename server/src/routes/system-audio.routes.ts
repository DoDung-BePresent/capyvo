import { Router } from 'express'
import { SystemAudioController, audioUpload } from '@/controllers/system-audio.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new SystemAudioController()

router.get('/', authenticate, asyncHandler(ctrl.getAll.bind(ctrl)))
router.patch(
  '/:key/audio',
  authenticate,
  requireRole('ADMIN'),
  audioUpload.single('audio'),
  asyncHandler(ctrl.uploadAudio.bind(ctrl)),
)

export default router
