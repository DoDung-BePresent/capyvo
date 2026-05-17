import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { queryKeys } from '@/lib/query-keys'

export interface DashboardOverview {
  totalUsers: number
  newUsersThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  totalPayments: number
  totalSessions: number
  sessionsThisMonth: number
  totalQuestions: number
}

export interface OpenAIStats {
  totalTokens: number
  totalRequests: number
  estimatedCostUsd: number
  configured: boolean
}

export interface QuestionByPart {
  part: string
  count: number
}

export interface TokenPackageStat {
  label: string
  count: number
  totalRevenue: number
}

export interface DayStat {
  date: string
  revenue: number
}

export interface SessionDayStat {
  date: string
  count: number
}

export interface RecentPayment {
  id: string
  amount: number
  tokenAmount: number | null
  paidAt: string | null
  userEmail: string
  userFullName: string | null
}

export interface AdminDashboardStats {
  overview: DashboardOverview
  openai: OpenAIStats
  questionsByPart: QuestionByPart[]
  paymentDistribution: TokenPackageStat[]
  revenueSeries: DayStat[]
  sessionSeries: SessionDayStat[]
  recentPayments: RecentPayment[]
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard.stats(),
    queryFn: async () => {
      const res = await axiosInstance.get<{ success: boolean; data: AdminDashboardStats }>(
        '/admin/dashboard/stats',
      )
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
  })
}
