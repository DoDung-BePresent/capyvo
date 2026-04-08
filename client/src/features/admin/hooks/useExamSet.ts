import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '@/lib/query-keys'
import { examSetService } from '../services/exam-set.service'
import type { CreateExamSetPayload, UpdateExamSetPayload } from '../types'

export function useGetExamSets() {
  return useQuery({
    queryKey: queryKeys.examSets.list(),
    queryFn: examSetService.getAll,
  })
}

export function useGetExamSet(id: string) {
  return useQuery({
    queryKey: queryKeys.examSets.detail(id),
    queryFn: () => examSetService.getById(id),
    enabled: !!id,
  })
}

export function useCreateExamSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExamSetPayload) => examSetService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.list() })
      message.success('Tạo bộ đề thành công!')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra')
    },
  })
}

export function useUpdateExamSet(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateExamSetPayload) => examSetService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.detail(id) })
      message.success('Đã cập nhật bộ đề')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra')
    },
  })
}

export function useDeleteExamSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: examSetService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.list() })
      message.success('Đã xóa bộ đề')
    },
    onError: () => {
      message.error('Xóa thất bại')
    },
  })
}

export function useAssignQuestion(examSetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => examSetService.assignQuestion(examSetId, questionId),
    onSuccess: (_data, _v, _ctx) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.detail(examSetId) })
      message.success('Đã gán câu hỏi vào bộ đề')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Gán thất bại')
    },
  })
}

export function useUnassignQuestion(examSetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => examSetService.unassignQuestion(examSetId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSets.detail(examSetId) })
      message.success('Đã gỡ câu hỏi khỏi bộ đề')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Gỡ thất bại')
    },
  })
}

export function useGetPoolQuestions(questionNumber: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.questions.pool(questionNumber),
    queryFn: () => examSetService.getPoolQuestions(questionNumber),
    enabled,
  })
}
