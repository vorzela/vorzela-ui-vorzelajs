import { cx } from '../../lib/cx.ts'
import type { HTMLAttributes } from '../../types.ts'
import styles from './overlay.module.scss'

export interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'dark' | 'light'
}

/** Dimmed backdrop for dialogs and sheets. */
export function Overlay({ tone = 'dark', className, ...props }: OverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(styles.root, styles[tone], className)}
      {...props}
    />
  )
}
