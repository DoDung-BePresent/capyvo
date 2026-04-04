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
} from '../types'

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
