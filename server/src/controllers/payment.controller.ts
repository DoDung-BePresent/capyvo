import type { Request, Response, NextFunction } from 'express'
import { PaymentService, TOKEN_PACKAGES } from '@/services/payment.service'
import type { AuthRequest } from '@/middlewares/authenticate'

const paymentService = new PaymentService()

export class PaymentController {
  /** POST /payments/create-token — tạo link mua token */
  async createTokenOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const tokenAmount = Number(req.body.tokenAmount)
      if (!TOKEN_PACKAGES[tokenAmount]) {
        res.status(400).json({ success: false, message: 'Invalid token package' })
        return
      }
      const result = await paymentService.createTokenOrder(userId, tokenAmount)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  /** GET /payments/token-packages — danh sách gói token */
  getTokenPackages(_req: Request, res: Response): void {
    const packages = Object.entries(TOKEN_PACKAGES).map(([tokens, price]) => ({
      tokens: Number(tokens),
      price,
    }))
    res.json({ success: true, data: packages })
  }

  /** POST /payments/webhook — PayOS gọi vào đây */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await paymentService.handleWebhook(req.body)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }

  /** GET /payments/status?orderCode=xxx — client poll sau khi return */
  async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderCode = Number(req.query['orderCode'])
      if (!orderCode) {
        res.status(400).json({ success: false, message: 'orderCode is required' })
        return
      }
      const userId = (req as AuthRequest).userId
      const result = await paymentService.getPaymentStatus(orderCode, userId)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  /** GET /payments/my — lịch sử thanh toán */
  async getMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const payments = await paymentService.getMyPayments(userId)
      res.json({ success: true, data: payments })
    } catch (err) {
      next(err)
    }
  }
}
