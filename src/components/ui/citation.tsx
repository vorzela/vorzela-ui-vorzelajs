import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './citation.module.scss'

export interface CitationProps {
  source: ReactNode
  href?: string
  index?: number
  className?: string
}

/** Inline source reference with an optional numeric marker. */
export function Citation({ source, href, index, className }: CitationProps) {
  const content = (
    <>
      {index !== undefined ? <span className={styles.index}>[{index}]</span> : null}
      <span>{source}</span>
    </>
  )

  return href ? (
    <a className={cx(styles.root, className)} href={href}>
      {content}
    </a>
  ) : (
    <cite className={cx(styles.root, className)}>{content}</cite>
  )
}
