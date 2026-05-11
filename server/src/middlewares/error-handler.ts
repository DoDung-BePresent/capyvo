import type { Request, Response, NextFunction } from 'express'
import { ZodError, type ZodIssue } from 'zod'
import { AppError } from '@/errors/app-error'
import logger from '@/lib/logger'
import * as Sentry from '@sentry/node'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: (err.issues as ZodIssue[]).map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, path: req.path })
      // Capture 5xx errors to Sentry
      Sentry.captureException(err, {
        level: 'error',
        tags: {
          statusCode: err.statusCode,
          path: req.path,
        },
      })
    } else {
      logger.warn(err.message, { statusCode: err.statusCode, path: req.path })
      // Don't send 4xx errors to Sentry (they're expected)
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  // Unknown / unexpected errors - ALWAYS capture to Sentry
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  })

  Sentry.captureException(err, {
    level: 'fatal',
    tags: {
      path: req.path,
      method: req.method,
    },
    extra: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
  })

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
