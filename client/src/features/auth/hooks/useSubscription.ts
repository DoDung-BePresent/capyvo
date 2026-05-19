import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { subscriptionService } from '../services/subscription.service'

/**
 * Get available subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscription.plans(),
    queryFn: subscriptionService.getPlans,
    staleTime: Infinity,
  })
}

/**
 * Get current subscription with trial info
 */
export function useCurrentSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription.current(),
    queryFn: subscriptionService.getCurrent,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get subscription history
 */
export function useSubscriptionHistory() {
  return useQuery({
    queryKey: queryKeys.subscription.history(),
    queryFn: subscriptionService.getHistory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Helper hook to check if user is premium
 */
export function useIsPremium() {
  const { data } = useCurrentSubscription()
  return data?.isPremium ?? false
}

/**
 * Helper hook to check if user is on trial
 */
export function useIsOnTrial() {
  const { data } = useCurrentSubscription()
  return data?.trialStatus?.isOnTrial ?? false
}

/**
 * Helper hook to check if user is on FREE plan
 */
export function useIsFree() {
  const { data } = useCurrentSubscription()
  return data?.plan === 'FREE'
}
