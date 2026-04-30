import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Flex, Result, Space, Spin, Typography } from 'antd'
import { usePaymentStatus } from '../hooks/usePayment'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { PageHeader } from '@/shared/components'

const { Text } = Typography

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderCode = searchParams.get('orderCode') ? Number(searchParams.get('orderCode')) : null

  const { data: payment, isLoading } = usePaymentStatus(orderCode)

  // Khi thanh toán thành công → invalidate user cache để cập nhật subscription
  useEffect(() => {
    if (payment?.status === 'PAID') {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    }
  }, [payment?.status, queryClient])

  if (!orderCode) {
    return (
      <>
        <PageHeader title="Kết quả thanh toán" />
        <Flex justify="center" style={{ marginTop: 64 }}>
          <Result
            status="error"
            title="Không tìm thấy đơn hàng"
            extra={<Button onClick={() => navigate('/payment')}>Quay lại</Button>}
          />
        </Flex>
      </>
    )
  }

  if (isLoading || payment?.status === 'PENDING') {
    return (
      <>
        <PageHeader title="Kết quả thanh toán" />
        <Flex vertical align="center" gap={16} style={{ marginTop: 80 }}>
          <Spin size="large" />
          <Text type="secondary">Đang kiểm tra trạng thái thanh toán…</Text>
        </Flex>
      </>
    )
  }

  if (payment?.status === 'PAID') {
    return (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <PageHeader
          title="Kết quả thanh toán"
          description="Xác nhận giao dịch từ hệ thống thanh toán."
        />
        <Flex justify="center">
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={`${payment.tokenAmount ?? 0} token đã được cộng vào tài khoản. Chúc bạn luyện tập hiệu quả!`}
            extra={[
              <Button type="primary" onClick={() => navigate('/')} key="home">
                Bắt đầu luyện tập
              </Button>,
              <Button onClick={() => navigate('/payment')} key="payment">
                Mua thêm token
              </Button>,
            ]}
          />
        </Flex>
      </Space>
    )
  }

  return (
    <Space vertical size={24} style={{ width: '100%' }}>
      <PageHeader title="Kết quả thanh toán" />
      <Flex justify="center">
        <Result
          status="warning"
          title="Thanh toán chưa hoàn tất"
          subTitle="Đơn hàng của bạn đã bị huỷ hoặc hết hạn."
          extra={
            <Button type="primary" onClick={() => navigate('/payment')}>
              Thử lại
            </Button>
          }
        />
      </Flex>
    </Space>
  )
}
