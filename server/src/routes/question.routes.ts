import { Router } from 'express'
import { QuestionController, upload, uploadAudio } from '@/controllers/question.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new QuestionController()

// Any authenticated user can fetch questions (needed for practice mode)
router.get('/', authenticate, asyncHandler(ctrl.getQuestions.bind(ctrl)))
router.get('/grouped', authenticate, asyncHandler(ctrl.getQuestionsGrouped.bind(ctrl)))
router.get('/practice-sets', authenticate, asyncHandler(ctrl.getPracticeSets.bind(ctrl)))
router.get('/part/:partNumber/all', authenticate, asyncHandler(ctrl.getQuestionsByPart.bind(ctrl)))
router.get(
  '/part/:partNumber/exam-sets',
  authenticate,
  asyncHandler(ctrl.getExamSetsByPart.bind(ctrl)),
)
router.get('/part/:partNumber/topics', authenticate, asyncHandler(ctrl.getTopicsByPart.bind(ctrl)))

// Admin-only routes
router.use(authenticate, requireRole('ADMIN'))

router.delete('/:id', asyncHandler(ctrl.deleteQuestion.bind(ctrl)))
router.delete('/set/:setId', asyncHandler(ctrl.deleteQuestionSet.bind(ctrl)))
router.patch('/:id', asyncHandler(ctrl.updateQuestion.bind(ctrl)))
router.patch('/:id/status', asyncHandler(ctrl.updateQuestionStatus.bind(ctrl)))
router.patch('/set/:setId', asyncHandler(ctrl.updateQuestionSet.bind(ctrl)))
router.patch('/bulk/status', asyncHandler(ctrl.bulkUpdateQuestionStatus.bind(ctrl)))
router.post('/upload/image', upload.single('image'), asyncHandler(ctrl.uploadImage.bind(ctrl)))
router.post('/upload/audio', uploadAudio.single('audio'), asyncHandler(ctrl.uploadAudio.bind(ctrl)))
router.post('/analyze-image', asyncHandler(ctrl.analyzeImage.bind(ctrl)))
router.post('/part/1', asyncHandler(ctrl.createPart1.bind(ctrl)))
router.post('/part/2', asyncHandler(ctrl.createPart2.bind(ctrl)))
router.post('/part/3', asyncHandler(ctrl.createPart3.bind(ctrl)))
router.post('/part/4', asyncHandler(ctrl.createPart4.bind(ctrl)))
router.post('/part/5', asyncHandler(ctrl.createPart5.bind(ctrl)))

export default router
