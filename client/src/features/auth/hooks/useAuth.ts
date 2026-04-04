import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { authService } from '../services/auth.service'

export function useGetMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    retry: false,
    staleTime: Infinity,
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (email: string) => authService.sendOtp(email),
  })
}

export function useVerifyOtp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) =>
      authService.verifyOtp(email, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
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
