import type { Request, Response, NextFunction } from 'express'
import { OpenAIUsageService } from '@/services/openai-usage.service'

export class OpenAIUsageController {
  private service = new OpenAIUsageService()

  async getDetailedUsage(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const startDateStr = req.query['startDate'] as string | undefined
    const endDateStr = req.query['endDate'] as string | undefined

    // Default to current month if not provided
    const now = new Date()
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const data = await this.service.getDetailedUsage(startDate, endDate)
    res.json({ success: true, data })
  }
}
