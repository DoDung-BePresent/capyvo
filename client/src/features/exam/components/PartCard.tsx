import { Card, Button, Progress } from 'antd'
import { ArrowForward } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'

interface PartCardProps {
  partNumber: number
  label: string
  title: string
  description: string
  questionInfo: string
  color: string
  icon: React.ReactNode
  progress?: number // 0-100, optional
  onStart: () => void
}

const StyledCard = styled(
  Card,
  'h-full rounded-lg shadow-sm transition-all duration-300 overflow-hidden ease-out hover:-translate-y-0.5 hover:shadow-xl',
)
const CardBody = styled('div', 'p-6')
const Header = styled('div', 'flex items-center justify-between mb-4')
const Title = styled('h3', 'text-lg font-semibold text-gray-900 mb-2 leading-snug')
const Description = styled('p', 'text-sm text-gray-600 leading-relaxed mb-4')
const QuestionInfo = styled('span', 'text-xs text-gray-500 font-medium')
const IconWrapper = styled('div', 'absolute -right-5 -top-5')
const Icon = styled('span', 'flex items-end justify-start p-6 size-25 rounded-full')
const Tag = styled(
  'span',
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold',
)
const StyledButton = styled(
  Button,
  'w-full h-12 rounded-lg inline-flex items-center justify-center gap-2 font-semibold text-base shadow-md transition-all duration-200 hover:shadow-lg active:translate-y-0.5 active:shadow-sm',
)

/**
 * Chuyển hex color sang rgba với opacity
 * VD: hexToRgba('#4F46E5', 0.1) => 'rgba(79, 70, 229, 0.1)'
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function PartCard({
  label,
  title,
  description,
  questionInfo,
  color,
  icon,
  progress,
  onStart,
}: PartCardProps) {
  return (
    <StyledCard hoverable styles={{ body: { padding: 0 } }}>
      <CardBody>
        {/* Header */}
        <Header>
          <Tag
            style={{
              backgroundColor: hexToRgba(color, 0.1),
              color: color,
            }}
          >
            {label}
          </Tag>
        </Header>

        <IconWrapper>
          <Icon
            style={{
              backgroundColor: hexToRgba(color, 0.15),
              color: color,
            }}
          >
            {icon}
          </Icon>
        </IconWrapper>

        {/* Content */}
        <Title>{title}</Title>
        <QuestionInfo>{questionInfo}</QuestionInfo>
        <Description>{description}</Description>

        {/* Progress bar */}
        {progress !== undefined && (
          <Progress
            size="medium"
            percent={progress}
            strokeColor={color}
            railColor={hexToRgba(color, 0.1)}
            showInfo={false}
            strokeWidth={8}
            className="mb-4!"
          />
        )}

        {/* Action */}
        <StyledButton
          size="large"
          type="primary"
          onClick={onStart}
          style={{
            backgroundColor: color,
            borderColor: color,
          }}
        >
          Bắt đầu luyện tập
          <ArrowForward style={{ fontSize: 20 }} />
        </StyledButton>
      </CardBody>
    </StyledCard>
  )
}
