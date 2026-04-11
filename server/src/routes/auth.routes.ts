import { Router } from 'express'
import { authenticate } from '@/middlewares/authenticate'
import { AuthController } from '@/controllers/auth.controller'

const router = Router()
const controller = new AuthController()

router.use(authenticate)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy profile user hiện tại
 *     description: Trả về profile user, tự động tạo record nếu đây là lần đầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       enum: [USER, ADMIN]
 *       401:
 *         description: Unauthorized
 */
router.get('/me', (req, res, next) =>
  controller.getMe(req as Parameters<typeof controller.getMe>[0], res, next),
)

export default router
