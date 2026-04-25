import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { AnalysisResult, SessionDetail } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'

interface TranscribeAndAnalyzeResult {
  transcript: string
  analysis: AnalysisResult
}

export function useTranscribeAndAnalyze(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (responseId: string): Promise<TranscribeAndAnalyzeResult> => {
      const { data } = await axiosInstance.post<ApiResponse<TranscribeAndAnalyzeResult>>(
        `/responses/${responseId}/transcribe-analyze`,
      )
      return data.data
    },
    onSuccess: ({ transcript, analysis }, responseId) => {
      queryClient.setQueryData(
        queryKeys.practiceSessions.detail(sessionId),
        (old: SessionDetail | undefined) => {
          if (!old) return old
          return {
            ...old,
            userResponses: old.userResponses.map((r) =>
              r.id === responseId ? { ...r, transcript, pronunciationScore: analysis } : r,
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
  })
}
