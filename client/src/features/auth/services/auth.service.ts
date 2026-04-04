import supabase from '@/lib/supabase'
import axiosInstance from '@/lib/axios'
import type { User } from '../types'

export const authService = {
  /**
   * Gửi magic link tới email — user click link để đăng nhập
   */
  sendMagicLink: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  },

  /**
   * Lấy profile user từ BE (đã sync với Prisma)
   */
  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>('/auth/me')
    return data
  },

  /**
   * Đăng xuất — xóa session Supabase
   */
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}
