import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { AnalysisResult } from '@/features/exam/services/session.service'

interface TranscribeAndAnalyzeResult {
  transcript: string
  analysis: AnalysisResult
}

interface TranscribeAndAnalyzeParams {
  responseId: string
  partNumber: number
}

export function useTranscribeAndAnalyze(
  options?: UseMutationOptions<TranscribeAndAnalyzeResult, Error, TranscribeAndAnalyzeParams>,
) {
  return useMutation({
    mutationFn: async ({
      responseId,
      partNumber,
    }: TranscribeAndAnalyzeParams): Promise<TranscribeAndAnalyzeResult> => {
      const { data } = await axiosInstance.post<ApiResponse<TranscribeAndAnalyzeResult>>(
        `/responses/${responseId}/transcribe-analyze`,
        { partNumber },
      )
      return data.data
    },
    ...options,
  })
}
