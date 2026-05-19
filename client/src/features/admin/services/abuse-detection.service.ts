import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface SuspiciousUser {
  userId: string
  email: string
  fullName: string | null
  flags: string[]
  metrics: {
    sessionsLast24h: number
    sessionsLast7d: number
    avgSessionDuration: number
    totalResponses: number
    failedResponses: number
    failureRate: number
  }
  riskScore: number
  createdAt: string
}

export interface AbuseStats {
  totalUsers: number
  suspiciousUsers: number
  flaggedUsers: SuspiciousUser[]
  thresholds: {
    maxSessionsPer24h: number
    maxSessionsPer7d: number
    maxFailureRate: number
  }
}

export const abuseDetectionService = {
  detect: async (): Promise<AbuseStats> => {
    const { data } = await axiosInstance.get<ApiResponse<AbuseStats>>(
      '/admin/abuse-detection/detect',
    )
    return data.data
  },
}
