import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export type AllowedEmoji = '1️⃣' | '2️⃣' | '3️⃣' | '4️⃣' | '5️⃣' | '😍' | '💖' | '🤔'

export interface PublicShareDetail {
  id: string
  createdAt: string
  user: {
    id: string
    fullName: string | null
    email: string
  }
  response: {
    id: string
    transcript: string | null
    audioUrl: string | null
    createdAt: string
  }
  reactions: Array<{
    emoji: string
    count: number
    userReacted: boolean
  }>
}

export interface MyShareDetail {
  id: string
  createdAt: string
  question: {
    id: string
    partNumber: number
    questionNumber: number
  }
  response: {
    id: string
    transcript: string | null
  }
  reactionCount: number
}

export const shareService = {
  /**
   * Create a public share
   */
  createShare: async (responseId: string): Promise<{ shareId: string }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ shareId: string }>>('/shares', {
      responseId,
    })
    return data.data
  },

  /**
   * Delete a share
   */
  deleteShare: async (shareId: string): Promise<void> => {
    await axiosInstance.delete(`/shares/${shareId}`)
  },

  /**
   * Get all shares for a question
   */
  getSharesByQuestion: async (
    questionId: string,
    limit = 20,
    offset = 0,
  ): Promise<PublicShareDetail[]> => {
    const { data } = await axiosInstance.get<ApiResponse<PublicShareDetail[]>>(
      `/shares/question/${questionId}`,
      {
        params: { limit, offset },
      },
    )
    return data.data
  },

  /**
   * Toggle reaction on a share
   */
  toggleReaction: async (
    shareId: string,
    emoji: AllowedEmoji,
  ): Promise<{ action: 'added' | 'removed' | 'updated' }> => {
    const { data } = await axiosInstance.post<
      ApiResponse<{ action: 'added' | 'removed' | 'updated' }>
    >(`/shares/${shareId}/reactions`, { emoji })
    return data.data
  },

  /**
   * Get my shares
   */
  getMyShares: async (): Promise<MyShareDetail[]> => {
    const { data } = await axiosInstance.get<ApiResponse<MyShareDetail[]>>('/shares/my')
    return data.data
  },
}
