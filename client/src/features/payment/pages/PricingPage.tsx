import { Row, Col, message } from 'antd'
import { PageHeader } from '@/shared/components'
import PricingCard, { type PricingPlan } from '@/features/payment/components/PricingCard'
import { useCreateSubscriptionOrder } from '@/features/payment/hooks/usePayment'
import { useIsOnTrial, useCurrentSubscription } from '@/features/auth/hooks/useSubscription'

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'MIỄN PHÍ',
    duration: 'MÃI MÃI',
    price: 0,
    pricePerMonth: 0,
    description: 'Luyện tập cơ bản không giới hạn',
    features: [
      'Luyện tập theo part không giới hạn',
      'AI Transcription',
      'Xem transcript chi tiết',
      'Share bài tập & reactions',
      '❌ Không có thi thử full đề',
      '❌ Không có AI chấm điểm',
    ],
    color: '#8c8c8c', // Gray
    isFreePlan: true,
  },
  {
    id: 'PREMIUM',
    name: 'PREMIUM',
    duration: '30 NGÀY',
    price: 99000,
    pricePerMonth: 99,
    description: 'Trải nghiệm đầy đủ với AI chấm điểm',
    features: [
      'Tất cả tính năng gói Miễn phí',
      '✨ Thi thử full đề không giới hạn',
      '✨ AI Analysis & Scoring',
      '✨ Feedback chi tiết theo tiêu chí',
      '✨ Phân tích lỗi phát âm cụ thể',
      '✨ Ước tính điểm TOEIC chính xác',
    ],
    color: '#faad14', // Gold
    isPopular: true,
  },
  {
    id: 'CLASSROOM',
    name: 'LỚP HỌC',
    duration: 'GIẢNG VIÊN',
    price: 0,
    pricePerMonth: 0,
    description: 'Đang phát triển - Liên hệ để được tư vấn và đặt trước',
    features: [
      'Tất cả tính năng Premium',
      'Xem kết quả học viên (View only)',
      'Quản lý nhiều lớp học',
      'Báo cáo tiến độ lớp',
      'Dashboard giảng viên',
      'Hỗ trợ tùy chỉnh',
    ],
    color: '#059669', // Green
    isContactPlan: true,
    contactUrl: 'https://zalo.me/0352195876',
    badge: 'Sắp ra mắt',
  },
]

export default function PricingPage() {
  const { mutateAsync: createOrder, isPending } = useCreateSubscriptionOrder()
  const isOnTrial = useIsOnTrial()
  const { data: subscription } = useCurrentSubscription()

  const handleSelectPlan = async (planId: string) => {
    // FREE plan doesn't need payment
    if (planId === 'FREE') {
      message.info('Bạn đang sử dụng gói miễn phí')
      return
    }

    try {
      const result = await createOrder(planId)
      // Redirect to PayOS checkout page
      window.location.href = result.checkoutUrl
    } catch (error) {
      console.error('Failed to create order:', error)
      message.error('Không thể tạo đơn hàng. Vui lòng thử lại.')
    }
  }

  return (
    <>
      <PageHeader
        title="Chọn gói phù hợp với bạn"
        description="Mở khóa toàn bộ tính năng và luyện tập không giới hạn với các gói subscription"
      />

      <Row gutter={[24, 24]} justify="center">
        {PRICING_PLANS.map((plan) => (
          <Col key={plan.id} xs={24} sm={12} lg={8}>
            <PricingCard plan={plan} onSelect={handleSelectPlan} isLoading={isPending} />
          </Col>
        ))}
      </Row>

      {/* Additional Info */}
      <div className="my-12 text-center space-y-2">
        <p className="text-sm text-gray-500">
          Tất cả gói đều có thể hủy bất cứ lúc nào. Không có phí ẩn.
        </p>
        <p className="text-sm text-gray-500">
          Cần hỗ trợ? Liên hệ{' '}
          <a href="https://zalo.me/0352195876" className="text-blue-600 hover:underline">
            Zalo
          </a>
        </p>
        {!isOnTrial && !subscription?.isPremium && (
          <p className="text-sm font-medium text-gold-600 mt-4">
            💡 Mẹo: Đăng ký ngay để nhận 7 ngày dùng thử Premium!
          </p>
        )}
      </div>
    </>
  )
}
