export type Role = 'USER' | 'ADMIN'

export type SubscriptionPlanId = 'FREE' | 'TRIAL' | 'PREMIUM' | 'CLASSROOM'

export interface TrialStatus {
  hasUsedTrial: boolean
  isOnTrial: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  daysRemaining: number
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  durationDays: number
  price: number
  pricePerMonth: number
  isActive: boolean
}

export interface Subscription {
  id: string
  planId: SubscriptionPlanId
  planName?: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startDate: string
  endDate: string
  daysRemaining?: number | null
  plan?: SubscriptionPlan
}

export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: Role
  isPremium: boolean
  premiumUntil: string | null
  hasUsedTrial: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  createdAt: string
  subscriptions?: Subscription[]
  trialStatus?: TrialStatus
}

export interface SendOtpPayload {
  email: string
}
