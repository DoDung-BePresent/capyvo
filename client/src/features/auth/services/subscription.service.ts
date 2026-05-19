import axiosInstance from '@/lib/axios'
import type { SubscriptionPlan, Subscription, TrialStatus } from '../types'

interface CurrentSubscriptionResponse {
  subscription: Subscription | null
  plan: 'FREE' | 'TRIAL' | 'PREMIUM' | 'CLASSROOM'
  isPremium: boolean
  trialStatus: TrialStatus | null
}

export const subscriptionService = {
  /**
   * Get available subscription plans (excludes FREE)
   */
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await axiosInstance.get<{ plans: SubscriptionPlan[] }>('/subscription/plans')
    return data.plans
  },

  /**
   * Get current subscription with trial info
   */
  getCurrent: async (): Promise<CurrentSubscriptionResponse> => {
    const { data } = await axiosInstance.get<CurrentSubscriptionResponse>('/subscription/current')
    return data
  },

  /**
   * Get subscription history
   */
  getHistory: async (): Promise<Subscription[]> => {
    const { data } = await axiosInstance.get<{ subscriptions: Subscription[] }>(
      '/subscription/history',
    )
    return data.subscriptions
  },
}
