import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export const responseService = {
  saveAudio: async (
    sessionId: string,
    questionId: string,
    blob: Blob,
  ): Promise<{ audioUrl: string }> => {
    const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm'
    const form = new FormData()
    form.append('audio', blob, `response-${questionId}.${ext}`)
    form.append('questionId', questionId)
    form.append('sessionId', sessionId)
    const { data } = await axiosInstance.post<ApiResponse<{ audioUrl: string }>>(
      '/responses/audio',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}
