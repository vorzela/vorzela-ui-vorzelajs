/**
 * Combobox combining input + popover + list. Debounce-safe, keyboard
 * navigable, focus-trapped panel, proper cleanup.
 */
import { computed, effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf, useMounted } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import type { CSSProperties } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { Check, ChevronsUpDown, X } from './icons.tsx'
import { Label } from './label.tsx'
import styles from './combobox.module.scss'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[] | (() => ComboboxOption[])
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  onSearchChange?: (query: string) => void
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean | (() => boolean)
  emptyMessage?: string
  className?: string
  wrapClassName?: string
  clearable?: boolean
  freeSolo?: boolean
}

export function Combobox({
  options,
  value: valueProp,
  defaultValue = '',
  onChange,
  onSearchChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  label,
  hint,
  error,
  required,
  disabled,
  emptyMessage = 'No results found.',
  className,
  wrapClassName,
  clearable = true,
  freeSolo = false,
}: ComboboxProps) {
  const id = useId('combobox')
  const optionsValue = accessorOf(options)
  const isDisabled = accessorOf(disabled ?? false)
  const isControlled = valueProp !== undefined
  const controlledValue = isControlled ? accessorOf(valueProp) : null
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const value = (): string =>
    controlledValue ? controlledValue() : uncontrolled()

  const [open, setOpen] = signal(false)
  const [search, setSearch] = signal<string | null>(null)
  const mounted = useMounted()
  const [pos, setPos] = signal({ left: 0, top: 0, bottom: 0, width: 0 })
  const [dropUp, setDropUp] = signal(false)
  const [activeIdx, setActiveIdx] = signal(-1)

  const triggerRef: { current: HTMLButtonElement | null } = { current: null }
  const inputRef: { current: HTMLInputElement | null } = { current: null }
  const panelRef: { current: HTMLDivElement | null } = { current: null }
  const listRef: { current: HTMLDivElement | null } = { current: null }

  const selectedOption = (): ComboboxOption | undefined =>
    optionsValue().find((option) => option.value === value())

  // `null` means "show the selected label"; a string is the user's filter.
  const query = (): string =>
    open() ? (search() ?? selectedOption()?.label ?? '') : ''

  const filteredOptions = (): ComboboxOption[] => {
    const current = query().trim().toLowerCase()
    if (!current) return optionsValue()
    return optionsValue().filter(
      (option) =>
        option.label.toLowerCase().includes(current) ||
        option.value.toLowerCase().includes(current) ||
        (option.description?.toLowerCase().includes(current) ?? false),
    )
  }
  const hasFilteredOptions = computed(() => filteredOptions().length > 0)

  function measure(): void {
    if (typeof window === 'undefined' || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow)
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
    setSearch(null)
    setOpen(true)
    queueMicrotask(() => {
      if (open()) inputRef.current?.focus({ preventScroll: true })
    })
  }

  function closePanel(returnFocus = true): void {
    setOpen(false)
    setSearch(null)
    setActiveIdx(-1)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }

  function selectValue(nextValue: string): void {
    const previous = value()
    if (!isControlled) setUncontrolled(nextValue)
    if (previous !== nextValue) onChange?.(nextValue)
    closePanel()
  }

  effect(() => {
    if (!open()) return
    const handler = (event: PointerEvent): void => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      closePanel(false)
    }
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 0)
    timer.unref?.()
    onCleanup(() => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handler)
    })
  })

  effect(() => {
    if (!open()) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closePanel()
      }
    }
    document.addEventListener('keydown', handler, { capture: true })
    onCleanup(() =>
      document.removeEventListener('keydown', handler, { capture: true }),
    )
  })

  effect(() => {
    if (!open()) return
    const update = (): void => measure()
    window.addEventListener('scroll', update, { passive: true, capture: true })
    window.addEventListener('resize', update, { passive: true })
    onCleanup(() => {
      window.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    })
  })

  effect(() => {
    const index = activeIdx()
    if (index < 0 || !listRef.current) return
    const element = listRef.current.children[index] as HTMLElement | undefined
    element?.scrollIntoView({ block: 'nearest' })
  })

  function handleKeyDown(event: KeyboardEvent): void {
    if (!open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openPanel()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIdx((index) => Math.min(index + 1, filteredOptions().length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIdx((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = filteredOptions()[activeIdx()]
      if (option && !option.disabled) selectValue(option.value)
    } else if (event.key === 'Tab') {
      closePanel(false)
    }
  }

  const panelStyle = (): CSSProperties => {
    const position = pos()
    return {
      position: 'fixed',
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
    <div className={cx(styles.root, wrapClassName)}>
      {label ? (
        <Label htmlFor={id} required={required} hint={hint} hintId={`${id}-hint`}>
          {label}
        </Label>
      ) : null}

      <div className={styles.field}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-disabled={isDisabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-activedescendant={() =>
            open() && activeIdx() >= 0
              ? `${id}-option-${activeIdx()}`
              : undefined
          }
          disabled={isDisabled}
          onClick={() => (open() ? closePanel() : openPanel())}
          onKeyDown={handleKeyDown}
          className={cx(styles.trigger, error && styles.invalid, className)}
        >
          <span
            className={() =>
              cx(
                styles.value,
                !selectedOption() && !value() ? styles.placeholder : undefined,
              )
            }
          >
            {() => selectedOption()?.label ?? value() ?? placeholder}
          </span>
          <ChevronsUpDown size={14} className={styles.chevron} aria-hidden />
        </button>

        <Show when={() => clearable && Boolean(value()) && !isDisabled()}>
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear selection"
            onClick={(event) => {
              event.stopPropagation()
              if (!isControlled) setUncontrolled('')
              onChange?.('')
              setSearch('')
            }}
          >
            <X size={14} aria-hidden />
          </button>
        </Show>
      </div>

      <Show when={() => open() && mounted()}>
        {() => (
          <Portal>
            <div ref={panelRef} className={styles.panel} style={panelStyle}>
              <div className={styles.searchWrap}>
                <input
                  ref={inputRef}
                  type="text"
                  aria-label={searchPlaceholder}
                  autoComplete="off"
                  className={styles.searchInput}
                  placeholder={searchPlaceholder}
                  value={query}
                  onInput={(event) => {
                    const target = event.currentTarget as HTMLInputElement
                    setSearch(target.value)
                    onSearchChange?.(target.value)
                    setActiveIdx(-1)
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div
                ref={listRef}
                id={`${id}-listbox`}
                role="listbox"
                aria-label={label ?? placeholder}
                className={styles.list}
              >
                <Show
                  when={hasFilteredOptions}
                  fallback={<p className={styles.empty}>{emptyMessage}</p>}
                >
                  {() => (
                    <For
                      each={filteredOptions}
                      key={(option) => option.value}
                    >
                      {(option, index) => (
                        <button
                          id={`${id}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={() => value() === option.value}
                          disabled={option.disabled}
                          className={() =>
                            cx(
                              styles.option,
                              option.disabled && styles.optionDisabled,
                              activeIdx() === index &&
                                !option.disabled &&
                                styles.optionActive,
                            )
                          }
                          onClick={() => {
                            if (!option.disabled) selectValue(option.value)
                          }}
                          onPointerEnter={() => {
                            if (!option.disabled) setActiveIdx(() => index)
                          }}
                        >
                          <span className={styles.optionLabel}>
                            {option.label}
                            {option.description ? (
                              <span className={styles.optionDescription}>
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                          <Show when={() => value() === option.value}>
                            <Check size={14} className={styles.check} aria-hidden />
                          </Show>
                        </button>
                      )}
                    </For>
                  )}
                </Show>
                <Show when={() => freeSolo && Boolean(query().trim())}>
                  <button
                    type="button"
                    className={cx(styles.option, styles.freeSolo)}
                    onClick={() => selectValue(query().trim())}
                  >
                    Use &quot;{query().trim()}&quot;
                  </button>
                </Show>
              </div>
            </div>
          </Portal>
        )}
      </Show>

      {error ? (
        <p id={`${id}-error`} role="alert" className={cx(styles.message, styles.errorText)}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
