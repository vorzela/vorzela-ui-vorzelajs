import { onCleanup, signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import styles from './anchor.module.scss'

export type AnchorItem = {
  id: string
  label: string
  level?: 2 | 3 | 4
}

export interface AnchorProps {
  items: AnchorItem[] | (() => AnchorItem[])
  label?: string
  offset?: number
  smooth?: boolean
  activeId?: string | (() => string)
  onChange?: (id: string) => void
  className?: string
  id?: string
}

/** Table of contents with a scroll-spy indicator. */
export function Anchor({
  items,
  label = 'On this page',
  offset = 96,
  smooth = true,
  activeId,
  onChange,
  className,
  id,
}: AnchorProps) {
  const labelId = `${id ?? useId('anchor')}-label`
  const list = typeof items === 'function' ? items : () => items
  const controlled = activeId === undefined ? null : typeof activeId === 'function' ? activeId : () => activeId
  const [internal, setInternal] = signal(list()[0]?.id ?? '')
  const active = (): string => (controlled ? controlled() : internal())

  if (typeof window !== 'undefined' && !controlled) {
    let frame = 0
    const update = (): void => {
      frame = 0
      let current = list()[0]?.id ?? ''
      for (const item of list()) {
        const element = document.getElementById(item.id)
        if (!element) continue
        if (element.getBoundingClientRect().top <= offset + 1) current = item.id
        else break
      }
      setInternal((previous) => (previous === current ? previous : current))
    }
    const schedule = (): void => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    onCleanup(() => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    })
  }

  const go = (event: Event, item: AnchorItem): void => {
    const element = document.getElementById(item.id)
    if (!element) return
    event.preventDefault()
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
    if (!controlled) setInternal(item.id)
    onChange?.(item.id)
  }

  return (
    <nav id={id} aria-labelledby={labelId} className={cx(styles.root, className)}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <ol className={styles.list}>
        <For each={list}>
          {(item) => (
            <li>
              <a
                href={`#${item.id}`}
                aria-current={item.id === active() ? 'location' : undefined}
                className={cx(
                  styles.link,
                  item.level === 3 && styles.level3,
                  item.level === 4 && styles.level4,
                  item.id === active() && styles.active,
                )}
                onClick={(event) => go(event, item)}
              >
                {item.label}
              </a>
            </li>
          )}
        </For>
      </ol>
    </nav>
  )
}
