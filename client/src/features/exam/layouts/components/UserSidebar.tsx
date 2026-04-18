import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Icons
 */
import { HomeOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons'

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config'
import { Logo } from '@/shared/components'

const { Sider } = Layout

const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, label: 'Trang chủ' },
  { key: '/practice', icon: <BookOutlined />, label: 'Luyện theo Part' },
  { key: '/exam', icon: <FileTextOutlined />, label: 'Thi thử' },
]

export interface UserSidebarProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export function UserSidebar({ collapsed }: UserSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey =
    location.pathname === '/'
      ? '/'
      : (MENU_ITEMS.slice(1).find((m) => location.pathname.startsWith(m.key))?.key ?? '/')

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={SIDEBAR_WIDTHS.width}
      collapsedWidth={SIDEBAR_WIDTHS.collapsedWidth}
      theme="light"
      style={{ height: '100vh', overflow: 'auto', position: 'sticky', top: 0 }}
      className="border-r border-[var(--ant-color-border-secondary)]"
    >
      {/* Logo */}
      <div className="p-5 py-4">
        <Logo collapsed={collapsed} />
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={MENU_ITEMS}
        style={{ borderRight: 0 }}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
