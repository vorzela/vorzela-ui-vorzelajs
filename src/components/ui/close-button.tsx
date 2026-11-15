import { cx } from '../../lib/cx.ts'
import { forwardRef } from '../../types.ts'
import type { ButtonHTMLAttributes } from '../../types.ts'
import { X } from './icons.tsx'
import styles from './close-button.module.scss'

export type CloseButtonSize = 'sm' | 'md' | 'lg'

const SIZE: Record<CloseButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
}

export interface CloseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: CloseButtonSize
  label?: string
  className?: string
  children?: never
}

/** Compact close control for dialogs, sheets, toasts and banners. */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ size = 'md', label = 'Close', className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cx(styles.root, SIZE[size], className)}
      {...props}
    >
      <X aria-hidden="true" />
    </button>
  ),
)

CloseButton.displayName = 'CloseButton'
