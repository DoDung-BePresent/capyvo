import { Button, Progress, Tag } from 'antd'

/**
 * Icons
 */
import { WorkspacePremium } from '@mui/icons-material'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

/**
 * Assets
 */
import CapybaraBilling from '@/assets/images/billing.png'

interface UpgradeWidgetProps {
  collapsed: boolean
  onUpgrade: () => void
  isPremium?: boolean
  isOnTrial?: boolean
  daysRemaining?: number | null
  totalDays?: number
  planName?: string // "FREE", "PREMIUM", "CLASSROOM"
}

const Container = styled('div', 'p-4 pb-10')

const CollapsedView = styled('div', 'flex flex-col items-center gap-2')

const IconCircle = styled('div', 'flex items-center justify-center w-12 h-12 rounded-full')

const ExpandedView = styled('div', 'flex flex-col gap-3')

const StyledButton = styled(
  Button,
  'relative h-10 w-fit mx-auto rounded-lg! inline-flex items-center justify-center gap-1.5 font-semibold text-sm transition-all duration-150 ease-out hover:translate-y-1 shadow-[0_3px_0_0_var(--shadow-color)]! hover:shadow-none! active:shadow-none!',
)

export function UpgradeWidget({
  collapsed,
  onUpgrade,
  isPremium = false,
  isOnTrial = false,
  daysRemaining = null,
  totalDays,
  planName,
}: UpgradeWidgetProps) {
  // Auto-calculate totalDays based on trial status if not provided
  const calculatedTotalDays = totalDays ?? (isOnTrial ? 7 : 30)

  // Calculate percentage for progress circle
  const percentage =
    isPremium && daysRemaining !== null && daysRemaining > 0
      ? Math.round((daysRemaining / calculatedTotalDays) * 100)
      : 0

  // Determine color based on days remaining and total days
  const getProgressColor = () => {
    if (!isPremium || daysRemaining === null || daysRemaining <= 0) return COLORS.primary

    // For trial (7 days), use different thresholds
    if (isOnTrial) {
      if (daysRemaining <= 2) return '#ff4d4f' // Red for <= 2 days
      if (daysRemaining <= 4) return '#faad14' // Orange for <= 4 days
      return '#52c41a' // Green for > 4 days
    }

    // For premium subscription (30 days)
    if (daysRemaining <= 7) return '#ff4d4f' // Red for <= 7 days
    if (daysRemaining <= 15) return '#faad14' // Orange for <= 15 days
    return '#52c41a' // Green for > 15 days
  }

  // Determine tag color and text
  const getTagProps = () => {
    if (planName === 'FREE') {
      return { color: 'default', text: 'FREE' }
    }
    if (isOnTrial) {
      return { color: 'blue', text: 'TRIAL' }
    }
    if (planName === 'PREMIUM') {
      return { color: 'gold', text: 'PREMIUM' }
    }
    return { color: 'default', text: planName || 'FREE' }
  }

  const tagProps = getTagProps()

  if (collapsed) {
    return (
      <Container onClick={onUpgrade} className="cursor-pointer">
        <CollapsedView>
          {isPremium && daysRemaining !== null && daysRemaining > 0 ? (
            <Progress
              type="circle"
              percent={percentage}
              size={40}
              strokeWidth={10}
              strokeColor={getProgressColor()}
              format={() => (
                <span style={{ fontSize: 11, fontWeight: 700, color: getProgressColor() }}>
                  {daysRemaining}
                </span>
              )}
            />
          ) : (
            <IconCircle
              style={{
                backgroundColor: hexToRgba(COLORS.primary, 0.15),
                color: COLORS.primary,
              }}
            >
              <WorkspacePremium style={{ fontSize: 24 }} />
            </IconCircle>
          )}
        </CollapsedView>
      </Container>
    )
  }

  return (
    <Container>
      <ExpandedView>
        {isPremium && daysRemaining !== null && daysRemaining > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <Tag color={tagProps.color} style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
              {tagProps.text}
            </Tag>
            <Progress
              type="circle"
              percent={percentage}
              size={100}
              strokeColor={getProgressColor()}
              strokeWidth={8}
              format={() => (
                <div className="flex flex-col items-center">
                  <span style={{ fontSize: 24, fontWeight: 700, color: getProgressColor() }}>
                    {daysRemaining}
                  </span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>ngày</span>
                </div>
              )}
            />
          </div>
        ) : (
          <>
            {planName === 'FREE' && (
              <Tag
                color="default"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 8,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block',
                  width: 'fit-content',
                }}
              >
                FREE
              </Tag>
            )}
            <img src={CapybaraBilling} className="size-25 mx-auto" />
          </>
        )}

        <StyledButton
          type="primary"
          onClick={onUpgrade}
          style={
            {
              '--shadow-color': hexToRgba(COLORS.primary, 0.5),
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
              color: '#fff',
            } as React.CSSProperties
          }
        >
          <WorkspacePremium style={{ fontSize: 18 }} />
          {isPremium && daysRemaining !== null && daysRemaining > 0
            ? isOnTrial
              ? 'Nâng cấp ngay'
              : 'Gia hạn ngay'
            : 'Nâng cấp ngay'}
        </StyledButton>
      </ExpandedView>
    </Container>
  )
}
