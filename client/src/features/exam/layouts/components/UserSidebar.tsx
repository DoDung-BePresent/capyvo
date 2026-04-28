import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Icons
 */
import { ThunderboltOutlined } from '@ant-design/icons'

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config'
import { Logo } from '@/shared/components'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'
import { Assignment, HomeFilled, RecordVoiceOver } from '@mui/icons-material'

const { Sider } = Layout

const MENU_ITEMS = [
  { key: '/', icon: <HomeFilled style={{ fontSize: 22 }} />, label: 'Trang chủ' },
  {
    key: '/practice',
    icon: <RecordVoiceOver style={{ fontSize: 22, marginLeft: 1 }} />,
    label: 'Luyện theo Part',
  },
  { key: '/exam', icon: <Assignment style={{ fontSize: 22 }} />, label: 'Thi thử' },
]

export interface UserSidebarProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export function UserSidebar({ collapsed }: UserSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useSession()
  const { data: user } = useGetMe(session)

  const selectedKey =
    location.pathname === '/'
      ? '/'
      : (MENU_ITEMS.slice(1).find((m) => location.pathname.startsWith(m.key))?.key ?? '/')

  const credits = user?.transcriptionCredits ?? 0

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={SIDEBAR_WIDTHS.width}
      collapsedWidth={SIDEBAR_WIDTHS.collapsedWidth}
      theme="light"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
      className="border-r border-(--ant-color-border-secondary)"
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
        style={{ borderRight: 0, flex: 1 }}
        onClick={({ key }) => navigate(key)}
        styles={{
          root: {
            paddingInline: 15,
          },
          item: {
            borderRadius: 8,
            paddingInline: 15,
          },
        }}
      />

      {/* Token widget */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid var(--ant-color-border-secondary)',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onClick={() => navigate('/payment')}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.background =
            'var(--ant-color-fill-quaternary)')
        }
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
      >
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ThunderboltOutlined style={{ fontSize: 18, color: '#faad14' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#faad14' }}>{credits}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThunderboltOutlined style={{ fontSize: 16, color: '#faad14' }} />
              <div>
                <div
                  style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)', lineHeight: 1.2 }}
                >
                  Token còn lại
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#faad14', lineHeight: 1.4 }}>
                  {credits}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ant-color-primary)', fontWeight: 500 }}>
              + Mua
            </span>
          </div>
        )}
      </div>
    </Sider>
  )
}
