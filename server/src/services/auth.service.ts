import prisma from '@/lib/prisma'
import type { User, Subscription, SubscriptionPlan } from '@prisma/client'

export type UserWithSubscription = User & {
  subscriptions: (Subscription & { plan: SubscriptionPlan })[]
}

export class AuthService {
  /**
   * Lấy user từ DB. Nếu chưa tồn tại thì tạo mới (first login).
   */
  async findOrCreateUser(supabaseId: string, email: string): Promise<UserWithSubscription> {
    const existing = await prisma.user.findUnique({
      where: { id: supabaseId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    })
    if (existing) return existing

    const newUser = await prisma.user.create({
      data: {
        id: supabaseId,
        email,
      },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    })
    return newUser
  }

  async getProfile(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } })
  }
}
