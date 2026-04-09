import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

const { Content } = Layout

export function UserContent() {
  return (
    <Content className="p-5 px-10 pb-0" style={{ overflowY: 'auto' }}>
      <Outlet />
    </Content>
  )
}
