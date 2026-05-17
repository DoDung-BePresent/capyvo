import 'dotenv/config'

// Initialize Sentry FIRST (before any other imports)
import '@/lib/sentry'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import * as Sentry from '@sentry/node'
import { requestLogger } from '@/middlewares/request-logger'
import { errorHandler } from '@/middlewares/error-handler'
import { checkMaintenance } from '@/middlewares/check-maintenance'
import apiRouter from '@/routes'
import swaggerSpec from '@/lib/swagger'
import { redis } from '@/lib/redis'

const app = express()

// Sentry instrumentation (must be first middleware)
Sentry.setupExpressErrorHandler(app)

// Security
app.use(helmet({ contentSecurityPolicy: false })) // disable CSP for Swagger UI
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use(requestLogger)

// Bull Board (Queue Dashboard) - Only if Redis is available
if (redis) {
  import('@/lib/bull-board').then(({ serverAdapter }) => {
    app.use('/admin/queues', serverAdapter.getRouter())
  })
}

// API Docs (dev only)
if (process.env.NODE_ENV !== 'production') {
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
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-error', () => {
    throw new Error('Test error for Sentry')
  })
}

// Global error handler (must be last)
app.use(errorHandler)

export default app
