import type { Response } from 'express'
import prisma from '@/lib/prisma'

const SETTING_KEY = 'maintenance_mode'

// In-memory state — initialized on first use
let maintenanceEnabled: boolean | null = null

// SSE client registry
const sseClients = new Set<Response>()

export class MaintenanceService {
  async init(): Promise<void> {
    const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
    maintenanceEnabled = setting?.value === 'true'
  }

  isEnabled(): boolean {
    return maintenanceEnabled ?? false
  }

  async setEnabled(value: boolean): Promise<void> {
    maintenanceEnabled = value
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(value) },
      create: { key: SETTING_KEY, value: String(value) },
    })
    this.broadcast({ maintenance: value })
  }

  addSseClient(res: Response): void {
    sseClients.add(res)
  }

  removeSseClient(res: Response): void {
    sseClients.delete(res)
  }

  private broadcast(data: object): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`
    for (const client of sseClients) {
      client.write(payload)
    }
  }
}

export const maintenanceService = new MaintenanceService()
