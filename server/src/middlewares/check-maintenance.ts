import type { Request, Response, NextFunction } from 'express'
import { maintenanceService } from '@/services/maintenance.service'
import supabaseAdmin from '@/lib/supabase'
import prisma from '@/lib/prisma'

export async function checkMaintenance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!maintenanceService.isEnabled()) {
    next()
    return
  }

  // Always allow maintenance status/events and auth endpoints
  if (req.path.startsWith('/maintenance') || req.path.startsWith('/auth')) {
    next()
    return
  }

  // Allow admins through
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const { data } = await supabaseAdmin.auth.getUser(token)
      if (data.user) {
        const user = await prisma.user.findUnique({
          where: { id: data.user.id },
          select: { role: true },
        })
        if (user?.role === 'ADMIN') {
          next()
          return
        }
      }
    } catch {
      // fall through to 503
    }
  }

  res.status(503).json({
    success: false,
    error: { message: 'Service is temporarily unavailable for maintenance.' },
  })
}
