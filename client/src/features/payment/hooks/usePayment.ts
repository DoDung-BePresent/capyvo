import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { paymentService } from '../services/payment.service'

export function useCreateSubscriptionOrder() {
  return useMutation({
    mutationFn: (planId: string) => paymentService.createSubscriptionOrder(planId),
  })
}

export function usePaymentStatus(orderCode: number | null) {
  return useQuery({
    queryKey: queryKeys.payments.status(orderCode!),
    queryFn: () => paymentService.getStatus(orderCode!),
    enabled: !!orderCode,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'PENDING' ? 3000 : false
    },
  })
}

export function useMyPayments() {
  return useQuery({
    queryKey: queryKeys.payments.my(),
    queryFn: () => paymentService.getMyPayments(),
  })
}
