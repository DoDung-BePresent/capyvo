import type { Request, Response, NextFunction } from 'express'
import { maintenanceService } from '@/services/maintenance.service'
import { ForbiddenError } from '@/errors/app-error'

export class MaintenanceController {
  getStatus(_req: Request, res: Response): void {
    res.json({ success: true, data: { maintenance: maintenanceService.isEnabled() } })
  }

  async setStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { maintenance } = req.body as { maintenance: boolean }
      if (typeof maintenance !== 'boolean') {
        throw new ForbiddenError('maintenance must be a boolean')
      }
      await maintenanceService.setEnabled(maintenance)
      res.json({ success: true, data: { maintenance } })
    } catch (err) {
      next(err)
    }
  }

  sseStream(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Send current state immediately on connect
    res.write(`data: ${JSON.stringify({ maintenance: maintenanceService.isEnabled() })}\n\n`)

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
