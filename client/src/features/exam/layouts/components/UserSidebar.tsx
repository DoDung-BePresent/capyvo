import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Icons
 */
import { Assignment, HomeFilled, RecordVoiceOver } from '@mui/icons-material'

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'

/**
 * Hooks
 */
import { useCurrentSubscription } from '@/features/auth/hooks/useSubscription'

/**
 * Components
 */
import { Logo } from '@/shared/components'
import { UpgradeWidget } from './UpgradeWidget'

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

const Bottom = styled('div', 'absolute bottom-0 w-full')
export interface UserSidebarProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export function UserSidebar({ collapsed }: UserSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useCurrentSubscription()

  const selectedKey =
    location.pathname === '/'
      ? '/'
      : (MENU_ITEMS.slice(1).find((m) => location.pathname.startsWith(m.key))?.key ?? '/')

  // Get subscription info - ONLY use subscriptionData (don't fallback to user data)
  // This prevents showing TRIAL from user cache before subscription API loads
  const isPremium = subscriptionData?.isPremium ?? false
  const trialStatus = subscriptionData?.trialStatus
  const isOnTrial = trialStatus?.isOnTrial ?? false
  const daysRemaining =
    subscriptionData?.subscription?.daysRemaining ?? trialStatus?.daysRemaining ?? null
  const planName = subscriptionData?.plan ?? 'FREE'

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
            paddingInline: collapsed ? 7 : 15,
          },
          item: {
            borderRadius: 8,
            paddingInline: 15,
          },
        }}
      />

      {/* Upgrade Widget */}
      <Bottom>
        <UpgradeWidget
          collapsed={collapsed}
          onUpgrade={() => navigate('/pricing')}
          isPremium={isPremium}
          isOnTrial={isOnTrial}
          daysRemaining={daysRemaining}
          planName={planName}
          isLoading={isLoadingSubscription}
        />
      </Bottom>
    </Sider>
  )
}
