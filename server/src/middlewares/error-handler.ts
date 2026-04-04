import type { Request, Response, NextFunction } from 'express'
import { ZodError, type ZodIssue } from 'zod'
import { AppError } from '@/errors/app-error'
import logger from '@/lib/logger'

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
    } else {
      logger.warn(err.message, { statusCode: err.statusCode, path: req.path })
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  // Unknown / unexpected errors
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  })

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
