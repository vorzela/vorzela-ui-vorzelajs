/**
 * Async-aware autocomplete input.
 *
 * Keyboard accessible, portal-rendered, auto-flipping, debounced, and fully
 * controlled: the parent owns the async data source. Selected items are
 * rendered by the caller as chips if desired.
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf, useMounted } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { CSSProperties, ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { Label } from './label.tsx'
import { Search, X } from './icons.tsx'
import styles from './autocomplete.module.scss'

export interface AutocompleteProps<T> {
  /** Current search text (controlled). Accepts a signal accessor. */
  query: string | (() => string)
  /** Called on every keystroke with the raw input. */
  onQueryChange: (q: string) => void
  /** Result items to display in the dropdown. Accepts a signal accessor. */
  items: T[] | (() => T[])
  /** Called when the user picks an item. */
  onSelect: (item: T) => void
  /** Extract the display label for an item. */
  itemLabel: (item: T) => string
  /** Extract a unique string key for an item. */
  itemValue: (item: T) => string
  /** Optional custom rendering for each dropdown row. */
  renderItem?: (item: T) => ReactNode
  /** Show a loading spinner / message. Accepts a signal accessor. */
  loading?: boolean | (() => boolean)
  /** Minimum query length before showing the dropdown (default: 2). */
  minQuery?: number
  /** Debounce interval in ms — delay before onQueryChange fires. */
  debounce?: number
  /** Placeholder inside the input. */
  placeholder?: string
  /** Field label. */
  label?: string
  /** Hint text below the label. */
  hint?: string
  /** Required asterisk. */
  required?: boolean
  /** Error text below the control. */
  error?: string
  /** Disabled state. Accepts a signal accessor. */
  disabled?: boolean | (() => boolean)
  /** Empty-state message (default: "No results found"). */
  emptyMessage?: string
  /** Additional class on the root wrapper. */
  className?: string
}

const MAX_DROP_H = 280

