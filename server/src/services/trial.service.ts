import { addDays } from 'date-fns'
import prisma from '@/lib/prisma'
import logger from '@/lib/logger'

export class TrialService {
  /**
   * Get premium trial days from app settings
   */
  static async getTrialDays(): Promise<number> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'PREMIUM_TRIAL_DAYS' },
    })

    if (!setting) {
      logger.warn('PREMIUM_TRIAL_DAYS setting not found, using default: 7')
      return 7
    }

    const days = parseInt(setting.value, 10)
    return isNaN(days) ? 7 : days
  }

  /**
   * Update premium trial days setting (admin only)
   */
  static async updateTrialDays(days: number): Promise<void> {
    if (days < 0 || days > 365) {
      throw new Error('Trial days must be between 0 and 365')
    }

    await prisma.appSetting.upsert({
      where: { key: 'PREMIUM_TRIAL_DAYS' },
      update: { value: days.toString() },
      create: { key: 'PREMIUM_TRIAL_DAYS', value: days.toString() },
    })

    logger.info(`Updated PREMIUM_TRIAL_DAYS to ${days}`)
  }

  /**
   * Activate premium trial for new user
   */
  static async activateTrial(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasUsedTrial: true, isPremium: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user already used trial
    if (user.hasUsedTrial) {
      logger.info(`User ${userId} already used trial, skipping`)
      return
    }

    // Check if user already has premium (from payment)
    if (user.isPremium) {
      logger.info(`User ${userId} already has premium, skipping trial`)
      return
    }

    const trialDays = await this.getTrialDays()

    // If trial days is 0, skip trial activation
    if (trialDays === 0) {
      logger.info('Trial is disabled (0 days), skipping')
      return
    }

    const now = new Date()
    const trialStartedAt = now
    const trialEndsAt = addDays(now, trialDays)

    await prisma.user.update({
      where: { id: userId },
      data: {
        hasUsedTrial: true,
        trialStartedAt,
        trialEndsAt,
        isPremium: true,
        premiumUntil: trialEndsAt,
      },
    })

    logger.info(`Activated ${trialDays}-day premium trial for user ${userId}`)
  }

  /**
   * Check if user is on trial
   */
  static async isOnTrial(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasUsedTrial: true,
        trialEndsAt: true,
        isPremium: true,
      },
    })

    if (!user || !user.hasUsedTrial || !user.trialEndsAt) {
      return false
    }

    // Check if trial is still active
    const now = new Date()
    return user.isPremium && user.trialEndsAt > now
  }

  /**
   * Get trial status for user
   */
  static async getTrialStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasUsedTrial: true,
        trialStartedAt: true,
        trialEndsAt: true,
        isPremium: true,
      },
    })

    if (!user) {
      return null
    }

    const now = new Date()
    const isOnTrial = user.hasUsedTrial && user.trialEndsAt && user.trialEndsAt > now

    let daysRemaining = 0
    if (isOnTrial && user.trialEndsAt) {
      const diffTime = user.trialEndsAt.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      hasUsedTrial: user.hasUsedTrial,
      isOnTrial,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      daysRemaining: isOnTrial ? daysRemaining : 0,
    }
  }

  /**
   * Check and expire trials (run by cron job)
   */
  static async checkExpiredTrials(): Promise<number> {
    const now = new Date()

    // Find users with expired trials
    const expiredTrialUsers = await prisma.user.findMany({
      where: {
        hasUsedTrial: true,
        trialEndsAt: { lt: now },
        isPremium: true,
      },
      select: {
        id: true,
        email: true,
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: { gte: now },
          },
        },
      },
    })

    logger.info(`Found ${expiredTrialUsers.length} users with expired trials`)

    let revokedCount = 0

    for (const user of expiredTrialUsers) {
      // Check if user has active paid subscription
      if (user.subscriptions.length > 0) {
        logger.info(`User ${user.id} has active subscription, keeping premium`)
        continue
      }

      // Revoke premium (trial expired, no paid subscription)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      })

      logger.info(`Revoked premium for user ${user.id} (trial expired)`)
      revokedCount++
    }

    return revokedCount
  }
}
