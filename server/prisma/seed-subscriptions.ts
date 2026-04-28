import 'dotenv/config'
import { PrismaClient, SubscriptionPlanId } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...')

  const plans = [
    {
      id: SubscriptionPlanId.MONTHLY,
      name: '1 THÁNG',
      durationDays: 30,
      price: 90000,
      pricePerMonth: 90000,
      isActive: true,
    },
    {
      id: SubscriptionPlanId.QUARTERLY,
      name: '3 THÁNG',
      durationDays: 90,
      price: 255000,
      pricePerMonth: 85000,
      isActive: true,
    },
    {
      id: SubscriptionPlanId.BIANNUAL,
      name: '6 THÁNG',
      durationDays: 180,
      price: 480000,
      pricePerMonth: 80000,
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
