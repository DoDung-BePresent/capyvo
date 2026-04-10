import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { maintenanceController } from '@/controllers/maintenance.controller'

const router = Router()

// Public — anyone can check status or subscribe to events
router.get('/status', maintenanceController.getStatus.bind(maintenanceController))
router.get('/events', maintenanceController.sseStream.bind(maintenanceController))

// Admin only — toggle maintenance mode
router.patch(
  '/',
  authenticate,
  requireRole('ADMIN'),
  maintenanceController.setStatus.bind(maintenanceController),
)

export default router
