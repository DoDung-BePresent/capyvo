import { PayOS } from '@payos/node'
import prisma from '@/lib/prisma'
import { AppError } from '@/errors/app-error'
import { SubscriptionPlanId } from '@prisma/client'
import { SubscriptionService } from './subscription.service'
import logger from '@/lib/logger'
import { z } from 'zod'
import { env } from '@/config/env'

// Validation schema for PayOS webhook
const PayOSWebhookSchema = z.object({
  orderCode: z.number().int().positive(),
  code: z.string().regex(/^\d{2}$/, 'Code must be 2 digits'),
  data: z.object({}).passthrough(), // Allow any data structure
})

const payos = new PayOS({
  clientId: env.PAYOS_CLIENT_ID,
  apiKey: env.PAYOS_API_KEY,
  checksumKey: env.PAYOS_CHECKSUM_KEY,
})

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
    const returnUrl = env.PAYOS_RETURN_URL ?? 'http://localhost:5173/payment/result'
    const cancelUrl = env.PAYOS_CANCEL_URL ?? 'http://localhost:5173/payment/cancel'

    // Create payment with timeout (10 seconds)
    const paymentData = await Promise.race([
      payos.paymentRequests.create({
        orderCode,
        amount: plan.price,
        description: `Capyvo ${plan.name}`,
        returnUrl: `${returnUrl}?orderCode=${orderCode}`,
        cancelUrl: `${cancelUrl}?orderCode=${orderCode}`,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new AppError('PayOS request timeout', 504)), 10000),
      ),
    ])

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

  /** Xác minh webhook từ PayOS */
  async handleWebhook(body: unknown) {
    // Verify webhook signature (done by middleware)
    const webhookData = await payos.webhooks.verify(body as never)

    // Validate webhook data structure
    const validated = PayOSWebhookSchema.parse(webhookData)
    const { orderCode, code } = validated
    const isSuccess = code === '00'

    logger.info('Processing PayOS webhook', {
      orderCode,
      code,
      isSuccess,
      timestamp: new Date().toISOString(),
    })

    // Use transaction with optimistic locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Atomic update with WHERE condition - only update if still PENDING
      const updated = await tx.payment.updateMany({
        where: {
          orderCode: BigInt(orderCode),
          status: 'PENDING', // Critical: Only update if still PENDING
        },
        data: {
          status: isSuccess ? 'PAID' : code === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED',
          paidAt: isSuccess ? new Date() : null,
          payosTransactionId: String(orderCode),
        },
      })

      // If no rows updated, payment was already processed
      if (updated.count === 0) {
        logger.info('Payment already processed (idempotent)', { orderCode })
        return { alreadyProcessed: true }
      }

      // Fetch the updated payment
      const payment = await tx.payment.findUnique({
        where: { orderCode: BigInt(orderCode) },
      })

      if (!payment) {
        logger.error('Payment not found after update', { orderCode })
        throw new AppError(`Payment not found: ${orderCode}`, 404)
      }

      // Handle subscription payment if successful
      if (isSuccess) {
        const planId = this.extractPlanIdFromDescription(payment.description)
        if (planId) {
          logger.info('Creating subscription from webhook', {
            userId: payment.userId,
            planId,
            paymentId: payment.id,
          })
          await SubscriptionService.createSubscriptionInTransaction(
            tx,
            payment.userId,
            planId,
            payment.id,
          )
        }
      }

      logger.info('Payment webhook processed successfully', {
        orderCode,
        paymentId: payment.id,
        status: payment.status,
      })

      return { processed: true, payment }
    })

    return result
  }

  /** Extract plan ID from payment description */
  private extractPlanIdFromDescription(description: string): SubscriptionPlanId | null {
    if (description.includes('Premium')) return SubscriptionPlanId.PREMIUM
    if (description.includes('Dùng thử')) return SubscriptionPlanId.TRIAL
    if (description.includes('Lớp học')) return SubscriptionPlanId.CLASSROOM
    if (description.includes('Miễn phí')) return SubscriptionPlanId.FREE
    // Legacy: BASIC is deprecated, treat as FREE
    if (description.includes('Cơ bản')) return SubscriptionPlanId.FREE
    return null
  }

  /** Kiểm tra trạng thái một order (client poll sau khi return từ PayOS) */
  async getPaymentStatus(orderCode: number, userId: string) {
    // Validate orderCode format
    if (!orderCode || orderCode <= 0 || orderCode > 9999999999999) {
      throw new AppError('Invalid orderCode format', 400)
    }

    const payment = await prisma.payment.findFirst({
      where: { orderCode: BigInt(orderCode), userId },
    })
    if (!payment) throw new AppError('Payment not found', 404)

    if (payment.status === 'PENDING') {
      // Get payment status with timeout (5 seconds)
      const info = await Promise.race([
        payos.paymentRequests.get(orderCode),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new AppError('PayOS request timeout', 504)), 5000),
        ),
      ])

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
