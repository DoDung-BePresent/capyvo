import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestLogger } from '@/middlewares/request-logger'
import { errorHandler } from '@/middlewares/error-handler'
import apiRouter from '@/routes'

const app = express()

// Security
app.use(helmet())
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

// Routes
app.use('/api', apiRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Global error handler (must be last)
app.use(errorHandler)

export default app
