import { useState } from 'react'
import { Layout } from 'antd'
import { AppSidebar, AppHeader, AppContent, AppFooter } from './components'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout hasSider style={{ height: '100vh', overflow: 'hidden' }}>
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <Layout>
        <AppHeader collapsed={collapsed} onCollapse={setCollapsed} />
        <AppContent />
        <AppFooter />
      </Layout>
    </Layout>
  )
}
