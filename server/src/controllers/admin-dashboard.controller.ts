import type { Request, Response, NextFunction } from 'express'
import { AdminDashboardService } from '@/services/admin-dashboard.service'

const svc = new AdminDashboardService()

export class AdminDashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getStats()
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
}
