import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

export interface PricingInputs {
  targetUsers: number
  profitMarginPercent: number
  infrastructureCostUsd: number
}

export interface PricingCalculation {
  // Inputs
  targetUsers: number
  profitMarginPercent: number
  infrastructureCostUsd: number

  // Current metrics
  currentUsers: number
  avgOpenAICostPerUser: number
  avgSessionsPerUser: number
  avgTokensPerUser: number

  // Calculations
  totalOpenAICost: number
  totalInfrastructureCost: number
  totalCost: number
  targetRevenue: number
  revenuePerUser: number

  // Suggested pricing (VND)
  suggestedPrices: {
    basic: number
    standard: number
    premium: number
  }

  // Break-even analysis
  breakEvenUsers: number
  profitAtTargetUsers: number
}

export const pricingCalculatorService = {
  calculate: async (inputs: PricingInputs): Promise<PricingCalculation> => {
    const { data } = await axiosInstance.post<ApiResponse<PricingCalculation>>(
      '/admin/pricing-calculator/calculate',
      inputs,
    )
    return data.data
  },
}
