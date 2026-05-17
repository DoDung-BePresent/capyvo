import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { AbuseDetectionController } from '@/controllers/abuse-detection.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new AbuseDetectionController()

router.use(authenticate, requireRole('ADMIN'))
router.get('/detect', asyncHandler(ctrl.detect.bind(ctrl)))

export default router
