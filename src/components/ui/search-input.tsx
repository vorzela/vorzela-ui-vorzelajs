import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Clock, Search, X } from './icons.tsx'
import { Label } from './label.tsx'
import styles from './search-input.module.scss'

export interface SearchInputProps {
  label?: string
  placeholder?: string
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  /** Called on Enter or when a recent search is chosen. */
  onSearch?: (query: string) => void
  /** localStorage key for the recent searches. */
  historyKey?: string
  /** Seed entries used when storage is empty (demos, first run). */
  initialHistory?: string[]
  maxHistory?: number
  className?: string
  id?: string
}

function readHistory(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

/**
 * Search field with recent-query history. Enter stores the query, focus with an
 * empty value reveals history, and every entry is keyboard reachable.
 */
export function SearchInput({
  label,
  placeholder = 'Search…',
  value: valueProp,
  defaultValue = '',
  onChange,
  onSearch,
  historyKey = 'vz.search-history',
  initialHistory = [],
  maxHistory = 5,
  className,
  id: idProp,
}: SearchInputProps) {
  const id = idProp ?? useId('search')
  const listId = `${id}-history`
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<string>(valueProp)
  const query = (): string => (controlled ? controlled() : uncontrolled())
  const [history, setHistory] = signal<string[]>(
    initialHistory.slice(0, maxHistory),
  )
  const [open, setOpen] = signal(false)
  const [root, setRoot] = signal<HTMLDivElement | null>(null)

  // Read persisted history after mount so the server and the first client
  // render both use the deterministic `initialHistory` seed.
  effect(() => {
    const stored = readHistory(historyKey)
    if (stored.length > 0) setHistory(stored.slice(0, maxHistory))
  })

  const setQuery = (next: string): void => {
    if (!controlled) setUncontrolled(next)
    onChange?.(next)
  }

  const commit = (next: string): void => {
    const trimmed = next.trim()
    if (!trimmed) return
    const nextHistory = [
      trimmed,
      ...history().filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
      ),
    ].slice(0, maxHistory)
    setHistory(nextHistory)
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(nextHistory))
    } catch {
      /* storage blocked */
    }
    setOpen(false)
    onSearch?.(trimmed)
  }

  const clearHistory = (): void => {
    setHistory([])
    try {
      window.localStorage.removeItem(historyKey)
    } catch {
      /* storage blocked */
    }
  }

  effect(() => {
    const node = root()
    if (!open() || !node || typeof document === 'undefined') return

    const onPointerDown = (event: globalThis.PointerEvent): void => {
      if (node.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    onCleanup(() => document.removeEventListener('pointerdown', onPointerDown))
  })

  const showHistory = (): boolean =>
    open() && query().trim().length === 0 && history().length > 0

  return (
    <div ref={(node) => setRoot(node as HTMLDivElement)} className={cx(styles.root, className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className={styles.shell}>
        <span className={styles.icon}>
          <Search aria-hidden />
        </span>
        <input
          id={id}
          type="search"
          role="combobox"
          aria-expanded={() => (showHistory() ? 'true' : 'false')}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          className={styles.input}
          onChange={(event) =>
            setQuery((event.currentTarget as HTMLInputElement).value)
          }
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Enter') {
              event.preventDefault()
              commit(query())
            }
            if (event.key === 'ArrowDown' && showHistory()) {
              event.preventDefault()
              root()
                ?.querySelector<HTMLButtonElement>('[role="option"]')
                ?.focus()
            }
          }}
        />
        <Show when={() => Boolean(query())}>
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setOpen(true)
            }}
          >
            <X aria-hidden />
          </button>
        </Show>
      </div>

      <Show when={showHistory}>
        {() => (
          <div
            id={listId}
            role="listbox"
            aria-label="Recent searches"
            className={styles.dropdown}
          >
            <div className={styles.dropdownHead}>
              <span className={styles.dropdownTitle}>Recent searches</span>
              <button
                type="button"
                className={styles.clearHistory}
                onClick={clearHistory}
              >
                Clear
              </button>
            </div>
            <div className={styles.list}>
              <For each={history} key={(item) => item}>
                {(item) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    className={styles.item}
                    onClick={() => {
                      setQuery(item)
                      commit(item)
                    }}
                  >
                    <Clock aria-hidden />
                    <span className={styles.itemLabel}>{item}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
