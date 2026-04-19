import { useState } from 'react'
import { Button, Card, Col, Row, Space, Table, Tag, Typography, Flex } from 'antd'
import { ThunderboltOutlined, ShoppingCartOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useCreateTokenOrder, useTokenPackages, useMyPayments } from '../hooks/usePayment'
import dayjs from 'dayjs'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'
import { PageHeader } from '@/shared/components'
import type { TokenPackage } from '../types'

const { Text } = Typography

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'processing', label: 'Đang chờ' },
  PAID: { color: 'success', label: 'Đã thanh toán' },
  CANCELLED: { color: 'default', label: 'Đã huỷ' },
  EXPIRED: { color: 'error', label: 'Hết hạn' },
}

export default function PaymentPage() {
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const createToken = useCreateTokenOrder()
  const { data: packages = [] } = useTokenPackages()
  const { data: payments } = useMyPayments()

  const [selectedTokens, setSelectedTokens] = useState<number | null>(null)

  const credits = user?.transcriptionCredits ?? 0

  const handleBuy = async () => {
    if (selectedTokens == null) return
    const result = await createToken.mutateAsync(selectedTokens)
    window.location.href = result.checkoutUrl
  }

  const selectedPkg = packages.find((p) => p.tokens === selectedTokens)

  const columns = [
    { title: 'Nội dung', dataIndex: 'description', key: 'description' },
    {
      title: 'Token',
      dataIndex: 'tokenAmount',
      key: 'tokenAmount',
      render: (v: number | null) =>
        v ? (
          <Space size={4}>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <Text strong>{v}</Text>
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v.toLocaleString('vi-VN') + ' ₫',
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
  ]

  return (
    <Space vertical size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Mua token"
        description="Token dùng để chấm điểm AI, phân tích Speaking & Writing. Mỗi lần chấm tốn 1 token."
      />
      <Card styles={{ body: { padding: '16px 24px' } }}>
        <Flex align="center" gap={12}>
          <ThunderboltOutlined style={{ fontSize: 28, color: '#faad14' }} />
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Token hiện tại
            </Text>
            <div>
              <Text style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{credits}</Text>
              <Text type="secondary" style={{ marginLeft: 6 }}>
                token
              </Text>
            </div>
          </div>
        </Flex>
      </Card>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          Chọn gói token
        </Text>
        <Row gutter={[12, 12]}>
          {packages.map((pkg: TokenPackage) => {
            const isSelected = selectedTokens === pkg.tokens
            return (
              <Col key={pkg.tokens} xs={24} sm={8}>
                <Card
                  hoverable
                  onClick={() => setSelectedTokens(pkg.tokens)}
                  style={{
                    borderColor: isSelected ? 'var(--ant-color-primary)' : undefined,
                    borderWidth: isSelected ? 2 : 1,
                    cursor: 'pointer',
                  }}
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <Flex justify="space-between" align="center">
                    <Space direction="vertical" size={2}>
                      <Space size={6}>
                        <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />
                        <Text strong style={{ fontSize: 18 }}>
                          {pkg.tokens} token
                        </Text>
                      </Space>
                      <Text strong style={{ color: 'var(--ant-color-primary)', fontSize: 15 }}>
                        {pkg.price.toLocaleString('vi-VN')} ₫
                      </Text>
                    </Space>
                    {isSelected && (
                      <CheckCircleFilled
                        style={{ fontSize: 20, color: 'var(--ant-color-primary)' }}
                      />
                    )}
                  </Flex>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>
      <Button
        type="primary"
        size="large"
        icon={<ShoppingCartOutlined />}
        loading={createToken.isPending}
        onClick={handleBuy}
      >
        {selectedPkg
          ? 'Mua ' +
            selectedPkg.tokens +
            ' token — ' +
            selectedPkg.price.toLocaleString('vi-VN') +
            ' ₫'
          : 'Chọn gói để tiếp tục'}
      </Button>
      {payments && payments.length > 0 && (
        <Card title="Lịch sử thanh toán">
          <Table
            dataSource={payments}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </Space>
  )
}
