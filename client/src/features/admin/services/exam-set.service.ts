import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type {
  ExamSet,
  ExamSetWithQuestions,
  CreateExamSetPayload,
  UpdateExamSetPayload,
} from '../types'
import type { Question } from '../types'

export const examSetService = {
  getAll: async (): Promise<ExamSet[]> => {
    const { data } = await axiosInstance.get<ApiResponse<ExamSet[]>>('/exam-sets')
    return data.data
  },

  getById: async (id: string): Promise<ExamSetWithQuestions> => {
    const { data } = await axiosInstance.get<ApiResponse<ExamSetWithQuestions>>(`/exam-sets/${id}`)
    return data.data
  },

  create: async (payload: CreateExamSetPayload): Promise<ExamSet> => {
    const { data } = await axiosInstance.post<ApiResponse<ExamSet>>('/exam-sets', payload)
    return data.data
  },

  update: async (id: string, payload: UpdateExamSetPayload): Promise<ExamSet> => {
    const { data } = await axiosInstance.put<ApiResponse<ExamSet>>(`/exam-sets/${id}`, payload)
    return data.data
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/exam-sets/${id}`)
  },

  assignQuestion: async (examSetId: string, questionId: string): Promise<Question> => {
    const { data } = await axiosInstance.post<ApiResponse<Question>>(
      `/exam-sets/${examSetId}/assign`,
      { questionId },
    )
    return data.data
  },

  unassignQuestion: async (examSetId: string, questionId: string): Promise<Question> => {
    const { data } = await axiosInstance.post<ApiResponse<Question>>(
      `/exam-sets/${examSetId}/unassign`,
      { questionId },
    )
    return data.data
  },

  getPoolQuestions: async (questionNumber: number): Promise<Question[]> => {
    const { data } = await axiosInstance.get<ApiResponse<Question[]>>('/exam-sets/pool', {
      params: { questionNumber },
    })
    return data.data
  },

  getPublished: async (): Promise<ExamSet[]> => {
    const { data } = await axiosInstance.get<ApiResponse<ExamSet[]>>('/exam-sets/published')
    return data.data
  },

  getPublishedById: async (id: string): Promise<ExamSetWithQuestions> => {
    const { data } = await axiosInstance.get<ApiResponse<ExamSetWithQuestions>>(
      `/exam-sets/${id}/take`,
    )
    return data.data
  },
}
