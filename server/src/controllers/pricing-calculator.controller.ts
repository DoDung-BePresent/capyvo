import type { Request, Response, NextFunction } from 'express'
import { PricingCalculatorService } from '@/services/pricing-calculator.service'
import { z } from 'zod'

const PricingInputsSchema = z.object({
  targetUsers: z.number().int().min(1),
  profitMarginPercent: z.number().min(0).max(100),
  infrastructureCostUsd: z.number().min(0),
})

export class PricingCalculatorController {
  private service = new PricingCalculatorService()

  async calculate(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const inputs = PricingInputsSchema.parse(req.body)
    const data = await this.service.calculatePricing(inputs)
    res.json({ success: true, data })
  }
}
