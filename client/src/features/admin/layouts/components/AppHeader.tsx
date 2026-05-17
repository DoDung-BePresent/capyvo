import { Layout, Avatar, Dropdown, Typography, Button, Tooltip, Space } from 'antd'

/**
 * Icons
 */
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

/**
 * Hooks
 */
import { useNavigate } from 'react-router-dom'
import { useGetMe, useLogout } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'

const { Header } = Layout
const { Text } = Typography

interface AppHeaderProps {
  collapsed: boolean
  onCollapse: (value: boolean) => void
}

export function AppHeader({ collapsed, onCollapse }: AppHeaderProps) {
  const navigate = useNavigate()
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const { mutate: logout } = useLogout()

  const menuItems = [
    {
      key: 'name',
      label: (
        <div>
          <Text strong>{user?.fullName || 'Người dùng'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => logout(undefined, { onSuccess: () => navigate('/login', { replace: true }) }),
    },
  ]

  return (
    <Header className="border-b bg-white! p-1.25 px-5! flex justify-between items-center gap-3 border-[var(--ant-color-border-secondary)]">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => onCollapse(!collapsed)}
        style={{ fontSize: 16, color: '#666' }}
      />
      <Space size={12}>
        <Tooltip title="Quản lý lịch bảo trì">
          <Button
            type="text"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/admin/maintenance-schedules')}
            style={{ color: '#666' }}
          />
        </Tooltip>
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Avatar
            shape="square"
            src={user?.avatarUrl}
            icon={!user?.avatarUrl && <UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </Space>
    </Header>
  )
}

export default AppHeader
