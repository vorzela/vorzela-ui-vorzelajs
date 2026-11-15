import { effect, signal } from '@vorzelajs/core'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { ChangeEvent, HTMLAttributes } from '../../types.ts'
import { ChevronDown } from './icons.tsx'
import { Label } from './label.tsx'
import styles from './native-select.module.scss'

export type NativeSelectSize = 'sm' | 'md' | 'lg'

export type NativeSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type NativeSelectProps = HTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  size?: NativeSelectSize
  options?: NativeSelectOption[]
  placeholder?: string
  wrapClassName?: string
  value?: string | number | (() => string | number)
  defaultValue?: string | number
  name?: string
  disabled?: boolean
  multiple?: boolean
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

/**
 * Native `<select>` with the kit field chrome. Prefer this for short, static
 * option lists — it keeps the platform picker, keyboard and mobile behaviour.
 */
export function NativeSelect({
  label,
  hint,
  error,
  required,
  size = 'md',
  options,
  placeholder,
  wrapClassName,
  className,
  id,
  children,
  value,
  defaultValue,
  ...props
}: NativeSelectProps) {
  const generatedId = useId('native-select')
  const selectId = id ?? generatedId
  const hintId = hint ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const [selectNode, setSelectNode] = signal<HTMLSelectElement | null>(null)
  const controlled =
    value === undefined ? null : accessorOf<string | number>(value)

  // The DOM value property is applied before `<option>` children exist, which
  // clears the selection. Re-apply after the tree is assembled (microtask) so
  // both controlled values and `defaultValue` survive.
  effect(() => {
    const node = selectNode()
    if (!node) return

    const next = controlled ? controlled() : defaultValue
    if (next === undefined) return

    const apply = (): void => {
      // `value` exists on DOM elements but not on the server host's nodes.
      if ('value' in node) node.value = String(next)
    }

    if (typeof queueMicrotask === 'function') queueMicrotask(apply)
    else apply()
  })

  return (
    <div
      className={cx(
        styles.root,
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        wrapClassName,
      )}
    >
      {label ? (
        <Label htmlFor={selectId} required={required} hint={undefined}>
          {label}
        </Label>
      ) : null}
      <div className={styles.field}>
        <select
          {...props}
          ref={(node) => setSelectNode(node as HTMLSelectElement)}
          id={selectId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cx(styles.select, error && styles.error, className)}
        >
          {placeholder ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              selected={
                controlled
                  ? () => String(controlled()) === option.value
                  : undefined
              }
            >
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className={styles.chevron} aria-hidden />
      </div>
      {error ? (
        <p id={errorId} className={cx(styles.message, styles.messageError)}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.message}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
