import type { Request, Response, NextFunction } from 'express'
import { PaymentService, TOKEN_PACKAGES } from '@/services/payment.service'
import type { AuthRequest } from '@/middlewares/authenticate'
import { SubscriptionPlanId } from '@prisma/client'

export class PaymentController {
  private service = new PaymentService()

  async createTokenOrder(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const tokenAmount = Number(req.body.tokenAmount)
    if (!TOKEN_PACKAGES[tokenAmount]) {
      res.status(400).json({ success: false, message: 'Invalid token package' })
      return
    }
    const result = await this.service.createTokenOrder(userId, tokenAmount)
    res.status(201).json({ success: true, data: result })
  }

  async createSubscriptionOrder(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const { planId } = req.body

    if (!planId) {
      res.status(400).json({ success: false, message: 'Plan ID is required' })
      return
    }

    const planIdEnum = planId.toUpperCase() as SubscriptionPlanId
    if (!Object.values(SubscriptionPlanId).includes(planIdEnum)) {
      res.status(400).json({ success: false, message: 'Invalid plan ID' })
      return
    }

    const result = await this.service.createSubscriptionOrder(userId, planIdEnum)
    res.status(201).json({ success: true, data: result })
  }

  getTokenPackages(_req: Request, res: Response): void {
    const packages = Object.entries(TOKEN_PACKAGES).map(([tokens, price]) => ({
      tokens: Number(tokens),
      price,
    }))
    res.json({ success: true, data: packages })
  }

  async handleWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.service.handleWebhook(req.body)
    res.json({ success: true })
  }

  async getPaymentStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const orderCode = Number(req.query['orderCode'])
    if (!orderCode) {
      res.status(400).json({ success: false, message: 'orderCode is required' })
      return
    }
    const userId = (req as AuthRequest).userId
    const result = await this.service.getPaymentStatus(orderCode, userId)
    res.json({ success: true, data: result })
  }

  async getMyPayments(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const payments = await this.service.getMyPayments(userId)
    res.json({ success: true, data: payments })
  }
}
