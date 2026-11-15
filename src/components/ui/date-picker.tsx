/**
 * Masked text input + Calendar popup for picking a date.
 *
 * DISPLAY format : dd/mm/yyyy  (user-visible, auto-masked as you type)
 * VALUE  format  : YYYY-MM-DD  (ISO — backend)
 *
 * The popup is portal-rendered (never clipped) and has a fixed 320 px width
 * so the calendar layout is always well-proportioned regardless of input width.
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import { Portal } from '../primitives/portal.tsx'
import { CalendarIcon, CircleAlert, CircleCheck, X } from './icons.tsx'
import { Calendar } from './calendar.tsx'
import { parseIso, todayIso } from './calendar-utils.ts'
import { Label } from './label.tsx'
import styles from './date-picker.module.scss'
import type { CSSProperties } from '../../types.ts'

function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function displayToIso(display: string): string {
  const parts = display.split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return ''
  const iso = `${y}-${m}-${d}`
  const dt = new Date(`${iso}T00:00:00`)
  return isNaN(dt.getTime()) ? '' : iso
}

export interface DatePickerProps {
  /** Controlled value — ISO YYYY-MM-DD or '', value or signal accessor */
  value?: string | (() => string | undefined)
  /** Called with ISO YYYY-MM-DD or '' */
  onChange?: (iso: string) => void
  label?: string
  hint?: string
  error?: string
  success?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  /** ISO YYYY-MM-DD — dates before this are disabled */
  min?: string | (() => string | undefined)
  /** ISO YYYY-MM-DD — dates after this are disabled */
  max?: string | (() => string | undefined)
  wrapClassName?: string
  id?: string
}

// Calendar popup is always 320 px wide — NOT tied to input width
const PANEL_W = 320

interface PanelPosition {
  top: number
  bottom: number
  left: number
}

