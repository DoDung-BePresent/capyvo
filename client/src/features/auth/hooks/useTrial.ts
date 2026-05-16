import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { trialService } from '../services/trial.service'

/**
 * Get trial status for current user
 */
export function useTrialStatus() {
  return useQuery({
    queryKey: queryKeys.trial.status(),
    queryFn: trialService.getStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get trial settings (admin only)
 */
export function useTrialSettings() {
  return useQuery({
    queryKey: queryKeys.trial.settings(),
    queryFn: trialService.getSettings,
    staleTime: Infinity,
  })
}

/**
 * Update trial days (admin only)
 */
export function useUpdateTrialSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: trialService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trial.settings() })
    },
  })
}

/**
 * Manually check expired trials (admin only)
 */
export function useCheckExpiredTrials() {
  return useMutation({
    mutationFn: trialService.checkExpired,
  })
}
