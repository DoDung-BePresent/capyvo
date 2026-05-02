import {
  Layout,
  Avatar,
  Dropdown,
  Typography,
  Button,
  Switch,
  Tooltip,
  Badge,
  App,
  Space,
} from 'antd'

/**
 * Icons
 */
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

/**
 * Hooks
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMe, useLogout } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMaintenance, useMaintenanceMutation } from '@/shared/hooks/useMaintenance'

/**
 * Components
 */
import { MaintenanceScheduleModal } from '@/features/admin/components/MaintenanceScheduleModal'

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
  const { isMaintenance, schedule } = useMaintenance()
  const { mutate: setMaintenance, isPending } = useMaintenanceMutation()
  const { modal } = App.useApp()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  function handleMaintenanceToggle(checked: boolean) {
    modal.confirm({
      title: checked ? 'Bật chế độ bảo trì?' : 'Tắt chế độ bảo trì?',
      content: checked
        ? 'Tất cả người dùng sẽ thấy trang bảo trì ngay lập tức.'
        : 'Hệ thống sẽ hoạt động bình thường trở lại.',
      okText: 'Xác nhận',
      cancelText: 'Huỷ',
      okButtonProps: { danger: checked },
      onOk: () => setMaintenance(checked),
    })
  }

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
    <>
      <Header className="border-b bg-white! p-1.25 px-5! flex justify-between items-center gap-3 border-[var(--ant-color-border-secondary)]">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{ fontSize: 16, color: '#666' }}
        />
        <Space size={12}>
          <Tooltip title={isMaintenance ? 'Đang bảo trì — click để tắt' : 'Bật chế độ bảo trì'}>
            <Switch
              checkedChildren={<ToolOutlined />}
              unCheckedChildren={<ToolOutlined />}
              checked={isMaintenance}
              loading={isPending}
              onChange={handleMaintenanceToggle}
              style={{ backgroundColor: isMaintenance ? '#faad14' : undefined }}
            />
          </Tooltip>
          <Tooltip title="Lên lịch bảo trì">
            <Badge dot={!!schedule} offset={[-2, 2]}>
              <Button
                type="text"
                icon={<CalendarOutlined />}
                onClick={() => setScheduleOpen(true)}
                style={{ color: schedule ? '#faad14' : '#666' }}
              />
            </Badge>
          </Tooltip>
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Avatar shape="square" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Space>
      </Header>

      <MaintenanceScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </>
  )
}

export default AppHeader