export function DatePicker({
  value,
  onChange,
  label,
  hint,
  error,
  success,
  required,
  placeholder,
  disabled,
  min,
  max,
  wrapClassName,
  id: idProp,
}: DatePickerProps) {
  const generatedId = useId('date-picker')
  const id = idProp ?? generatedId
  const today = todayIso()

  const valueAccessor = accessorOf<string | undefined>(value)
  const minAccessor = accessorOf<string | undefined>(min)
  const maxAccessor = accessorOf<string | undefined>(max)

  const [wrap, setWrap] = signal<HTMLDivElement | null>(null)
  const [panel, setPanel] = signal<HTMLDivElement | null>(null)
  const [open, setOpen] = signal(false)
  const [position, setPosition] = signal<PanelPosition>({
    top: 0,
    bottom: 0,
    left: 0,
  })
  const [dropUp, setDropUp] = signal(false)

  const [draft, setDraft] = signal<{
    value: string | undefined
    text: string
  }>({
    value: valueAccessor(),
    text: isoToDisplay(valueAccessor() ?? ''),
  })

  const currentValue = () => valueAccessor() ?? ''
  // Derive the displayed text from the latest external value whenever the
  // parent replaces it; keep the local draft while the value is unchanged.
  const inputText = () =>
    draft().value === valueAccessor()
      ? draft().text
      : isoToDisplay(valueAccessor() ?? '')
  const hasValue = () => Boolean(currentValue())

  const setInputText = (text: string) => {
    setDraft({ value: valueAccessor(), text })
  }

  const measure = () => {
    if (typeof window === 'undefined') return
    const rect = wrap()?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const clampedLeft = Math.min(rect.left, window.innerWidth - PANEL_W - 8)
    setDropUp(spaceBelow < 380)
    setPosition({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: Math.max(8, clampedLeft),
    })
  }

  const openPicker = () => {
    if (disabled) return
    measure()
    setOpen(true)
  }

  const closePicker = () => {
    setOpen(false)
  }

  // Dismiss on outside pointer press and Escape. The listeners live only while
  // the popup is open and are removed by the owning component scope.
  effect(() => {
    if (!open()) return
    if (typeof document === 'undefined') return

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node
      if (!wrap()?.contains(target) && !panel()?.contains(target)) {
        closePicker()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closePicker()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    })
  })

  const handleSelect = (iso: string) => {
    onChange?.(iso)
    setInputText(isoToDisplay(iso))
    closePicker()
  }

  const handleClear = (event: globalThis.MouseEvent) => {
    event.stopPropagation()
    onChange?.('')
    setInputText('')
  }

  const handleInput = (event: Event) => {
    const digits = (event.currentTarget as HTMLInputElement).value
      .replace(/\D/g, '')
      .slice(0, 8)

    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }

    setInputText(formatted)

    if (digits.length === 8) {
      const iso = displayToIso(formatted)
      if (iso) onChange?.(iso)
    } else if (digits.length === 0) {
      onChange?.('')
    }
  }

  const hasError = Boolean(error)
  const hasSuccess = Boolean(success) && !hasError
  const describedBy =
    [
      hint ? `${id}-hint` : null,
      hasError ? `${id}-error` : null,
      hasSuccess ? `${id}-success` : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

  const panelStyle = (): CSSProperties => ({
    width: `${PANEL_W}px`,
    left: `${position().left}px`,
    ...(dropUp()
      ? { bottom: `${position().bottom}px` }
      : { top: `${position().top}px` }),
  })

  return (
    <div
      className={cx(styles.root, wrapClassName)}
      ref={(node) => setWrap(node as HTMLDivElement)}
    >
      {label ? (
        <Label
          htmlFor={id}
          required={required}
          hint={hint}
          hintId={`${id}-hint`}
        >
          {label}
        </Label>
      ) : null}

      <div
        className={() =>
          cx(
            styles.field,
            hasError
              ? styles.invalid
              : hasSuccess
                ? styles.valid
                : open()
                  ? styles.open
                  : undefined,
            disabled && styles.disabled,
          )
        }
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Open calendar"
          aria-expanded={() => (open() ? 'true' : 'false')}
          onClick={openPicker}
          className={styles.iconButton}
        >
          <CalendarIcon size={16} aria-hidden />
        </button>

        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder ?? 'dd/mm/yyyy'}
          disabled={disabled}
          value={() => inputText()}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onInput={handleInput}
          onFocus={() => {
            if (!open()) openPicker()
          }}
          className={styles.input}
        />

        <Show when={() => hasValue() && !disabled}>
          {() => (
            <button
              type="button"
              aria-label="Clear date"
              onClick={handleClear}
              className={styles.clear}
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </Show>

        <Show when={() => hasError && !hasValue()}>
          {() => (
            <span className={cx(styles.status, styles.statusError)}>
              <CircleAlert size={16} aria-hidden />
            </span>
          )}
        </Show>
        <Show when={() => hasSuccess}>
          {() => (
            <span className={cx(styles.status, styles.statusSuccess)}>
              <CircleCheck size={16} aria-hidden />
            </span>
          )}
        </Show>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className={cx(styles.message, styles.errorText)}
        >
          {error}
        </p>
      ) : null}
      {success && !hasError ? (
        <p id={`${id}-success`} className={cx(styles.message, styles.successText)}>
          {success}
        </p>
      ) : null}

      <Show when={open}>
        {() => {
          const seedDate = parseIso(currentValue()) ?? parseIso(today)!
          return (
            <Portal>
              <div
                ref={(node) => setPanel(node as HTMLDivElement)}
                style={panelStyle}
                role="dialog"
                aria-modal="false"
                aria-label="Choose a date"
                className={styles.panel}
              >
                <Calendar
                  value={currentValue}
                  onSelect={handleSelect}
                  min={minAccessor}
                  max={maxAccessor}
                  showToday
                  initialYear={seedDate.getFullYear()}
                  initialMonth={seedDate.getMonth()}
                />
              </div>
            </Portal>
          )
        }}
      </Show>
    </div>
  )
}
