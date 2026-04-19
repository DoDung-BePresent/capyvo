export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'

export interface Payment {
  id: string
  orderCode: number
  amount: number
  description: string
  status: PaymentStatus
  durationDays: number
  paidAt: string | null
  createdAt: string
}

export interface CreateOrderResponse {
  checkoutUrl: string
  orderCode: number
}
