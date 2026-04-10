import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export interface MaintenanceSchedule {
  start: string | null // ISO date string
  end: string | null // ISO date string
  message: string
}

export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null)

  useEffect(() => {
    const es = new EventSource(`${API_URL}/maintenance/events`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          maintenance: boolean
          schedule: MaintenanceSchedule | null
        }
        setIsMaintenance(data.maintenance)
        setSchedule(data.schedule ?? null)
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      // Browser automatically reconnects; nothing to do here
    }

    return () => es.close()
  }, [])

  return { isMaintenance, schedule }
}

export function useMaintenanceMutation() {
  return useMutation({
    mutationFn: (maintenance: boolean) => axiosInstance.patch('/maintenance', { maintenance }),
  })
}

export function useMaintenanceScheduleMutation() {
  return useMutation({
    mutationFn: (data: { start: string | null; end: string | null; message: string }) =>
      axiosInstance.put('/maintenance/schedule', data),
  })
}

export function useClearScheduleMutation() {
  return useMutation({
    mutationFn: () => axiosInstance.delete('/maintenance/schedule'),
  })
}
