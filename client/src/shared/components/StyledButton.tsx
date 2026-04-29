import { Button, type ButtonProps } from 'antd'
import { styled } from '@/shared/utils/cn'
import { COLORS } from '@/shared/constants/user-color'
import { hexToRgba } from '@/shared/utils/color'

const BaseButton = styled(
  Button,
  'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-out hover:translate-y-1 shadow-[0_4px_0_0_var(--shadow-color)]! hover:shadow-none! active:shadow-none!',
)

interface StyledButtonProps extends ButtonProps {
  shadowColor?: string
}

export function StyledButton({ shadowColor, style, ...props }: StyledButtonProps) {
  const defaultShadowColor =
    props.type === 'primary'
      ? hexToRgba(COLORS.primary, 0.6)
      : props.danger
        ? hexToRgba('#ff4d4f', 0.6)
        : 'rgba(0, 0, 0, 0.15)'

  return (
    <BaseButton
      {...props}
      style={
        {
          '--shadow-color': shadowColor || defaultShadowColor,
          ...style,
        } as React.CSSProperties
      }
    />
  )
}
