import { Router } from 'express'
import { SubscriptionController } from '../controllers/subscription.controller'
import { authenticate } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = SubscriptionController

// Public routes
router.get('/plans', asyncHandler(ctrl.getPlans))

// Protected routes
router.use(authenticate)

router.get('/current', asyncHandler(ctrl.getCurrentSubscription))
router.get('/history', asyncHandler(ctrl.getHistory))
router.post('/create', asyncHandler(ctrl.createSubscription))
router.post('/cancel', asyncHandler(ctrl.cancelSubscription))
router.post('/check-expired', asyncHandler(ctrl.checkExpired))

export default router
