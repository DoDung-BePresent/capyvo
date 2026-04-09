import { Layout, Typography } from 'antd'

const { Footer } = Layout
const { Text } = Typography

export function UserFooter() {
  return (
    <Footer>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Capyvo ©{new Date().getFullYear()} — TOEIC Speaking Simulator
      </Text>
    </Footer>
  )
}
