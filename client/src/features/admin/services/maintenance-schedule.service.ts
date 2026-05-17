import axiosInstance from '@/lib/axios'
import type {
  MaintenanceSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  MaintenanceScope,
} from '../types/maintenance'

export const maintenanceScheduleService = {
  /**
   * Get all schedules
   */
  getAll: async (): Promise<MaintenanceSchedule[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: MaintenanceSchedule[] }>(
      '/maintenance-schedules/admin',
    )
    return data.data
  },

  /**
   * Get schedules by scope
   */
  getByScope: async (scope: MaintenanceScope): Promise<MaintenanceSchedule[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: MaintenanceSchedule[] }>(
      `/maintenance-schedules/admin/${scope.toLowerCase()}`,
    )
    return data.data
  },

  /**
   * Create schedule
   */
  create: async (dto: CreateScheduleDto): Promise<MaintenanceSchedule> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: MaintenanceSchedule }>(
      '/maintenance-schedules/admin',
      dto,
    )
    return data.data
  },

  /**
   * Update schedule
   */
  update: async (id: string, dto: UpdateScheduleDto): Promise<MaintenanceSchedule> => {
    const { data } = await axiosInstance.patch<{ success: boolean; data: MaintenanceSchedule }>(
      `/maintenance-schedules/admin/${id}`,
      dto,
    )
    return data.data
  },

  /**
   * Delete schedule
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/maintenance-schedules/admin/${id}`)
  },

  /**
   * Toggle active status
   */
  toggleActive: async (id: string): Promise<MaintenanceSchedule> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: MaintenanceSchedule }>(
      `/maintenance-schedules/admin/${id}/toggle`,
    )
    return data.data
  },

  /**
   * Check maintenance status for a scope (public)
   */
  checkMaintenance: async (
    scope: MaintenanceScope,
  ): Promise<{
    isUnderMaintenance: boolean
    schedule: MaintenanceSchedule | null
  }> => {
    const { data } = await axiosInstance.get<{
      success: boolean
      data: { isUnderMaintenance: boolean; schedule: MaintenanceSchedule | null }
    }>(`/maintenance-schedules/check/${scope.toLowerCase()}`)
    return data.data
  },
}
