import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { AuthController } from '@/controllers/auth.controller'
import { asyncHandler } from '@/utils/async-handler'

const router = Router()
const controller = new AuthController()

router.use(authenticate)
router.get('/me', asyncHandler(controller.getMe.bind(controller)))

export default router
