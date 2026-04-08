import { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppSidebar, AppHeader, AppContent, AppFooter } from './components'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout hasSider style={{ height: '100vh', overflow: 'hidden' }}>
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <Layout>
        <AppHeader collapsed={collapsed} onCollapse={setCollapsed} />
        <AppContent>
          <Outlet />
          <AppFooter />
        </AppContent>
      </Layout>
    </Layout>
  )
}
