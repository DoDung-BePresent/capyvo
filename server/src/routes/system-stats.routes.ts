import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { getSystemStats } from '@/controllers/system-stats.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))
router.get('/', asyncHandler(getSystemStats))

export default router
