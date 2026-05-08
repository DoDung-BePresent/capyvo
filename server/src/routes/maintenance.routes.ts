import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { maintenanceController } from '@/controllers/maintenance.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()

// Public routes
router.get('/status', maintenanceController.getStatus.bind(maintenanceController))
router.get('/events', maintenanceController.sseStream.bind(maintenanceController))

// Admin only routes
router.patch(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(maintenanceController.setStatus.bind(maintenanceController)),
)
router.put(
  '/schedule',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(maintenanceController.setSchedule.bind(maintenanceController)),
)
router.delete(
  '/schedule',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(maintenanceController.clearSchedule.bind(maintenanceController)),
)

export default router
