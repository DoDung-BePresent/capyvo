import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { SessionController } from '@/controllers/session.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new SessionController()

router.post('/', authenticate, asyncHandler(ctrl.create.bind(ctrl)))
router.get('/my/completed-set-ids', authenticate, asyncHandler(ctrl.completedSetIds.bind(ctrl)))
router.get('/my', authenticate, asyncHandler(ctrl.myBySet.bind(ctrl)))
router.get('/stats/:examSetId', authenticate, asyncHandler(ctrl.setStats.bind(ctrl)))
router.patch('/:id/complete', authenticate, asyncHandler(ctrl.complete.bind(ctrl)))
router.get('/:id', authenticate, asyncHandler(ctrl.detail.bind(ctrl)))

export default router
