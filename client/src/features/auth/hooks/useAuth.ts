import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { authService } from '../services/auth.service'
import type { LoginPayload } from '../types'

export function useGetMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      queryClient.setQueryData(queryKeys.auth.me(), data.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      localStorage.removeItem('access_token')
      queryClient.clear()
    },
  })
}
