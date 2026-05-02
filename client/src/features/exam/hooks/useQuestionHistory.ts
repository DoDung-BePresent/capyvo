import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { responseService } from '@/features/exam/services/response.service'

export function useQuestionHistory(questionId: string | null) {
  return useQuery({
    queryKey: queryKeys.responses.questionHistory(questionId ?? ''),
    queryFn: () => responseService.getQuestionHistory(questionId!),
    enabled: !!questionId,
  })
}
