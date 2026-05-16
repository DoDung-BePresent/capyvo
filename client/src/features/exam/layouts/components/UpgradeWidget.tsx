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
  isLoading?: boolean
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
  isLoading = false,
}: UpgradeWidgetProps) {
  // Determine actual plan type (priority: planName > isOnTrial)
  const actualPlan =
    planName === 'PREMIUM' || planName === 'CLASSROOM'
      ? planName
      : planName === 'TRIAL' || isOnTrial
        ? 'TRIAL'
        : 'FREE'

  // Calculate totalDays based on actual plan
  const calculatedTotalDays =
    totalDays ??
    (actualPlan === 'TRIAL'
      ? 7
      : actualPlan === 'CLASSROOM'
        ? 365
        : actualPlan === 'PREMIUM'
          ? 30
          : 0)

  // Calculate percentage for progress circle
  const percentage =
    isPremium && daysRemaining !== null && daysRemaining > 0 && calculatedTotalDays > 0
      ? Math.round((daysRemaining / calculatedTotalDays) * 100)
      : 0

  // Determine color based on days remaining and plan
  const getProgressColor = () => {
    if (!isPremium || daysRemaining === null || daysRemaining <= 0) return COLORS.primary

    // For trial (7 days), use different thresholds
    if (actualPlan === 'TRIAL') {
      if (daysRemaining <= 2) return '#ff4d4f' // Red for <= 2 days
      if (daysRemaining <= 4) return '#faad14' // Orange for <= 4 days
      return '#52c41a' // Green for > 4 days
    }

    // For premium/classroom subscription (30+ days)
    if (daysRemaining <= 7) return '#ff4d4f' // Red for <= 7 days
    if (daysRemaining <= 15) return '#faad14' // Orange for <= 15 days
    return '#52c41a' // Green for > 15 days
  }

  // Determine tag color and text
  const getTagProps = () => {
    if (actualPlan === 'PREMIUM') {
      return { color: 'gold', text: 'PREMIUM' }
    }
    if (actualPlan === 'CLASSROOM') {
      return { color: 'green', text: 'CLASSROOM' }
    }
    if (actualPlan === 'TRIAL') {
      return { color: 'blue', text: 'TRIAL' }
    }
    return { color: 'default', text: 'FREE' }
  }

  const tagProps = getTagProps()

  if (collapsed) {
    return (
      <Container onClick={onUpgrade} className="cursor-pointer">
        <CollapsedView>
          {/* Show progress circle only if premium and has days remaining and NOT loading */}
          {!isLoading && isPremium && daysRemaining !== null && daysRemaining > 0 ? (
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

  // Render progress based on plan type
  const renderProgress = () => {
    // Loading or no premium: show capybara image (like FREE plan)
    if (isLoading || !isPremium || daysRemaining === null || daysRemaining <= 0) {
      return (
        <>
          {/* Only show FREE tag if NOT loading and actually FREE */}
          {!isLoading && actualPlan === 'FREE' && (
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
      )
    }

    // Show progress with tag
    return (
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
              <span style={{ fontSize: 28, fontWeight: 700, color: getProgressColor() }}>
                {daysRemaining}
              </span>
            </div>
          )}
        />
      </div>
    )
  }

  return (
    <Container>
      <ExpandedView>
        {renderProgress()}

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
            ? actualPlan === 'TRIAL'
              ? 'Nâng cấp ngay'
              : 'Gia hạn ngay'
            : 'Nâng cấp ngay'}
        </StyledButton>
      </ExpandedView>
    </Container>
  )
}
