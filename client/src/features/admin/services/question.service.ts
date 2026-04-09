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
} from '../types'

export const questionService = {
  getByPart: async (partNumber: number): Promise<Question[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Question[]>>('/questions', {
      params: { partNumber },
    })
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
      questions: [
        { questionNumber: 5, questionText: payload.q5 },
        { questionNumber: 6, questionText: payload.q6 },
        { questionNumber: 7, questionText: payload.q7 },
      ],
    }
    const { data } = await axiosInstance.post<ApiResponse<Question[]>>('/questions/part/3', body)
    return data.data
  },

  createPart4: async (payload: Part4FormValues): Promise<Question[]> => {
    const body = {
      contextText: payload.contextText,
      imageUrl: payload.imageUrl,
      questions: [
        { questionNumber: 8, questionText: payload.q8 },
        { questionNumber: 9, questionText: payload.q9 },
        { questionNumber: 10, questionText: payload.q10 },
      ],
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
}
