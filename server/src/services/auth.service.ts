import prisma from '@/lib/prisma'
import type { User, Subscription, SubscriptionPlan } from '@prisma/client'

export type UserWithSubscription = User & {
  subscriptions: (Subscription & { plan: SubscriptionPlan })[]
}

export class AuthService {
  /**
   * Lấy user từ DB. Nếu chưa tồn tại thì tạo mới (first login).
   */
  async findOrCreateUser(
    supabaseId: string,
    email: string,
    fullName?: string,
    avatarUrl?: string,
  ): Promise<UserWithSubscription> {
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

    // Nếu user đã tồn tại, cập nhật fullName và avatarUrl nếu có thay đổi
    if (existing) {
      const needsUpdate =
        (fullName && fullName !== existing.fullName) ||
        (avatarUrl && avatarUrl !== existing.avatarUrl)

      if (needsUpdate) {
        return prisma.user.update({
          where: { id: supabaseId },
          data: {
            ...(fullName && { fullName }),
            ...(avatarUrl && { avatarUrl }),
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
      }

      return existing
    }

    const newUser = await prisma.user.create({
      data: {
        id: supabaseId,
        email,
        fullName,
        avatarUrl,
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
