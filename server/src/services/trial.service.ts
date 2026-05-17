import prisma from '@/lib/prisma'
import { addDays } from 'date-fns'
import logger from '@/lib/logger'
import { SubscriptionPlanId } from '@prisma/client'

export class TrialService {
  /**
   * Activate premium trial for new user by creating a TRIAL subscription
   */
  static async activateTrial(userId: string): Promise<void> {
    try {
      // Get trial settings
      const settings = await this.getTrialSettings()
      const trialDays = settings.trialDays

      // Check if user already has any subscription (including trial)
      const existingSubscription = await prisma.subscription.findFirst({
        where: { userId },
      })

      if (existingSubscription) {
        logger.info(`User ${userId} already has a subscription, skipping trial activation`)
        return
      }

      // Get TRIAL plan
      const trialPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: SubscriptionPlanId.TRIAL },
      })

      if (!trialPlan) {
        logger.error('TRIAL plan not found in database')
        return
      }

      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Normalize to 00:00:00
      const endDate = addDays(startDate, trialDays)

      // Create TRIAL subscription
      await prisma.subscription.create({
        data: {
          userId,
          planId: SubscriptionPlanId.TRIAL,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      })

      // Update user cache fields
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil: endDate,
        },
      })

      logger.info(`Trial activated for user ${userId}: ${trialDays} days`)
    } catch (error) {
      logger.error(`Failed to activate trial for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Get trial status for a user by checking their TRIAL subscription
   */
  static async getTrialStatus(userId: string) {
    const now = new Date()

    // Find TRIAL subscription
    const trialSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        planId: SubscriptionPlanId.TRIAL,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!trialSubscription) {
      return {
        hasUsedTrial: false,
        isOnTrial: false,
        trialStartedAt: null,
        trialEndsAt: null,
        daysRemaining: 0,
      }
    }

    const isOnTrial = trialSubscription.status === 'ACTIVE' && trialSubscription.endDate >= now

    const daysRemaining = isOnTrial
      ? Math.ceil((trialSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      hasUsedTrial: true,
      isOnTrial,
      trialStartedAt: trialSubscription.startDate.toISOString(),
      trialEndsAt: trialSubscription.endDate.toISOString(),
      daysRemaining,
    }
  }

  /**
   * Get trial settings from app_settings table
   */
  static async getTrialSettings() {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'trial_days' },
    })

    return {
      trialDays: setting ? parseInt(setting.value, 10) : 7, // Default 7 days
    }
  }

  /**
   * Update trial settings (admin only)
   */
  static async updateTrialSettings(trialDays: number) {
    await prisma.appSetting.upsert({
      where: { key: 'trial_days' },
      update: { value: String(trialDays) },
      create: { key: 'trial_days', value: String(trialDays) },
    })

    return { trialDays }
  }

  /**
   * Check and expire trials (cron job)
   * This will be handled by subscription expiry cron job
   */
  static async checkExpiredTrials() {
    const now = new Date()

    // Find expired TRIAL subscriptions
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        planId: SubscriptionPlanId.TRIAL,
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      include: { user: true },
    })

    logger.info(`Found ${expiredTrials.length} expired trials`)

    for (const trial of expiredTrials) {
      // Update subscription status
      await prisma.subscription.update({
        where: { id: trial.id },
        data: { status: 'EXPIRED' },
      })

      // Check if user has any other active subscription
      const otherActiveSub = await prisma.subscription.findFirst({
        where: {
          userId: trial.userId,
          status: 'ACTIVE',
          endDate: { gte: now },
          id: { not: trial.id },
        },
      })

      if (!otherActiveSub) {
        // No other active subscription, revoke premium
        await prisma.user.update({
          where: { id: trial.userId },
          data: {
            isPremium: false,
            premiumUntil: null,
          },
        })
        logger.info(`Revoked premium for user ${trial.userId} (trial expired)`)
      }
    }

    return { revokedCount: expiredTrials.length }
  }
}
