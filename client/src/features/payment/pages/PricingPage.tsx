import { Row, Col } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/components'
import PricingCard, { type PricingPlan } from '@/features/payment/components/PricingCard'

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: '1 THÁNG',
    duration: '30 NGÀY',
    price: 90000,
    pricePerMonth: 90,
    description: 'Thử xem LuyenNoi có gì :)',
    features: [
      'Luyện tập không giới hạn',
      'Phân tích chi tiết phát âm',
      'Thi thử toàn bộ đề',
      'Hỗ trợ qua email',
    ],
    color: '#7C3AED', // Purple
  },
  {
    id: 'quarterly',
    name: '3 THÁNG',
    duration: '90 NGÀY',
    price: 255000,
    pricePerMonth: 85,
    description: 'Ôn speaking thôi, chứ không trượt gì :)',
    features: [
      'Tất cả tính năng gói 1 tháng',
      'Tiết kiệm 15.000đ',
      'Theo dõi tiến độ chi tiết',
      'Ưu tiên hỗ trợ',
    ],
    color: '#4F46E5', // Indigo
    isPopular: true,
    discount: 'Tiết kiệm 5%',
  },
  {
    id: 'biannual',
    name: '6 THÁNG',
    duration: '180 NGÀY',
    price: 480000,
    pricePerMonth: 80,
    description: 'Phá đảo speaking - chắc chắn lên band :)',
    features: [
      'Tất cả tính năng gói 3 tháng',
      'Tiết kiệm 60.000đ',
      'Báo cáo tiến độ hàng tuần',
      'Hỗ trợ ưu tiên 24/7',
    ],
    color: '#0891B2', // Cyan
    discount: 'Tiết kiệm 11%',
  },
]

export default function PricingPage() {
  const navigate = useNavigate()

  const handleSelectPlan = (planId: string) => {
    // TODO: Navigate to checkout or open payment modal
    console.log('Selected plan:', planId)
    navigate(`/payment/checkout?plan=${planId}`)
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
            <PricingCard plan={plan} onSelect={handleSelectPlan} />
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
