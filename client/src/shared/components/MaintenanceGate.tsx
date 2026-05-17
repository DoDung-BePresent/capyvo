import type { ReactNode } from 'react'
import { useMaintenance } from '@/shared/hooks/useMaintenance'
import { MaintenancePage } from './ErrorPages'

interface MaintenanceGateProps {
  children: ReactNode
}

export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { isMaintenance, schedule, isGlobal } = useMaintenance()

  // Only block at app level for GLOBAL maintenance
  // Scope-specific maintenance will be handled in UserContent
  if (isMaintenance && isGlobal && !window.location.pathname.startsWith('/admin')) {
    return <MaintenancePage endTime={schedule?.endAt ?? undefined} message={schedule?.message} />
  }

  return <>{children}</>
}
