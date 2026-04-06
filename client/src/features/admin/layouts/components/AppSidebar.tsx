import { Layout, Menu, Typography, Button } from 'antd'
import {
  DashboardOutlined,
  ReadOutlined,
  PictureOutlined,
  MessageOutlined,
  TableOutlined,
  BulbOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { PART_META } from '../../types'

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
      { key: '/admin/questions/part/1', icon: <ReadOutlined />, label: PART_META[1].description },
      {
        key: '/admin/questions/part/2',
        icon: <PictureOutlined />,
        label: PART_META[2].description,
      },
      {
        key: '/admin/questions/part/3',
        icon: <MessageOutlined />,
        label: PART_META[3].description,
      },
      { key: '/admin/questions/part/4', icon: <TableOutlined />, label: PART_META[4].description },
      { key: '/admin/questions/part/5', icon: <BulbOutlined />, label: PART_META[5].description },
    ],
  },
]

interface AppSidebarProps {
  collapsed: boolean
  onCollapse: (value: boolean) => void
}

export function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = location.pathname
  const openKeys =
    !collapsed && location.pathname.startsWith('/admin/questions') ? ['questions'] : []

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      collapsedWidth={64}
      theme="light"
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 20px' : '0 16px 0 20px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {!collapsed && (
          <Text style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>🐹 Capyvo</Text>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{ color: '#666' }}
        />
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
