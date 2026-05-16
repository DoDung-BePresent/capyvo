import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Icons
 */
import {
  DashboardOutlined,
  FileDoneOutlined,
  ReadOutlined,
  TagsOutlined,
  RobotOutlined,
  CalculatorOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'

/**
 * Types
 */
import { PART_META } from '@/features/admin/types'

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config'

/**
 * Components
 */
import { Logo } from '@/shared/components'

const { Sider } = Layout

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
    key: '/admin/topics',
    icon: <TagsOutlined />,
    label: 'Chủ đề',
  },
  {
    key: '/admin/trial-settings',
    icon: <ClockCircleOutlined />,
    label: 'Premium Trial',
  },
  {
    key: '/admin/openai-usage',
    icon: <RobotOutlined />,
    label: 'OpenAI Usage',
  },
  {
    key: '/admin/pricing-calculator',
    icon: <CalculatorOutlined />,
    label: 'Pricing Calculator',
  },
  {
    key: '/admin/abuse-detection',
    icon: <SafetyOutlined />,
    label: 'Abuse Detection',
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
        defaultOpenKeys={openKeys}
        items={MENU_ITEMS}
        style={{ borderRight: 0 }}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
