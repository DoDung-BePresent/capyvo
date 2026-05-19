import { Layout, Avatar, Dropdown, Typography, Button } from 'antd'

/**
 * Icons
 */
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

/**
 * Hooks
 */
import { useNavigate } from 'react-router-dom'
import { useGetMe, useLogout } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'

const { Header } = Layout
const { Text } = Typography

export interface UserHeaderProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export function UserHeader({ collapsed, onCollapse }: UserHeaderProps) {
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
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Avatar
          shape="square"
          src={user?.avatarUrl}
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
        />
      </Dropdown>
    </Header>
  )
}
