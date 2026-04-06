import { Layout, Space, Avatar, Dropdown, Typography, theme } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGetMe, useLogout } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'

const { Header } = Layout
const { Text, Link } = Typography

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/questions': 'Câu hỏi',
  '/admin/questions/part/1': 'Part 1',
  '/admin/questions/part/2': 'Part 2',
  '/admin/questions/part/3': 'Part 3',
  '/admin/questions/part/4': 'Part 4',
  '/admin/questions/part/5': 'Part 5',
}

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const { mutate: logout } = useLogout()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const pageTitle = BREADCRUMB_MAP[location.pathname] ?? 'Admin'

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
    <Header style={{ background: colorBgContainer }}>
      {/* Breadcrumb-style title */}
      <Space size={4}>
        <Link onClick={() => navigate('/admin')} style={{ color: '#888', fontSize: 13 }}>
          Dashboard
        </Link>
        {location.pathname !== '/admin' && (
          <>
            <Text style={{ color: '#ccc' }}>/</Text>
            <Text style={{ fontSize: 13, fontWeight: 600 }}>{pageTitle}</Text>
          </>
        )}
      </Space>

      {/* User avatar + dropdown */}
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Avatar
          size="small"
          icon={<UserOutlined />}
          style={{ cursor: 'pointer', background: '#4F46E5' }}
        />
      </Dropdown>
    </Header>
  )
}
