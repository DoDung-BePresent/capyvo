import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface OpenAIUsageDetail {
  date: string
  tokens: number
  requests: number
  costUsd: number
}

export interface OpenAIUsageByModel {
  model: string
  tokens: number
  requests: number
  costUsd: number
}

export interface OpenAIDetailedStats {
  totalTokens: number
  totalRequests: number
  estimatedCostUsd: number
  configured: boolean
  dailyUsage: OpenAIUsageDetail[]
  usageByModel: OpenAIUsageByModel[]
  startDate: string
  endDate: string
}

export const openaiUsageService = {
  getDetailedUsage: async (startDate?: string, endDate?: string): Promise<OpenAIDetailedStats> => {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const { data } = await axiosInstance.get<ApiResponse<OpenAIDetailedStats>>(
      '/admin/openai-usage/detailed',
      { params },
    )
    return data.data
  },
}
