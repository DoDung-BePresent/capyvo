import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

/**
 * Script to check subscription status for all users
 * Useful for debugging and verifying subscription states
 */
async function checkSubscriptions() {
  console.log('📊 Checking subscription status...\n')

  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        email: 'asc',
      },
    })

    if (users.length === 0) {
      console.log('✅ No users found in the system.')
      return
    }

    console.log(`Found ${users.length} user(s):\n`)
    console.log('─'.repeat(80))

    for (const user of users) {
      const activeSub = user.subscriptions.find((s) => s.status === 'ACTIVE')

      console.log(`\n👤 ${user.email}`)
      console.log(`   Name: ${user.fullName || 'N/A'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Premium: ${user.isPremium ? '✅ Yes' : '❌ No'}`)
      console.log(
        `   Premium Until: ${user.premiumUntil ? user.premiumUntil.toISOString().split('T')[0] : 'N/A'}`,
      )

      if (user.subscriptions.length === 0) {
        console.log(`   Subscriptions: None`)
      } else {
        console.log(`   Subscriptions (${user.subscriptions.length}):`)
        for (const sub of user.subscriptions) {
          const isActive = sub.status === 'ACTIVE' ? '🟢' : '⚪'
          const startDate = sub.startDate.toISOString().split('T')[0]
          const endDate = sub.endDate.toISOString().split('T')[0]
          console.log(`      ${isActive} ${sub.planId} - ${sub.status} (${startDate} → ${endDate})`)
        }
      }

      if (activeSub) {
        console.log(`   ✅ Current Plan: ${activeSub.planId}`)
      } else {
        console.log(`   ⚠️  No active subscription`)
      }
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n✨ Check completed!')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

checkSubscriptions()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
