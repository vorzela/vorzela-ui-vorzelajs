import { signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './virtual-list.module.scss'
import type { Key, ReactNode, SyntheticEvent } from '../../types.ts'

export interface VirtualListProps<T> {
  items: T[] | (() => T[])
  itemHeight: number
  height?: number
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  getKey: (item: T, index: number) => Key
  label?: string
  className?: string
}

interface WindowRow<T> {
  item: T
  index: number
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Windowed list for large record sets with fixed row heights. */
export function VirtualList<T>({
  items: itemsProp,
  itemHeight,
  height = 320,
  overscan = 4,
  renderItem,
  getKey,
  label = 'List',
  className,
}: VirtualListProps<T>) {
  const items = accessorOf(itemsProp)
  const [scrollTop, setScrollTop] = signal(0)

  const total = (): number => items().length * itemHeight
  const visible = Math.ceil(height / itemHeight)
  const start = (): number =>
    Math.max(0, Math.floor(scrollTop() / itemHeight) - overscan)
  const end = (): number =>
    Math.min(items().length, start() + visible + overscan * 2)

  let cache = new Map<number, WindowRow<T>>()

  /**
   * Reuse row wrappers so scrolling only creates rows for indices entering
   * the window; `For` keys by record and keeps the rest untouched.
   */
  const windowRows = (): Array<WindowRow<T>> => {
    const list = items()
    const first = start()
    const last = end()
    const next = new Map<number, WindowRow<T>>()
    const out: Array<WindowRow<T>> = []

    for (let index = first; index < last; index += 1) {
      const item = list[index] as T
      const existing = cache.get(index)
      const row =
        existing && existing.item === item
          ? existing
          : { item, index }
      next.set(index, row)
      out.push(row)
    }

    cache = next
    return out
  }

  return (
    <div
      role="list"
      aria-label={label}
      tabIndex={0}
      onScroll={(event: SyntheticEvent<HTMLDivElement>) =>
        setScrollTop(event.currentTarget.scrollTop)
      }
      style={{ height }}
      className={cx(styles.root, className)}
    >
      <div className={styles.inner} style={reactive(() => ({ height: total() }))}>
        <For each={windowRows} key={(row) => getKey(row.item, row.index)}>
          {(row) => (
            <div
              role="listitem"
              className={styles.item}
              style={{ top: row.index * itemHeight, height: itemHeight }}
            >
              {renderItem(row.item, row.index)}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
