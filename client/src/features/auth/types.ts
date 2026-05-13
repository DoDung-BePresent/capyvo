export type Role = 'USER' | 'ADMIN'

export type SubscriptionPlanId = 'BASIC' | 'PREMIUM' | 'CLASSROOM'

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
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startDate: string
  endDate: string
  plan: SubscriptionPlan
}

export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: Role
  isPremium: boolean
  premiumUntil: string | null
  createdAt: string
  subscriptions?: Subscription[]
}

export interface SendOtpPayload {
  email: string
}
