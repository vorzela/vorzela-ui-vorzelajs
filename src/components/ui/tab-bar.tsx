import { signal, type Accessor } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './tab-bar.module.scss'
import type { CSSProperties, KeyboardEvent, ReactNode } from '../../types.ts'

export interface TabBarItem {
  value: string
  label: string
  icon?: ReactNode
  /** Small count or dot rendered above the icon. */
  badge?: ReactNode
  disabled?: boolean
}

export interface TabBarProps {
  items: TabBarItem[]
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  /** Accessible name for the navigation landmark. */
  label?: string
  /** `fixed` pins the bar to the bottom with a safe-area inset. */
  position?: 'static' | 'fixed'
  className?: string
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/**
 * Compact bottom navigation. Grid-based, one tab stop, roving focus with
 * Arrow/Home/End keys. Active state is expressed with `aria-current`.
 */
export function TabBar({
  items,
  value: valueProp,
  defaultValue,
  onChange,
  label = 'Primary navigation',
  position = 'static',
  className,
}: TabBarProps) {
  const [internal, setInternal] = signal(
    defaultValue ?? items[0]?.value ?? '',
  )
  const controlled = valueProp === undefined ? null : accessorOf(valueProp)
  const value: Accessor<string> = () =>
    controlled ? controlled() : internal()

  const setValue = (next: string): void => {
    if (!controlled) setInternal(next)
    onChange?.(next)
  }

  const refs: Array<HTMLButtonElement | null> = []
  const enabled = items.filter((item) => !item.disabled)
  const activeIndex = (): number =>
    items.findIndex((item) => item.value === value())
  const tabStop = (): number => (activeIndex() >= 0 ? activeIndex() : 0)

  const move = (direction: 1 | -1): void => {
    if (enabled.length === 0) return
    const currentValue = items[tabStop()]?.value
    const currentEnabled = Math.max(
      0,
      enabled.findIndex((item) => item.value === currentValue),
    )
    const next =
      enabled[(currentEnabled + direction + enabled.length) % enabled.length]
    if (next) {
      setValue(next.value)
      refs[items.indexOf(next)]?.focus()
    }
  }

  const focusValue = (next: TabBarItem | undefined): void => {
    if (!next) return
    setValue(next.value)
    refs[items.indexOf(next)]?.focus()
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusValue(enabled[0])
    } else if (event.key === 'End') {
      event.preventDefault()
      focusValue(enabled[enabled.length - 1])
    }
  }

  return (
    <nav
      aria-label={label}
      className={cx(styles.root, position === 'fixed' && styles.fixed, className)}
      style={{ '--tab-count': items.length } as CSSProperties}
    >
      <For each={() => items} key={(item) => item.value}>
        {(item, index) => {
          const active = (): boolean => item.value === value()

          return (
            <button
              ref={(node) => {
                refs[index] = node as HTMLButtonElement | null
              }}
              type="button"
              disabled={item.disabled}
              aria-current={() => (active() ? 'page' : undefined)}
              tabIndex={reactive(() => (active() ? 0 : -1))}
              className={reactive(() =>
                cx(styles.item, active() && styles.active),
              )}
              onClick={() => setValue(item.value)}
              onKeyDown={
        handleKeyDown as unknown as (event: globalThis.KeyboardEvent) => void
      }
            >
              {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
              <span className={styles.label}>{item.label}</span>
              {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
            </button>
          )
        }}
      </For>
    </nav>
  )
}
