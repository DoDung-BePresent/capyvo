import { Layout } from 'antd'
import type { ReactNode } from 'react'

const { Content } = Layout

interface AppContentProps {
  children: ReactNode
}

export function AppContent({ children }: AppContentProps) {
  return <Content>{children}</Content>
}
