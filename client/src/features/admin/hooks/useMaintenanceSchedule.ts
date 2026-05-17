import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceScheduleService } from '../services/maintenance-schedule.service'
import type { CreateScheduleDto, UpdateScheduleDto, MaintenanceScope } from '../types/maintenance'

const queryKeys = {
  all: ['maintenance-schedules'] as const,
  byScope: (scope: MaintenanceScope) => ['maintenance-schedules', scope] as const,
}

export function useMaintenanceSchedules() {
  return useQuery({
    queryKey: queryKeys.all,
    queryFn: maintenanceScheduleService.getAll,
  })
}

export function useMaintenanceSchedulesByScope(scope: MaintenanceScope) {
  return useQuery({
    queryKey: queryKeys.byScope(scope),
    queryFn: () => maintenanceScheduleService.getByScope(scope),
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateScheduleDto) => maintenanceScheduleService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScheduleDto }) =>
      maintenanceScheduleService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => maintenanceScheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export function useToggleScheduleActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => maintenanceScheduleService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}
