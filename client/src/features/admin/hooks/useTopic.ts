import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { queryKeys } from '@/lib/query-keys'
import { topicService } from '../services/topic.service'

/**
 * Hook to fetch all topics with question counts, optionally filtered by partNumber
 * Validates: Requirements 8.2
 */
export function useTopics(partNumber?: number) {
  return useQuery({
    queryKey: partNumber ? ['topics', { partNumber }] : queryKeys.topics.list(),
    queryFn: () => topicService.getAll(partNumber),
  })
}

/**
 * Hook to create a new topic
 * Validates: Requirements 8.1
 */
export function useCreateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; partNumber: number; description?: string }) =>
      topicService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      message.success('Tạo chủ đề thành công!')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra')
    },
  })
}

/**
 * Hook to update an existing topic
 * Validates: Requirements 8.3
 */
export function useUpdateTopic(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name?: string; description?: string }) =>
      topicService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      message.success('Đã cập nhật chủ đề')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Có lỗi xảy ra')
    },
  })
}

/**
 * Hook to delete a topic
 * Validates: Requirements 8.4
 */
export function useDeleteTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: topicService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      message.success('Đã xóa chủ đề')
    },
    onError: (err: Error) => {
      message.error(err.message || 'Xóa thất bại')
    },
  })
}

/**
 * Hook to assign a topic to multiple questions (bulk assignment)
 * Validates: Requirements 2.6
 */
export function useAssignTopic(topicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionIds: string[]) => topicService.assignToQuestions(topicId, questionIds),
    onSuccess: (data) => {
      // Invalidate topics list to update question counts
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      // Invalidate all question queries to reflect new topic assignments
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      message.success(`Đã gán chủ đề cho ${data.assigned} câu hỏi`)
    },
    onError: (err: Error) => {
      message.error(err.message || 'Gán thất bại')
    },
  })
}

/**
 * Hook to remove a topic from multiple questions (bulk unassignment)
 * Validates: Requirements 2.6
 */
export function useUnassignTopic(topicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionIds: string[]) => topicService.unassignFromQuestions(topicId, questionIds),
    onSuccess: (data) => {
      // Invalidate topics list to update question counts
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
      // Invalidate all question queries to reflect removed topic assignments
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      message.success(`Đã gỡ chủ đề khỏi ${data.unassigned} câu hỏi`)
    },
    onError: (err: Error) => {
      message.error(err.message || 'Gỡ thất bại')
    },
  })
}
