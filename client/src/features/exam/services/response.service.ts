import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import type { AnalysisResult } from './session.service'

export const responseService = {
  checkSubscription: async () => {
    const { data } = await axiosInstance.get<
      ApiResponse<{
        hasAccess: boolean
        isPremium: boolean
        plan: 'BASIC' | 'PREMIUM' | null
        daysRemaining: number | null
      }>
    >('/responses/check-subscription')
    return data.data
  },

  saveAudio: async (
    sessionId: string,
    questionId: string,
    blob: Blob,
  ): Promise<{ audioUrl: string; responseId: string }> => {
    const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm'
    const form = new FormData()
    form.append('audio', blob, `response-${questionId}.${ext}`)
    form.append('questionId', questionId)
    form.append('sessionId', sessionId)
    const { data } = await axiosInstance.post<
      ApiResponse<{ audioUrl: string; responseId: string }>
    >('/responses/audio', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data
  },

  transcribe: async (responseId: string): Promise<string> => {
    const { data } = await axiosInstance.post<ApiResponse<{ transcript: string }>>(
      `/responses/${responseId}/transcribe`,
    )
    return data.data.transcript
  },

  transcribeAndAnalyze: async (
    responseId: string,
    partNumber: number,
  ): Promise<{
    transcript: string
    analysis: AnalysisResult
  }> => {
    const { data } = await axiosInstance.post<
      ApiResponse<{
        transcript: string
        analysis: AnalysisResult
      }>
    >(`/responses/${responseId}/transcribe-analyze`, { partNumber })
    return data.data
  },

  getOverallAssessment: async (
    sessionId: string,
  ): Promise<{
    estimatedScore: number
    assessment: string
    partScores: Record<number, number>
  }> => {
    const { data } = await axiosInstance.get<
      ApiResponse<{
        estimatedScore: number
        assessment: string
        partScores: Record<number, number>
      }>
    >(`/responses/session/${sessionId}/overall-assessment`)
    return data.data
  },

  getQuestionHistory: async (questionId: string) => {
    const { data } = await axiosInstance.get<
      ApiResponse<
        Array<{
          id: string
          sessionId: string
          audioUrl: string | null
          transcript: string | null
          pronunciationScore: {
            score: number
            criteria: {
              accuracy: number
              vocabulary: number
              grammar: number
              fluency: number
            }
            issues: Array<{
              category: string
              original: string
              spoken: string
              note: string
            }>
            summary: string
          } | null
          completedAt: string | null
          createdAt: string
        }>
      >
    >(`/responses/question/${questionId}/history`)
    return data.data
  },
}
