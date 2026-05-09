import { Button, Tag } from 'antd'
import { Check } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

export interface PricingPlan {
  id: string
  name: string
  duration: string // "1 THÁNG", "3 THÁNG", "6 THÁNG"
  price: number
  pricePerMonth: number
  description: string
  features: string[]
  color: string
  isPopular?: boolean
  discount?: string // "Tiết kiệm 15%"
  isContactPlan?: boolean // For plans that require contact instead of payment
  contactUrl?: string // URL to contact (e.g., Zalo link)
  badge?: string // "Sắp ra mắt", "Mới", etc.
}

interface PricingCardProps {
  plan: PricingPlan
  onSelect: (planId: string) => void
  isLoading?: boolean
}

const StyledCard = styled(
  'div',
  'relative h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1',
)

const PopularBadge = styled(
  'div',
  'absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide',
)

const Header = styled('div', 'mb-6')

const PlanName = styled('div', 'text-sm font-bold uppercase tracking-wide mb-1')

const Duration = styled('div', 'text-xs text-gray-500 font-medium')

const PriceSection = styled('div', 'mb-6')

const TotalPrice = styled('div', 'text-2xl font-bold text-gray-900 mb-1')

const PricePerMonth = styled('div', 'text-3xl font-extrabold mb-2')

const Description = styled('div', 'text-sm text-gray-600 mb-6 min-h-10')

const FeatureList = styled('ul', 'space-y-3 mb-6')

const FeatureItem = styled('li', 'flex items-start gap-2 text-sm text-gray-700')

const CheckIcon = styled(
  'div',
  'flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5',
)

const StyledButton = styled(
  Button,
  'relative w-full h-12 rounded-xl! inline-flex items-center justify-center gap-2 font-bold text-base transition-all duration-150 ease-out hover:translate-y-1 shadow-[0_4px_0_0_var(--shadow-color)]! hover:shadow-none! active:shadow-none!',
)

export default function PricingCard({ plan, onSelect, isLoading = false }: PricingCardProps) {
  const isPopular = plan.isPopular

  return (
    <StyledCard
      style={{
        backgroundColor: isPopular ? hexToRgba(plan.color, 0.03) : '#fff',
        border: isPopular ? `2px solid ${plan.color}` : '2px solid #e5e7eb',
        boxShadow: isPopular
          ? `0 8px 24px ${hexToRgba(plan.color, 0.15)}`
          : '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* Popular/Badge */}
      {isPopular && (
        <PopularBadge style={{ backgroundColor: plan.color }}>Phổ biến nhất</PopularBadge>
      )}
      {!isPopular && plan.badge && (
        <PopularBadge style={{ backgroundColor: plan.color }}>{plan.badge}</PopularBadge>
      )}

      {/* Header */}
      <Header>
        <PlanName style={{ color: plan.color }}>{plan.name}</PlanName>
        <Duration>{plan.duration}</Duration>
      </Header>

      {/* Price */}
      <PriceSection>
        {plan.isContactPlan ? (
          <>
            <TotalPrice style={{ color: plan.color }}>Liên hệ</TotalPrice>
            <PricePerMonth style={{ color: plan.color, fontSize: '1.25rem' }}>
              Báo giá theo nhu cầu
            </PricePerMonth>
          </>
        ) : (
          <>
            <TotalPrice>{plan.price.toLocaleString('vi-VN')} VNĐ</TotalPrice>
            <PricePerMonth style={{ color: plan.color }}>
              {plan.pricePerMonth}k<span className="text-lg font-semibold">/tháng</span>
            </PricePerMonth>
            {plan.discount && (
              <Tag color="success" style={{ fontSize: 11, fontWeight: 600 }}>
                {plan.discount}
              </Tag>
            )}
          </>
        )}
      </PriceSection>

      {/* Description */}
      <Description>{plan.description}</Description>

      {/* Features */}
      <FeatureList>
        {plan.features.map((feature, index) => (
          <FeatureItem key={index}>
            <CheckIcon
              style={{
                backgroundColor: hexToRgba(plan.color, 0.15),
                color: plan.color,
              }}
            >
              <Check style={{ fontSize: 14 }} />
            </CheckIcon>
            <span>{feature}</span>
          </FeatureItem>
        ))}
      </FeatureList>

      {/* CTA Button */}
      {plan.isContactPlan ? (
        <StyledButton
          type="default"
          size="large"
          onClick={() => window.open(plan.contactUrl, '_blank')}
          style={
            {
              '--shadow-color': hexToRgba(plan.color, 0.6),
              backgroundColor: plan.color,
              borderColor: plan.color,
              color: '#fff',
            } as React.CSSProperties
          }
        >
          Liên hệ Zalo
        </StyledButton>
      ) : (
        <StyledButton
          type={isPopular ? 'primary' : 'default'}
          size="large"
          loading={isLoading}
          onClick={() => onSelect(plan.id)}
          style={
            isPopular
              ? ({
                  '--shadow-color': hexToRgba(plan.color, 0.6),
                  backgroundColor: plan.color,
                  borderColor: plan.color,
                  color: '#fff',
                } as React.CSSProperties)
              : ({
                  '--shadow-color': 'rgba(0,0,0,0.15)',
                  backgroundColor: '#fff',
                  borderColor: plan.color,
                  color: plan.color,
                } as React.CSSProperties)
          }
        >
          Thanh toán
        </StyledButton>
      )}
    </StyledCard>
  )
}
