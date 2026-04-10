import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { requestLogger } from '@/middlewares/request-logger'
import { errorHandler } from '@/middlewares/error-handler'
import { checkMaintenance } from '@/middlewares/check-maintenance'
import { maintenanceService } from '@/services/maintenance.service'
import apiRouter from '@/routes'
import swaggerSpec from '@/lib/swagger'

const app = express()

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

// API Docs (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))
}

// Initialize maintenance state from DB (non-blocking)
maintenanceService.init().catch(() => {})

// Maintenance check (before all API routes)
app.use('/api', checkMaintenance)

// Routes
app.use('/api', apiRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Global error handler (must be last)
app.use(errorHandler)

export default app
