import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface ActivityData {
  activityByDate: Record<string, number>
  currentStreak: number
  longestStreak: number
}

export const activityService = {
  async getUserActivity(): Promise<ActivityData> {
    const { data } = await axiosInstance.get<ApiResponse<ActivityData>>('/activity/my')
    return data.data
  },
}
