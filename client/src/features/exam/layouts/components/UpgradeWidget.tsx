import { Button } from 'antd'

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
}

const Container = styled('div', 'p-4 pb-10')

const CollapsedView = styled('div', 'flex flex-col items-center gap-2')

const IconCircle = styled('div', 'flex items-center justify-center w-12 h-12 rounded-full')

const ExpandedView = styled('div', 'flex flex-col gap-3')

const StyledButton = styled(
  Button,
  'relative h-10 w-fit mx-auto rounded-lg! inline-flex items-center justify-center gap-1.5 font-semibold text-sm transition-all duration-150 ease-out hover:translate-y-1 shadow-[0_3px_0_0_var(--shadow-color)]! hover:shadow-none! active:shadow-none!',
)

export function UpgradeWidget({ collapsed, onUpgrade }: UpgradeWidgetProps) {
  if (collapsed) {
    return (
      <Container onClick={onUpgrade} className="cursor-pointer">
        <CollapsedView>
          <IconCircle
            style={{
              backgroundColor: hexToRgba(COLORS.primary, 0.15),
              color: COLORS.primary,
            }}
          >
            <WorkspacePremium style={{ fontSize: 24 }} />
          </IconCircle>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Pro
          </span>
        </CollapsedView>
      </Container>
    )
  }

  return (
    <Container>
      <ExpandedView>
        <img src={CapybaraBilling} className="size-25 mx-auto" />

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
          Nâng cấp ngay
        </StyledButton>
      </ExpandedView>
    </Container>
  )
}
