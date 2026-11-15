import { cx } from '../../lib/cx.ts'
import type { HTMLAttributes } from '../../types.ts'
import styles from './primitives.module.scss'

/** Screen-reader-only content. */
export function VisuallyHidden({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx(styles.sr, className)} {...props} />
}
