import { Request, NextFunction, Response } from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { SubscriptionPlanId } from '@prisma/client'
import type { AuthRequest } from '@/middlewares/authenticate'

export class SubscriptionController {
  /**
   * GET /api/subscription/plans
   * Lấy danh sách các gói subscription
   */
  static async getPlans(req: Request, res: Response, _next: NextFunction) {
    try {
      const plans = await SubscriptionService.getPlans()

      // Format response để match với frontend
      const formattedPlans = plans.map((plan) => ({
        id: plan.id.toLowerCase(),
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price,
        pricePerMonth: plan.pricePerMonth,
        isActive: plan.isActive,
      }))

      res.json({ plans: formattedPlans })
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      res.status(500).json({ error: 'Failed to fetch subscription plans' })
    }
  }

  /**
   * GET /api/subscription/current
   * Lấy subscription hiện tại của user
   */
  static async getCurrentSubscription(req: Request, res: Response, _next: NextFunction) {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const subscription = await SubscriptionService.getCurrentSubscription(userId)

      if (!subscription) {
        return res.json({ subscription: null })
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
          autoRenew: subscription.autoRenew,
        },
      })
    } catch (error) {
      console.error('Error fetching current subscription:', error)
      res.status(500).json({ error: 'Failed to fetch subscription' })
    }
  }

  /**
   * GET /api/subscription/history
   * Lấy lịch sử subscriptions của user
   */
  static async getHistory(req: Request, res: Response, _next: NextFunction) {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const subscriptions = await SubscriptionService.getUserSubscriptions(userId)

      const formattedSubscriptions = subscriptions.map((sub) => ({
        id: sub.id,
        planId: sub.planId.toLowerCase(),
        planName: sub.plan.name,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        autoRenew: sub.autoRenew,
        createdAt: sub.createdAt,
      }))

      res.json({ subscriptions: formattedSubscriptions })
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      res.status(500).json({ error: 'Failed to fetch subscription history' })
    }
  }

  /**
   * POST /api/subscription/create
   * Tạo subscription mới (sau khi thanh toán thành công)
   */
  static async createSubscription(req: Request, res: Response, _next: NextFunction) {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { planId, paymentId } = req.body

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required' })
      }

      // Convert planId to enum
      const planIdEnum = planId.toUpperCase() as SubscriptionPlanId
      if (!Object.values(SubscriptionPlanId).includes(planIdEnum)) {
        return res.status(400).json({ error: 'Invalid plan ID' })
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
      console.error('Error creating subscription:', error)
      res.status(500).json({ error: 'Failed to create subscription' })
    }
  }

  /**
   * POST /api/subscription/cancel
   * Hủy subscription (không gia hạn)
   */
  static async cancelSubscription(req: Request, res: Response, _next: NextFunction) {
    try {
      const userId = (req as AuthRequest).userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { subscriptionId } = req.body

      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' })
      }

      // Verify ownership
      const subscription = await SubscriptionService.getCurrentSubscription(userId)
      if (!subscription || subscription.id !== subscriptionId) {
        return res.status(403).json({ error: 'Forbidden' })
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
      console.error('Error cancelling subscription:', error)
      res.status(500).json({ error: 'Failed to cancel subscription' })
    }
  }

  /**
   * POST /api/subscription/check-expired (Internal/Cron)
   * Check và update expired subscriptions
   */
  static async checkExpired(req: Request, res: Response, _next: NextFunction) {
    try {
      // TODO: Add authentication for cron job (API key or internal only)
      const count = await SubscriptionService.checkExpiredSubscriptions()
      res.json({ message: `Processed ${count} expired subscriptions` })
    } catch (error) {
      console.error('Error checking expired subscriptions:', error)
      res.status(500).json({ error: 'Failed to check expired subscriptions' })
    }
  }
}
