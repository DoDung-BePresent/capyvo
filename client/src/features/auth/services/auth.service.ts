import supabase from '@/lib/supabase'
import axiosInstance from '@/lib/axios'
import type { User } from '../types'
import type { ApiResponse } from '@/shared/types/api'

export const authService = {
  sendOtp: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
  },

  verifyOtp: async (email: string, token: string): Promise<void> => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
  },

  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<ApiResponse<User>>('/auth/me')
    return data.data
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}
