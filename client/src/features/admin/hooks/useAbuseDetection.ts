import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { abuseDetectionService } from '../services/abuse-detection.service'

export function useAbuseDetection(enabled = true) {
  return useQuery({
    queryKey: queryKeys.abuseDetection.detect(),
    queryFn: () => abuseDetectionService.detect(),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
