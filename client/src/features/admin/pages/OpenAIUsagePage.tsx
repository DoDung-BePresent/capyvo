import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Flex,
  Skeleton,
  DatePicker,
  Space,
  Tag,
  Table,
  Alert,
} from 'antd'
import { Area, Column } from '@ant-design/charts'
import { ApiOutlined, RobotOutlined, ThunderboltOutlined, DollarOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import { useOpenAIUsage } from '../hooks/useOpenAIUsage'
import dayjs, { type Dayjs } from 'dayjs'
import type { OpenAIUsageByModel } from '../services/openai-usage.service'

const { Text } = Typography
const { RangePicker } = DatePicker

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

const modelColumns = [
  {
    title: 'Model',
    dataIndex: 'model',
    key: 'model',
    render: (model: string) => <Text strong>{model}</Text>,
  },
  {
    title: 'Tokens',
    dataIndex: 'tokens',
    key: 'tokens',
    render: (tokens: number) => (
      <Tag icon={<ThunderboltOutlined />} color="gold">
        {formatNumber(tokens)}
      </Tag>
    ),
  },
  {
    title: 'Requests',
    dataIndex: 'requests',
    key: 'requests',
    render: (requests: number) => <Text>{requests.toLocaleString()}</Text>,
  },
  {
    title: 'Chi phí ước tính',
    dataIndex: 'costUsd',
    key: 'costUsd',
    render: (cost: number) => <Text strong>${cost.toFixed(2)}</Text>,
  },
]

export default function OpenAIUsagePage() {
  // Default to current month
  const now = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    now.startOf('month'),
    now.endOf('month'),
  ])

  const startDate = dateRange[0].format('YYYY-MM-DD')
  const endDate = dateRange[1].format('YYYY-MM-DD')

  const { data: stats, isLoading } = useOpenAIUsage(startDate, endDate)

  const handleDateChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    }
  }

  if (!stats?.configured && !isLoading) {
    return (
      <>
        <PageHeader
          title="OpenAI Usage"
          description="Theo dõi chi tiết việc sử dụng OpenAI API"
          breadcrumbs={[{ label: 'Admin Dashboard', href: '/admin' }, { label: 'OpenAI Usage' }]}
        />
        <Alert
          type="warning"
          message="Chưa cấu hình OPENAI_API_ADMIN_KEY"
          description="Vui lòng thêm OPENAI_API_ADMIN_KEY vào file .env để xem thống kê chi tiết."
          showIcon
        />
      </>
    )
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="OpenAI Usage"
        description="Theo dõi chi tiết việc sử dụng OpenAI API"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/admin' }, { label: 'OpenAI Usage' }]}
        extra={
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
        }
      />

      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        {[
          {
            title: 'Tổng Tokens',
            value: stats ? formatNumber(stats.totalTokens) : '—',
            icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#faad14' }} />,
            color: '#faad14',
          },
          {
            title: 'Tổng Requests',
            value: stats ? stats.totalRequests.toLocaleString() : '—',
            icon: <ApiOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
            color: '#1677ff',
          },
          {
            title: 'Chi phí ước tính',
            value: stats ? `$${stats.estimatedCostUsd.toFixed(2)}` : '—',
            icon: <DollarOutlined style={{ fontSize: 22, color: '#52c41a' }} />,
            color: '#52c41a',
          },
          {
            title: 'Trung bình/ngày',
            value: stats
              ? `$${(stats.estimatedCostUsd / Math.max(stats.dailyUsage.length, 1)).toFixed(2)}`
              : '—',
            icon: <RobotOutlined style={{ fontSize: 22, color: '#722ed1' }} />,
            color: '#722ed1',
          },
        ].map((item) => (
          <Col key={item.title} xs={24} sm={12} lg={6}>
            <Card styles={{ body: { padding: '16px 20px' } }}>
              <Flex justify="space-between" align="flex-start">
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.title}
                  </Text>
                  {isLoading ? (
                    <Skeleton.Input active size="small" style={{ marginTop: 4, width: 80 }} />
                  ) : (
                    <div style={{ fontSize: 22, fontWeight: 700, color: item.color, marginTop: 2 }}>
                      {item.value}
                    </div>
                  )}
                </div>
                <div style={{ opacity: 0.15, fontSize: 36 }}>{item.icon}</div>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Daily Usage Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Tokens theo ngày">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Area
                data={stats?.dailyUsage ?? []}
                xField="date"
                yField="tokens"
                shapeField="smooth"
                style={{ height: 300 }}
                axis={{
                  x: {
                    labelFormatter: (v: string) => dayjs(v).format('DD/MM'),
                  },
                  y: {
                    labelFormatter: (v: number) => formatNumber(v),
                  },
                }}
                tooltip={{
                  items: [
                    {
                      field: 'tokens',
                      name: 'Tokens',
                      valueFormatter: (v: number) => formatNumber(v),
                    },
                    {
                      field: 'requests',
                      name: 'Requests',
                      valueFormatter: (v: number) => v.toLocaleString(),
                    },
                  ],
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Requests theo ngày" style={{ height: '100%' }}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Column
                data={stats?.dailyUsage ?? []}
                xField="date"
                yField="requests"
                style={{ height: 300 }}
                axis={{
                  x: {
                    labelFormatter: (v: string) => dayjs(v).format('DD/MM'),
                  },
                }}
                tooltip={{
                  items: [
                    {
                      field: 'requests',
                      name: 'Requests',
                    },
                  ],
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Usage by Model */}
      <Card title="Phân bổ theo Model">
        <Table<OpenAIUsageByModel>
          dataSource={stats?.usageByModel ?? []}
          columns={modelColumns}
          rowKey="model"
          pagination={false}
          loading={isLoading}
        />
      </Card>
    </Space>
  )
}
