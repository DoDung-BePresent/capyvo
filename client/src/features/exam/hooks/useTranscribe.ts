import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { SessionDetail } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'

export function useTranscribe(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (responseId: string): Promise<string> => {
      const { data } = await axiosInstance.post<ApiResponse<{ transcript: string }>>(
        `/responses/${responseId}/transcribe`,
      )
      return data.data.transcript
    },
    // Optimistically update the session detail cache so the UI reflects immediately
    onSuccess: (transcript, responseId) => {
      queryClient.setQueryData(
        queryKeys.practiceSessions.detail(sessionId),
        (old: SessionDetail | undefined) => {
          if (!old) return old
          return {
            ...old,
            userResponses: old.userResponses.map((r) =>
              r.id === responseId ? { ...r, transcript } : r,
            ),
          }
        },
      )
      // Refetch /me to update subscription status in header
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
  })
}
