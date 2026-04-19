import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Result, Spin, Typography } from 'antd'
import { usePaymentStatus } from '../hooks/usePayment'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

const { Text } = Typography

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderCode = searchParams.get('orderCode') ? Number(searchParams.get('orderCode')) : null

  const { data: payment, isLoading } = usePaymentStatus(orderCode)

  // Khi thanh toán thành công → invalidate user cache để cập nhật isPremium
  useEffect(() => {
    if (payment?.status === 'PAID') {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    }
  }, [payment?.status, queryClient])

  if (!orderCode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
        <Result
          status="error"
          title="Không tìm thấy đơn hàng"
          extra={<Button onClick={() => navigate('/payment')}>Quay lại</Button>}
        />
      </div>
    )
  }

  if (isLoading || payment?.status === 'PENDING') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 80,
          gap: 16,
        }}
      >
        <Spin size="large" />
        <Text type="secondary">Đang kiểm tra trạng thái thanh toán…</Text>
      </div>
    )
  }

  if (payment?.status === 'PAID') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
        <Result
          status="success"
          title="Thanh toán thành công!"
          subTitle="Tài khoản của bạn đã được nâng cấp lên Premium. Chúc bạn học tốt!"
          extra={[
            <Button type="primary" onClick={() => navigate('/')} key="home">
              Bắt đầu luyện tập
            </Button>,
            <Button onClick={() => navigate('/payment')} key="payment">
              Xem chi tiết
            </Button>,
          ]}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
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
    </div>
  )
}
