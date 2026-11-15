import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './marquee.module.scss'

export interface MarqueeProps {
  children: ReactNode
  /** Seconds for one full loop. */
  speed?: number
  pauseOnHover?: boolean
  reverse?: boolean
  className?: string
}

/**
 * Clone rendered content for the duplicate track. Vorzela hands components
 * live DOM nodes, so the same node cannot be inserted twice without moving it.
 */
function cloneContent(value: ReactNode): ReactNode {
  if (Array.isArray(value)) return value.map((child) => cloneContent(child))
  if (value && typeof value === 'object' && 'nodeType' in value) {
    return (value as Node).cloneNode(true)
  }
  return value
}

/** CSS-only marquee. Duplicated content is hidden from assistive tech. */
export function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  reverse = false,
  className,
}: MarqueeProps) {
  return (
    <div
      className={cx(styles.root, pauseOnHover && styles.pauseOnHover, className)}
      style={{ '--marquee-duration': `${speed}s` }}
    >
      <div className={cx(styles.track, reverse && styles.reverse)}>
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden>
          {cloneContent(children)}
        </div>
      </div>
    </div>
  )
}
