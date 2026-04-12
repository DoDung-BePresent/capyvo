import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Statistic, Tooltip, Skeleton, Alert } from 'antd'
import { EditOutlined, DatabaseOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import { useSystemStats } from '../hooks/useSystemStats'

const { Title, Text } = Typography

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading, isError, refetch } = useSystemStats()

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader title="Admin Dashboard" />

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* ─── Navigation cards ─── */}
        <Col>
          <Card hoverable style={{ width: 240 }} onClick={() => navigate('/admin/questions')}>
            <EditOutlined style={{ fontSize: 28, color: '#4F46E5', marginBottom: 12 }} />
            <Title level={5} style={{ margin: '0 0 4px' }}>
              Quản lý câu hỏi
            </Title>
            <Text type="secondary">Thêm, sửa câu hỏi cho 5 part</Text>
          </Card>
        </Col>
      </Row>

      {/* ─── System stats ─── */}
      <Title level={5} style={{ marginTop: 32, marginBottom: 12 }}>
        Tài nguyên hệ thống{' '}
        <Tooltip title="Làm mới">
          <ReloadOutlined
            style={{ fontSize: 14, cursor: 'pointer', color: '#888' }}
            onClick={() => refetch()}
          />
        </Tooltip>
      </Title>

      {isError && (
        <Alert
          type="warning"
          message="Không lấy được dữ liệu hệ thống"
          description="Kiểm tra lại SUPABASE_ACCESS_TOKEN và OPENAI_API_KEY trên server."
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Supabase Storage */}
        <Col xs={24} sm={12} md={8}>
          <Card
            size="small"
            title={
              <span>
                <DatabaseOutlined style={{ marginRight: 6, color: '#3ECF8E' }} />
                Supabase Storage
              </span>
            }
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : !stats?.supabase.configured ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chưa cấu hình <code>SUPABASE_ACCESS_TOKEN</code>
              </Text>
            ) : stats.supabase.storageSizeBytes === null ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Không lấy được dữ liệu
              </Text>
            ) : (
              <Statistic
                value={formatBytes(stats.supabase.storageSizeBytes)}
                valueStyle={{ fontSize: 22 }}
                suffix="đã dùng"
              />
            )}
          </Card>
        </Col>

        {/* OpenAI Cost */}
        <Col xs={24} sm={12} md={8}>
          <Card
            size="small"
            title={
              <span>
                <RobotOutlined style={{ marginRight: 6, color: '#10a37f' }} />
                OpenAI — tháng này
              </span>
            }
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : !stats?.openai.configured ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chưa cấu hình <code>OPENAI_API_KEY</code>
              </Text>
            ) : stats.openai.currentMonthCostUsd === null ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Không lấy được dữ liệu (cần Organization key)
              </Text>
            ) : (
              <Statistic
                value={stats.openai.currentMonthCostUsd}
                precision={2}
                prefix="$"
                valueStyle={{ fontSize: 22 }}
                suffix="USD"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
