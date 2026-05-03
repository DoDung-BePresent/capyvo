import type { Request, Response, NextFunction } from 'express'
import { AdminDashboardService } from '@/services/admin-dashboard.service'

export class AdminDashboardController {
  private service = new AdminDashboardService()

  async getStats(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await this.service.getStats()
    res.json({ success: true, data })
  }
}
