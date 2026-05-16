import { Request, Response, NextFunction } from 'express'
import { TrialService } from '@/services/trial.service'
import { UnauthorizedError } from '@/errors/app-error'
import { z } from 'zod'
import type { AuthRequest } from '@/middlewares/authenticate'

const UpdateTrialDaysSchema = z.object({
  days: z.number().int().min(0).max(365),
})

export class TrialController {
  /**
   * GET /api/admin/trial/settings
   * Get current trial days setting
   */
  async getTrialSettings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const settings = await TrialService.getTrialSettings()

    res.json({
      success: true,
      data: {
        trialDays: settings.trialDays,
      },
    })
  }

  /**
   * PUT /api/admin/trial/settings
   * Update trial days setting (admin only)
   */
  async updateTrialSettings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { days } = UpdateTrialDaysSchema.parse(req.body)

    await TrialService.updateTrialSettings(days)

    res.json({
      success: true,
      message: `Đã cập nhật thời gian dùng thử thành ${days} ngày`,
      data: {
        trialDays: days,
      },
    })
  }

  /**
   * GET /api/trial/status
   * Get trial status for current user
   */
  async getTrialStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId

    if (!userId) {
      throw new UnauthorizedError()
    }

    const status = await TrialService.getTrialStatus(userId)

    res.json({
      success: true,
      data: status,
    })
  }

  /**
   * POST /api/admin/trial/check-expired
   * Manually trigger check expired trials (admin only)
   */
  async checkExpiredTrials(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result = await TrialService.checkExpiredTrials()

    res.json({
      success: true,
      message: `Đã thu hồi premium cho ${result.revokedCount} người dùng hết hạn dùng thử`,
      data: {
        revokedCount: result.revokedCount,
      },
    })
  }
}
