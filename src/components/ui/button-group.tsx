
import { cx } from '../../lib/cx.ts'

import styles from './button-group.module.scss'
import type { HTMLAttributes } from '../../types.ts'

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  /** Join the buttons into one continuous control. */
  attached?: boolean
}

/** Groups related buttons into one visual unit. */
export function ButtonGroup({
  orientation = 'horizontal',
  attached = true,
  className,
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cx(
        styles.root,
        orientation === 'vertical' ? styles.vertical : styles.horizontal,
        attached && styles.attached,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
