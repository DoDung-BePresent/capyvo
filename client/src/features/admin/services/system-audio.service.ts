import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { SystemAudio, SystemAudioKey } from '../types'

export const systemAudioService = {
  getAll: async (): Promise<SystemAudio[]> => {
    const { data } = await axiosInstance.get<ApiResponse<SystemAudio[]>>('/system-audio')
    return data.data
  },

  uploadAudio: async (key: SystemAudioKey, file: File): Promise<SystemAudio> => {
    const form = new FormData()
    form.append('audio', file)
    const { data } = await axiosInstance.patch<ApiResponse<SystemAudio>>(
      `/system-audio/${key}/audio`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}
