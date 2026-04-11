import { Router } from 'express'
import { ExamSetController } from '@/controllers/exam-set.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'

const router = Router()
const controller = new ExamSetController()

// ─── User-accessible routes (authenticated, no role restriction) ──────────────
router.get('/published', authenticate, (req, res, next) => controller.getPublished(req, res, next))
router.get('/:id/take', authenticate, (req, res, next) =>
  controller.getPublishedById(req, res, next),
)

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.use(authenticate, requireRole('ADMIN'))

// Pool must come before /:id to avoid route conflict
router.get('/pool', (req, res, next) => controller.getPoolQuestions(req, res, next))

router.get('/', (req, res, next) => controller.getAll(req, res, next))
router.get('/:id', (req, res, next) => controller.getById(req, res, next))
router.post('/', (req, res, next) => controller.create(req, res, next))
router.put('/:id', (req, res, next) => controller.update(req, res, next))
router.delete('/:id', (req, res, next) => controller.remove(req, res, next))

router.post('/:id/assign', (req, res, next) => controller.assignQuestion(req, res, next))
router.post('/:id/unassign', (req, res, next) => controller.unassignQuestion(req, res, next))

export default router
