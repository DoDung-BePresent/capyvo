import axiosInstance from '@/lib/axios'
import type { CreateOrderResponse, Payment, TokenPackage } from '../types'

export const paymentService = {
  async createSubscriptionOrder(planId: string): Promise<CreateOrderResponse> {
    const res = await axiosInstance.post<{ success: boolean; data: CreateOrderResponse }>(
      '/payments/create-subscription',
      { planId },
    )
    return res.data.data
  },

  async createTokenOrder(tokenAmount: number): Promise<CreateOrderResponse> {
    const res = await axiosInstance.post<{ success: boolean; data: CreateOrderResponse }>(
      '/payments/create-token',
      { tokenAmount },
    )
    return res.data.data
  },

  async getTokenPackages(): Promise<TokenPackage[]> {
    const res = await axiosInstance.get<{ success: boolean; data: TokenPackage[] }>(
      '/payments/token-packages',
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
