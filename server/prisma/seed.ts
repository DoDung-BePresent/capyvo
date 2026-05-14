import 'dotenv/config'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Main seed file that runs all seed scripts in order
 * This file is automatically executed by Prisma after migrations
 */
async function runAllSeeds() {
  console.log('🌱 Starting database seeding...\n')

  const seedFiles = [
    'seeds/seed-subscriptions.ts',
    'seeds/seed-topics.ts',
    // Add more seed files here as needed
  ]

  for (const seedFile of seedFiles) {
    const seedPath = path.join(__dirname, seedFile)
    console.log(`\n▶️  Running ${seedFile}...`)
    console.log('─'.repeat(60))

    try {
      execSync(`ts-node -r tsconfig-paths/register ${seedPath}`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      })
      console.log('─'.repeat(60))
      console.log(`✅ Completed ${seedFile}\n`)
    } catch (error) {
      console.error(`❌ Failed to run ${seedFile}:`, error)
      process.exit(1)
    }
  }

  console.log('\n🎉 All seeds completed successfully!')
}

runAllSeeds().catch((e) => {
  console.error('❌ Error running seeds:', e)
  process.exit(1)
})
