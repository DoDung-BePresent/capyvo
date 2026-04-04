import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { queryKeys } from '@/lib/query-keys'
import supabase from '@/lib/supabase'
import { authService } from '../services/auth.service'

export function useGetMe(session?: Session | null) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    enabled: !!session,
    retry: false,
    staleTime: Infinity,
  })
}

/** Invalidates getMe query khi auth state thay đổi (login/logout) */
export function useAuthSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      }
      if (event === 'SIGNED_OUT') {
        queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])
}

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: authService.loginWithGoogle,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
