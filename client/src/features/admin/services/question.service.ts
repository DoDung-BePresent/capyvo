import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type {
  Question,
  PracticeSet,
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
  UpdateQuestionPayload,
  ExamSetWithQuestions,
  QuestionType,
  QuestionStatus,
  QuestionWithTopics,
  QuestionSet,
  TopicWithCount,
} from '../types'

export const questionService = {
  /**
   * Get all questions with optional filters
   */
  getAll: async (filters?: {
    partNumber?: number
    type?: QuestionType
    status?: QuestionStatus
    topicId?: string
    examSetId?: string
    search?: string
  }): Promise<QuestionWithTopics[]> => {
    const { data } = await axiosInstance.get<ApiResponse<QuestionWithTopics[]>>('/questions', {
      params: filters,
    })
    return data.data
  },

  getByPart: async (partNumber: number): Promise<Question[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Question[]>>('/questions', {
      params: { partNumber },
    })
    return data.data
  },

  /**
   * Lấy exam set by ID với tất cả questions (cho full test)
   */
  getExamSetById: async (examSetId: string): Promise<ExamSetWithQuestions> => {
    const { data } = await axiosInstance.get<ApiResponse<ExamSetWithQuestions>>(
      `/exam-sets/${examSetId}/take`,
    )
    return data.data
  },

  /**
   * Lấy tất cả câu hỏi của một part (flat list với examSetId và topics)
   * Tối ưu cho UI grid questions
   */
  getQuestionsByPart: async (
    partNumber: number,
  ): Promise<(QuestionWithTopics & { examSetId: string; examSetTitle: string })[]> => {
    const { data } = await axiosInstance.get<
      ApiResponse<(QuestionWithTopics & { examSetId: string; examSetTitle: string })[]>
    >(`/questions/part/${partNumber}/all`)
    return data.data
  },

  /**
   * Lấy danh sách exam sets của một part (cho filter sidebar)
   */
  getExamSetsByPart: async (
    partNumber: number,
  ): Promise<{ id: string; title: string; questionCount: number }[]> => {
    const { data } = await axiosInstance.get<
      ApiResponse<{ id: string; title: string; questionCount: number }[]>
    >(`/questions/part/${partNumber}/exam-sets`)
    return data.data
  },

  /**
   * Lấy danh sách topics của một part với số lượng câu hỏi published
   */
  getTopicsByPart: async (partNumber: number): Promise<TopicWithCount[]> => {
    const { data } = await axiosInstance.get<ApiResponse<TopicWithCount[]>>(
      `/questions/part/${partNumber}/topics`,
    )
    return data.data
  },

  getPracticeSets: async (partNumber: number): Promise<PracticeSet[]> => {
    const { data } = await axiosInstance.get<ApiResponse<PracticeSet[]>>(
      '/questions/practice-sets',
      {
        params: { partNumber },
      },
    )
    return data.data
  },

  getByPartAndSet: async (partNumber: number, examSetId: string): Promise<Question[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Question[]>>('/questions', {
      params: { partNumber, examSetId },
    })
    return data.data
  },

  createPart1: async (payload: Part1FormValues): Promise<Question> => {
    const { data } = await axiosInstance.post<ApiResponse<Question>>('/questions/part/1', payload)
    return data.data
  },

  createPart2: async (payload: Part2FormValues): Promise<Question> => {
    const { data } = await axiosInstance.post<ApiResponse<Question>>('/questions/part/2', payload)
    return data.data
  },

  createPart3: async (payload: Part3FormValues): Promise<Question[]> => {
    const body = {
      contextText: payload.contextText,
      contextAudioUrl: payload.contextAudioUrl,
      questions: [
        { questionNumber: 5, questionText: payload.q5, questionAudioUrl: payload.q5AudioUrl },
        { questionNumber: 6, questionText: payload.q6, questionAudioUrl: payload.q6AudioUrl },
        { questionNumber: 7, questionText: payload.q7, questionAudioUrl: payload.q7AudioUrl },
      ],
      type: payload.type,
      status: payload.status,
      topicIds: payload.topicIds,
    }
    const { data } = await axiosInstance.post<ApiResponse<Question[]>>('/questions/part/3', body)
    return data.data
  },

  createPart4: async (payload: Part4FormValues): Promise<Question[]> => {
    const body = {
      contextText: payload.contextText,
      contextAudioUrl: payload.contextAudioUrl,
      imageUrl: payload.imageUrl,
      imageContext: payload.imageContext,
      questions: [
        { questionNumber: 8, questionText: payload.q8, questionAudioUrl: payload.q8AudioUrl },
        { questionNumber: 9, questionText: payload.q9, questionAudioUrl: payload.q9AudioUrl },
        { questionNumber: 10, questionText: payload.q10, questionAudioUrl: payload.q10AudioUrl },
      ],
      type: payload.type,
      status: payload.status,
      topicIds: payload.topicIds,
    }
    const { data } = await axiosInstance.post<ApiResponse<Question[]>>('/questions/part/4', body)
    return data.data
  },

  createPart5: async (payload: Part5FormValues): Promise<Question> => {
    const { data } = await axiosInstance.post<ApiResponse<Question>>('/questions/part/5', payload)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/questions/${id}`)
  },

  update: async (id: string, payload: UpdateQuestionPayload): Promise<Question> => {
    const { data } = await axiosInstance.patch<ApiResponse<Question>>(`/questions/${id}`, payload)
    return data.data
  },

  /**
   * Update question status
   */
  updateStatus: async (id: string, status: QuestionStatus): Promise<Question> => {
    const { data } = await axiosInstance.patch<ApiResponse<Question>>(`/questions/${id}/status`, {
      status,
    })
    return data.data
  },

  /**
   * Bulk update question status
   */
  bulkUpdateStatus: async (
    questionIds: string[],
    status: QuestionStatus,
  ): Promise<{ updated: number }> => {
    const { data } = await axiosInstance.patch<ApiResponse<{ updated: number }>>(
      '/questions/bulk/status',
      { questionIds, status },
    )
    return data.data
  },

  analyzeImage: async (imageUrl: string): Promise<string> => {
    const { data } = await axiosInstance.post<ApiResponse<{ context: string }>>(
      '/questions/analyze-image',
      { imageUrl },
    )
    return data.data.context
  },

  /**
   * Get questions grouped by setId (Part 3 & 4) or individual (Part 1, 2, 5)
   */
  getQuestionsGrouped: async (filters: {
    partNumber: number
    type?: QuestionType
    status?: QuestionStatus
    topicId?: string
    search?: string
  }): Promise<QuestionWithTopics[] | QuestionSet[]> => {
    const { data } = await axiosInstance.get<ApiResponse<QuestionWithTopics[] | QuestionSet[]>>(
      '/questions/grouped',
      {
        params: filters,
      },
    )
    return data.data
  },

  /**
   * Update entire question set (Part 3 or 4)
   */
  updateQuestionSet: async (
    setId: string,
    payload: Part3FormValues | Part4FormValues,
  ): Promise<Question[]> => {
    let body: unknown

    if ('q5' in payload) {
      // Part 3
      body = {
        contextText: payload.contextText,
        contextAudioUrl: payload.contextAudioUrl,
        questions: [
          { questionNumber: 5, questionText: payload.q5, questionAudioUrl: payload.q5AudioUrl },
          { questionNumber: 6, questionText: payload.q6, questionAudioUrl: payload.q6AudioUrl },
          { questionNumber: 7, questionText: payload.q7, questionAudioUrl: payload.q7AudioUrl },
        ],
        type: payload.type,
        status: payload.status,
        topicIds: payload.topicIds,
      }
    } else {
      // Part 4
      body = {
        contextText: payload.contextText,
        contextAudioUrl: payload.contextAudioUrl,
        imageUrl: payload.imageUrl,
        imageContext: payload.imageContext,
        questions: [
          { questionNumber: 8, questionText: payload.q8, questionAudioUrl: payload.q8AudioUrl },
          { questionNumber: 9, questionText: payload.q9, questionAudioUrl: payload.q9AudioUrl },
          { questionNumber: 10, questionText: payload.q10, questionAudioUrl: payload.q10AudioUrl },
        ],
        type: payload.type,
        status: payload.status,
        topicIds: payload.topicIds,
      }
    }

    const { data } = await axiosInstance.patch<ApiResponse<Question[]>>(
      `/questions/set/${setId}`,
      body,
    )
    return data.data
  },

  /**
   * Delete entire question set (Part 3 or 4)
   */
  deleteQuestionSet: async (setId: string): Promise<{ deleted: number }> => {
    const { data } = await axiosInstance.delete<ApiResponse<{ deleted: number }>>(
      `/questions/set/${setId}`,
    )
    return data.data
  },
}
