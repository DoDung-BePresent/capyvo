import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    const es = new EventSource(`${API_URL}/maintenance/events`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { maintenance: boolean }
        setIsMaintenance(data.maintenance)
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      // Browser automatically reconnects; nothing to do here
    }

    return () => es.close()
  }, [])

  return { isMaintenance }
}

export function useMaintenanceMutation() {
  return useMutation({
    mutationFn: (maintenance: boolean) => axiosInstance.patch('/maintenance', { maintenance }),
  })
}
