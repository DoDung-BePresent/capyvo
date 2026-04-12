import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { getSystemStats } from '@/controllers/system-stats.controller'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))
router.get('/', (req, res, next) => getSystemStats(req, res, next))

export default router
