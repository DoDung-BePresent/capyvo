import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { ShareController } from '@/controllers/share.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new ShareController()

// User endpoints
router.post('/', authenticate, asyncHandler(ctrl.createShare.bind(ctrl)))
router.delete('/:shareId', authenticate, asyncHandler(ctrl.deleteShare.bind(ctrl)))
router.get('/question/:questionId', authenticate, asyncHandler(ctrl.getSharesByQuestion.bind(ctrl)))
router.post('/:shareId/reactions', authenticate, asyncHandler(ctrl.toggleReaction.bind(ctrl)))
router.get('/my', authenticate, asyncHandler(ctrl.getMyShares.bind(ctrl)))

export default router
