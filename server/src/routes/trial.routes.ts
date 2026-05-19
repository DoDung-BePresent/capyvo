import { Router } from 'express'
import { TrialController } from '@/controllers/trial.controller'
import { authenticate } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const controller = new TrialController()

// User routes
router.get('/status', authenticate, asyncHandler(controller.getTrialStatus.bind(controller)))

// Admin routes
router.get(
  '/admin/settings',
  authenticate,
  asyncHandler(controller.getTrialSettings.bind(controller)),
)

router.put(
  '/admin/settings',
  authenticate,
  asyncHandler(controller.updateTrialSettings.bind(controller)),
)

router.post(
  '/admin/check-expired',
  authenticate,
  asyncHandler(controller.checkExpiredTrials.bind(controller)),
)

export default router
