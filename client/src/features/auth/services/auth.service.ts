import axiosInstance from '@/lib/axios'
import type { AuthResponse, LoginPayload } from '../types'

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', payload)
    return data
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout')
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    const { data } = await axiosInstance.get<AuthResponse['user']>('/auth/me')
    return data
  },
}
