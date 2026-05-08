import { Response, NextFunction } from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { AuthRequest } from '@/middlewares/authenticate'

/**
 * Middleware to check if user has premium subscription
 */
export async function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const isPremium = await SubscriptionService.isPremiumUser(userId)

    if (!isPremium) {
      return res.status(403).json({
        error: 'Premium subscription required',
        message: 'Bạn cần nâng cấp lên Premium để sử dụng tính năng này',
        upgradeUrl: '/pricing',
      })
    }

    next()
  } catch (error) {
    console.error('Error checking premium status:', error)
    res.status(500).json({ error: 'Failed to verify premium status' })
  }
}

/**
 * Extended AuthRequest with isPremium flag
 */
export interface PremiumAuthRequest extends AuthRequest {
  isPremium?: boolean
}

/**
 * Middleware to check premium status without blocking (adds flag only)
 */
export async function checkPremium(req: PremiumAuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId

    if (userId) {
      const isPremium = await SubscriptionService.isPremiumUser(userId)
      req.isPremium = isPremium
    }

    next()
  } catch (error) {
    console.error('Error checking premium status:', error)
    next() // Continue anyway
  }
}
