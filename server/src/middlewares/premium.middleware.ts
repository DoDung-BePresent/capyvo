import { Response, NextFunction } from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { TrialService } from '../services/trial.service'
import { AuthRequest } from '@/middlewares/authenticate'

/**
 * Middleware to check if user has premium subscription (including trial)
 */
export async function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const isPremium = await SubscriptionService.isPremiumUser(userId)

    if (!isPremium) {
      // Get trial status to provide better error message
      const trialStatus = await TrialService.getTrialStatus(userId)

      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: trialStatus?.hasUsedTrial
          ? 'Gói dùng thử đã hết hạn. Vui lòng nâng cấp lên Premium để tiếp tục sử dụng tính năng này.'
          : 'Bạn cần nâng cấp lên Premium để sử dụng tính năng này.',
        upgradeUrl: '/pricing',
        trialStatus,
      })
    }

    next()
  } catch (error) {
    console.error('Error checking premium status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify premium status',
    })
  }
}

/**
 * Extended AuthRequest with premium and trial info
 */
export interface PremiumAuthRequest extends AuthRequest {
  isPremium?: boolean
  isOnTrial?: boolean
  isFreeUser?: boolean
}

/**
 * Middleware to check premium status without blocking (adds flags only)
 */
export async function checkPremium(req: PremiumAuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId

    if (userId) {
      const [isPremium, trialStatus] = await Promise.all([
        SubscriptionService.isPremiumUser(userId),
        TrialService.getTrialStatus(userId),
      ])

      req.isPremium = isPremium
      req.isOnTrial = trialStatus.isOnTrial
      req.isFreeUser = !isPremium
    }

    next()
  } catch (error) {
    console.error('Error checking premium status:', error)
    next() // Continue anyway
  }
}

/**
 * Middleware to block FREE users from accessing premium features
 */
export async function blockFreeUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const isFree = await SubscriptionService.isFreeUser(userId)

    if (isFree) {
      return res.status(403).json({
        success: false,
        error: 'Premium feature',
        message: 'Tính năng này chỉ dành cho người dùng Premium. Vui lòng nâng cấp để sử dụng.',
        upgradeUrl: '/pricing',
      })
    }

    next()
  } catch (error) {
    console.error('Error checking user plan:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify user plan',
    })
  }
}
