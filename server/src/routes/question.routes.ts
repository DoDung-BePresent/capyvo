import { Router } from 'express'
import { QuestionController, upload } from '@/controllers/question.controller'
import { authenticate } from '@/middlewares/authenticate'
import { requireRole } from '@/middlewares/authenticate'

const router = Router()
const ctrl = new QuestionController()

// All question management routes require admin auth
router.use(authenticate, requireRole('ADMIN'))

router.get('/', (req, res, next) => ctrl.getQuestions(req, res, next))
router.delete('/:id', (req, res, next) => ctrl.deleteQuestion(req, res, next))

// Upload image → returns { url }
router.post('/upload/image', upload.single('image'), (req, res, next) =>
  ctrl.uploadImage(req, res, next),
)

// Create questions per part
router.post('/part/1', (req, res, next) => ctrl.createPart1(req, res, next))
router.post('/part/2', (req, res, next) => ctrl.createPart2(req, res, next))
router.post('/part/3', (req, res, next) => ctrl.createPart3(req, res, next))
router.post('/part/4', (req, res, next) => ctrl.createPart4(req, res, next))
router.post('/part/5', (req, res, next) => ctrl.createPart5(req, res, next))

export default router
