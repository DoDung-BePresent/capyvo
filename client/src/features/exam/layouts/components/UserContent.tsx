import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { ScrollTop, MaintenancePage } from '@/shared/components'
import { useMaintenance } from '@/shared/hooks/useMaintenance'

const { Content } = Layout

export function UserContent() {
  const { pathname } = useLocation()
  const { isMaintenance, schedule, isGlobal } = useMaintenance()

  // Show maintenance page for scope-specific maintenance (not global)
  // Global maintenance is handled by MaintenanceGate at app level
  if (isMaintenance && !isGlobal) {
    return (
      <Content className="px-10 p-8 pb-0" style={{ overflowY: 'auto' }}>
        <MaintenancePage
          className="min-h-0"
          endTime={schedule?.endAt ?? undefined}
          message={schedule?.message}
        />
      </Content>
    )
  }

  return (
    <Content className="p-5 px-10 pb-0" style={{ overflowY: 'auto' }}>
      <ScrollTop key={pathname}>
        <Outlet />
      </ScrollTop>
    </Content>
  )
}
