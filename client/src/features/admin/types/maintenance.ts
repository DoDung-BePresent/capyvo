export type MaintenanceScope = 'GLOBAL' | 'PRICING' | 'PRACTICE' | 'EXAM' | 'ADMIN'

export interface MaintenanceSchedule {
  id: string
  scope: MaintenanceScope
  title: string
  message: string
  startAt: string | null
  endAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

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

export const SCOPE_LABELS: Record<MaintenanceScope, string> = {
  GLOBAL: 'Toàn bộ hệ thống',
  PRICING: 'Trang Pricing & Thanh toán',
  PRACTICE: 'Trang Luyện tập',
  EXAM: 'Trang Thi thử',
  ADMIN: 'Trang Admin',
}

export const SCOPE_COLORS: Record<MaintenanceScope, string> = {
  GLOBAL: 'red',
  PRICING: 'orange',
  PRACTICE: 'blue',
  EXAM: 'green',
  ADMIN: 'purple',
}
