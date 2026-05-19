import { Router } from 'express'
import { authenticate, requireRole } from '@/middlewares/authenticate'
import { OpenAIUsageController } from '@/controllers/openai-usage.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const ctrl = new OpenAIUsageController()

router.use(authenticate, requireRole('ADMIN'))
router.get('/detailed', asyncHandler(ctrl.getDetailedUsage.bind(ctrl)))

export default router
