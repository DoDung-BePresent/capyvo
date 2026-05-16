import { Card, Typography, Table, Tag, Space, Flex, Tooltip, Progress, Alert, Skeleton } from 'antd'
import { WarningOutlined, SafetyOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import { useAbuseDetection } from '../hooks/useAbuseDetection'
import type { SuspiciousUser } from '../services/abuse-detection.service'
import dayjs from 'dayjs'

const { Text } = Typography

function getRiskColor(score: number): string {
  if (score >= 75) return '#cf1322'
  if (score >= 50) return '#fa8c16'
  if (score >= 25) return '#faad14'
  return '#52c41a'
}

function getRiskLevel(score: number): string {
  if (score >= 75) return 'Rất cao'
  if (score >= 50) return 'Cao'
  if (score >= 25) return 'Trung bình'
  return 'Thấp'
}

const columns = [
  {
    title: 'User',
    key: 'user',
    width: 250,
    render: (record: SuspiciousUser) => (
      <Space direction="vertical" size={0}>
        <Text strong>{record.fullName || 'Chưa có tên'}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.email}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Tạo: {dayjs(record.createdAt).format('DD/MM/YYYY')}
        </Text>
      </Space>
    ),
  },
  {
    title: 'Mức độ rủi ro',
    dataIndex: 'riskScore',
    key: 'riskScore',
    width: 150,
    sorter: (a: SuspiciousUser, b: SuspiciousUser) => b.riskScore - a.riskScore,
    render: (score: number) => (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Progress
          percent={score}
          strokeColor={getRiskColor(score)}
          size="small"
          format={(percent) => `${percent}%`}
        />
        <Text style={{ fontSize: 12, color: getRiskColor(score) }}>{getRiskLevel(score)}</Text>
      </Space>
    ),
  },
  {
    title: 'Hoạt động',
    key: 'activity',
    width: 200,
    render: (record: SuspiciousUser) => (
      <Space direction="vertical" size={2}>
        <Text style={{ fontSize: 12 }}>
          24h: <Text strong>{record.metrics.sessionsLast24h}</Text> sessions
        </Text>
        <Text style={{ fontSize: 12 }}>
          7d: <Text strong>{record.metrics.sessionsLast7d}</Text> sessions
        </Text>
        <Text style={{ fontSize: 12 }}>
          Avg: <Text strong>{record.metrics.avgSessionDuration.toFixed(0)}s</Text>/session
        </Text>
      </Space>
    ),
  },
  {
    title: 'Responses',
    key: 'responses',
    width: 150,
    render: (record: SuspiciousUser) => (
      <Space direction="vertical" size={2}>
        <Text style={{ fontSize: 12 }}>
          Total: <Text strong>{record.metrics.totalResponses}</Text>
        </Text>
        <Text style={{ fontSize: 12 }}>
          Failed:{' '}
          <Text type="danger" strong>
            {record.metrics.failedResponses}
          </Text>
        </Text>
        <Text style={{ fontSize: 12 }}>
          Rate: <Text strong>{(record.metrics.failureRate * 100).toFixed(1)}%</Text>
        </Text>
      </Space>
    ),
  },
  {
    title: 'Cảnh báo',
    dataIndex: 'flags',
    key: 'flags',
    render: (flags: string[]) => (
      <Space direction="vertical" size={4}>
        {flags.map((flag, idx) => (
          <Tag key={idx} color="red" icon={<WarningOutlined />} style={{ margin: 0 }}>
            {flag}
          </Tag>
        ))}
      </Space>
    ),
  },
]

export default function AbuseDetectionPage() {
  const { data: stats, isLoading, refetch, isFetching } = useAbuseDetection()

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Abuse Detection"
        description="Phát hiện và theo dõi các hành vi lạm dụng hệ thống"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/admin' }, { label: 'Abuse Detection' }]}
        extra={
          <Tooltip title="Làm mới">
            <ReloadOutlined
              spin={isFetching}
              style={{ cursor: 'pointer', fontSize: 16 }}
              onClick={() => refetch()}
            />
          </Tooltip>
        }
      />

      {/* Overview Cards */}
      {isLoading ? (
        <Skeleton active />
      ) : stats ? (
        <>
          <Flex gap={16}>
            <Card style={{ flex: 1 }}>
              <Flex align="center" gap={12}>
                <UserOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tổng số user
                  </Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
                    {stats.totalUsers}
                  </div>
                </div>
              </Flex>
            </Card>

            <Card style={{ flex: 1 }}>
              <Flex align="center" gap={12}>
                <WarningOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    User đáng ngờ
                  </Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}>
                    {stats.suspiciousUsers}
                  </div>
                </div>
              </Flex>
            </Card>

            <Card style={{ flex: 1 }}>
              <Flex align="center" gap={12}>
                <SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tỷ lệ an toàn
                  </Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                    {stats.totalUsers > 0
                      ? ((1 - stats.suspiciousUsers / stats.totalUsers) * 100).toFixed(1)
                      : 100}
                    %
                  </div>
                </div>
              </Flex>
            </Card>
          </Flex>

          {/* Thresholds Info */}
          <Alert
            message="Ngưỡng phát hiện"
            description={
              <Space direction="vertical" size={4}>
                <Text style={{ fontSize: 12 }}>
                  • Sessions trong 24h: <Text strong>{stats.thresholds.maxSessionsPer24h}</Text>
                </Text>
                <Text style={{ fontSize: 12 }}>
                  • Sessions trong 7 ngày: <Text strong>{stats.thresholds.maxSessionsPer7d}</Text>
                </Text>
                <Text style={{ fontSize: 12 }}>
                  • Tỷ lệ lỗi tối đa:{' '}
                  <Text strong>{(stats.thresholds.maxFailureRate * 100).toFixed(0)}%</Text>
                </Text>
              </Space>
            }
            type="info"
            showIcon
          />

          {/* Suspicious Users Table */}
          <Card title={`Danh sách user đáng ngờ (${stats.flaggedUsers.length})`}>
            {stats.flaggedUsers.length === 0 ? (
              <Alert
                message="Không phát hiện hành vi đáng ngờ"
                description="Tất cả user đang hoạt động bình thường."
                type="success"
                showIcon
              />
            ) : (
              <Table<SuspiciousUser>
                dataSource={stats.flaggedUsers}
                columns={columns}
                rowKey="userId"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} user`,
                }}
                scroll={{ x: 1000 }}
              />
            )}
          </Card>
        </>
      ) : null}
    </Space>
  )
}
