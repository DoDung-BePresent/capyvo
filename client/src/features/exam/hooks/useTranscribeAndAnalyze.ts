import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { AnalysisResult } from '@/features/exam/services/session.service'

interface TranscribeAndAnalyzeResult {
  transcript: string
  analysis: AnalysisResult
}

export function useTranscribeAndAnalyze(
  options?: UseMutationOptions<TranscribeAndAnalyzeResult, Error, string>,
) {
  return useMutation({
    mutationFn: async (responseId: string): Promise<TranscribeAndAnalyzeResult> => {
      const { data } = await axiosInstance.post<ApiResponse<TranscribeAndAnalyzeResult>>(
        `/responses/${responseId}/transcribe-analyze`,
      )
      return data.data
    },
    ...options,
  })
}
