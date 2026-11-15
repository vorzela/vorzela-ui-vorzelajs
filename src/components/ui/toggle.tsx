import { signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { forwardRef } from '../../types.ts'
import type { ButtonHTMLAttributes } from '../../types.ts'
import styles from './toggle.module.scss'

export type ToggleVariant = 'default' | 'outline'
export type ToggleSize = 'default' | 'sm' | 'lg'

const VARIANT: Record<ToggleVariant, string> = {
  default: '',
  outline: styles.outline,
}

const SIZE: Record<ToggleSize, string> = {
  default: '',
  sm: styles.sm,
  lg: styles.lg,
}

export interface ToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean | (() => boolean)
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: ToggleVariant
  size?: ToggleSize
  onClick?: (event: globalThis.MouseEvent) => void
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle(
    {
      className,
      variant = 'default',
      size = 'default',
      pressed: pressedProp,
      defaultPressed = false,
      onPressedChange,
      onClick,
      ...props
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = signal(defaultPressed)
    const controlled =
      pressedProp === undefined ? null : accessorOf<boolean>(pressedProp)
    const pressed = (): boolean =>
      controlled ? controlled() : uncontrolled()

    const handleClick = (event: globalThis.MouseEvent): void => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (!controlled) setUncontrolled(!pressed())
      onPressedChange?.(!pressed())
    }

    return (
      <button
        ref={ref}
        type="button"
        data-state={() => (pressed() ? 'on' : 'off')}
        aria-pressed={() => (pressed() ? 'true' : 'false')}
        className={cx(styles.root, VARIANT[variant], SIZE[size], className)}
        onClick={handleClick}
        {...props}
      />
    )
  },
)

Toggle.displayName = 'Toggle'
