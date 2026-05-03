import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { AdminDashboardController } from '@/controllers/admin-dashboard.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new AdminDashboardController()

router.use(authenticate, requireRole('ADMIN'))
router.get('/stats', asyncHandler(ctrl.getStats.bind(ctrl)))

export default router
