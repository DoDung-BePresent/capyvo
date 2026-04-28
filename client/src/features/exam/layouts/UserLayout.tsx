import { useState } from 'react'
import { ConfigProvider, Layout } from 'antd'
import { UserSidebar, UserHeader, UserContent } from './components'
import { NetworkStatusBanner, ScheduledMaintenanceBanner } from '@/shared/components'
import { userAntTheme } from '../config/user-ui.config'

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ConfigProvider theme={userAntTheme}>
      <NetworkStatusBanner />
      <ScheduledMaintenanceBanner />
      <Layout hasSider style={{ height: '100vh', overflow: 'hidden' }}>
        <UserSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <UserHeader collapsed={collapsed} onCollapse={setCollapsed} />
          <UserContent />
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
