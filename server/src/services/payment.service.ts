import { PayOS } from '@payos/node'
import prisma from '@/lib/prisma'
import { AppError } from '@/errors/app-error'
import { SubscriptionPlanId } from '@prisma/client'
import { SubscriptionService } from './subscription.service'

const payos = new PayOS({
  clientId: process.env['PAYOS_CLIENT_ID'],
  apiKey: process.env['PAYOS_API_KEY'],
  checksumKey: process.env['PAYOS_CHECKSUM_KEY'],
})

export const TOKEN_PACKAGES: Record<number, number> = {
  10: 20_000,
  30: 50_000,
  60: 90_000,
}

function genOrderCode() {
  return Number(Date.now().toString().slice(-9)) * 1000 + Math.floor(Math.random() * 1000)
}

export class PaymentService {
  /** Tạo payment link mua subscription */
  async createSubscriptionOrder(userId: string, planId: SubscriptionPlanId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      throw new AppError(`Invalid subscription plan: ${planId}`, 400)
    }

    const orderCode = genOrderCode()
    const returnUrl = process.env['PAYOS_RETURN_URL'] ?? 'http://localhost:5173/payment/result'
    const cancelUrl = process.env['PAYOS_CANCEL_URL'] ?? 'http://localhost:5173/payment/cancel'

    const paymentData = await payos.paymentRequests.create({
      orderCode,
      amount: plan.price,
      description: `Capyvo ${plan.name}`,
      returnUrl: `${returnUrl}?orderCode=${orderCode}`,
      cancelUrl: `${cancelUrl}?orderCode=${orderCode}`,
    })

    const payment = await prisma.payment.create({
      data: {
        userId,
        orderCode,
        amount: plan.price,
        description: `Gói ${plan.name}`,
        checkoutUrl: paymentData.checkoutUrl,
        status: 'PENDING',
      },
    })

    return { checkoutUrl: paymentData.checkoutUrl, orderCode, paymentId: payment.id }
  }

  /** Tạo payment link mua token (credits) - DEPRECATED */
  async createTokenOrder(userId: string, tokenAmount: number) {
    const price = TOKEN_PACKAGES[tokenAmount]
    if (!price) throw new AppError(`Invalid token package: ${tokenAmount}`, 400)

    const orderCode = genOrderCode()
    const returnUrl = process.env['PAYOS_RETURN_URL'] ?? 'http://localhost:5173/payment/result'
    const cancelUrl = process.env['PAYOS_CANCEL_URL'] ?? 'http://localhost:5173/payment/cancel'

    const paymentData = await payos.paymentRequests.create({
      orderCode,
      amount: price,
      description: `Capyvo ${tokenAmount} token`,
      returnUrl: `${returnUrl}?orderCode=${orderCode}`,
      cancelUrl: `${cancelUrl}?orderCode=${orderCode}`,
    })

    await prisma.payment.create({
      data: {
        userId,
        orderCode,
        amount: price,
        description: `${tokenAmount} token luyện tập`,
        tokenAmount,
        checkoutUrl: paymentData.checkoutUrl,
        status: 'PENDING',
      },
    })

    return { checkoutUrl: paymentData.checkoutUrl, orderCode }
  }

  /** Xác minh webhook từ PayOS */
  async handleWebhook(body: unknown) {
    const webhookData = await payos.webhooks.verify(body as never)
    const { orderCode, code } = webhookData
    const isSuccess = code === '00'

    const payment = await prisma.payment.findUnique({
      where: { orderCode: BigInt(orderCode) },
    })

    if (!payment) throw new AppError(`Payment not found: ${orderCode}`, 404)
    if (payment.status !== 'PENDING') return { alreadyProcessed: true }

    if (isSuccess) {
      const now = new Date()

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: now, payosTransactionId: String(orderCode) },
      })

      // Handle subscription payment
      const planId = this.extractPlanIdFromDescription(payment.description)
      if (planId) {
        await SubscriptionService.createSubscription(payment.userId, planId, payment.id)
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: code === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED' },
      })
    }

    return { processed: true }
  }

  /** Extract plan ID from payment description */
  private extractPlanIdFromDescription(description: string): SubscriptionPlanId | null {
    if (description.includes('Premium')) return SubscriptionPlanId.PREMIUM
    if (description.includes('Lớp học')) return SubscriptionPlanId.CLASSROOM
    // BASIC is deprecated, treat as FREE
    if (description.includes('Cơ bản')) return SubscriptionPlanId.FREE
    return null
  }

  /** Kiểm tra trạng thái một order (client poll sau khi return từ PayOS) */
  async getPaymentStatus(orderCode: number, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderCode: BigInt(orderCode), userId },
    })
    if (!payment) throw new AppError('Payment not found', 404)

    if (payment.status === 'PENDING') {
      const info = await payos.paymentRequests.get(orderCode)
      if (info.status === 'PAID') {
        const updated = await prisma.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date(), payosTransactionId: String(orderCode) },
        })

        if (updated.count > 0) {
          // Handle subscription payment
          const planId = this.extractPlanIdFromDescription(payment.description)
          if (planId) {
            await SubscriptionService.createSubscription(payment.userId, planId, payment.id)
          }
        }

        const final = await prisma.payment.findUnique({ where: { id: payment.id } })
        return final ? { ...final, orderCode: Number(final.orderCode) } : null
      }
    }

    return { ...payment, orderCode: Number(payment.orderCode) }
  }

  /** Lịch sử thanh toán của user */
  async getMyPayments(userId: string) {
    const rows = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        amount: true,
        description: true,
        status: true,
        tokenAmount: true,
        paidAt: true,
        createdAt: true,
      },
    })
    return rows.map((r) => ({ ...r, orderCode: Number(r.orderCode) }))
  }
}
