import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { ResponseController, uploadAudio } from '@/controllers/response.controller'

const router = Router()
const ctrl = new ResponseController()

router.get('/check-credits', authenticate, (req, res, next) => ctrl.checkCredits(req, res, next))

router.post('/audio', authenticate, uploadAudio.single('audio'), (req, res, next) =>
  ctrl.saveAudio(req, res, next),
)

router.post('/:id/transcribe', authenticate, (req, res, next) => ctrl.transcribe(req, res, next))

router.post('/:id/analyze', authenticate, (req, res, next) => ctrl.analyze(req, res, next))

router.post('/:id/transcribe-analyze', authenticate, (req, res, next) =>
  ctrl.transcribeAndAnalyze(req, res, next),
)

router.get('/question/:questionId/history', authenticate, (req, res, next) =>
  ctrl.getQuestionHistory(req, res, next),
)

export default router
