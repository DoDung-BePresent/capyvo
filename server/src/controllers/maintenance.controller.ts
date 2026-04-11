import type { Request, Response, NextFunction } from 'express'
import { maintenanceService } from '@/services/maintenance.service'
import { ForbiddenError } from '@/errors/app-error'

export class MaintenanceController {
  getStatus(_req: Request, res: Response): void {
    res.json({ success: true, data: maintenanceService.getFullStatus() })
  }

  async setStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { maintenance } = req.body as { maintenance: boolean }
      if (typeof maintenance !== 'boolean') {
        throw new ForbiddenError('maintenance must be a boolean')
      }
      await maintenanceService.setEnabled(maintenance)
      res.json({ success: true, data: maintenanceService.getFullStatus() })
    } catch (err) {
      next(err)
    }
  }

  async setSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      await maintenanceService.setSchedule(start, end, message)
      res.json({ success: true, data: maintenanceService.getFullStatus() })
    } catch (err) {
      next(err)
    }
  }

  async clearSchedule(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await maintenanceService.clearSchedule()
      res.json({ success: true, data: maintenanceService.getFullStatus() })
    } catch (err) {
      next(err)
    }
  }

  sseStream(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Send current full state immediately on connect
    res.write(`data: ${JSON.stringify(maintenanceService.getFullStatus())}\n\n`)

    maintenanceService.addSseClient(res)

    // Keep-alive ping every 25s
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000)

    req.on('close', () => {
      clearInterval(ping)
      maintenanceService.removeSseClient(res)
    })
  }
}

export const maintenanceController = new MaintenanceController()
