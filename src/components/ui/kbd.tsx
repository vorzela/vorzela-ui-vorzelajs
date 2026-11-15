
import { cx } from '../../lib/cx.ts'
import styles from './kbd.module.scss'
import type { HTMLAttributes } from '../../types.ts'

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md'
}

/** A single key cap. Wrap several in a `role="group"` for shortcuts. */
export function Kbd({ size = 'md', className, ...props }: KbdProps) {
  return (
    <kbd
      className={cx(styles.root, size === 'sm' && styles.sm, className)}
      {...props}
    />
  )
}
