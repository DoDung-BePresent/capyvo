import { SubscriptionPlanId, SubscriptionStatus } from '@prisma/client'
import { addDays } from 'date-fns'
import prisma from '@/lib/prisma'

export class SubscriptionService {
  /**
   * Lấy tất cả subscription plans
   */
  static async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { durationDays: 'asc' },
    })
  }

  /**
   * Lấy plan theo ID
   */
  static async getPlanById(planId: SubscriptionPlanId) {
    return prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })
  }

  /**
   * Lấy subscription hiện tại của user
   */
  static async getCurrentSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
      orderBy: { endDate: 'desc' },
    })
  }

  /**
   * Lấy tất cả subscriptions của user
   */
  static async getUserSubscriptions(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Tạo subscription mới hoặc gia hạn subscription hiện tại
   */
  static async createSubscription(userId: string, planId: SubscriptionPlanId, paymentId?: string) {
    const plan = await this.getPlanById(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    // Check if user has existing active subscription
    const existingSubscription = await this.getCurrentSubscription(userId)

    let startDate: Date
    let endDate: Date

    if (existingSubscription && existingSubscription.endDate > new Date()) {
      // User has active subscription - extend from current end date
      startDate = existingSubscription.endDate
      endDate = addDays(startDate, plan.durationDays)
      console.log(
        `Extending subscription for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      )
    } else {
      // No active subscription - start from now
      const now = new Date()
      // Normalize to start of day (00:00:00)
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = addDays(startDate, plan.durationDays)
      console.log(
        `Creating new subscription for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
      include: {
        plan: true,
      },
    })

    // Update user premium status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: endDate,
      },
    })

    // Link payment if provided
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { subscriptionId: subscription.id },
      })
    }

    return subscription
  }

  /**
   * Gia hạn subscription
   */
  static async renewSubscription(subscriptionId: string, planId: SubscriptionPlanId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const plan = await this.getPlanById(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    // Tính ngày bắt đầu mới (từ ngày hết hạn cũ hoặc hôm nay)
    // Calculate start and end dates (normalized to start of day)
    let startDate: Date
    if (subscription.endDate > new Date()) {
      // Subscription still active - extend from end date
      startDate = subscription.endDate
    } else {
      // Subscription expired - start from today
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
    const endDate = addDays(startDate, plan.durationDays)

    const newSubscription = await prisma.subscription.create({
      data: {
        userId: subscription.userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
      include: {
        plan: true,
      },
    })

    // Update user premium status
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: true,
        premiumUntil: endDate,
      },
    })

    return newSubscription
  }

  /**
   * Hủy subscription (không gia hạn)
   */
  static async cancelSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
      include: {
        plan: true,
      },
    })

    return subscription
  }

  /**
   * Check và update expired subscriptions (chạy bởi cron job)
   */
  static async checkExpiredSubscriptions() {
    const now = new Date()

    // Tìm subscriptions đã hết hạn nhưng vẫn ACTIVE
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
      include: {
        user: true,
      },
    })

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`)

    for (const subscription of expiredSubscriptions) {
      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      })

      // Check if user has any other active subscription
      const activeSubscription = await this.getCurrentSubscription(subscription.userId)

      if (!activeSubscription) {
        // No active subscription, revoke premium
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            isPremium: false,
            premiumUntil: null,
          },
        })
        console.log(`Revoked premium for user ${subscription.userId}`)
      }
    }

    return expiredSubscriptions.length
  }

  /**
   * Check if user has active premium
   */
  static async isPremiumUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    })

    if (!user || !user.isPremium || !user.premiumUntil) {
      return false
    }

    return user.premiumUntil > new Date()
  }

  /**
   * Get days remaining for user's subscription
   */
  static async getDaysRemaining(userId: string): Promise<number | null> {
    const subscription = await this.getCurrentSubscription(userId)
    if (!subscription) return null

    const now = new Date()
    const diffTime = subscription.endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }
}
