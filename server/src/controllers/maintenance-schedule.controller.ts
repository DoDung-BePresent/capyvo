import { Request, Response, NextFunction } from 'express'
import {
  MaintenanceScheduleService,
  CreateScheduleDto,
  UpdateScheduleDto,
} from '@/services/maintenance-schedule.service'
import { MaintenanceScope } from '@prisma/client'
import { z } from 'zod'

const CreateScheduleSchema = z.object({
  scope: z.nativeEnum(MaintenanceScope),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
})

const UpdateScheduleSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(500).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
})

export class MaintenanceScheduleController {
  /**
   * GET /api/admin/maintenance-schedules
   * Get all schedules
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await MaintenanceScheduleService.getAll()
      res.json({ success: true, data: schedules })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/admin/maintenance-schedules/:scope
   * Get schedules by scope
   */
  async getByScope(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scopeParam = req.params.scope
      const scope = (
        typeof scopeParam === 'string' ? scopeParam : scopeParam[0]
      ).toUpperCase() as MaintenanceScope

      if (!Object.values(MaintenanceScope).includes(scope)) {
        res.status(400).json({ success: false, message: 'Invalid scope' })
        return
      }

      const schedules = await MaintenanceScheduleService.getByScope(scope)
      res.json({ success: true, data: schedules })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/maintenance/check/:scope
   * Check if scope is under maintenance (public endpoint)
   */
  async checkMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scopeParam = req.params.scope
      const scope = (
        typeof scopeParam === 'string' ? scopeParam : scopeParam[0]
      ).toUpperCase() as MaintenanceScope

      if (!Object.values(MaintenanceScope).includes(scope)) {
        res.status(400).json({ success: false, message: 'Invalid scope' })
        return
      }

      const result = await MaintenanceScheduleService.checkMaintenance(scope)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/admin/maintenance-schedules
   * Create schedule
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateScheduleSchema.parse(req.body) as CreateScheduleDto
      const schedule = await MaintenanceScheduleService.create(data)
      res.json({ success: true, data: schedule })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/admin/maintenance-schedules/:id
   * Update schedule
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const data = UpdateScheduleSchema.parse(req.body) as UpdateScheduleDto
      const schedule = await MaintenanceScheduleService.update(id, data)
      res.json({ success: true, data: schedule })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/admin/maintenance-schedules/:id
   * Delete schedule
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      await MaintenanceScheduleService.delete(id)
      res.json({ success: true, message: 'Đã xóa lịch bảo trì' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/admin/maintenance-schedules/:id/toggle
   * Toggle active status
   */
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const schedule = await MaintenanceScheduleService.toggleActive(id)
      res.json({
        success: true,
        data: schedule,
        message: schedule.isActive ? 'Đã bật bảo trì' : 'Đã tắt bảo trì',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/admin/maintenance-schedules/check-schedules
   * Manually trigger schedule check (admin only)
   */
  async checkSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceScheduleService.checkSchedules()
      res.json({
        success: true,
        data: result,
        message: `Đã kích hoạt ${result.activated} và vô hiệu hóa ${result.deactivated} lịch bảo trì`,
      })
    } catch (error) {
      next(error)
    }
  }
}
