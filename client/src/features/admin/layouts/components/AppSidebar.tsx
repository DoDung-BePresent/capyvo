import { Layout, Menu, Typography } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Icons
 */
import { DashboardOutlined, FileDoneOutlined, ReadOutlined, SoundOutlined } from '@ant-design/icons'

/**
 * Types
 */
import { PART_META } from '@/features/admin/types'

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config'

const { Sider } = Layout
const { Text } = Typography

const MENU_ITEMS = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'questions',
    icon: <ReadOutlined />,
    label: 'Câu hỏi',
    children: [
      { key: '/admin/questions/part/1', label: PART_META[1].label },
      { key: '/admin/questions/part/2', label: PART_META[2].label },
      { key: '/admin/questions/part/3', label: PART_META[3].label },
      { key: '/admin/questions/part/4', label: PART_META[4].label },
      { key: '/admin/questions/part/5', label: PART_META[5].label },
    ],
  },
  {
    key: '/admin/exam-sets',
    icon: <FileDoneOutlined />,
    label: 'Bộ đề',
  },
  {
    key: '/admin/instructions',
    icon: <SoundOutlined />,
    label: 'Cấu hình giọng đọc',
  },
]

interface AppSidebarProps {
  collapsed: boolean
  onCollapse: (value: boolean) => void
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = location.pathname.startsWith('/admin/exam-sets')
    ? '/admin/exam-sets'
    : location.pathname
  const openKeys =
    !collapsed && location.pathname.startsWith('/admin/questions') ? ['questions'] : []

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={SIDEBAR_WIDTHS.width}
      collapsedWidth={SIDEBAR_WIDTHS.collapsedWidth}
      theme="light"
    >
      {/* Logo */}
      <div className="p-4 px-6">
        {!collapsed && (
          <Text style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>🐹 Capyvo</Text>
        )}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        items={MENU_ITEMS}
        style={{ borderRight: 0, marginTop: 8 }}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
