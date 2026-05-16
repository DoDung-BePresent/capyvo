import type { Request, Response, NextFunction } from 'express'
import { AbuseDetectionService } from '@/services/abuse-detection.service'

export class AbuseDetectionController {
  private service = new AbuseDetectionService()

  async detect(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await this.service.detectAbuse()
    res.json({ success: true, data })
  }
}
