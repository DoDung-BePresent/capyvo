import 'dotenv/config'
import { PrismaClient, SubscriptionPlanId } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...')

  const plans = [
    {
      id: SubscriptionPlanId.FREE,
      name: 'Miễn phí',
      durationDays: 0, // Permanent
      price: 0,
      pricePerMonth: 0,
      isActive: true,
    },
    {
      id: SubscriptionPlanId.TRIAL,
      name: 'Dùng thử',
      durationDays: 7,
      price: 0,
      pricePerMonth: 0,
      isActive: true,
    },
    {
      id: SubscriptionPlanId.PREMIUM,
      name: 'Premium',
      durationDays: 30,
      price: 49000,
      pricePerMonth: 49000,
      isActive: true,
    },
    {
      id: SubscriptionPlanId.CLASSROOM,
      name: 'Lớp học',
      durationDays: 365, // 1 year default, will be customized per teacher
      price: 0, // Contact for pricing
      pricePerMonth: 0,
      isActive: true,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    })
    console.log(`✅ Created/Updated plan: ${plan.name}`)
  }

  console.log('✨ Subscription plans seeded successfully!')
}

seedSubscriptionPlans()
  .catch((e) => {
    console.error('❌ Error seeding subscription plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
