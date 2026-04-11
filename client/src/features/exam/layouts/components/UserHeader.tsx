import { Layout, Avatar, Dropdown, Typography, Button } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
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
      key: 'email',
      label: <Text type="secondary">{user?.email}</Text>,
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
    <Header
      style={{
        background: '#fff',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => onCollapse(!collapsed)}
        style={{ fontSize: 16, color: '#666' }}
      />
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Avatar shape="square" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
      </Dropdown>
    </Header>
  )
}
