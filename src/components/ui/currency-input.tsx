import { effect, signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { Input } from './input.tsx'
import styles from './currency-input.module.scss'

export interface CurrencyInputProps {
  label?: string
  hint?: string
  error?: string
  success?: string
  required?: boolean
  disabled?: boolean
  value?: number | (() => number)
  defaultValue?: number
  onChange?: (value: number) => void
  currency?: string
  locale?: string
  min?: number
  max?: number
  className?: string
  id?: string
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.-]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

/**
 * Currency field with locale-aware formatting on blur and a plain decimal
 * editor while focused. The symbol is an input adornment, not part of the value.
 */
export function CurrencyInput({
  label,
  hint,
  error,
  success,
  required,
  disabled,
  value: valueProp,
  defaultValue = 0,
  onChange,
  currency = 'USD',
  locale,
  min,
  max,
  className,
  id,
}: CurrencyInputProps) {
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<number>(valueProp)
  const numeric = (): number => (controlled ? controlled() : uncontrolled())

  const [draft, setDraft] = signal(String(numeric()))
  const [focused, setFocused] = signal(false)

  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    })
  } catch {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    })
  }

  const symbol =
    formatter.formatToParts(0).find((item) => item.type === 'currency')
      ?.value ?? currency

  effect(() => {
    const next = numeric()
    if (!focused()) setDraft(String(next))
  })

  const commit = (next: number): number => {
    const clamped = Math.min(
      max ?? Number.POSITIVE_INFINITY,
      Math.max(min ?? Number.NEGATIVE_INFINITY, next),
    )
    if (!controlled) setUncontrolled(clamped)
    onChange?.(clamped)
    return clamped
  }

  const display = (): string =>
    focused() ? draft() : formatter.format(numeric())

  return (
    <Input
      id={id}
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={required}
      disabled={disabled}
      className={className}
      leading={<span className={styles.symbol}>{symbol}</span>}
      inputMode="decimal"
      autoComplete="off"
      // InputProps types `value` as a plain string, but the DOM binding accepts
      // an accessor and keeps the field reactive.
      value={display as unknown as string}
      onFocus={(event: globalThis.FocusEvent) => {
        setFocused(true)
        setDraft(String(numeric()))
        ;(event.currentTarget as HTMLInputElement).select()
      }}
      onBlur={() => {
        const parsed = parseAmount(draft())
        const next = commit(parsed)
        setFocused(false)
        setDraft(String(next))
      }}
      onChange={(event: globalThis.Event) => {
        const raw = (event.currentTarget as HTMLInputElement).value
        setDraft(raw)
        commit(parseAmount(raw))
      }}
    />
  )
}
