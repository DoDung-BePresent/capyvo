import supabase from '@/lib/supabase'
import axiosInstance from '@/lib/axios'
import type { User } from '../types'
import type { ApiResponse } from '@/shared/types/api'

export const authService = {
  loginWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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
