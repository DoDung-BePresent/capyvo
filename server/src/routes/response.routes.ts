import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { ResponseController, uploadAudio } from '@/controllers/response.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new ResponseController()

router.get('/check-subscription', authenticate, asyncHandler(ctrl.checkSubscription.bind(ctrl)))
router.post(
  '/audio',
  authenticate,
  uploadAudio.single('audio'),
  asyncHandler(ctrl.saveAudio.bind(ctrl)),
)
router.post('/:id/transcribe', authenticate, asyncHandler(ctrl.transcribe.bind(ctrl)))
router.post('/:id/analyze', authenticate, asyncHandler(ctrl.analyze.bind(ctrl)))
router.post(
  '/:id/transcribe-analyze',
  authenticate,
  asyncHandler(ctrl.transcribeAndAnalyze.bind(ctrl)),
)
router.get(
  '/question/:questionId/history',
  authenticate,
  asyncHandler(ctrl.getQuestionHistory.bind(ctrl)),
)
router.get(
  '/session/:sessionId/overall-assessment',
  authenticate,
  asyncHandler(ctrl.getOverallAssessment.bind(ctrl)),
)

export default router
