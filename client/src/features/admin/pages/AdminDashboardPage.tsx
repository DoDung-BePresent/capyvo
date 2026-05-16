import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Table, Tag, Space, Flex, Tooltip, Skeleton } from 'antd'
import {
  EditOutlined,
  RobotOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  TeamOutlined,
  ApiOutlined,
} from '@ant-design/icons'
import { Area, Column, Pie } from '@ant-design/charts'
import { PageHeader } from '@/shared/components'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import dayjs from 'dayjs'
import type { RecentPayment } from '../hooks/useAdminDashboard'

const { Text } = Typography

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const recentPaymentColumns = [
  {
    title: 'Người dùng',
    key: 'user',
    render: (r: RecentPayment) => (
      <Space vertical size={0}>
        <Text strong style={{ fontSize: 13 }}>
          {r.userFullName ?? '—'}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.userEmail}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Token',
    dataIndex: 'tokenAmount',
    key: 'tokenAmount',
    render: (v: number | null) =>
      v ? (
        <Tag icon={<ThunderboltOutlined />} color="gold">
          {v} token
        </Tag>
      ) : (
        '—'
      ),
  },
  {
    title: 'Số tiền',
    dataIndex: 'amount',
    key: 'amount',
    render: (v: number) => <Text strong>{formatVND(v)}</Text>,
  },
  {
    title: 'Thời gian',
    dataIndex: 'paidAt',
    key: 'paidAt',
    render: (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
  },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading, refetch } = useAdminDashboard()

  const ov = stats?.overview
  const openai = stats?.openai

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Admin Dashboard"
        description="Tổng quan hệ thống, doanh thu và hoạt động người dùng."
        extra={
          <Tooltip title="Làm mới">
            <ReloadOutlined
              style={{ cursor: 'pointer', color: '#888' }}
              onClick={() => refetch()}
            />
          </Tooltip>
        }
      />

      {/* ── Overview stats ── */}
      <Row gutter={[16, 16]}>
        {[
          {
            title: 'Tổng người dùng',
            value: ov?.totalUsers,
            suffix: `+${ov?.newUsersThisMonth ?? 0} tháng này`,
            icon: <TeamOutlined style={{ fontSize: 22, color: '#4F46E5' }} />,
            color: '#4F46E5',
          },
          {
            title: 'Tổng doanh thu',
            value: ov ? formatVND(ov.totalRevenue) : undefined,
            suffix: `${ov ? formatVND(ov.revenueThisMonth) : '—'} tháng này`,
            icon: <DollarOutlined style={{ fontSize: 22, color: '#52c41a' }} />,
            color: '#52c41a',
          },
          {
            title: 'OpenAI Tokens',
            value: openai?.configured ? formatNumber(openai.totalTokens) : '—',
            suffix: openai?.configured
              ? `${openai.totalRequests.toLocaleString()} requests`
              : 'Chưa cấu hình',
            icon: <ApiOutlined style={{ fontSize: 22, color: '#10a37f' }} />,
            color: '#10a37f',
            onClick: () => navigate('/admin/openai-usage'),
          },
          {
            title: 'Chi phí OpenAI',
            value: openai?.configured ? `$${openai.estimatedCostUsd.toFixed(2)}` : '—',
            suffix: 'Tháng này',
            icon: <RobotOutlined style={{ fontSize: 22, color: '#faad14' }} />,
            color: '#faad14',
            onClick: () => navigate('/admin/openai-usage'),
          },
        ].map((item) => (
          <Col key={item.title} xs={24} sm={12} lg={6}>
            <Card
              hoverable={!!item.onClick}
              onClick={item.onClick}
              styles={{ body: { padding: '16px 20px' } }}
              style={{ cursor: item.onClick ? 'pointer' : 'default' }}
            >
              <Flex justify="space-between" align="flex-start">
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.title}
                  </Text>
                  {isLoading ? (
                    <Skeleton.Input active size="small" style={{ marginTop: 4, width: 80 }} />
                  ) : (
                    <div style={{ fontSize: 22, fontWeight: 700, color: item.color, marginTop: 2 }}>
                      {item.value ?? '—'}
                    </div>
                  )}
                  {item.suffix && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.suffix}
                    </Text>
                  )}
                </div>
                <div style={{ opacity: 0.15, fontSize: 36 }}>{item.icon}</div>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Revenue chart + Token pie ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 30 ngày gần nhất">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Area
                data={stats?.revenueSeries ?? []}
                xField="date"
                yField="revenue"
                shapeField="smooth"
                style={{ height: 240 }}
                axis={{
                  y: { labelFormatter: (v: number) => `${(v / 1000).toFixed(0)}k` },
                }}
                tooltip={{
                  items: [{ field: 'revenue', valueFormatter: (v: number) => formatVND(v) }],
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ gói token" style={{ height: '100%' }}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : !stats?.paymentDistribution.length ? (
              <Flex justify="center" align="center" style={{ height: 200 }}>
                <Text type="secondary">Chưa có dữ liệu</Text>
              </Flex>
            ) : (
              <Pie
                data={stats.paymentDistribution}
                angleField="count"
                colorField="label"
                style={{ height: 220 }}
                label={{ text: 'label', style: { fontSize: 12 } }}
                legend={{ position: 'bottom' }}
                tooltip={{
                  items: [
                    { field: 'count', name: 'Đơn' },
                    {
                      field: 'totalRevenue',
                      name: 'Doanh thu',
                      valueFormatter: (v: number) => formatVND(v),
                    },
                  ],
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Session chart + Questions by part ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Phiên luyện tập 30 ngày gần nhất">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Column
                data={stats?.sessionSeries ?? []}
                xField="date"
                yField="count"
                style={{ height: 220 }}
                axis={{ y: { title: 'Số phiên' } }}
                tooltip={{ items: [{ field: 'count', name: 'Phiên' }] }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Câu hỏi theo Part" style={{ height: '100%' }}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Column
                data={stats?.questionsByPart ?? []}
                xField="part"
                yField="count"
                style={{ height: 220 }}
                label={{ text: 'count', style: { fontSize: 11 } }}
                tooltip={{ items: [{ field: 'count', name: 'Câu hỏi' }] }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Recent payments + Quick nav ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          <Card title="Thanh toán gần đây">
            <Table
              dataSource={stats?.recentPayments ?? []}
              columns={recentPaymentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/questions')}>
            <Flex align="center" gap={12}>
              <EditOutlined style={{ fontSize: 24, color: '#4F46E5' }} />
              <div>
                <Text strong>Quản lý câu hỏi</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Thêm, sửa câu hỏi cho 5 part
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
