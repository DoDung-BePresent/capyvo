import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '@/middlewares/authenticate'
import { ActivityService } from '@/services/activity.service'

export class ActivityController {
  private service = new ActivityService()

  async getUserActivity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const data = await this.service.getUserActivity(userId)
    res.json({ success: true, data })
  }
}
