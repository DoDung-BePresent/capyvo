import type { Request, Response, NextFunction } from 'express'
import { MaintenanceService, maintenanceService } from '@/services/maintenance.service'
import { ForbiddenError } from '@/errors/app-error'

export class MaintenanceController {
  private service: MaintenanceService

  constructor(service: MaintenanceService) {
    this.service = service
  }

  getStatus(_req: Request, res: Response): void {
    res.json({ success: true, data: this.service.getFullStatus() })
  }

  async setStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { maintenance } = req.body as { maintenance: boolean }
    if (typeof maintenance !== 'boolean') {
      throw new ForbiddenError('maintenance must be a boolean')
    }
    await this.service.setEnabled(maintenance)
    res.json({ success: true, data: this.service.getFullStatus() })
  }

  async setSchedule(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const {
      start = null,
      end = null,
      message = '',
    } = req.body as {
      start?: string | null
      end?: string | null
      message?: string
    }
    if (start && end && new Date(start) >= new Date(end)) {
      throw new ForbiddenError('start must be before end')
    }
    await this.service.setSchedule(start, end, message)
    res.json({ success: true, data: this.service.getFullStatus() })
  }

  async clearSchedule(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.service.clearSchedule()
    res.json({ success: true, data: this.service.getFullStatus() })
  }

  sseStream(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    res.write(`data: ${JSON.stringify(this.service.getFullStatus())}\n\n`)
    this.service.addSseClient(res)

    const ping = setInterval(() => res.write(': ping\n\n'), 25_000)

    req.on('close', () => {
      clearInterval(ping)
      this.service.removeSseClient(res)
    })
  }
}

export const maintenanceController = new MaintenanceController(maintenanceService)
