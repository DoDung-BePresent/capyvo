import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { Topic, TopicWithCount } from '../types'

export const topicService = {
  /**
   * Get all topics with question counts, optionally filtered by partNumber
   * Validates: Requirements 8.2
   */
  getAll: async (partNumber?: number): Promise<TopicWithCount[]> => {
    const { data } = await axiosInstance.get<ApiResponse<TopicWithCount[]>>('/topics', {
      params: partNumber ? { partNumber } : undefined,
    })
    return data.data
  },

  /**
   * Create a new topic
   * Validates: Requirements 8.1
   */
  create: async (payload: {
    name: string
    partNumber: number
    description?: string
  }): Promise<Topic> => {
    const { data } = await axiosInstance.post<ApiResponse<Topic>>('/topics', payload)
    return data.data
  },

  /**
   * Update an existing topic
   * Validates: Requirements 8.3
   */
  update: async (id: string, payload: { name?: string; description?: string }): Promise<Topic> => {
    const { data } = await axiosInstance.patch<ApiResponse<Topic>>(`/topics/${id}`, payload)
    return data.data
  },

  /**
   * Delete a topic
   * Validates: Requirements 8.4
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/topics/${id}`)
  },

  /**
   * Assign a topic to multiple questions (bulk assignment)
   * Validates: Requirements 2.6
   */
  assignToQuestions: async (
    topicId: string,
    questionIds: string[],
  ): Promise<{ assigned: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ assigned: number }>>(
      `/topics/${topicId}/assign`,
      { questionIds },
    )
    return data.data
  },

  /**
   * Remove a topic from multiple questions (bulk unassignment)
   * Validates: Requirements 2.6
   */
  unassignFromQuestions: async (
    topicId: string,
    questionIds: string[],
  ): Promise<{ unassigned: number }> => {
    const { data } = await axiosInstance.delete<ApiResponse<{ unassigned: number }>>(
      `/topics/${topicId}/unassign`,
      { data: { questionIds } },
    )
    return data.data
  },
}
