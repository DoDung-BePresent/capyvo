import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { TrialStatus } from '../types'

interface TrialSettingsResponse {
  trialDays: number
}

interface UpdateTrialDaysPayload {
  days: number
}

export const trialService = {
  /**
   * Get trial status for current user
   */
  getStatus: async (): Promise<TrialStatus> => {
    const { data } = await axiosInstance.get<ApiResponse<TrialStatus>>('/trial/status')
    return data.data
  },

  /**
   * Get trial settings (admin only)
   */
  getSettings: async (): Promise<TrialSettingsResponse> => {
    const { data } =
      await axiosInstance.get<ApiResponse<TrialSettingsResponse>>('/trial/admin/settings')
    return data.data
  },

  /**
   * Update trial days (admin only)
   */
  updateSettings: async (payload: UpdateTrialDaysPayload): Promise<TrialSettingsResponse> => {
    const { data } = await axiosInstance.put<ApiResponse<TrialSettingsResponse>>(
      '/trial/admin/settings',
      payload,
    )
    return data.data
  },

  /**
   * Manually check expired trials (admin only)
   */
  checkExpired: async (): Promise<{ revokedCount: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ revokedCount: number }>>(
      '/trial/admin/check-expired',
    )
    return data.data
  },
}
