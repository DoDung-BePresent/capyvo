import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '@/lib/query-keys'
import { questionService } from '../services/question.service'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
  UpdateQuestionPayload,
  QuestionType,
  QuestionStatus,
} from '../types'

/**
 * Hook to fetch questions with optional filters
 * Supports filtering by partNumber, type, status, topicId, examSetId, and search
 */
export function useQuestions(filters?: {
  partNumber?: number
  type?: QuestionType
  status?: QuestionStatus
  topicId?: string
  examSetId?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: () => questionService.getAll(filters),
  })
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useQuestions({ partNumber }) instead
 */
export function useGetQuestions(partNumber: number) {
  return useQuery({
    queryKey: queryKeys.questions.byPart(partNumber),
    queryFn: () => questionService.getByPart(partNumber),
  })
}

function useCreateQuestion<T>(partNumber: number, mutateFn: (payload: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mutateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.byPart(partNumber) })
      message.success('Thêm câu hỏi thành công!')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại')
    },
  })
}

export const useCreatePart1 = () =>
  useCreateQuestion<Part1FormValues>(1, questionService.createPart1)

export const useCreatePart2 = () =>
  useCreateQuestion<Part2FormValues>(2, questionService.createPart2)

export const useCreatePart3 = () =>
  useCreateQuestion<Part3FormValues>(3, questionService.createPart3)

export const useCreatePart4 = () =>
  useCreateQuestion<Part4FormValues>(4, questionService.createPart4)

export const useCreatePart5 = () =>
  useCreateQuestion<Part5FormValues>(5, questionService.createPart5)

export function useDeleteQuestion(partNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: questionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.byPart(partNumber) })
      message.success('Đã xóa câu hỏi')
    },
    onError: () => {
      message.error('Xóa thất bại')
    },
  })
}

export function useUpdateQuestion(partNumber: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuestionPayload }) =>
      questionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.byPart(partNumber) })
      message.success('Cập nhật câu hỏi thành công!')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại')
    },
  })
}

/**
 * Hook to update a single question's status
 * Invalidates all question queries to ensure UI consistency
 */
export function useUpdateQuestionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuestionStatus }) =>
      questionService.updateStatus(id, status),
    onSuccess: (updatedQuestion) => {
      // Invalidate all question queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.byPart(updatedQuestion.partNumber),
      })
      message.success('Cập nhật trạng thái thành công!')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại')
    },
  })
}

/**
 * Hook to bulk update status for multiple questions
 * Invalidates all question queries to ensure UI consistency
 */
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ questionIds, status }: { questionIds: string[]; status: QuestionStatus }) =>
      questionService.bulkUpdateStatus(questionIds, status),
    onSuccess: (result) => {
      // Invalidate all question queries to ensure consistency across all views
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      // Also invalidate topics queries as question counts may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      message.success(`Đã cập nhật ${result.updated} câu hỏi thành công!`)
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại')
    },
  })
}
