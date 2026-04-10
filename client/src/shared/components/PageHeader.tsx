import { Breadcrumb, Typography, Space, Flex } from 'antd'
import { Helmet } from 'react-helmet-async'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const { Title, Text } = Typography

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  extra?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, extra }: PageHeaderProps) {
  return (
    <>
      <Helmet>
        <title>{title} — Capyvo Admin</title>
      </Helmet>

      <div style={{ marginBottom: 24 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            style={{ marginBottom: 8 }}
            items={breadcrumbs.map((b) =>
              b.href ? { title: <Link to={b.href}>{b.label}</Link> } : { title: b.label },
            )}
          />
        )}

        <Flex align="center" justify="space-between" gap={16}>
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ margin: 0 }}>
              {title}
            </Title>
            {description && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {description}
              </Text>
            )}
          </Space>

          {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
        </Flex>
      </div>
    </>
  )
}
