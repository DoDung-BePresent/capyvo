import { Router } from 'express'
import { ExamSetController } from '@/controllers/exam-set.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const controller = new ExamSetController()

// ─── User-accessible routes (authenticated, no role restriction) ──────────────
router.get('/published', authenticate, asyncHandler(controller.getPublished.bind(controller)))
router.get('/:id/take', authenticate, asyncHandler(controller.getPublishedById.bind(controller)))

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.use(authenticate, requireRole('ADMIN'))

router.get('/pool', asyncHandler(controller.getPoolQuestions.bind(controller)))
router.get('/', asyncHandler(controller.getAll.bind(controller)))
router.get('/:id', asyncHandler(controller.getById.bind(controller)))
router.post('/', asyncHandler(controller.create.bind(controller)))
router.put('/:id', asyncHandler(controller.update.bind(controller)))
router.delete('/:id', asyncHandler(controller.remove.bind(controller)))
router.post('/:id/assign', asyncHandler(controller.assignQuestion.bind(controller)))
router.post('/:id/unassign', asyncHandler(controller.unassignQuestion.bind(controller)))

export default router
