import type { Request, Response, NextFunction } from 'express'
import { MaintenanceScheduleService } from '@/services/maintenance-schedule.service'
import { MaintenanceScope } from '@prisma/client'
import supabaseAdmin from '@/lib/supabase'
import prisma from '@/lib/prisma'

/**
 * Map request paths to maintenance scopes
 */
function getMaintenanceScope(path: string): MaintenanceScope | null {
  // Remove /api prefix if present
  const cleanPath = path.startsWith('/api') ? path.slice(4) : path

  if (cleanPath.startsWith('/pricing') || cleanPath.startsWith('/payments')) {
    return MaintenanceScope.PRICING
  }
  if (cleanPath.startsWith('/practice')) {
    return MaintenanceScope.PRACTICE
  }
  if (cleanPath.startsWith('/exam')) {
    return MaintenanceScope.EXAM
  }
  if (cleanPath.startsWith('/admin')) {
    return MaintenanceScope.ADMIN
  }
  return null
}

export async function checkMaintenance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Always allow maintenance-schedules and auth endpoints
  if (
    req.path.startsWith('/maintenance-schedules') ||
    req.path.startsWith('/auth') ||
    req.path === '/health'
  ) {
    next()
    return
  }

  // Check if user is admin (admins bypass maintenance)
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
      // fall through to maintenance check
    }
  }

  // Determine scope from request path
  const scope = getMaintenanceScope(req.path)

  // Check GLOBAL maintenance first
  const globalCheck = await MaintenanceScheduleService.checkMaintenance(MaintenanceScope.GLOBAL)
  if (globalCheck.isUnderMaintenance) {
    res.status(503).json({
      success: false,
      error: {
        message:
          globalCheck.schedule?.message || 'Service is temporarily unavailable for maintenance.',
        scope: 'GLOBAL',
        schedule: globalCheck.schedule,
      },
    })
    return
  }

  // Check scope-specific maintenance
  if (scope) {
    const scopeCheck = await MaintenanceScheduleService.checkMaintenance(scope)
    if (scopeCheck.isUnderMaintenance) {
      res.status(503).json({
        success: false,
        error: {
          message:
            scopeCheck.schedule?.message ||
            'This section is temporarily unavailable for maintenance.',
          scope,
          schedule: scopeCheck.schedule,
        },
      })
      return
    }
  }

  next()
}
