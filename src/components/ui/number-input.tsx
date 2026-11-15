import { signal } from '@vorzelajs/core'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Minus, Plus } from './icons.tsx'
import styles from './number-input.module.scss'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export interface NumberInputProps {
  value?: number | (() => number)
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  label?: string
  suffix?: string
  className?: string
  id?: string
}

export function NumberInput({
  value: valueProp,
  defaultValue = 0,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision = 0,
  disabled = false,
  label,
  suffix,
  className,
  id,
}: NumberInputProps) {
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<number>(valueProp)
  const current = (): number => (controlled ? controlled() : uncontrolled())

  const [draft, setDraft] = signal<string | null>(null)
  const inputId = id ?? useId('number-input')
  const display = (): string => draft() ?? String(current())

  const commit = (next: number): void => {
    const bounded = clamp(round(next, precision), min, max)
    if (!controlled) setUncontrolled(bounded)
    onChange?.(bounded)
    setDraft(null)
  }

  const nudge = (direction: 1 | -1): void => {
    if (disabled) return
    commit(current() + step * direction)
  }

  return (
    <div className={cx(styles.root, className)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}

      <div className={cx(styles.shell, disabled && styles.disabled)}>
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={() => disabled || current() <= min}
          aria-label="Decrease"
          className={cx(styles.step, styles.decrement)}
        >
          <Minus aria-hidden />
        </button>

        <div className={styles.field}>
          <input
            id={inputId}
            value={() => display()}
            onChange={(event) =>
              setDraft((event.target as HTMLInputElement).value)
            }
            onBlur={() => {
              const parsed = Number.parseFloat(display())
              commit(Number.isFinite(parsed) ? parsed : current())
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                ;(event.currentTarget as HTMLInputElement).blur()
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                nudge(1)
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                nudge(-1)
              }
            }}
            disabled={disabled}
            inputMode="decimal"
            aria-label={label ? undefined : 'Number value'}
            className={styles.control}
          />
          {suffix ? (
            <span className={styles.suffix} aria-hidden>
              {suffix}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={() => disabled || current() >= max}
          aria-label="Increase"
          className={cx(styles.step, styles.increment)}
        >
          <Plus aria-hidden />
        </button>
      </div>
    </div>
  )
}
