import axiosInstance from '@/lib/axios'
import type { CreateOrderResponse, Payment } from '../types'

export const paymentService = {
  async createOrder(): Promise<CreateOrderResponse> {
    const res = await axiosInstance.post<{ success: boolean; data: CreateOrderResponse }>(
      '/payments/create',
    )
    return res.data.data
  },

  async getStatus(orderCode: number): Promise<Payment> {
    const res = await axiosInstance.get<{ success: boolean; data: Payment }>(
      `/payments/status?orderCode=${orderCode}`,
    )
    return res.data.data
  },

  async getMyPayments(): Promise<Payment[]> {
    const res = await axiosInstance.get<{ success: boolean; data: Payment[] }>('/payments/my')
    return res.data.data
  },
}
