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

export function useSendMagicLink() {
  return useMutation({
    mutationFn: (email: string) => authService.sendMagicLink(email),
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
