import { Row, Col, message } from 'antd'
import { PageHeader } from '@/shared/components'
import PricingCard, { type PricingPlan } from '@/features/payment/components/PricingCard'
import { useCreateSubscriptionOrder } from '@/features/payment/hooks/usePayment'

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'BASIC',
    name: 'CƠ BẢN',
    duration: '30 NGÀY',
    price: 49000,
    pricePerMonth: 49,
    description: 'Luyện tập cơ bản với transcript',
    features: [
      'Luyện tập không giới hạn',
      'AI Transcription',
      'Xem transcript chi tiết',
      'Share bài tập & reactions',
      'Thi thử toàn bộ đề',
    ],
    color: '#1890ff', // Blue
  },
  {
    id: 'PREMIUM',
    name: 'PREMIUM',
    duration: '30 NGÀY',
    price: 99000,
    pricePerMonth: 99,
    description: 'Phân tích chuyên sâu với AI',
    features: [
      'Tất cả tính năng gói Cơ bản',
      'AI Analysis & Scoring',
      'Feedback chi tiết theo tiêu chí',
      'Phân tích lỗi cụ thể',
      'Ước tính điểm TOEIC',
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

  const handleSelectPlan = async (planId: string) => {
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
        description="Mở khóa toàn bộ tính năng và luyện tập không giới hạn với các gói subscription."
      />

      <Row gutter={[24, 24]} justify="center">
        {PRICING_PLANS.map((plan) => (
          <Col key={plan.id} xs={24} sm={12} lg={8}>
            <PricingCard plan={plan} onSelect={handleSelectPlan} isLoading={isPending} />
          </Col>
        ))}
      </Row>

      {/* Additional Info */}
      <div className="my-12 text-center">
        <p className="text-sm text-gray-500">
          Tất cả gói đều có thể hủy bất cứ lúc nào. Không có phí ẩn.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Cần hỗ trợ? Liên hệ{' '}
          <a href="mailto:support@capyvo.com" className="text-blue-600 hover:underline">
            support@capyvo.com
          </a>
        </p>
      </div>
    </>
  )
}
