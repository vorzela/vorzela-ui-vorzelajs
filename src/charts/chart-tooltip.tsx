import { cx } from '../lib/cx.ts'
import type { CSSProperties, ReactNode } from '../types.ts'
import styles from './charts.module.scss'

/** Floating tooltip positioned inside a chart container. */
export function ChartTooltip({
  x,
  y,
  width,
  children,
  className,
}: {
  x: number
  y: number
  width: number
  children: ReactNode
  className?: string
}) {
  const flip = x > width * 0.65
  const style: CSSProperties = { top: Math.max(4, y - 12) }

  if (flip) style.right = width - x + 12
  else style.left = x + 12

  return (
    <div role="status" className={cx(styles.tooltip, className)} style={style}>
      {children}
    </div>
  )
}
