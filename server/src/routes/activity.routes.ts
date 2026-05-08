import { Router } from 'express'
import { ActivityController } from '@/controllers/activity.controller'
import { authenticate } from '@/middlewares/authenticate'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const controller = new ActivityController()

router.use(authenticate)
router.get('/my', asyncHandler(controller.getUserActivity.bind(controller)))

export default router
