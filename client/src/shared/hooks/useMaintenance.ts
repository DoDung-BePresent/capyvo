import { useEffect, useState } from 'react'
import axiosInstance from '@/lib/axios'

export interface MaintenanceSchedule {
  id: string
  scope: string
  title: string
  message: string
  startAt: string | null
  endAt: string | null
  isActive: boolean
}

export interface MaintenanceStatus {
  isUnderMaintenance: boolean
  schedule: MaintenanceSchedule | null
}

/**
 * Map frontend paths to maintenance scopes
 */
function getMaintenanceScope(pathname: string): string | null {
  if (pathname.startsWith('/pricing') || pathname.startsWith('/payment')) {
    return 'pricing'
  }
  if (pathname.startsWith('/practice')) {
    return 'practice'
  }
  if (pathname.startsWith('/exam')) {
    return 'exam'
  }
  if (pathname.startsWith('/admin')) {
    return 'admin'
  }
  return null
}

/**
 * Hook to check maintenance status
 * Polls every 30 seconds to check if maintenance is active
 * Checks both GLOBAL and scope-specific maintenance based on current route
 *
 * @returns {object} Maintenance status
 * @returns {boolean} isMaintenance - Whether maintenance is active
 * @returns {MaintenanceSchedule | null} schedule - Active maintenance schedule
 * @returns {boolean} isGlobal - Whether it's GLOBAL maintenance (true) or scope-specific (false)
 */
export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null)
  const [isGlobal, setIsGlobal] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    // Listen for route changes (popstate for back/forward, custom event for programmatic navigation)
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleRouteChange)

    // Listen for custom route change event (dispatched by React Router)
    const handleCustomRouteChange = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('routechange', handleCustomRouteChange)

    // Also check on interval in case route changed without events
    const pathCheckInterval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname)
      }
    }, 1000)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('routechange', handleCustomRouteChange)
      clearInterval(pathCheckInterval)
    }
  }, [currentPath])

  useEffect(() => {
    async function checkMaintenance() {
      try {
        // Always check GLOBAL maintenance first
        const { data: globalData } = await axiosInstance.get<{
          success: boolean
          data: MaintenanceStatus
        }>('/maintenance-schedules/check/global')

        if (globalData.data.isUnderMaintenance) {
          setIsMaintenance(true)
          setSchedule(globalData.data.schedule)
          setIsGlobal(true)
          return
        }

        // Check scope-specific maintenance based on current route
        const scope = getMaintenanceScope(currentPath)
        if (scope) {
          const { data: scopeData } = await axiosInstance.get<{
            success: boolean
            data: MaintenanceStatus
          }>(`/maintenance-schedules/check/${scope}`)

          setIsMaintenance(scopeData.data.isUnderMaintenance)
          setSchedule(scopeData.data.schedule)
          setIsGlobal(false)
        } else {
          // No scope-specific maintenance for this route
          setIsMaintenance(false)
          setSchedule(null)
          setIsGlobal(false)
        }
      } catch {
        // If API fails, assume no maintenance
        setIsMaintenance(false)
        setSchedule(null)
        setIsGlobal(false)
      }
    }

    // Check immediately
    void checkMaintenance()

    // Poll every 30 seconds
    const interval = setInterval(() => {
      void checkMaintenance()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentPath])

  return { isMaintenance, schedule, isGlobal }
}
