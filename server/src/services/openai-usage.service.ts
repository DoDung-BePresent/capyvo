import logger from '@/lib/logger'
import { env } from '@/config/env'
import axios from 'axios'

interface OpenAIUsageResponse {
  object: 'list'
  data: Array<{
    aggregation_timestamp: number
    n_requests: number
    operation: string
    snapshot_id: string
    n_context_tokens_total: number
    n_generated_tokens_total: number
  }>
  ft_data: unknown[]
  dalle_api_data: unknown[]
  whisper_api_data: unknown[]
  tts_api_data: unknown[]
  current_usage_usd: number
}

export interface OpenAIUsageStats {
  totalTokens: number
  totalRequests: number
  estimatedCostUsd: number
  configured: boolean
}

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

export class OpenAIUsageService {
  private adminKey: string | undefined

  constructor() {
    this.adminKey = env.OPENAI_API_ADMIN_KEY
  }

  /**
   * Get OpenAI usage stats for current month
   * Uses OpenAI Admin API with admin key
   */
  async getCurrentMonthUsage(): Promise<OpenAIUsageStats> {
    if (!this.adminKey) {
      logger.warn('OPENAI_API_ADMIN_KEY not configured')
      return {
        totalTokens: 0,
        totalRequests: 0,
        estimatedCostUsd: 0,
        configured: false,
      }
    }

    try {
      // Get current month date range
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

      const startDateStr = startDate.toISOString().split('T')[0]

      // Call OpenAI Usage API (new format with 'date' param)
      const response = await axios.get<OpenAIUsageResponse>('https://api.openai.com/v1/usage', {
        params: {
          date: startDateStr, // OpenAI now uses 'date' instead of 'start_date'
        },
        headers: {
          Authorization: `Bearer ${this.adminKey}`,
        },
        timeout: 10000,
      })

      // Calculate totals
      let totalTokens = 0
      let totalRequests = 0

      for (const item of response.data.data) {
        totalTokens += (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0)
        totalRequests += item.n_requests || 0
      }

      const estimatedCostUsd = response.data.current_usage_usd || 0

      return {
        totalTokens,
        totalRequests,
        estimatedCostUsd,
        configured: true,
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          logger.error(
            'OpenAI API key không có quyền truy cập /v1/usage endpoint. Vui lòng sử dụng Admin API key từ https://platform.openai.com/settings/organization/admin-keys',
          )
        } else {
          logger.error('Failed to fetch OpenAI usage:', {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
          })
        }
      } else {
        logger.error('Failed to fetch OpenAI usage:', error)
      }

      return {
        totalTokens: 0,
        totalRequests: 0,
        estimatedCostUsd: 0,
        configured: true, // Key is configured but API call failed
      }
    }
  }

  /**
   * Get detailed OpenAI usage stats with daily breakdown and model breakdown
   */
  async getDetailedUsage(startDate: Date, endDate: Date): Promise<OpenAIDetailedStats> {
    if (!this.adminKey) {
      logger.warn('OPENAI_API_ADMIN_KEY not configured')
      return {
        totalTokens: 0,
        totalRequests: 0,
        estimatedCostUsd: 0,
        configured: false,
        dailyUsage: [],
        usageByModel: [],
        startDate: startDate.toISOString().split('T')[0] as string,
        endDate: endDate.toISOString().split('T')[0] as string,
      }
    }

    try {
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Call OpenAI Usage API (new format with 'date' param)
      const response = await axios.get<OpenAIUsageResponse>('https://api.openai.com/v1/usage', {
        params: {
          date: startDateStr, // OpenAI now uses 'date' instead of 'start_date'
        },
        headers: {
          Authorization: `Bearer ${this.adminKey}`,
        },
        timeout: 10000,
      })

      // Calculate totals
      let totalTokens = 0
      let totalRequests = 0

      // Group by date
      const dailyMap = new Map<string, { tokens: number; requests: number }>()
      // Group by model (operation)
      const modelMap = new Map<string, { tokens: number; requests: number }>()

      for (const item of response.data.data) {
        const tokens = (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0)
        const requests = item.n_requests || 0

        totalTokens += tokens
        totalRequests += requests

        // Daily aggregation
        const date = new Date(item.aggregation_timestamp * 1000)
          .toISOString()
          .split('T')[0] as string
        const daily = dailyMap.get(date) || { tokens: 0, requests: 0 }
        daily.tokens += tokens
        daily.requests += requests
        dailyMap.set(date, daily)

        // Model aggregation
        const model = item.operation || 'unknown'
        const modelData = modelMap.get(model) || { tokens: 0, requests: 0 }
        modelData.tokens += tokens
        modelData.requests += requests
        modelMap.set(model, modelData)
      }

      const estimatedCostUsd = response.data.current_usage_usd || 0

      // Convert maps to arrays
      const dailyUsage: OpenAIUsageDetail[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          tokens: data.tokens,
          requests: data.requests,
          costUsd: 0, // We don't have per-day cost breakdown
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Estimate cost per model based on token proportion
      const usageByModel: OpenAIUsageByModel[] = Array.from(modelMap.entries())
        .map(([model, data]) => ({
          model: this.formatModelName(model),
          tokens: data.tokens,
          requests: data.requests,
          costUsd: totalTokens > 0 ? (data.tokens / totalTokens) * estimatedCostUsd : 0,
        }))
        .sort((a, b) => b.tokens - a.tokens)

      return {
        totalTokens,
        totalRequests,
        estimatedCostUsd,
        configured: true,
        dailyUsage,
        usageByModel,
        startDate: startDateStr as string,
        endDate: endDateStr as string,
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          logger.error(
            'OpenAI API key không có quyền truy cập /v1/usage endpoint. Vui lòng sử dụng Admin API key từ https://platform.openai.com/settings/organization/admin-keys',
          )
        } else {
          logger.error('Failed to fetch detailed OpenAI usage:', {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
          })
        }
      } else {
        logger.error('Failed to fetch detailed OpenAI usage:', error)
      }

      return {
        totalTokens: 0,
        totalRequests: 0,
        estimatedCostUsd: 0,
        configured: true,
        dailyUsage: [],
        usageByModel: [],
        startDate: startDate.toISOString().split('T')[0] as string,
        endDate: endDate.toISOString().split('T')[0] as string,
      }
    }
  }

  /**
   * Format model/operation name for display
   */
  private formatModelName(operation: string): string {
    const mapping: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'whisper-1': 'Whisper (STT)',
      'tts-1': 'TTS',
      'tts-1-hd': 'TTS HD',
      'dall-e-3': 'DALL-E 3',
      'dall-e-2': 'DALL-E 2',
    }

    return mapping[operation] || operation
  }
}