export function Autocomplete<T>({
  query,
  onQueryChange,
  items,
  onSelect,
  itemLabel,
  itemValue,
  renderItem,
  loading,
  minQuery = 2,
  debounce: debounceMs = 0,
  placeholder,
  label,
  hint,
  required,
  error,
  disabled,
  emptyMessage,
  className,
}: AutocompleteProps<T>) {
  const id = useId('autocomplete')

  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const panelRef: { current: HTMLDivElement | null } = { current: null }
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let queryGeneration = 0

  const mounted = useMounted()
  const queryValue = accessorOf(query)
  const itemsValue = accessorOf(items)
  const isLoading = accessorOf(loading ?? false)
  const isDisabled = accessorOf(disabled ?? false)

  const [open, setOpen] = signal(false)
  const [activeIdx, setActiveIdx] = signal(-1)
  const [pos, setPos] = signal({ left: 0, top: 0, bottom: 0, width: 0 })
  const [dropUp, setDropUp] = signal(false)
  /** Local draft so debounced `onQueryChange` does not block typing. */
  const [draft, setDraft] = signal(queryValue())
  let lastQuery = queryValue()

  effect(() => {
    const next = queryValue()
    if (next !== lastQuery) {
      lastQuery = next
      setDraft(next)
    }
  })

  onCleanup(() => {
    clearTimeout(debounceTimer)
  })

  function measure(): void {
    if (typeof window === 'undefined' || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setDropUp(spaceBelow < MAX_DROP_H && spaceAbove > spaceBelow)
    setPos({
      left: rect.left,
      top: rect.bottom,
      bottom: rect.top,
      width: rect.width,
    })
  }

  function openPanel(): void {
    if (isDisabled()) return
    measure()
    setActiveIdx(-1)
    setOpen(true)
  }

  function close(returnFocus = true): void {
    setOpen(false)
    setActiveIdx(-1)
    if (returnFocus) inputRef.current?.focus({ preventScroll: true })
  }

  effect(() => {
    if (!open()) return
    const handler = (): void => measure()
    window.addEventListener('scroll', handler, { passive: true, capture: true })
    window.addEventListener('resize', handler, { passive: true })
    onCleanup(() => {
      window.removeEventListener('scroll', handler, { capture: true })
      window.removeEventListener('resize', handler)
    })
  })

  effect(() => {
    if (!open()) return
    const handler = (event: PointerEvent): void => {
      const target = event.target as Node
      if (
        inputRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      close(false)
    }
    document.addEventListener('pointerdown', handler)
    onCleanup(() => document.removeEventListener('pointerdown', handler))
  })

  effect(() => {
    if (!open()) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }
    document.addEventListener('keydown', handler, { capture: true })
    onCleanup(() =>
      document.removeEventListener('keydown', handler, { capture: true }),
    )
  })

  function handleKeyDown(event: KeyboardEvent): void {
    if (!open()) {
      if (event.key === 'ArrowDown' && draft().trim().length >= minQuery) {
        event.preventDefault()
        openPanel()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIdx((index) => Math.min(index + 1, itemsValue().length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIdx((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = itemsValue()[activeIdx()]
      if (item !== undefined) {
        onSelect(item)
        close()
      }
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  effect(() => {
    const index = activeIdx()
    if (index < 0 || !panelRef.current) return
    const list = panelRef.current.querySelector('[role="listbox"]')
    const element = list?.children[index] as HTMLElement | undefined
    element?.scrollIntoView({ block: 'nearest' })
  })

  function handleInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement
    const value = target.value
    setDraft(value)
    clearTimeout(debounceTimer)
    const generation = ++queryGeneration
    if (debounceMs > 0) {
      debounceTimer = setTimeout(() => {
        if (generation !== queryGeneration) return
        onQueryChange(value)
      }, debounceMs)
      debounceTimer.unref?.()
    } else {
      onQueryChange(value)
    }

    if (value.trim().length >= minQuery) {
      if (!open()) openPanel()
      else measure()
    } else {
      setOpen(false)
    }
    setActiveIdx(-1)
  }

  const showPanel = (): boolean => open() && draft().trim().length >= minQuery

  const panelStyle = (): CSSProperties => {
    const position = pos()
    return {
      left: `${position.left}px`,
      width: `${position.width}px`,
      ...(typeof window === 'undefined'
        ? {}
        : dropUp()
          ? {
              bottom: `${window.innerHeight - position.bottom + 6}px`,
              transformOrigin: 'bottom',
            }
          : {
              top: `${position.top + 6}px`,
              transformOrigin: 'top',
            }),
    }
  }

  return (
    <div className={cx(styles.root, className)}>
      {label ? (
        <Label htmlFor={id} required={required} hint={hint} hintId={`${id}-hint`}>
          {label}
        </Label>
      ) : null}

      <div className={styles.field}>
        <Search size={14} aria-hidden className={styles.searchIcon} />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
          aria-controls={`${id}-listbox`}
          aria-activedescendant={() =>
            showPanel() && activeIdx() >= 0
              ? `${id}-option-${activeIdx()}`
              : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          autoComplete="off"
          disabled={isDisabled}
          placeholder={placeholder}
          value={draft}
          onInput={handleInput}
          onFocus={() => {
            if (draft().trim().length >= minQuery) openPanel()
          }}
          onKeyDown={handleKeyDown}
          className={cx(styles.input, error && styles.invalid)}
        />
        <Show when={() => draft().length > 0 && !isDisabled()}>
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              queryGeneration += 1
              clearTimeout(debounceTimer)
              setDraft('')
              onQueryChange('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className={styles.clear}
          >
            <X size={14} aria-hidden />
          </button>
        </Show>
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className={cx(styles.message, styles.errorText)}>
          {error}
        </p>
      ) : null}

      <Show when={mounted}>
        {() => (
          <Portal>
            <div
              ref={panelRef}
              inert={() => !showPanel()}
              className={cx(
                styles.panel,
                showPanel() ? styles.panelOpen : styles.panelClosed,
              )}
              style={panelStyle}
            >
              <Show when={isLoading}>
                <p className={styles.loading}>Searching…</p>
              </Show>

              <Show when={() => !isLoading() && itemsValue().length === 0}>
                <p className={styles.empty}>{emptyMessage ?? 'No results found'}</p>
              </Show>

              <div
                role="listbox"
                id={`${id}-listbox`}
                aria-label={label ?? 'Suggestions'}
                className={styles.list}
              >
                <For each={itemsValue} key={(item) => itemValue(item)}>
                  {(item, index) => (
                    <button
                      id={`${id}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={() => activeIdx() === index}
                      className={() =>
                        cx(
                          styles.option,
                          activeIdx() === index && styles.optionActive,
                        )
                      }
                      onClick={() => {
                        onSelect(item)
                        close()
                      }}
                      onPointerEnter={() => setActiveIdx(() => index)}
                    >
                      {renderItem ? (
                        renderItem(item)
                      ) : (
                        <span className={styles.optionLabel}>{itemLabel(item)}</span>
                      )}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  )
}
