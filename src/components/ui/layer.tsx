import { Portal } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './layer.module.scss'

export interface LayerProps {
  children?: ReactNode
  className?: string
  mount?: string
  portal?: boolean
}

/** Positioning layer; portals to the body by default. */
export function Layer({ children, className, mount, portal = true }: LayerProps) {
  const content = <div className={cx(styles.root, className)}>{children}</div>
  return portal ? <Portal mount={mount}>{content}</Portal> : content
}
