import { Button, Card, Divider, Space, Table, Tag, Typography } from 'antd'
import { CrownOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useCreatePaymentOrder, useMyPayments } from '../hooks/usePayment'
import dayjs from 'dayjs'
import { useAuthSync } from '@/features/auth/hooks/useAuth'

const { Title, Text } = Typography

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'processing', label: 'Đang chờ' },
  PAID: { color: 'success', label: 'Đã thanh toán' },
  CANCELLED: { color: 'default', label: 'Đã huỷ' },
  EXPIRED: { color: 'error', label: 'Hết hạn' },
}

export default function PaymentPage() {
  const { user } = useAuthSync()
  const createOrder = useCreatePaymentOrder()
  const { data: payments } = useMyPayments()

  const isPremium = user?.isPremium
  const expiresAt = user?.premiumExpiresAt

  const handleBuy = async () => {
    const result = await createOrder.mutateAsync()
    // Mở trang thanh toán PayOS trong tab mới
    window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (v: number) => <Text code>{v}</Text>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => `${v.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = STATUS_TAG[v] ?? { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 16px' }}>
      {/* Premium status card */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="center">
            <CrownOutlined style={{ fontSize: 32, color: isPremium ? '#faad14' : '#bfbfbf' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {isPremium ? 'Bạn đang là thành viên Premium' : 'Nâng cấp Premium'}
              </Title>
              {isPremium && expiresAt && (
                <Text type="secondary">Hết hạn: {dayjs(expiresAt).format('DD/MM/YYYY')}</Text>
              )}
            </div>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <Space direction="vertical" size={8}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>Luyện tập không giới hạn tất cả các Part</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>Chấm điểm tự động bằng AI (Speaking + Writing)</Text>
            </Space>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>Phân tích chi tiết từng câu trả lời</Text>
            </Space>
            <Space>
              <ClockCircleOutlined style={{ color: '#1677ff' }} />
              <Text strong>Chỉ 90.000 ₫ / tháng</Text>
            </Space>
          </Space>

          {!isPremium && (
            <Button
              type="primary"
              size="large"
              icon={<CrownOutlined />}
              loading={createOrder.isPending}
              onClick={handleBuy}
              style={{ marginTop: 8 }}
            >
              Mua Premium ngay
            </Button>
          )}
          {isPremium && (
            <Button
              size="large"
              icon={<CrownOutlined />}
              loading={createOrder.isPending}
              onClick={handleBuy}
            >
              Gia hạn thêm 1 tháng
            </Button>
          )}
        </Space>
      </Card>

      {/* Payment history */}
      {payments && payments.length > 0 && (
        <Card title="Lịch sử thanh toán" style={{ borderRadius: 12 }}>
          <Table
            dataSource={payments}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  )
}
