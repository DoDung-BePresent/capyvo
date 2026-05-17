import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { openaiUsageService } from '../services/openai-usage.service'

export function useOpenAIUsage(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.openaiUsage.detailed(startDate, endDate),
    queryFn: () => openaiUsageService.getDetailedUsage(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
