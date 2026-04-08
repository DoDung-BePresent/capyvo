import { Router } from 'express'
import { PartInstructionController, audioUpload } from '@/controllers/part-instruction.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'

const router = Router()
const ctrl = new PartInstructionController()

router.get('/', authenticate, (req, res, next) => ctrl.getAll(req, res, next))

router.patch(
  '/:partNumber/audio',
  authenticate,
  requireRole('ADMIN'),
  audioUpload.single('audio'),
  (req, res, next) => ctrl.uploadAudio(req, res, next),
)

export default router
