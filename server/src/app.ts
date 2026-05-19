import 'dotenv/config'

// Validate environment variables FIRST (before any other imports)
import '@/config/env'

// Initialize Sentry SECOND (after env validation)
import '@/lib/sentry'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import * as Sentry from '@sentry/node'
import { env, isProduction } from '@/config/env'
import { requestLogger } from '@/middlewares/request-logger'
import { errorHandler } from '@/middlewares/error-handler'
import { checkMaintenance } from '@/middlewares/check-maintenance'
import apiRouter from '@/routes'
import swaggerSpec from '@/lib/swagger'
import { redis } from '@/lib/redis'
import logger from '@/lib/logger'

const app = express()

// Sentry instrumentation (must be first middleware)
Sentry.setupExpressErrorHandler(app)

// Security
app.use(helmet({ contentSecurityPolicy: false })) // disable CSP for Swagger UI

// CORS configuration with strict origin validation
const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL].filter((origin): origin is string =>
  Boolean(origin),
)

// In production, CLIENT_URL must be configured
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CLIENT_URL must be configured in production')
}

// Fallback for development
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173')
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        logger.warn('Blocked CORS request from unauthorized origin', { origin })
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger)

// Bull Board (Queue Dashboard) - Only if Redis is available
if (redis) {
  import('@/lib/bull-board').then(({ serverAdapter }) => {
    app.use('/admin/queues', serverAdapter.getRouter())
  })
}

// API Docs (dev only)
if (!isProduction) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))
}

// Maintenance check (before all API routes)
app.use('/api', checkMaintenance)

// Routes
app.use('/api', apiRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Test error endpoint (dev only)
if (!isProduction) {
  app.get('/api/test-error', () => {
    throw new Error('Test error for Sentry')
  })
}

// Global error handler (must be last)
app.use(errorHandler)

export default app
