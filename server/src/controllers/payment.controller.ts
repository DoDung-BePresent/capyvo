import type { Request, Response, NextFunction } from 'express'
import { PaymentService } from '@/services/payment.service'
import type { AuthRequest } from '@/middlewares/authenticate'

const paymentService = new PaymentService()

export class PaymentController {
  /** POST /payments/create — tạo link thanh toán */
  async createPaymentLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const result = await paymentService.createPaymentLink(userId)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  /** POST /payments/webhook — PayOS gọi vào đây */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await paymentService.handleWebhook(
        req.body,
        req.headers as Record<string, string | string[] | undefined>,
      )
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
