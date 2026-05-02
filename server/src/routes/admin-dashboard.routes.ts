import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { AdminDashboardController } from '@/controllers/admin-dashboard.controller'

const router = Router()
const ctrl = new AdminDashboardController()

router.use(authenticate, requireRole('ADMIN'))

router.get('/stats', (req, res, next) => ctrl.getStats(req, res, next))

export default router
