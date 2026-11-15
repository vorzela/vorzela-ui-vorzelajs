import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './bento-grid.module.scss'

export interface BentoGridProps {
  children?: ReactNode
  className?: string
}

/** Bento mosaic; column count follows the grid's container width. */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={styles.container}>
      <div className={cx(styles.grid, className)}>{children}</div>
    </div>
  )
}

const COL_SPAN = {
  1: '',
  2: styles.colSpan2,
  3: styles.colSpan3,
  4: styles.colSpan4,
} as const

const ROW_SPAN = {
  1: '',
  2: styles.rowSpan2,
  3: styles.rowSpan3,
} as const

export interface BentoItemProps {
  children?: ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
}

export function BentoItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoItemProps) {
  return (
    <div
      className={cx(
        styles.item,
        COL_SPAN[colSpan],
        ROW_SPAN[rowSpan],
        className,
      )}
    >
      {children}
    </div>
  )
}
