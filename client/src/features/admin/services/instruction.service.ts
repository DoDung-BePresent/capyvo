import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { PartInstruction } from '../types'

export const instructionService = {
  getAll: async (): Promise<PartInstruction[]> => {
    const { data } = await axiosInstance.get<ApiResponse<PartInstruction[]>>('/part-instructions')
    return data.data
  },

  uploadAudio: async (partNumber: number, file: File): Promise<PartInstruction> => {
    const form = new FormData()
    form.append('audio', file)
    const { data } = await axiosInstance.patch<ApiResponse<PartInstruction>>(
      `/part-instructions/${partNumber}/audio`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}
