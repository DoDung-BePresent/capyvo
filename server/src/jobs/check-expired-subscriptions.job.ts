import cron from 'node-cron'
import { SubscriptionService } from '../services/subscription.service'

/**
 * Cron job chạy hàng ngày lúc 00:00 để check expired subscriptions
 */
export function startSubscriptionCheckJob() {
  // Chạy mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Running subscription expiration check...')
    try {
      const count = await SubscriptionService.checkExpiredSubscriptions()
      console.log(`✅ Processed ${count} expired subscriptions`)
    } catch (error) {
      console.error('❌ Error checking expired subscriptions:', error)
    }
  })

  console.log('⏰ Subscription check cron job started (runs daily at 00:00)')
}
