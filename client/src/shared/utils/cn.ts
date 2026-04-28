import { type ClassValue, clsx } from 'clsx'
import {
  createElement,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function styled<T extends ElementType>(element: T, baseClassName: string) {
  type Props = ComponentPropsWithoutRef<T> & {
    className?: string
  }
  type Ref = ComponentPropsWithRef<T> extends { ref?: React.Ref<infer R> | undefined } ? R : never

  const StyledComponent = forwardRef<Ref, Props>((props, ref) => {
    const { className, ...rest } = props
    return createElement(element, {
      ...rest,
      ref,
      className: cn(baseClassName, className),
    })
  })

  StyledComponent.displayName = `Styled(${
    typeof element === 'string'
      ? element
      : (element as { displayName?: string; name?: string }).displayName ||
        (element as { displayName?: string; name?: string }).name ||
        'Component'
  })`

  return StyledComponent
}
