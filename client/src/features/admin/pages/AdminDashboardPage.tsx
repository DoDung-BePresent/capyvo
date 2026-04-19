import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Table, Tag, Space, Flex, Tooltip, Skeleton, Alert } from 'antd'
import {
  EditOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ReloadOutlined,
  UserOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  BookOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Area, Column, Pie } from '@ant-design/charts'
import { PageHeader } from '@/shared/components'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import { useSystemStats } from '../hooks/useSystemStats'
import dayjs from 'dayjs'
import type { RecentPayment } from '../hooks/useAdminDashboard'

const { Text } = Typography

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const recentPaymentColumns = [
  {
    title: 'Người dùng',
    key: 'user',
    render: (r: RecentPayment) => (
      <Space direction="vertical" size={0}>
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
  const {
    data: sysStats,
    isLoading: isSysLoading,
    isError: isSysError,
    refetch: refetchSys,
  } = useSystemStats()

  const ov = stats?.overview

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
            title: 'Số đơn đã thanh toán',
            value: ov?.totalPayments,
            icon: <RiseOutlined style={{ fontSize: 22, color: '#faad14' }} />,
            color: '#faad14',
          },
          {
            title: 'Phiên luyện tập',
            value: ov?.totalSessions,
            suffix: `+${ov?.sessionsThisMonth ?? 0} tháng này`,
            icon: <UserOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
            color: '#1677ff',
          },
          {
            title: 'Câu hỏi trong hệ thống',
            value: ov?.totalQuestions,
            icon: <BookOutlined style={{ fontSize: 22, color: '#722ed1' }} />,
            color: '#722ed1',
          },
        ].map((item) => (
          <Col key={item.title} xs={24} sm={12} lg={8} xl={4}>
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
            ) : !stats?.tokenPackageStats.length ? (
              <Flex justify="center" align="center" style={{ height: 200 }}>
                <Text type="secondary">Chưa có dữ liệu</Text>
              </Flex>
            ) : (
              <Pie
                data={stats.tokenPackageStats}
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
        <Col xs={24} lg={16}>
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
        <Col xs={24} lg={8}>
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
        <Col xs={24} lg={16}>
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
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
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

            {/* System resources */}
            <Card
              size="small"
              title={
                <Flex justify="space-between" align="center">
                  <span>Tài nguyên hệ thống</span>
                  <ReloadOutlined
                    style={{ fontSize: 12, cursor: 'pointer', color: '#888' }}
                    onClick={() => refetchSys()}
                  />
                </Flex>
              }
            >
              {isSysError && (
                <Alert
                  type="warning"
                  message="Không lấy được dữ liệu hệ thống"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              )}
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Space size={6}>
                    <DatabaseOutlined style={{ color: '#3ECF8E' }} />
                    <Text style={{ fontSize: 13 }}>Supabase Storage</Text>
                  </Space>
                  {isSysLoading ? (
                    <Skeleton.Input active size="small" style={{ width: 70 }} />
                  ) : !sysStats?.supabase.configured ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chưa cấu hình
                    </Text>
                  ) : (
                    <Text strong style={{ fontSize: 13 }}>
                      {sysStats.supabase.storageSizeBytes !== null
                        ? formatBytes(sysStats.supabase.storageSizeBytes)
                        : '—'}
                    </Text>
                  )}
                </Flex>
                <Flex justify="space-between" align="center">
                  <Space size={6}>
                    <RobotOutlined style={{ color: '#10a37f' }} />
                    <Text style={{ fontSize: 13 }}>OpenAI tháng này</Text>
                  </Space>
                  {isSysLoading ? (
                    <Skeleton.Input active size="small" style={{ width: 70 }} />
                  ) : !sysStats?.openai.configured ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chưa cấu hình
                    </Text>
                  ) : (
                    <Text strong style={{ fontSize: 13 }}>
                      {sysStats.openai.currentMonthCostUsd !== null
                        ? `$${sysStats.openai.currentMonthCostUsd.toFixed(2)}`
                        : '—'}
                    </Text>
                  )}
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  )
}
