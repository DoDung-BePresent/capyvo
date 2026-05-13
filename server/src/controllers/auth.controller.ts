import type { Request, Response, NextFunction } from 'express'
import { AuthService } from '@/services/auth.service'
import { NotFoundError } from '@/errors/app-error'
import type { AuthRequest } from '@/middlewares/authenticate'

export class AuthController {
  private service = new AuthService()

  async getMe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const authReq = req as AuthRequest
    const user = await this.service.findOrCreateUser(
      authReq.userId,
      authReq.userEmail,
      authReq.userMetadata?.full_name,
      authReq.userMetadata?.avatar_url,
    )
    if (!user) throw new NotFoundError('User')
    res.json({ success: true, data: user })
  }
}
