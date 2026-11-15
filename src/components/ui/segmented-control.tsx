import { signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import styles from './segmented-control.module.scss'

export type SegmentedSize = 'sm' | 'default'

export type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>
  value?: T | (() => T)
  defaultValue?: T
  onChange?: (value: T) => void
  size?: SegmentedSize
  label?: string
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  size = 'default',
  label = 'View',
  className,
}: SegmentedControlProps<T>) {
  const [uncontrolled, setUncontrolled] = signal<T | undefined>(
    defaultValue ?? options[0]?.value,
  )
  const controlled =
    valueProp === undefined ? null : accessorOf<T>(valueProp)
  const current = (): T | undefined =>
    controlled ? controlled() : uncontrolled()

  const setCurrent = (next: T): void => {
    if (!controlled) setUncontrolled(next)
    onChange?.(next)
  }

  const refs: Array<HTMLButtonElement | null> = []

  const move = (direction: 1 | -1): void => {
    const enabled = options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.disabled)
    if (!enabled.length) return

    const at = enabled.findIndex(({ option }) => option.value === current())
    const next = enabled[(at + direction + enabled.length) % enabled.length]
    if (!next) return

    setCurrent(next.option.value)
    refs[next.index]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(styles.root, size === 'sm' && styles.sm, className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault()
          move(1)
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          move(-1)
        }
      }}
    >
      {options.map((option, index) => {
        const selected = (): boolean => option.value === current()

        return (
          <button
            key={option.value}
            ref={(node) => {
              refs[index] = node as HTMLButtonElement | null
            }}
            type="button"
            role="radio"
            aria-checked={() => (selected() ? 'true' : 'false')}
            disabled={option.disabled}
            tabindex={() => (selected() ? 0 : -1)}
            onClick={() => setCurrent(option.value)}
            className={styles.option}
          >
            {option.icon ? (
              <span className={styles.icon} aria-hidden>
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
