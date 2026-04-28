import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { questionService } from '@/features/admin/services/question.service'
import type { PartNumber } from '@/features/admin/types'

/**
 * Hook để lấy tất cả câu hỏi của một part
 * Trả về flat list questions với examSetId
 */
export function usePartQuestions(partNumber: PartNumber) {
  return useQuery({
    queryKey: queryKeys.questions.byPart(partNumber),
    queryFn: () => questionService.getQuestionsByPart(partNumber),
    enabled: !!partNumber && partNumber >= 1 && partNumber <= 5,
  })
}

/**
 * Hook để lấy danh sách exam sets của một part (cho filter)
 */
export function usePartExamSets(partNumber: PartNumber) {
  return useQuery({
    queryKey: queryKeys.questions.examSetsByPart(partNumber),
    queryFn: () => questionService.getExamSetsByPart(partNumber),
    enabled: !!partNumber && partNumber >= 1 && partNumber <= 5,
  })
}
