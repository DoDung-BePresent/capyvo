import { PayOS } from '@payos/node'
import prisma from '@/lib/prisma'
import { AppError } from '@/errors/app-error'

// Constructor nhận PayOSOptions — đọc từ env nếu không truyền
const payos = new PayOS({
  clientId: process.env['PAYOS_CLIENT_ID'],
  apiKey: process.env['PAYOS_API_KEY'],
  checksumKey: process.env['PAYOS_CHECKSUM_KEY'],
})

export const PLAN_PRICE_VND = 90_000
export const PLAN_DURATION_DAYS = 30

export class PaymentService {
  /** Tạo payment link PayOS, lưu Payment record */
  async createPaymentLink(userId: string) {
    // orderCode: số nguyên dương, tối đa 9 chữ số
    const orderCode =
      Number(Date.now().toString().slice(-9)) * 1000 + Math.floor(Math.random() * 1000)

    const returnUrl = process.env['PAYOS_RETURN_URL'] ?? 'http://localhost:5173/payment/result'
    const cancelUrl = process.env['PAYOS_CANCEL_URL'] ?? 'http://localhost:5173/payment/cancel'

    const paymentData = await payos.paymentRequests.create({
      orderCode,
      amount: PLAN_PRICE_VND,
      description: 'Capyvo Premium 1 thang',
      returnUrl: `${returnUrl}?orderCode=${orderCode}`,
      cancelUrl: `${cancelUrl}?orderCode=${orderCode}`,
    })

    // Persist payment record
    await prisma.payment.create({
      data: {
        userId,
        orderCode,
        amount: PLAN_PRICE_VND,
        description: 'Capyvo Premium 1 tháng',
        durationDays: PLAN_DURATION_DAYS,
        checkoutUrl: paymentData.checkoutUrl,
        status: 'PENDING',
      },
    })

    return { checkoutUrl: paymentData.checkoutUrl, orderCode }
  }

  /** Xác minh webhook từ PayOS và cập nhật subscription */
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
      const user = await prisma.user.findUnique({ where: { id: payment.userId } })
      const base =
        user?.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now
      const premiumExpiresAt = new Date(base)
      premiumExpiresAt.setDate(premiumExpiresAt.getDate() + payment.durationDays)

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: now, payosTransactionId: String(orderCode) },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { isPremium: true, premiumExpiresAt },
        }),
      ])
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: code === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED' },
      })
    }

    return { processed: true }
  }

  /** Kiểm tra trạng thái một order (dùng sau khi user return từ PayOS) */
  async getPaymentStatus(orderCode: number, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderCode: BigInt(orderCode), userId },
    })
    if (!payment) throw new AppError('Payment not found', 404)

    // Nếu vẫn PENDING → hỏi PayOS trực tiếp
    if (payment.status === 'PENDING') {
      const info = await payos.paymentRequests.get(orderCode)
      if (info.status === 'PAID') {
        const now = new Date()
        const user = await prisma.user.findUnique({ where: { id: payment.userId } })
        const base =
          user?.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now
        const premiumExpiresAt = new Date(base)
        premiumExpiresAt.setDate(premiumExpiresAt.getDate() + payment.durationDays)
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID', paidAt: now, payosTransactionId: String(orderCode) },
          }),
          prisma.user.update({
            where: { id: payment.userId },
            data: { isPremium: true, premiumExpiresAt },
          }),
        ])
        return prisma.payment.findFirst({ where: { id: payment.id } })
      }
    }

    return payment
  }

  /** Lịch sử thanh toán của user */
  async getMyPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderCode: true,
        amount: true,
        description: true,
        status: true,
        durationDays: true,
        paidAt: true,
        createdAt: true,
      },
    })
  }
}
