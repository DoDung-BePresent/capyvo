import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  ReadOutlined,
  PictureOutlined,
  MessageOutlined,
  TableOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { PART_META } from '../types'

const { Sider, Content } = Layout
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
      {
        key: '/admin/questions/part/1',
        icon: <ReadOutlined />,
        label: PART_META[1].description,
      },
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
      {
        key: '/admin/questions/part/4',
        icon: <TableOutlined />,
        label: PART_META[4].description,
      },
      {
        key: '/admin/questions/part/5',
        icon: <BulbOutlined />,
        label: PART_META[5].description,
      },
    ],
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine which menu keys are open/selected
  const selectedKey = location.pathname
  const openKeys = location.pathname.startsWith('/admin/questions') ? ['questions'] : []

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        width={240}
        theme="dark"
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, overflow: 'auto' }}
      >
        <div
          style={{
            height: 48,
            margin: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
            🐹 Capyvo
          </Text>
          <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>Admin</Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ marginLeft: 240 }}>
        <Content style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
