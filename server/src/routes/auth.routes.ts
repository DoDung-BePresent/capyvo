import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { AuthController } from '@/controllers/auth.controller'

const router = Router()
const controller = new AuthController()

// Tất cả auth routes đều cần token hợp lệ
router.use(authenticate)

router.get('/me', (req, res, next) =>
  controller.getMe(req as Parameters<typeof controller.getMe>[0], res, next),
)

export default router
