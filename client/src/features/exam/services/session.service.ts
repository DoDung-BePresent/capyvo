import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface ScoringCriteria {
  accuracy: number
  vocabulary: number
  grammar: number
  fluency: number
}

export interface AnalysisIssue {
  category: 'omission' | 'addition' | 'morphology' | 'pronunciation' | 'substitution' | 'order'
  original: string
  spoken: string
  note: string
}

export interface AnalysisResult {
  score: number
  criteria: ScoringCriteria
  issues: AnalysisIssue[]
  summary: string
}

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
  transcript: string | null
  pronunciationScore: AnalysisResult | null
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
  partNumber: number | null
  status: string
  startedAt: string
  completedAt: string | null
  examSet: { id: string; title: string }
  userResponses: ResponseItem[]
}

export const sessionService = {
  async createSession(
    examSetId: string,
    partNumber?: number | null,
  ): Promise<{ sessionId: string }> {
    const { data } = await axiosInstance.post<ApiResponse<{ sessionId: string }>>('/sessions', {
      examSetId,
      partNumber: partNumber ?? null,
    })
    return data.data
  },

  async completeSession(id: string): Promise<void> {
    await axiosInstance.patch(`/sessions/${id}/complete`)
  },

  async getMySessions(): Promise<SessionSummary[]> {
    const { data } = await axiosInstance.get<ApiResponse<SessionSummary[]>>('/sessions/my')
    return data.data
  },

  async getMySessionsBySet(
    examSetId: string,
    partNumber?: number | null,
  ): Promise<SessionSummary[]> {
    const params = new URLSearchParams({ examSetId: examSetId })
    if (partNumber != null) params.set('partNumber', String(partNumber))
    const { data } = await axiosInstance.get<ApiResponse<SessionSummary[]>>(
      `/sessions/my?${params.toString()}`,
    )
    return data.data
  },

  async getSessionDetail(id: string): Promise<SessionDetail> {
    const { data } = await axiosInstance.get<ApiResponse<SessionDetail>>(`/sessions/${id}`)
    return data.data
  },

  async getSetStats(
    examSetId: string,
    partNumber?: number | null,
  ): Promise<{ totalAttempts: number }> {
    const params = new URLSearchParams()
    if (partNumber != null) params.set('partNumber', String(partNumber))
    const qs = params.toString() ? `?${params.toString()}` : ''
    const { data } = await axiosInstance.get<ApiResponse<{ totalAttempts: number }>>(
      `/sessions/stats/${encodeURIComponent(examSetId)}${qs}`,
    )
    return data.data
  },

  async getCompletedSetIds(partNumber?: number | null): Promise<string[]> {
    const params = new URLSearchParams()
    if (partNumber != null) params.set('partNumber', String(partNumber))
    const qs = params.toString() ? `?${params.toString()}` : ''
    const { data } = await axiosInstance.get<ApiResponse<string[]>>(
      `/sessions/my/completed-set-ids${qs}`,
    )
    return data.data
  },
}
