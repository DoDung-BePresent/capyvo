import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { Question } from '@/shared/types/domain'

/**
 * Topic interface for practice page
 */
export interface Topic {
  id: string
  name: string
  partNumber: number
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * Topic with question count for filtering
 */
export interface TopicWithCount extends Topic {
  questionCount: number
}

/**
 * Question with topics for practice page
 */
export interface QuestionWithTopics extends Question {
  topics: Topic[]
}

/**
 * Question service for exam/practice features
 * This service fetches ONLY PUBLISHED questions for end users
 */
export const questionService = {
  /**
   * Get all published questions for a part with optional topic filtering
   * Only returns PUBLISHED questions with their topics
   *
   * @param partNumber - Part number (1-5)
   * @param topicId - Optional topic ID to filter by
   * @returns Array of published questions with topics
   */
  getByPart: async (partNumber: number, topicId?: string): Promise<QuestionWithTopics[]> => {
    const params: { partNumber: number; topicId?: string } = { partNumber }
    if (topicId) {
      params.topicId = topicId
    }

    const { data } = await axiosInstance.get<ApiResponse<QuestionWithTopics[]>>(
      `/questions/part/${partNumber}/all`,
      { params },
    )
    return data.data
  },

  /**
   * Get topics for a specific part with published question counts
   * Only returns topics that have at least one PUBLISHED question for the part
   * Topics are sorted alphabetically by name
   *
   * @param partNumber - Part number (1-5)
   * @returns Array of topics with question counts
   */
  getTopicsByPart: async (partNumber: number): Promise<TopicWithCount[]> => {
    const { data } = await axiosInstance.get<ApiResponse<TopicWithCount[]>>(
      `/questions/part/${partNumber}/topics`,
    )
    return data.data
  },
}
