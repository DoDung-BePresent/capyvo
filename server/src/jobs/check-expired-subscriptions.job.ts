import cron from 'node-cron'
import { SubscriptionService } from '../services/subscription.service'
import { TrialService } from '../services/trial.service'

/**
 * Cron job chạy hàng ngày lúc 00:00 để check expired subscriptions và trials
 */
export function startSubscriptionCheckJob() {
  // Chạy mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Running subscription and trial expiration check...')
    try {
      // Check expired subscriptions
      const subscriptionCount = await SubscriptionService.checkExpiredSubscriptions()
      console.log(`✅ Processed ${subscriptionCount} expired subscriptions`)

      // Check expired trials
      const trialCount = await TrialService.checkExpiredTrials()
      console.log(`✅ Processed ${trialCount} expired trials`)
    } catch (error) {
      console.error('❌ Error checking expired subscriptions/trials:', error)
    }
  })

  console.log('⏰ Subscription & trial check cron job started (runs daily at 00:00)')
}
