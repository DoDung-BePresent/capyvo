import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { ScrollTop } from '@/shared/components'

const { Content } = Layout

export function AppContent() {
  const { pathname } = useLocation()
  return (
    <Content className="p-5 px-10 pb-0" style={{ overflowY: 'auto' }}>
      <ScrollTop key={pathname}>
        <Outlet />
      </ScrollTop>
    </Content>
  )
}
