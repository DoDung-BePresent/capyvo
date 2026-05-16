import { Request, NextFunction, Response } from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { TrialService } from '../services/trial.service'
import { SubscriptionPlanId } from '@prisma/client'
import type { AuthRequest } from '@/middlewares/authenticate'

export class SubscriptionController {
  /**
   * GET /api/subscription/plans
   * Lấy danh sách các gói subscription (chỉ PREMIUM, không show FREE)
   */
  static async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionService.getPlans()

      // Filter out FREE and TRIAL plans (users get these automatically)
      // Only show purchasable plans
      const formattedPlans = plans
        .filter((plan) => plan.id !== 'FREE' && plan.id !== 'TRIAL')
        .map((plan) => ({
          id: plan.id.toLowerCase(),
          name: plan.name,
          durationDays: plan.durationDays,
          price: plan.price,
          pricePerMonth: plan.pricePerMonth,
          isActive: plan.isActive,
        }))

      res.json({ plans: formattedPlans })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/subscription/current
   * Lấy subscription hiện tại của user (bao gồm trial info)
   */
  static async getCurrentSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const [subscription, isPremium, trialStatus] = await Promise.all([
        SubscriptionService.getCurrentSubscription(userId),
        SubscriptionService.isPremiumUser(userId),
        TrialService.getTrialStatus(userId),
      ])

      // Determine current plan
      let currentPlan: string
      if (subscription) {
        // User has paid subscription
        currentPlan = subscription.planId
      } else if (trialStatus?.isOnTrial) {
        // User is on trial (no paid subscription)
        currentPlan = 'TRIAL'
      } else {
        // User is on FREE plan
        currentPlan = 'FREE'
      }

      // If no paid subscription, return basic info
      if (!subscription) {
        res.json({
          subscription: null,
          plan: currentPlan,
          isPremium,
          trialStatus,
        })
        return
      }

      const daysRemaining = await SubscriptionService.getDaysRemaining(userId)

      res.json({
        subscription: {
          id: subscription.id,
          planId: subscription.planId.toLowerCase(),
          planName: subscription.plan.name,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          daysRemaining,
        },
        plan: currentPlan,
        isPremium,
        trialStatus,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/subscription/history
   * Lấy lịch sử subscriptions của user
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const subscriptions = await SubscriptionService.getUserSubscriptions(userId)

      const formattedSubscriptions = subscriptions.map((sub) => ({
        id: sub.id,
        planId: sub.planId.toLowerCase(),
        planName: sub.plan.name,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
      }))

      res.json({ subscriptions: formattedSubscriptions })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/subscription/create
   * Tạo subscription mới (sau khi thanh toán thành công)
   */
  static async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { planId, paymentId } = req.body

      if (!planId) {
        res.status(400).json({ error: 'Plan ID is required' })
        return
      }

      // Convert planId to enum
      const planIdEnum = planId.toUpperCase() as SubscriptionPlanId
      if (!Object.values(SubscriptionPlanId).includes(planIdEnum)) {
        res.status(400).json({ error: 'Invalid plan ID' })
        return
      }

      const subscription = await SubscriptionService.createSubscription(
        userId,
        planIdEnum,
        paymentId,
      )

      res.json({
        subscription: {
          id: subscription.id,
          planId: subscription.planId.toLowerCase(),
          planName: subscription.plan.name,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/subscription/cancel
   * Hủy subscription (không gia hạn)
   */
  static async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { subscriptionId } = req.body

      if (!subscriptionId) {
        res.status(400).json({ error: 'Subscription ID is required' })
        return
      }

      // Verify ownership
      const subscription = await SubscriptionService.getCurrentSubscription(userId)
      if (!subscription || subscription.id !== subscriptionId) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }

      const cancelledSubscription = await SubscriptionService.cancelSubscription(subscriptionId)

      res.json({
        subscription: {
          id: cancelledSubscription.id,
          status: cancelledSubscription.status,
          message:
            'Subscription cancelled successfully. You can still use premium features until the end date.',
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/subscription/check-expired (Internal/Cron)
   * Check và update expired subscriptions
   */
  static async checkExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Add authentication for cron job (API key or internal only)
      const count = await SubscriptionService.checkExpiredSubscriptions()
      res.json({ message: `Processed ${count} expired subscriptions` })
    } catch (error) {
      next(error)
    }
  }
}
