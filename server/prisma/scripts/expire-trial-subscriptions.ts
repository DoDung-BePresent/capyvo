import 'dotenv/config'
import { PrismaClient, SubscriptionPlanId, SubscriptionStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

/**
 * Script to expire all TRIAL subscriptions and convert them to FREE
 * This is useful for testing FREE tier functionality without waiting 7 days
 */
async function expireTrialSubscriptions() {
  console.log('🔄 Starting trial subscription expiration...\n')

  try {
    // Find all active TRIAL subscriptions
    const trialSubscriptions = await prisma.subscription.findMany({
      where: {
        planId: SubscriptionPlanId.TRIAL,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    })

    if (trialSubscriptions.length === 0) {
      console.log('✅ No active TRIAL subscriptions found. Nothing to do.')
      return
    }

    console.log(`📊 Found ${trialSubscriptions.length} active TRIAL subscription(s):\n`)

    for (const sub of trialSubscriptions) {
      console.log(`   - ${sub.user.email} (${sub.user.fullName || 'No name'})`)
    }

    console.log('\n🔄 Processing subscriptions...\n')

    let successCount = 0
    let errorCount = 0

    for (const sub of trialSubscriptions) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Expire the TRIAL subscription
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              status: SubscriptionStatus.EXPIRED,
              endDate: new Date(), // Set end date to now
            },
          })

          // 2. Create a new FREE subscription
          await tx.subscription.create({
            data: {
              userId: sub.userId,
              planId: SubscriptionPlanId.FREE,
              status: SubscriptionStatus.ACTIVE,
              startDate: new Date(),
              endDate: new Date('2099-12-31'), // Far future date for FREE plan
            },
          })

          // 3. Update user cache fields
          await tx.user.update({
            where: { id: sub.userId },
            data: {
              isPremium: false,
              premiumUntil: null,
            },
          })
        })

        console.log(`   ✅ ${sub.user.email} - TRIAL → FREE`)
        successCount++
      } catch (error) {
        console.error(`   ❌ ${sub.user.email} - Error:`, error)
        errorCount++
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total: ${trialSubscriptions.length}`)
    console.log('\n✨ Trial expiration completed!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

expireTrialSubscriptions()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
