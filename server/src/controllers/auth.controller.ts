import type { Request, Response, NextFunction } from 'express'
import { AuthService } from '@/services/auth.service'
import { TrialService } from '@/services/trial.service'
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

    // Get trial status
    const trialStatus = await TrialService.getTrialStatus(authReq.userId)

    // Profile data is authentication-dependent. It must never be served from a
    // browser or proxy cache, otherwise Express can reply 304 without a body
    // and the client will interpret the user as missing.
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    })

    res.json({
      success: true,
      data: {
        ...user,
        trialStatus,
      },
    })
  }
}
