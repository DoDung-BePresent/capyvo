import { Router } from 'express'
import { SystemAudioController, audioUpload } from '@/controllers/system-audio.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'

const router = Router()
const ctrl = new SystemAudioController()

router.get('/', authenticate, (req, res, next) => ctrl.getAll(req, res, next))

router.patch(
  '/:key/audio',
  authenticate,
  requireRole('ADMIN'),
  audioUpload.single('audio'),
  (req, res, next) => ctrl.uploadAudio(req, res, next),
)

export default router
