import { MaintenanceScope, type MaintenanceSchedule } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface CreateScheduleDto {
  scope: MaintenanceScope
  title: string
  message: string
  startAt?: string | null
  endAt?: string | null
  isActive?: boolean
}

export interface UpdateScheduleDto {
  title?: string
  message?: string
  startAt?: string | null
  endAt?: string | null
  isActive?: boolean
}

export class MaintenanceScheduleService {
  /**
   * Get all schedules
   */
  static async getAll() {
    return prisma.maintenanceSchedule.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Get schedules by scope
   */
  static async getByScope(scope: MaintenanceScope) {
    return prisma.maintenanceSchedule.findMany({
      where: { scope },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Get active schedules by scope
   */
  static async getActiveByScope(scope: MaintenanceScope) {
    const now = new Date()
    return prisma.maintenanceSchedule.findMany({
      where: {
        scope,
        isActive: true,
        AND: [
          {
            OR: [
              { startAt: null }, // No start time = active now
              { startAt: { lte: now } }, // Start time has passed
            ],
          },
          {
            OR: [
              { endAt: null }, // No end time = never expires
              { endAt: { gte: now } }, // End time not reached
            ],
          },
        ],
      },
    })
  }

  /**
   * Check if scope is under maintenance
   */
  static async isUnderMaintenance(scope: MaintenanceScope): Promise<boolean> {
    const schedules = await this.getActiveByScope(scope)
    return schedules.length > 0
  }

  /**
   * Check if GLOBAL or specific scope is under maintenance
   */
  static async checkMaintenance(scope: MaintenanceScope): Promise<{
    isUnderMaintenance: boolean
    schedule: MaintenanceSchedule | null
  }> {
    // Check GLOBAL first
    const globalSchedules = await this.getActiveByScope(MaintenanceScope.GLOBAL)
    if (globalSchedules.length > 0) {
      return { isUnderMaintenance: true, schedule: globalSchedules[0] }
    }

    // Check specific scope
    const scopeSchedules = await this.getActiveByScope(scope)
    if (scopeSchedules.length > 0) {
      return { isUnderMaintenance: true, schedule: scopeSchedules[0] }
    }

    return { isUnderMaintenance: false, schedule: null }
  }

  /**
   * Create schedule
   */
  static async create(data: CreateScheduleDto) {
    return prisma.maintenanceSchedule.create({
      data: {
        scope: data.scope,
        title: data.title,
        message: data.message,
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        isActive: data.isActive ?? false,
      },
    })
  }

  /**
   * Update schedule
   */
  static async update(id: string, data: UpdateScheduleDto) {
    return prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        title: data.title,
        message: data.message,
        startAt:
          data.startAt !== undefined ? (data.startAt ? new Date(data.startAt) : null) : undefined,
        endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : undefined,
        isActive: data.isActive,
      },
    })
  }

  /**
   * Delete schedule
   */
  static async delete(id: string) {
    return prisma.maintenanceSchedule.delete({
      where: { id },
    })
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id: string) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    return prisma.maintenanceSchedule.update({
      where: { id },
      data: { isActive: !schedule.isActive },
    })
  }

  /**
   * Check and auto-activate/deactivate schedules (run by cron)
   */
  static async checkSchedules() {
    const now = new Date()

    // Auto-activate schedules that should start
    const toActivate = await prisma.maintenanceSchedule.findMany({
      where: {
        isActive: false,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
    })

    for (const schedule of toActivate) {
      await prisma.maintenanceSchedule.update({
        where: { id: schedule.id },
        data: { isActive: true },
      })
      console.log(`Auto-activated maintenance schedule: ${schedule.title}`)
    }

    // Auto-deactivate schedules that should end
    const toDeactivate = await prisma.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        endAt: { lt: now },
      },
    })

    for (const schedule of toDeactivate) {
      await prisma.maintenanceSchedule.update({
        where: { id: schedule.id },
        data: { isActive: false },
      })
      console.log(`Auto-deactivated maintenance schedule: ${schedule.title}`)
    }

    return {
      activated: toActivate.length,
      deactivated: toDeactivate.length,
    }
  }
}
