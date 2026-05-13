import { Router } from 'express'
import { TopicController } from '@/controllers/topic.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new TopicController()

// All topic routes require admin authentication
router.use(authenticate, requireRole('ADMIN'))

router.get('/', asyncHandler(ctrl.getAll.bind(ctrl)))
router.post('/', asyncHandler(ctrl.create.bind(ctrl)))
router.patch('/:id', asyncHandler(ctrl.update.bind(ctrl)))
router.delete('/:id', asyncHandler(ctrl.delete.bind(ctrl)))
router.post('/:id/assign', asyncHandler(ctrl.assignToQuestions.bind(ctrl)))
router.delete('/:id/unassign', asyncHandler(ctrl.unassignFromQuestions.bind(ctrl)))

export default router
