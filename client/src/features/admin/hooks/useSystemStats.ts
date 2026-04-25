import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { queryKeys } from '@/lib/query-keys'
import type { ApiResponse } from '@/shared/types/api'

export interface SystemStats {
  supabase: {
    storageSizeBytes: number | null
    dbSizeBytes: number | null
    configured: boolean
  }
  openai: {
    currentMonthCostUsd: number | null
    configured: boolean
  }
}

async function fetchSystemStats(): Promise<SystemStats> {
  const { data } = await axiosInstance.get<ApiResponse<SystemStats>>('/system-stats')
  return data.data
}

export function useSystemStats() {
  return useQuery({
    queryKey: queryKeys.systemStats.all(),
    queryFn: fetchSystemStats,
    staleTime: 5 * 60 * 1000, // 5 min — no need to poll frequently
    retry: false,
  })
}
