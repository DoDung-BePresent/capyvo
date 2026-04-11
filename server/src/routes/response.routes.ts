import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { ResponseController, uploadAudio } from '@/controllers/response.controller'

const router = Router()
const ctrl = new ResponseController()

router.post('/audio', authenticate, uploadAudio.single('audio'), (req, res, next) =>
  ctrl.saveAudio(req, res, next),
)

export default router
