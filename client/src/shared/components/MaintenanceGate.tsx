import type { ReactNode } from 'react'
import { useMaintenance } from '@/shared/hooks/useMaintenance'
import { MaintenancePage } from './ErrorPages'

interface MaintenanceGateProps {
  children: ReactNode
}

export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { isMaintenance, schedule } = useMaintenance()

  // Admin routes bypass the gate (they authenticate server-side anyway)
  if (isMaintenance && !window.location.pathname.startsWith('/admin')) {
    return <MaintenancePage endTime={schedule?.end} message={schedule?.message} />
  }

  return <>{children}</>
}
