import type { Request, Response, NextFunction } from 'express'
import supabaseAdmin from '@/lib/supabase'
import { UnauthorizedError } from '@/errors/app-error'
import logger from '@/lib/logger'

export interface AuthRequest extends Request {
  userId: string
  userEmail: string
  userMetadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication failed: Missing authorization token', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
      })
      throw new UnauthorizedError('Missing authorization token')
    }

    const token = authHeader.slice(7)
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      logger.warn('Authentication failed: Invalid or expired token', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        error: error?.message,
      })
      throw new UnauthorizedError('Invalid or expired token')
    }

    ;(req as AuthRequest).userId = data.user.id
    ;(req as AuthRequest).userEmail = data.user.email ?? ''
    ;(req as AuthRequest).userMetadata = {
      full_name: data.user.user_metadata?.full_name,
      avatar_url: data.user.user_metadata?.avatar_url,
    }

    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(role: 'ADMIN') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { default: prisma } = await import('@/lib/prisma')
      const user = await prisma.user.findUnique({
        where: { id: (req as AuthRequest).userId },
        select: { role: true },
      })
      if (!user || user.role !== role) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: (req as AuthRequest).userId,
          requiredRole: role,
          userRole: user?.role,
          path: req.path,
          ip: req.ip,
        })
        throw new UnauthorizedError(`Requires ${role} role`)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
