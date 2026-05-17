import { Router } from 'express'
import { MaintenanceScheduleController } from '@/controllers/maintenance-schedule.controller'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const controller = new MaintenanceScheduleController()

// Public routes
router.get('/check/:scope', asyncHandler(controller.checkMaintenance.bind(controller)))

// Admin routes
router.get(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.getAll.bind(controller)),
)

router.get(
  '/admin/:scope',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.getByScope.bind(controller)),
)

router.post(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.create.bind(controller)),
)

router.patch(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.update.bind(controller)),
)

router.delete(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.delete.bind(controller)),
)

router.post(
  '/admin/:id/toggle',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.toggleActive.bind(controller)),
)

router.post(
  '/admin/check-schedules',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(controller.checkSchedules.bind(controller)),
)

export default router
