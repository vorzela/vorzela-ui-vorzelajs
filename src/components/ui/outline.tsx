import { For } from '@vorzelajs/dom'
import { cx } from '../../lib/cx.ts'
import styles from './outline.module.scss'

export interface OutlineItem {
  id: string
  label: string
  level?: number
}

export interface OutlineProps {
  items: OutlineItem[] | (() => OutlineItem[])
  activeId?: string | (() => string | undefined)
  className?: string
  label?: string
}

/** Table-of-contents navigation for long documents. */
export function Outline({
  items,
  activeId,
  className,
  label = 'On this page',
}: OutlineProps) {
  const list = typeof items === 'function' ? items : () => items
  const active =
    typeof activeId === 'function' ? activeId : () => activeId

  return (
    <nav className={cx(styles.root, className)} aria-label={label}>
      <p className={styles.label}>{label}</p>
      <ul className={styles.list}>
        <For each={list}>
          {(item) => (
            <li style={{ paddingLeft: `${Math.max(0, (item.level ?? 2) - 2) * 12}px` }}>
              <a
                className={cx(styles.link, item.id === active() && styles.active)}
                href={`#${item.id}`}
                aria-current={item.id === active() ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          )}
        </For>
      </ul>
    </nav>
  )
}
