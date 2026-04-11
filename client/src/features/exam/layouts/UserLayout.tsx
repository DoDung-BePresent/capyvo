import { useState } from 'react'
import { Layout } from 'antd'
import { UserSidebar, UserHeader, UserContent, UserFooter } from './components'
import { NetworkStatusBanner, ScheduledMaintenanceBanner } from '@/shared/components'

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <NetworkStatusBanner />
      <ScheduledMaintenanceBanner />
      <Layout hasSider style={{ height: '100vh', overflow: 'hidden' }}>
        <UserSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <UserHeader collapsed={collapsed} onCollapse={setCollapsed} />
          <UserContent />
          <UserFooter />
        </Layout>
      </Layout>
    </>
  )
}
