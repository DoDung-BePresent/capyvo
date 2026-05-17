import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Flex, Result, Space, Spin, Typography, message } from 'antd'
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

  useEffect(() => {
    if (payment?.status === 'PAID') {
      // Invalidate both user and subscription cache to prevent showing TRIAL before PREMIUM
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current() })
      message.success('Thanh toán thành công! Gói đăng ký đã được kích hoạt.')

      // Redirect to home after 1 seconds
      setTimeout(() => {
        navigate('/')
      }, 1000)
    }
  }, [payment?.status, queryClient, navigate])

  if (!orderCode) {
    return (
      <>
        <PageHeader title="Kết quả thanh toán" />
        <Flex justify="center" style={{ marginTop: 64 }}>
          <Result
            status="error"
            title="Không tìm thấy đơn hàng"
            extra={<Button onClick={() => navigate('/pricing')}>Quay lại</Button>}
          />
        </Flex>
      </>
    )
  }

  if (isLoading || payment?.status === 'PENDING') {
    return (
      <Flex vertical align="center" gap={16} style={{ marginTop: 80 }}>
        <Spin size="large" />
        <Text type="secondary">Đang kiểm tra trạng thái thanh toán…</Text>
      </Flex>
    )
  }

  if (payment?.status === 'PAID') {
    return (
      <Flex vertical align="center" gap={16} style={{ marginTop: 80 }}>
        <Spin size="large" />
        <Text type="secondary">Thanh toán thành công!</Text>
      </Flex>
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
            <Button type="primary" onClick={() => navigate('/pricing')}>
              Thử lại
            </Button>
          }
        />
      </Flex>
    </Space>
  )
}
