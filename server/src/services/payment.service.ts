import { PayOS } from '@payos/node'
import prisma from '@/lib/prisma'
import { AppError } from '@/errors/app-error'

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
  /** Tạo payment link mua token (credits) */
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

  /** Xác minh webhook từ PayOS và cộng token cho user */
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
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: now, payosTransactionId: String(orderCode) },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { transcriptionCredits: { increment: payment.tokenAmount ?? 0 } },
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

  /** Kiểm tra trạng thái một order (client poll sau khi return từ PayOS) */
  async getPaymentStatus(orderCode: number, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderCode: BigInt(orderCode), userId },
    })
    if (!payment) throw new AppError('Payment not found', 404)

    if (payment.status === 'PENDING') {
      // Gọi PayOS API server-to-server bằng PAYOS_API_KEY — client không thể giả mạo response này
      const info = await payos.paymentRequests.get(orderCode)
      if (info.status === 'PAID') {
        // Dùng updateMany với filter status=PENDING để đảm bảo idempotent:
        // nếu webhook đã xử lý trước thì affected=0 và ta không cộng token 2 lần
        const updated = await prisma.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date(), payosTransactionId: String(orderCode) },
        })

        if (updated.count > 0) {
          await prisma.user.update({
            where: { id: payment.userId },
            data: { transcriptionCredits: { increment: payment.tokenAmount ?? 0 } },
          })
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
