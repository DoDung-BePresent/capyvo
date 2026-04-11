import type { Response, NextFunction } from 'express'
import { AuthService } from '@/services/auth.service'
import { NotFoundError } from '@/errors/app-error'
import type { AuthRequest } from '@/middlewares/authenticate'

const authService = new AuthService()

export class AuthController {
  /**
   * GET /api/auth/me
   * Trả về profile user, tự động tạo nếu đây là lần đầu đăng nhập
   */
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.findOrCreateUser(req.userId, req.userEmail)
      if (!user) throw new NotFoundError('User')
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  }
}
