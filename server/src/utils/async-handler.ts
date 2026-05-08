import type { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Async handler wrapper - eliminates repetitive try-catch in controllers
 * Usage: router.get('/', asyncHandler(controller.method))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
