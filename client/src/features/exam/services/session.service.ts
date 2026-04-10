import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface SessionSummary {
  id: string
  examSetId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  startedAt: string
  completedAt: string | null
  _count: { userResponses: number }
  examSet: { title: string }
}

export interface ResponseItem {
  id: string
  questionId: string
  audioUrl: string | null
  question: {
    id: string
    partNumber: number
    questionNumber: number
    contentText: string | null
    contextText: string | null
    questionText: string | null
    imageUrls: string[]
    prepTimeSeconds: number
    responseTimeSeconds: number
  }
}

export interface SessionDetail {
  id: string
  examSetId: string
  status: string
  startedAt: string
  completedAt: string | null
  examSet: { id: string; title: string }
  userResponses: ResponseItem[]
}

export const sessionService = {
  async createSession(examSetId: string): Promise<{ sessionId: string }> {
    const { data } = await axiosInstance.post<ApiResponse<{ sessionId: string }>>('/sessions', {
      examSetId,
    })
    return data.data
  },

  async completeSession(id: string): Promise<void> {
    await axiosInstance.patch(`/sessions/${id}/complete`)
  },

  async getMySessionsBySet(examSetId: string): Promise<SessionSummary[]> {
    const { data } = await axiosInstance.get<ApiResponse<SessionSummary[]>>(
      `/sessions/my?examSetId=${encodeURIComponent(examSetId)}`,
    )
    return data.data
  },

  async getSessionDetail(id: string): Promise<SessionDetail> {
    const { data } = await axiosInstance.get<ApiResponse<SessionDetail>>(`/sessions/${id}`)
    return data.data
  },

  async getSetStats(examSetId: string): Promise<{ totalAttempts: number }> {
    const { data } = await axiosInstance.get<ApiResponse<{ totalAttempts: number }>>(
      `/sessions/stats/${encodeURIComponent(examSetId)}`,
    )
    return data.data
  },

  async getCompletedSetIds(): Promise<string[]> {
    const { data } = await axiosInstance.get<ApiResponse<string[]>>(
      '/sessions/my/completed-set-ids',
    )
    return data.data
  },
}
