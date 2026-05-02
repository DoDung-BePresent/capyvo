import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { AnalysisResult, SessionDetail } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'

interface AnalyzeParams {
  responseId: string
  partNumber: number
}

export function useAnalyze(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ responseId, partNumber }: AnalyzeParams): Promise<AnalysisResult> => {
      const { data } = await axiosInstance.post<ApiResponse<{ analysis: AnalysisResult }>>(
        `/responses/${responseId}/analyze`,
        { partNumber },
      )
      return data.data.analysis
    },
    onSuccess: (analysis, { responseId }) => {
      queryClient.setQueryData(
        queryKeys.practiceSessions.detail(sessionId),
        (old: SessionDetail | undefined) => {
          if (!old) return old
          return {
            ...old,
            userResponses: old.userResponses.map((r) =>
              r.id === responseId ? { ...r, pronunciationScore: analysis } : r,
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
  })
}
