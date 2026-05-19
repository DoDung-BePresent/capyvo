import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env, isDevelopment, isProduction } from '@/config/env'
import logger from './logger'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: isDevelopment ? ['query', 'warn', 'error'] : ['error'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (!isProduction) {
  globalForPrisma.prisma = prisma
}

prisma.$connect().then(() => {
  logger.info('Database connected')
})

export default prisma
