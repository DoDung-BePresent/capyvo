import prisma from '@/lib/prisma'
import { OpenAIUsageService } from './openai-usage.service'

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
    basic: number // 100 tokens
    standard: number // 300 tokens
    premium: number // 500 tokens
  }

  // Break-even analysis
  breakEvenUsers: number
  profitAtTargetUsers: number
}

export class PricingCalculatorService {
  private openaiService = new OpenAIUsageService()

  async calculatePricing(inputs: PricingInputs): Promise<PricingCalculation> {
    // Get current metrics
    const [currentUsers, openaiUsage, totalSessions] = await Promise.all([
      prisma.user.count(),
      this.openaiService.getCurrentMonthUsage(),
      prisma.practiceSession.count(),
    ])

    // Calculate averages
    const avgOpenAICostPerUser = currentUsers > 0 ? openaiUsage.estimatedCostUsd / currentUsers : 0
    const avgSessionsPerUser = currentUsers > 0 ? totalSessions / currentUsers : 0
    const avgTokensPerUser = currentUsers > 0 ? openaiUsage.totalTokens / currentUsers : 0

    // Calculate costs for target users
    const totalOpenAICost = avgOpenAICostPerUser * inputs.targetUsers
    const totalInfrastructureCost = inputs.infrastructureCostUsd
    const totalCost = totalOpenAICost + totalInfrastructureCost

    // Calculate target revenue with profit margin
    const targetRevenue = totalCost * (1 + inputs.profitMarginPercent / 100)
    const revenuePerUser = inputs.targetUsers > 0 ? targetRevenue / inputs.targetUsers : 0

    // Exchange rate: 1 USD = 25,000 VND (approximate)
    const USD_TO_VND = 25000

    // Suggested pricing based on token packages
    // Assume: 100 tokens = 1x base price, 300 tokens = 2.5x, 500 tokens = 4x
    const basePrice = revenuePerUser * USD_TO_VND
    const suggestedPrices = {
      basic: Math.ceil(basePrice / 1000) * 1000, // Round to nearest 1000 VND
      standard: Math.ceil((basePrice * 2.5) / 1000) * 1000,
      premium: Math.ceil((basePrice * 4) / 1000) * 1000,
    }

    // Break-even analysis
    const breakEvenUsers = totalCost > 0 ? Math.ceil(totalCost / avgOpenAICostPerUser) : 0
    const profitAtTargetUsers = targetRevenue - totalCost

    return {
      // Inputs
      targetUsers: inputs.targetUsers,
      profitMarginPercent: inputs.profitMarginPercent,
      infrastructureCostUsd: inputs.infrastructureCostUsd,

      // Current metrics
      currentUsers,
      avgOpenAICostPerUser,
      avgSessionsPerUser,
      avgTokensPerUser,

      // Calculations
      totalOpenAICost,
      totalInfrastructureCost,
      totalCost,
      targetRevenue,
      revenuePerUser,

      // Suggested pricing
      suggestedPrices,

      // Break-even
      breakEvenUsers,
      profitAtTargetUsers,
    }
  }
}
