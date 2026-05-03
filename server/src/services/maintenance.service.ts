import type { Response } from 'express'
import prisma from '@/lib/prisma'

const SETTING_KEY = 'maintenance_mode'
const SCHEDULE_KEY = 'maintenance_schedule'

// In-memory state — initialized on first use
let maintenanceEnabled: boolean | null = null

export interface ScheduleData {
  start: string | null // ISO date string
  end: string | null // ISO date string
  message: string
}

let currentSchedule: ScheduleData | null = null
let startTimer: ReturnType<typeof setTimeout> | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

// SSE client registry
const sseClients = new Set<Response>()

export class MaintenanceService {
  async init(): Promise<void> {
    const [modeSetting, scheduleSetting] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: SETTING_KEY } }),
      prisma.appSetting.findUnique({ where: { key: SCHEDULE_KEY } }),
    ])
    maintenanceEnabled = modeSetting?.value === 'true'
    if (scheduleSetting) {
      try {
        currentSchedule = JSON.parse(scheduleSetting.value) as ScheduleData
        this._applyTimers()
      } catch {
        currentSchedule = null
      }
    }
  }

  isEnabled(): boolean {
    return maintenanceEnabled ?? false
  }

  getSchedule(): ScheduleData | null {
    return currentSchedule
  }

  getFullStatus(): { maintenance: boolean; schedule: ScheduleData | null } {
    return { maintenance: this.isEnabled(), schedule: currentSchedule }
  }

  async setEnabled(value: boolean): Promise<void> {
    maintenanceEnabled = value
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(value) },
      create: { key: SETTING_KEY, value: String(value) },
    })
    this._broadcast(this.getFullStatus())
  }

  async setSchedule(start: string | null, end: string | null, message: string): Promise<void> {
    currentSchedule = { start, end, message }
    await prisma.appSetting.upsert({
      where: { key: SCHEDULE_KEY },
      update: { value: JSON.stringify(currentSchedule) },
      create: { key: SCHEDULE_KEY, value: JSON.stringify(currentSchedule) },
    })
    this._applyTimers()
    this._broadcast(this.getFullStatus())
  }

  async clearSchedule(): Promise<void> {
    if (startTimer) {
      clearTimeout(startTimer)
      startTimer = null
    }
    if (endTimer) {
      clearTimeout(endTimer)
      endTimer = null
    }
    currentSchedule = null
    await prisma.appSetting.deleteMany({ where: { key: SCHEDULE_KEY } })
    this._broadcast(this.getFullStatus())
  }

  addSseClient(res: Response): void {
    sseClients.add(res)
  }

  removeSseClient(res: Response): void {
    sseClients.delete(res)
  }

  private _broadcast(data: object): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`
    for (const client of sseClients) {
      client.write(payload)
    }
  }

  private _applyTimers(): void {
    if (startTimer) {
      clearTimeout(startTimer)
      startTimer = null
    }
    if (endTimer) {
      clearTimeout(endTimer)
      endTimer = null
    }

    if (!currentSchedule) return

    const now = Date.now()

    if (currentSchedule.start) {
      const msUntilStart = new Date(currentSchedule.start).getTime() - now
      if (msUntilStart > 0) {
        startTimer = setTimeout(() => {
          this.setEnabled(true).catch(() => {})
        }, msUntilStart)
      }
    }

    if (currentSchedule.end) {
      const msUntilEnd = new Date(currentSchedule.end).getTime() - now
      if (msUntilEnd > 0) {
        endTimer = setTimeout(async () => {
          // Clear schedule in memory before broadcasting so clients see schedule: null
          currentSchedule = null
          endTimer = null
          try {
            await prisma.appSetting.deleteMany({ where: { key: SCHEDULE_KEY } })
          } catch {
            /* ignore */
          }
          this.setEnabled(false).catch(() => {})
        }, msUntilEnd)
      }
    }
  }
}

// Singleton instance for stateful service (SSE clients, timers)
export const maintenanceService = new MaintenanceService()
