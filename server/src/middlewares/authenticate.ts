import type { Request, Response, NextFunction } from 'express'
import supabaseAdmin from '@/lib/supabase'
import { UnauthorizedError } from '@/errors/app-error'

export interface AuthRequest extends Request {
  userId: string
  userEmail: string
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing authorization token')
    }

    const token = authHeader.slice(7)
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token')
    }

    ;(req as AuthRequest).userId = data.user.id
    ;(req as AuthRequest).userEmail = data.user.email ?? ''

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
        throw new UnauthorizedError(`Requires ${role} role`)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
