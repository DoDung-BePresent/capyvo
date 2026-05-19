import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

async function seedAppSettings() {
  console.log('🌱 Seeding app settings...')

  const settings = [
    {
      key: 'PREMIUM_TRIAL_DAYS',
      value: '7',
      description: 'Number of days for premium trial (default: 7)',
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Enable/disable maintenance mode',
    },
  ]

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
    console.log(`✅ Created/Updated setting: ${setting.key} = ${setting.value}`)
  }

  console.log('✨ App settings seeded successfully!')
}

seedAppSettings()
  .catch((e) => {
    console.error('❌ Error seeding app settings:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
